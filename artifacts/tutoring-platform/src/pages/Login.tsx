import { useState, type FormEvent } from "react";
import { useLoginWithPassword } from "@workspace/api-client-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import telosIcon from "@/assets/telos_icon_128.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useLoginWithPassword({
    mutation: {
      onSuccess: () => {
        // Full reload so the whole app boots with the fresh session.
        window.location.href = import.meta.env.BASE_URL;
      },
      onError: () => setError("Invalid email or password."),
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (email.trim() === "" || password === "") return;
    setError(null);
    login.mutate({ data: { email: email.trim(), password, rememberMe } });
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md px-6 py-16">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader className="items-center text-center">
              <img
                src={telosIcon}
                alt=""
                className="mb-2 h-16 w-16 rounded-xl"
              />
              <CardTitle className="font-serif text-2xl">
                Sign in to TELOS
              </CardTitle>
              <CardDescription>
                Enter the email and password you were given.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-login-password"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="login-remember"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                  data-testid="checkbox-remember-me"
                />
                <Label htmlFor="login-remember" className="font-normal">
                  Remember me for 30 days
                </Label>
              </div>
              {error && (
                <p
                  className="text-sm text-destructive"
                  role="alert"
                  data-testid="text-login-error"
                >
                  {error}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button
                type="submit"
                className="w-full"
                disabled={
                  email.trim() === "" || password === "" || login.isPending
                }
                data-testid="button-submit-login"
              >
                {login.isPending ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                No account? Access is set up by your tutor — get in touch and
                we'll create one for you.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
