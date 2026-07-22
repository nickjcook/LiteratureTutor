import * as oidc from "openid-client";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  GetCurrentAuthUserResponse,
  StopImpersonatingResponse,
  LoginWithPasswordBody,
  LoginWithPasswordResponse,
  ChangeMyPasswordBody,
  ChangeMyPasswordResponse,
  ExchangeMobileAuthorizationCodeBody,
  ExchangeMobileAuthorizationCodeResponse,
  LogoutMobileSessionResponse,
} from "@workspace/api-zod";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { ensureBootstrapAdmin } from "../lib/adminAuth";
import { verifyPassword, hashPassword } from "../lib/passwords";
import {
  clearSession,
  getOidcConfig,
  getSessionId,
  getSession,
  updateSession,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  ISSUER_URL,
  type SessionData,
} from "../lib/auth";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string, maxAge?: number | null) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    // SameSite=None + Partitioned (CHIPS) so the session works inside the
    // Replit preview iframe (a cross-site embed where Lax cookies are never
    // sent). Partitioning keys the cookie to the embedding site, which keeps
    // cross-site attacker pages from riding the session (CSRF stays blunted).
    sameSite: "none",
    partitioned: true,
    path: "/",
    // maxAge null => browser-session cookie (cleared when the browser closes);
    // used for local logins without "remember me".
    ...(maxAge === null ? {} : { maxAge: maxAge ?? SESSION_TTL }),
  });
}

function setOidcCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

async function upsertUser(claims: Record<string, unknown>) {
  const userData = {
    id: claims.sub as string,
    email: (claims.email as string) || null,
    firstName: (claims.first_name as string) || null,
    lastName: (claims.last_name as string) || null,
    profileImageUrl: (claims.profile_image_url || claims.picture) as
      | string
      | null,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();

  // Bootstrap-admin allow-list (ADMIN_EMAILS secret): grants the admin role at
  // login. Identity is still verified by Replit Auth as normal.
  await ensureBootstrapAdmin(user);

  return user;
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
      impersonator: req.isAuthenticated() ? (req.impersonator ?? null) : null,
    }),
  );
});

// Interim local auth (email + password) so testers can sign in without Replit
// accounts. Replaced wholesale by Clerk after the testing phase.
const REMEMBER_ME_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const SHORT_SESSION_TTL = 24 * 60 * 60 * 1000; // 1 day server-side

router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = LoginWithPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const { email, password, rememberMe } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(sql`lower(${usersTable.email}) = ${email.trim().toLowerCase()}`);

  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : // Burn comparable time so missing accounts aren't distinguishable.
      await verifyPassword(password, null).then(() => false);
  if (!user || !valid) {
    await new Promise((r) => setTimeout(r, 250));
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await ensureBootstrapAdmin(user);

  const sessionData: SessionData = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
    access_token: "",
    provider: "local",
  };

  const sid = await createSession(
    sessionData,
    rememberMe ? REMEMBER_ME_TTL : SHORT_SESSION_TTL,
  );
  setSessionCookie(res, sid, rememberMe ? REMEMBER_ME_TTL : null);

  res.json(
    LoginWithPasswordResponse.parse({
      user: sessionData.user,
      impersonator: null,
    }),
  );
});

router.post("/auth/change-password", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  // Impersonation invariant: an admin viewing as another user must not be
  // able to change that user's password.
  if (req.impersonator) {
    res
      .status(400)
      .json({ error: "You can't change a password while impersonating" });
    return;
  }
  const parsed = ChangeMyPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  const { currentPassword, newPassword } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Accounts that only ever used Replit OIDC have no password yet; they may
  // set one without a current password. Otherwise the current one is required.
  if (user.passwordHash != null) {
    const ok =
      currentPassword != null &&
      (await verifyPassword(currentPassword, user.passwordHash));
    if (!ok) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
  }

  await db
    .update(usersTable)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(usersTable.id, user.id));

  res.json(ChangeMyPasswordResponse.parse({ success: true }));
});

// Deliberately NOT admin-gated: while impersonating a non-admin the session's
// effective user fails requireAdmin, yet must be able to end the impersonation.
// Possession of a session with an `impersonator` is the authorisation.
router.post(
  "/auth/stop-impersonating",
  async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const sid = getSessionId(req);
    const session = sid ? await getSession(sid) : null;
    if (!sid || !session?.impersonator) {
      res.status(400).json({ error: "Not currently impersonating" });
      return;
    }

    req.log.info(
      { adminId: session.impersonator.id, targetId: session.user.id },
      "Impersonation ended",
    );

    session.user = session.impersonator;
    delete session.impersonator;
    await updateSession(sid, session);

    res.json(
      StopImpersonatingResponse.parse({
        user: session.user,
        impersonator: null,
      }),
    );
  },
);

router.get("/login", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const returnTo = getSafeReturnTo(req.query.returnTo);

  const state = oidc.randomState();
  const nonce = oidc.randomNonce();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const redirectTo = oidc.buildAuthorizationUrl(config, {
    redirect_uri: callbackUrl,
    scope: "openid email profile offline_access",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "login consent",
    state,
    nonce,
  });

  setOidcCookie(res, "code_verifier", codeVerifier);
  setOidcCookie(res, "nonce", nonce);
  setOidcCookie(res, "state", state);
  setOidcCookie(res, "return_to", returnTo);

  res.redirect(redirectTo.href);
});

// Query params are not validated because the OIDC provider may include
// parameters not expressed in the schema.
router.get("/callback", async (req: Request, res: Response) => {
  const config = await getOidcConfig();
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  const codeVerifier = req.cookies?.code_verifier;
  const nonce = req.cookies?.nonce;
  const expectedState = req.cookies?.state;

  if (!codeVerifier || !expectedState) {
    res.redirect("/api/login");
    return;
  }

  const currentUrl = new URL(
    `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
  );

  let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
  try {
    tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState,
      idTokenExpected: true,
    });
  } catch {
    res.redirect("/api/login");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  res.clearCookie("code_verifier", { path: "/" });
  res.clearCookie("nonce", { path: "/" });
  res.clearCookie("state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });

  const claims = tokens.claims();
  if (!claims) {
    res.redirect("/api/login");
    return;
  }

  const dbUser = await upsertUser(
    claims as unknown as Record<string, unknown>,
  );

  const now = Math.floor(Date.now() / 1000);
  const sessionData: SessionData = {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      profileImageUrl: dbUser.profileImageUrl,
    },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
});

router.get("/logout", async (req: Request, res: Response) => {
  const origin = getOrigin(req);
  const sid = getSessionId(req);
  const session = sid ? await getSession(sid) : null;
  await clearSession(res, sid);

  // Local email+password sessions have no OIDC provider session to end.
  if (session?.provider === "local") {
    res.redirect(origin);
    return;
  }

  const config = await getOidcConfig();
  const endSessionUrl = oidc.buildEndSessionUrl(config, {
    client_id: process.env.REPL_ID!,
    post_logout_redirect_uri: origin,
  });

  res.redirect(endSessionUrl.href);
});

router.post(
  "/mobile-auth/token-exchange",
  async (req: Request, res: Response) => {
    const parsed = ExchangeMobileAuthorizationCodeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid required parameters" });
      return;
    }

    const { code, code_verifier, redirect_uri, state, nonce } = parsed.data;

    try {
      const config = await getOidcConfig();

      const callbackUrl = new URL(redirect_uri);
      callbackUrl.searchParams.set("code", code);
      callbackUrl.searchParams.set("state", state);
      callbackUrl.searchParams.set("iss", ISSUER_URL);

      const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: code_verifier,
        expectedNonce: nonce ?? undefined,
        expectedState: state,
        idTokenExpected: true,
      });

      const claims = tokens.claims();
      if (!claims) {
        res.status(401).json({ error: "No claims in ID token" });
        return;
      }

      const dbUser = await upsertUser(
        claims as unknown as Record<string, unknown>,
      );

      const now = Math.floor(Date.now() / 1000);
      const sessionData: SessionData = {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          profileImageUrl: dbUser.profileImageUrl,
        },
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiresIn() ? now + tokens.expiresIn()! : claims.exp,
      };

      const sid = await createSession(sessionData);
      res.json(ExchangeMobileAuthorizationCodeResponse.parse({ token: sid }));
    } catch (err) {
      req.log.error({ err }, "Mobile token exchange error");
      res.status(500).json({ error: "Token exchange failed" });
    }
  },
);

router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  if (sid) {
    await deleteSession(sid);
  }
  res.json(LogoutMobileSessionResponse.parse({ success: true }));
});

export default router;
