# Claude Code on Replit — persistent session + worklog reporting

**Five parts in this one doc:** **Part 1** (Steps 1–8 below) sets up the persistent
tmux session + memory tuning + login persistence (Step 8 is an optional headless
boot autostart). **Part 2** sets up the
worklog change-recording + daily digest. **Part 3** lets a Claude session take
headless screenshots of the running app on Replit, to self-verify UI changes.
**Part 4** makes `git push` and `gh pr create` work in every Repl with no
interactive login. **Part 5** is a portable responsive layout kit so the UI uses
wide screens well and doesn't cramp on mobile. Set up Part 1 always; Part 2 if
you want this app's work recorded; **Part 3 is strongly recommended for any app
with a UI** — being able to see its own changes stops Claude from shipping broken
layouts and saves you from eyeballing every one (skip it only for a pure
backend/CLI with no visual surface); **Part 4 once you have more than one app**,
so you get login-free offsite backups (mind its Step 5 — never push secrets);
and **Part 5 is likewise strongly recommended for any app with a UI** — it's a
copy-one-block CSS fix for the wasted-wide-screen / cramped-mobile problem that
recurs in every app (pairs with Part 3, which is how you *see* the difference).

> **Copy the app-facing conventions into the target app's own docs.** This
> setup doc is **not** loaded into a normal working session's context — only the
> target app's own auto-loaded markdown (`CLAUDE.md`, `replit.md`, or whatever
> that app reads on start) is. So any *application-level* convention this doc
> establishes — above all the **Part 5 layout rules** (data/dashboard pages run
> full-width; never wrap them in a fixed `max-w-*` cap; cap only forms and
> prose) and the **Part 3 two-width screenshot check** — must be written into
> that app's own docs when you set it up, not left only here. If they live only
> in this doc they get silently forgotten and re-broken in every later session
> (the recurring symptom: pages shipped with fixed width caps and wasted side
> margins until someone points back to Part 5). Rule of thumb: whenever you
> *apply* one of this doc's conventions to an app, also *record it* in that
> app's context docs.

> **This is a handover document for another Claude Code session.** A separate
> Repl already has this working; the user is giving you this doc so you can set
> it up in *your* Repl. **Do not blindly paste the scripts below.** Run the
> diagnostics first, report what you find, *then* adapt and install. Yesterday
> the user tried this without the diagnostic step and hit missing components.

---

## Fetching this doc (first install + staying current)

This document is **served live** from the central Worklog app, so you no longer
copy/paste it between Repls — you fetch the canonical latest version. The app is
a **public deployment**, so all of the commands below work with a plain `curl`
(no token). The published **Setup & API page**
(`https://globalapprecorder.replit.app/setup`) lists every command and endpoint.

**First install — paste this one message into a fresh Claude Code shell:**

> Fetch the Replit setup doc and follow it: run
> `curl -fsS "https://globalapprecorder.replit.app/api/setup-doc?format=raw" -o claude-tmux-setup.md`,
> then read `claude-tmux-setup.md` and set up Parts 1–5 for this Repl — run the
> diagnostics first, report what you find, then install.

That single message is the whole bootstrap in a new app: it pulls this file down
and tells the session to run it.

**Update an existing copy to the latest version:**

```sh
curl -fsS "https://globalapprecorder.replit.app/api/setup-doc?format=raw" -o claude-tmux-setup.md
```

**Still on the v1 auto-update hook? Upgrade it once — paste this message into a
Claude Code session in the app.** (v1 = the `_setup_doc_autocheck` in
`$REPL_HOME/.config/bashrc` has no `_setup_scripts_autosync` function. v1 only
re-downloads this doc; it cannot auto-sync the launcher scripts, so apps on v1
miss script fixes — including crash auto-resume — until upgraded. One paste per
app, then every future update is fully automatic.)

> The setup doc gained v2 of the daily auto-update hook (script auto-sync).
> Fetch the latest doc (`curl -fsS "https://globalapprecorder.replit.app/api/setup-doc?format=raw" -o claude-tmux-setup.md`),
> then replace the old `_setup_doc_autocheck` block in
> `$REPL_HOME/.config/bashrc` with the v2 block from Part 1's "Auto-update
> once per day" section, source the bashrc, clear
> `$REPL_HOME/.config/.setup-doc-checked`, run `_setup_doc_autocheck`, and
> confirm via `.config/script-sync.log` that the launcher scripts synced
> (local `--max-old-space-size` must be preserved). Report what changed.

**What propagates automatically vs what needs a pass.** With the **v2**
auto-update hook (below) installed, two things stay current with zero touches:
the doc file itself, **and the launcher scripts** (`run-claude.sh`,
`claude-tmux.sh`, `claude-autostart.sh`) — the hook extracts them from the
doc's marked code blocks and installs them (syntax-checked, heap size
preserved) whenever the doc changes. What still needs a manual pass is anything
that lives *outside* those scripts: bashrc blocks (Steps 6/7, Part 4), app-level
conventions (Part 5 layout rules, Part 2 hooks), and upgrades to the hook
itself. When the update reminder mentions those, paste this into a Claude Code
session in that app:

> The setup doc `claude-tmux-setup.md` was updated. Re-read it and re-apply
> anything the automatic script sync doesn't cover: diff the doc's bashrc
> blocks (Steps 6/7, Part 4, the auto-update hook) against
> `$REPL_HOME/.config/bashrc`, re-check Parts 2–5 conventions, and report what
> changed. (The launcher scripts sync automatically — verify via
> `.config/script-sync.log` rather than re-applying by hand.)

**Checking for updates (ask Claude to "check the setup doc for updates").** The
default endpoint (no `?format=raw`) returns JSON
`{ filename, checksum, updatedAt, bytes, markdown }`. The `checksum` is the
**first 12 hex of `sha256(doc)`**, so a local `sha256sum` is an exact match —
compare the two and only re-download when they differ:

```sh
# 1. Published version's checksum:
curl -fsS "https://globalapprecorder.replit.app/api/setup-doc" | grep -o '"checksum":"[^"]*"'
# 2. This Repl's local checksum (same algorithm):
sha256sum claude-tmux-setup.md | cut -c1-12
# 3. If they differ, re-fetch (the "Update an existing copy" command above) and
#    re-read this doc, then apply any changes to Parts 1–5.
```

### Auto-update once per day (recommended — set this up once)

The manual check above is easy to forget, and on Replit a doc can drift for days
before anyone re-runs it. Wire the **"update an existing copy"** flow into the
durable, sourced-every-tab bashrc hook (the same
`$REPL_HOME/.config/bashrc` Steps 6, 7, and Part 4 use) so it runs **by itself**
— the first time you open a shell or type `claude` on a new day — with no command
to remember.

The shape mirrors the rest of Part 1:

- It's defined as a function (`_setup_doc_autocheck`) in
  `$REPL_HOME/.config/bashrc`, which is sourced by every interactive Shell-tab
  session (and skipped in `REPLIT_MODE` agent/workflow shells, which is fine —
  those shouldn't self-mutate the repo).
- It's triggered from **two** places, so it can't be missed: once on **shell
  startup** (the first interactive shell of the day), and again from the
  **`claude` shadow function** (Step 6) — so simply typing `claude` always kicks
  it off too, whichever tab you're in.
- It fires **at most once per calendar day**, gated by a **durable date-stamped
  marker** (`$REPL_HOME/.config/.setup-doc-checked` holding today's date). Because
  the marker is durable and date-based (not a `/tmp` boot flag), it re-fires on
  the first shell/`claude` of a **new day whether or not the container recycled**,
  and never more than once a day no matter how many tabs you open.
- It does the exact checksum-compare from "Checking for updates" above and only
  re-downloads when the published `checksum` differs from the local
  `sha256sum`.
- It's **backgrounded and fully fail-soft** (`( … ) &`, every step `|| true` /
  `2>/dev/null`): a slow or down endpoint, no network, or a missing curl can
  never delay your prompt or error the shell.
- The download is **atomic** (write to `.tmp`, then `mv`) so a half-fetched file
  can never replace a good doc, and it only overwrites on a successful fetch.
- When it *does* update, it leaves a one-line note in
  `$REPL_HOME/.config/setup-doc-update.log` (and the next day's first check
  prints a reminder) so you know to **re-read the doc and re-apply Parts 1–5** —
  fetching the new bytes is automatic, but acting on changed setup instructions
  still needs a human/Claude pass.

Append this block to `$REPL_HOME/.config/bashrc` (idempotent — appending it
twice just redefines the same function and the date marker no-ops the second
startup call):

```sh
cat >> "$REPL_HOME/.config/bashrc" <<'EOF'

# --- Auto-update this setup doc + auto-sync its launcher scripts (v2) --------
# Runs the "update an existing copy" flow automatically, at most once per
# calendar day — and then ALSO syncs the launcher scripts (run-claude.sh,
# claude-tmux.sh, claude-autostart.sh) from the freshly-fetched doc. The doc is
# the CANONICAL SOURCE of those scripts: its fenced code blocks are wrapped in
# <!-- script:NAME:begin/end --> markers, extracted below and installed over
# the local copies — so script fixes propagate to every app with NO manual
# re-apply. Zero extra network: scripts only change when the doc does. Every
# install is gated by `bash -n`, so a malformed doc edit can never replace a
# working script. This Repl's sized --max-old-space-size (Step 2) is preserved
# across updates. Only scripts already present locally are touched (Step 8's
# autostart stays opt-in). Old script is backed up to
# .config/script-sync-backups/ and each sync logged to .config/script-sync.log.
# Disable script sync alone with CLAUDE_SCRIPT_SYNC=off; everything is
# fail-soft and skipped in REPLIT_MODE agent/workflow shells.
_setup_scripts_autosync() {
  [ "${CLAUDE_SCRIPT_SYNC:-on}" = "off" ] && return 0
  local doc="$REPL_HOME/claude-tmux-setup.md" name tmp cur heap
  [ -r "$doc" ] || return 0
  for name in run-claude.sh claude-tmux.sh claude-autostart.sh; do
    cur="$REPL_HOME/$name"
    [ -f "$cur" ] || continue            # only update scripts this Repl uses
    tmp="$REPL_HOME/.${name}.sync.$$"
    # Extract the fenced block between the markers (drop the ``` fence lines).
    awk -v s="<!-- script:$name:begin -->" -v e="<!-- script:$name:end -->" \
      '$0==e{f=0} f{print} $0==s{f=1}' "$doc" 2>/dev/null | sed '1d;$d' > "$tmp" 2>/dev/null
    # Preserve this Repl's sized heap ceiling (Step 2) across updates.
    if [ "$name" = "run-claude.sh" ]; then
      heap="$(grep -o 'max-old-space-size=[0-9]*' "$cur" 2>/dev/null | head -1 | cut -d= -f2)"
      [ -n "$heap" ] && sed -i "s/max-old-space-size=[0-9]*/max-old-space-size=$heap/g" "$tmp" 2>/dev/null
    fi
    # Gates: non-empty, a real script, valid bash, and actually different.
    if [ -s "$tmp" ] && head -1 "$tmp" | grep -q '^#!' \
       && bash -n "$tmp" 2>/dev/null && ! cmp -s "$tmp" "$cur"; then
      mkdir -p "$REPL_HOME/.config/script-sync-backups" 2>/dev/null
      cp "$cur" "$REPL_HOME/.config/script-sync-backups/$name.$(date +%Y%m%d-%H%M%S)" 2>/dev/null
      chmod +x "$tmp" 2>/dev/null
      mv "$tmp" "$cur" 2>/dev/null \
        && echo "$(date -Is) synced $name from setup doc" \
             >> "$REPL_HOME/.config/script-sync.log" 2>/dev/null
    else
      rm -f "$tmp" 2>/dev/null
    fi
  done
}
_setup_doc_autocheck() {
  [ -n "${REPLIT_MODE:-}" ] && return 0
  local mark="$REPL_HOME/.config/.setup-doc-checked"
  local today; today="$(date +%F 2>/dev/null)" || return 0
  [ "$(cat "$mark" 2>/dev/null)" = "$today" ] && return 0   # already checked today
  echo "$today" > "$mark" 2>/dev/null || true
  # If an earlier day's background check pulled a new version, note it once.
  # (Scripts sync automatically; bashrc/config-block changes still need a pass.)
  if [ -f "$REPL_HOME/.config/setup-doc-update.log" ]; then
    echo "[setup-doc] doc updated since last check (launcher scripts auto-synced — re-read the doc only if Parts/bashrc blocks changed):"
    tail -n 1 "$REPL_HOME/.config/setup-doc-update.log" 2>/dev/null
    rm -f "$REPL_HOME/.config/setup-doc-update.log" 2>/dev/null || true
  fi
  (
    DOC="$REPL_HOME/claude-tmux-setup.md"
    BASE="https://globalapprecorder.replit.app"
    remote="$(curl -fsS -m 10 "$BASE/api/setup-doc" 2>/dev/null \
      | grep -o '"checksum":"[^"]*"' | cut -d'"' -f4)"
    [ -n "$remote" ] || exit 0
    local_sum="$(sha256sum "$DOC" 2>/dev/null | cut -c1-12)"
    if [ -n "$local_sum" ] && [ "$remote" != "$local_sum" ]; then
      if curl -fsS -m 30 "$BASE/api/setup-doc?format=raw" -o "$DOC.tmp" 2>/dev/null \
         && [ -s "$DOC.tmp" ]; then
        mv "$DOC.tmp" "$DOC" 2>/dev/null \
          && echo "$(date -Is) re-fetched (checksum $local_sum -> $remote)" \
               >> "$REPL_HOME/.config/setup-doc-update.log" 2>/dev/null \
          && _setup_scripts_autosync
      else
        rm -f "$DOC.tmp" 2>/dev/null || true
      fi
    else
      # Doc already current — still heal scripts that lag it (first run after
      # installing this hook, or a partially-applied earlier update).
      _setup_scripts_autosync
    fi
  ) >/dev/null 2>&1 &
}
# Trigger on shell startup (first interactive shell of the day fires it).
_setup_doc_autocheck
EOF
```

> **Upgrading from the v1 hook** (the version without `_setup_scripts_autosync`):
> don't append — **replace** the old `_setup_doc_autocheck` block in
> `$REPL_HOME/.config/bashrc` with the block above (appending would work, since
> the later definition wins, but leaves dead code). This upgrade is the ONE
> remaining manual step per app; after it, both the doc *and* the launcher
> scripts stay current with zero touches. The ready-made one-paste message for
> doing this is under **"Update an existing copy"** at the top of this doc.

Then make the **`claude` shadow function (Step 6) call it too**, so typing
`claude` always triggers the once-per-day check even if this particular shell
was already open before today. Add one line at the top of the `claude()` body:

```sh
claude() {
  # Once-per-day setup-doc auto-update (Part 1), if the hook is defined.
  command -v _setup_doc_autocheck >/dev/null 2>&1 && _setup_doc_autocheck
  local wrapper="$REPL_HOME/claude-tmux.sh"
  if [ -n "${TMUX:-}" ] || [ ! -x "$wrapper" ]; then
    command claude "$@"
  else
    CLAUDE_BIN="$(type -P claude)" "$wrapper" "$@"
  fi
}
```

(Order in the bashrc doesn't matter — bash resolves `_setup_doc_autocheck`
when `claude` is *called*, not when it's defined, so both functions just need to
exist by then. If you're installing fresh, the Step 6 block already shows this
line in place.)

Apply it to the current shell without reopening the tab, and confirm both the
date marker and the background check work:

```sh
rm -f "$REPL_HOME/.config/.setup-doc-checked"   # clear so this shell re-checks today
source "$REPL_HOME/.config/bashrc"              # defines the fn + runs the startup check
cat "$REPL_HOME/.config/.setup-doc-checked"     # -> today's date: won't re-run again today
type _setup_doc_autocheck | head -1             # -> "_setup_doc_autocheck is a function"
```

> **Why a once-per-day bashrc function and not cron.** Replit gives no
> user-controlled init/systemd you can rely on across recycles, but the bashrc
> hook is *already* the doc's durable "runs on every fresh container" mechanism —
> reusing it keeps all the self-healing in one place and needs nothing new per
> container. A **durable date-stamped marker** (not a `/tmp` boot flag) is what
> makes it "first shell or `claude` of a new day," so it fires reliably the next
> day whether or not the container happened to recycle, and only once. If you'd
> instead want a fixed *intraday* schedule (e.g. hourly on a long-lived
> container), point a `cron`/scheduler at the same checksum-compare body — the
> logic is identical.

### Suggesting improvements back (so every app benefits)

If you improve the setup in *this* Repl — a new failure mode, a better heap
formula, a fix for a fresh Replit quirk — send it back to the central doc so the
next app gets it automatically. Don't just edit your local copy; POST a suggestion.

> **Auth:** submitting (POST) a suggestion now requires the same bearer the
> worklog sender uses — `Authorization: Bearer $RECEIVER_TOKEN` (see Part 2).
> Reading the doc and fetching `baseChecksum` (GET) stay open and need no token;
> only the *mutating* endpoints (POST a suggestion, and the maintainer's PATCH
> triage) are gated. A missing/wrong token returns `401`. `RECEIVER_TOKEN` is
> already present in every app set up per Part 2, so there's nothing new to mint.

`baseChecksum` is **not a value you make up** — it's the `checksum` field from
`GET /api/setup-doc` (first 12 hex of `sha256(doc)`), used for optimistic
concurrency so your suggestion applies against the doc version you actually saw.
Fetch it first, in the same shell, immediately before posting:

```sh
BASE_CHECKSUM=$(curl -fsS "https://globalapprecorder.replit.app/api/setup-doc" \
  | grep -o '"checksum":"[^"]*"' | cut -d'"' -f4)
echo "baseChecksum = $BASE_CHECKSUM"   # a real value, never invented
```

```sh
curl -fsS -X POST "https://globalapprecorder.replit.app/api/setup-doc/suggestions" \
  -H "Authorization: Bearer $RECEIVER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "app": "<this app name>",
    "summary": "one-line description of the improvement",
    "section": "Part 1 / Step 2 / Troubleshooting / …",
    "body": "the proposed change — prose, a diff, or replacement text, plus why",
    "baseChecksum": "'"$BASE_CHECKSUM"'"
  }'
```

The doc maintainer reviews queued suggestions
(`GET /api/setup-doc/suggestions?status=new`, open/read-only) and folds the good
ones into the base document — after which every app that re-fetches picks them
up. (Marking a suggestion merged/rejected is a `PATCH
/api/setup-doc/suggestions/:id` and also needs the `Authorization: Bearer
$RECEIVER_TOKEN` header.)

---

## The job

Make Claude Code survive Replit tab closes and stop the "blank screen, terminal
exited, my long context is gone" crashes. End state for the user:

```sh
./claude-tmux.sh
```

…starts (or reattaches to) a persistent tmux session running Claude Code with an
enlarged Node heap, sized to the container's **free headroom** (not just its cap
— see Step 2). A dropped tab can't take the session with it; the heap ceiling
isn't the reason long sessions die.

You'll add two scripts and one env var. That's all.

---

## Why this exists (so you can explain it if asked)

Claude Code is a long-running Node process. On Replit it dies in three ways:

- **SIGHUP** when the web shell tab closes or the connection drops — the host
  pane dies, taking the foreground Claude process with it. Context gone.
- **SIGABRT (exit 134)** when V8 hits its default ~4.2 GB old-space heap
  ceiling. Typical on a long, file-editing, 1M-context session. Screen goes
  blank, no error visible.
- **CONTAINER RECYCLE** when Replit reclaims the whole box (idle eviction,
  redeploy, host migration). This is the *most common* death in practice, and
  it kills tmux itself — no launcher trick survives it.

`tmux` solves the first (the Claude process is detached from the pane).
A bigger Node heap (`NODE_OPTIONS=--max-old-space-size=…`) solves the
second. The third can't be prevented from inside the workspace — a plain
Replit workspace VM gets deallocated on Replit's schedule (roughly nightly,
sometimes in daytime clusters), and nothing running *in* it, tmux included,
can keep it alive; genuinely 24/7 uptime is what a Reserved VM / Always-On
deployment is for, not a dev workspace. So it's handled by **recovery** instead:
the *conversation* survives a recycle because transcripts live in the persisted
`CLAUDE_CONFIG_DIR` (Step 7), and `run-claude.sh` **auto-resumes** it — when the
prior run died without a clean exit, the next launch runs `claude --continue`
automatically, so you come back to the same conversation instead of a blank
prompt. (Without both of those pieces, a recycle *looks* like lost context even
though the transcript is safely on disk.)

**But the heap can't be sized to the container cap — it must be sized to the
*free* headroom under that cap.** The heap ceiling is how large V8 is *allowed*
to grow; if `(heap ceiling + everything else already running) > container cap`,
the kernel **SIGKILLs the process (exit 137)** before V8 ever reaches its own
heap-abort. So setting the ceiling too high doesn't fix exit 134 — it just
trades it for exit 137, which looks identical to the user (blank screen, context
gone). Step 2 sizes the heap against the Repl's *measured* baseline for exactly
this reason.

---

## Step 1 — Diagnose this Repl (do this FIRST, report results)

Before writing any files, run these and tell the user what you find. The answers
shape the install:

```sh
# Where is the claude binary? (the launcher needs to find it)
command -v claude && echo "→ on PATH" || echo "→ claude NOT on PATH"

# Node version (sanity)
node --version 2>/dev/null || echo "→ no node on PATH"

# Is tmux already installed?
command -v tmux && tmux -V || echo "→ tmux not installed yet"

# What's the container's memory cap? (sets the right heap size)
cat /sys/fs/cgroup/memory.max 2>/dev/null || echo "→ no cgroup v2"
# Baseline already in use — read THIS CONTAINER's cgroup, not free -h (which on
# Replit's shared nodes reports the whole host; see Step 2):
awk '{printf "→ container baseline: %.1f GB\n", $1/1024/1024/1024}' \
  /sys/fs/cgroup/memory.current 2>/dev/null \
  || cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2>/dev/null \
  || echo "→ no cgroup baseline readable"
free -h 2>/dev/null | head -2   # host-wide — sanity check only, NOT the baseline

# Which package manager is available for installing tmux?
command -v nix-env  && echo "→ legacy Nix available"
command -v nix      && echo "→ flakes-era Nix available"
command -v apt-get  && echo "→ apt available (rare in Replit, but possible)"

# Anything already running in tmux?
tmux ls 2>/dev/null || echo "→ no existing tmux sessions"

# Are scripts already here from a previous attempt?
ls -la claude-tmux.sh run-claude.sh 2>/dev/null || echo "→ no existing scripts"
```

**Report back to the user before continuing.** If any of these surprise you
(no Nix, no claude on PATH, unusual memory cap, scripts already present from a
previous attempt) — flag it. That's what stops yesterday's headache.

---

## Step 2 — Size the heap to this container's *free* headroom

> A flat ceiling (e.g. `12288` on any 16 GB Repl) assumes the container is
> nearly empty before Claude starts. It usually isn't — and when baseline usage
> + the ceiling exceeds the cap, the container OOM-kills Claude (exit 137), which
> looks identical to the heap-abort (134) the setting was meant to prevent.

**Don't size the heap to `memory.max`. Size it to what's actually free.** From
Step 1 you have both the cap (`memory.max`) and the baseline already in use —
and the baseline must come from the **cgroup** (`memory.current`;
`memory.usage_in_bytes` on cgroup v1), **not** from `free -h`. On Replit's
shared nodes `free -h` reports the *entire host*, not your container: its
"used" figure can overstate the container's real baseline by many GB and
swings with other tenants' load (observed on one Repl: `free -h` "used" went
14 GiB → 4.3 GiB within minutes while the container's own `memory.current`
sat near ~3.7 GB the whole time). Plugged into the formula below, the inflated
figure yields a uselessly tiny — or negative — heap, and a different answer
every run. Use `free -h` only as a rough sanity check, or a fallback when the
cgroup files are unreadable. The rule:

```
heap ceiling  ≈  container cap  −  baseline already in use  −  ~3 GB safety margin
```

The ~3 GB margin covers Claude's own non-heap memory (V8 off-heap, buffers,
child processes, tmux, the shell) plus growth in the baseline during a session.
Round **down** to a clean GB value and set that as `--max-old-space-size` (in MB).

**Worked example — the Repl this doc was last installed on (16 GB cap):**
the cgroup baseline (`memory.current`) showed **~4.5 GB already used** at
idle, before Claude grew. So:

```
16 GB cap − 4.5 GB baseline − 3 GB margin  ≈  8 GB  →  --max-old-space-size=8192
```

That's why `run-claude.sh` below ships **8192**, not `12288` (which would put
`12 + 4.5 = 16.5 GB` over the 16 GB cap → exit-137 OOM). `8 + 4.5 = 12.5 GB`
sits comfortably under.

Starting points by cap (assuming a *low* ~1 GB baseline — **always subtract the
baseline you actually measured in Step 1** before trusting these):

| `memory.max` (human) | Low-baseline starting point | After subtracting a 4–5 GB baseline |
|---|---|---|
| 16 GB (`17179869184` / `max`) | 12288 (12 GB)  | **8192 (8 GB)** ← typical busy Repl |
| 8 GB (`8589934592`)           | 4096 (4 GB)    | tell the user — little room left |
| 4 GB (`4294967296`)           | 2048 (2 GB)    | tell the user — exit 134/137 likely |

Edit the `--max-old-space-size=…` value in `run-claude.sh` (below) to the figure
the formula gives for *this* Repl before writing it. When in doubt, err lower:
exit 137 (OOM) destroys context; a slightly smaller heap merely risks exit 134
on an unusually long session, and you can raise it then.

---

## Step 3 — Write the two scripts

Both go in the repo root. They're written to be portable across Repls:
`claude-tmux.sh` self-installs tmux via Nix, and `run-claude.sh` finds
`claude` via `PATH` (with a `CLAUDE_BIN` env override if needed).

### `claude-tmux.sh`

<!-- script:claude-tmux.sh:begin -->
```bash
#!/usr/bin/env bash
# Run Claude Code inside a persistent tmux session, so a dropped Replit tab or a
# SIGHUP (the "blank screen, shell just ends" crash) can't kill the session.
# The tmux server is detached from the terminal — if the tab dies, Claude keeps
# running. Just run this script again to reattach to the live session.
#
# Self-bootstrapping: if tmux isn't installed, this installs it via Nix
# (nix-env / nix profile) on first run, so the script is drop-in for any fresh
# Replit (or other Nix-based) environment.
#
# Usage: ./claude-tmux.sh [any claude args]
#   first run  -> creates session "claude" running the launcher
#   later runs -> reattach to the still-running session
set -u

SESSION=claude
DIR="$(dirname "$(readlink -f "$0")")"

# Durable cache for the tmux binary path. The Nix *profile* that records "tmux is
# installed" lives under $HOME (~/.nix-profile -> ~/.local/state/nix/profiles),
# which Replit wipes on every container recycle — so `command -v tmux` comes back
# empty each morning and we needlessly reinstall (and print "tmux not found")
# even though the BINARY in /nix/store survived. We cache a symlink to that
# surviving store binary in the persisted, gitignored workspace dir and prefer it.
TMUX_CACHE_DIR="${REPL_HOME:-$DIR}/.config/claude-tmux-bin"

# Resolve the current working tmux down to its real /nix/store path and (re)point
# the cache symlink at it. Idempotent + fail-soft: any problem just skips caching.
refresh_tmux_cache() {
  local cur real
  cur="$(command -v tmux 2>/dev/null)" || return 0
  real="$(readlink -f "$cur" 2>/dev/null)" || return 0
  [ -x "$real" ] || return 0
  mkdir -p "$TMUX_CACHE_DIR" 2>/dev/null || return 0
  if [ "$(readlink "$TMUX_CACHE_DIR/tmux" 2>/dev/null)" != "$real" ]; then
    ln -sf "$real" "$TMUX_CACHE_DIR/tmux" 2>/dev/null || true
  fi
}

# --- ensure tmux is available -------------------------------------------------
# Nix drops user-installed binaries in ~/.nix-profile/bin, which isn't always on
# PATH in a fresh shell. Put it on PATH first, then auto-install if still missing.
#
# Install preference: `nix profile install nixpkgs#tmux` (flakes) BEFORE
# `nix-env -iA nixpkgs.tmux`. Legacy nix-env resolves against the user's Nix
# channel, which on Replit is often a 2021-era snapshot that ships a tmux
# linked against glibc 2.33 — and that combo segfaults at startup (exit 139)
# on the current Replit kernel (6.x). Flakes resolves against current nixpkgs
# and pulls a build that actually runs.
ensure_tmux() {
  case ":$PATH:" in
    *":$HOME/.nix-profile/bin:"*) ;;
    *) PATH="$HOME/.nix-profile/bin:$PATH" ;;
  esac
  # ~/.local/bin is where the official Claude Code installer drops the `claude`
  # symlink, and is normally added to PATH by ~/.bashrc / ~/.profile. tmux can
  # spawn the inner shell with a stripped env (especially if reattaching to a
  # pre-existing tmux server), so put it on PATH unconditionally here.
  case ":$PATH:" in
    *":$HOME/.local/bin:"*) ;;
    *) PATH="$HOME/.local/bin:$PATH" ;;
  esac
  # Prefer the durable cache: after a recycle wipes the Nix profile, this symlink
  # still resolves to the live /nix/store binary, so `command -v tmux` finds a
  # working tmux and the reinstall (+ "tmux not found" message) is skipped. A
  # dangling symlink (store path also GC'd) isn't executable, so command -v skips
  # it and we fall through to the Nix install path below — no regression.
  case ":$PATH:" in
    *":$TMUX_CACHE_DIR:"*) ;;
    *) PATH="$TMUX_CACHE_DIR:$PATH" ;;
  esac
  export PATH

  # An existing tmux might be a stale install from a previous attempt that now
  # segfaults after a kernel upgrade — verify it runs before trusting it.
  if command -v tmux >/dev/null 2>&1; then
    if tmux -V >/dev/null 2>&1; then
      refresh_tmux_cache   # self-heal the cache to the binary we just verified
      return 0
    fi
    echo "tmux found at $(command -v tmux) but it crashes — likely a stale Nix build vs the current kernel's glibc. Reinstalling..."
  else
    echo "tmux not found — installing via Nix (one-off, ~30s)..."
  fi

  if command -v nix >/dev/null 2>&1; then
    # 'nix profile add' is the current verb; 'install' is now a DEPRECATED alias
    # on modern/Determinate Nix (prints "'install' is a deprecated alias for
    # 'add'"), but it's the only verb older Nix knows — so try 'add', fall back
    # to 'install'. If tmux is already listed in the profile but its store path
    # was GC'd on a container recycle (the "reinstalls every morning" case),
    # plain 'add' is a no-op that won't repair the missing binary — remove the
    # stale entry first so the add actually rebuilds it. We only get here when
    # the detection above already found tmux missing/broken, so removing it is safe.
    if nix profile list 2>/dev/null | grep -qiw tmux; then
      echo "tmux is in the Nix profile but not runnable — removing the stale entry before reinstalling..."
      nix profile remove tmux >/dev/null 2>&1 \
        || nix profile remove nixpkgs#tmux >/dev/null 2>&1 \
        || true
    fi
    nix profile add nixpkgs#tmux 2>/dev/null || nix profile install nixpkgs#tmux
  elif command -v nix-env >/dev/null 2>&1; then
    echo "WARN: no flakes-era 'nix' on PATH — falling back to legacy nix-env. If tmux segfaults below, run 'nix-channel --update' and re-run." >&2
    nix-env -iA nixpkgs.tmux
  else
    echo "ERROR: no Nix package manager (nix/nix-env) on PATH — can't auto-install tmux." >&2
    echo "       Install tmux manually, then re-run this script." >&2
    exit 1
  fi

  hash -r 2>/dev/null || true   # forget cached "tmux: not found" lookup
  if ! command -v tmux >/dev/null 2>&1; then
    echo "ERROR: tmux still not on PATH after install." >&2
    echo "       Try:  export PATH=\"\$HOME/.nix-profile/bin:\$PATH\"  then re-run." >&2
    exit 1
  fi
  # Catch the glibc-mismatch segfault HERE so we don't fall into a "session
  # immediately dies" loop that's hard to diagnose from the tmux side.
  if ! tmux -V >/dev/null 2>&1; then
    rc=$?
    echo "ERROR: tmux installed at $(command -v tmux) but crashes (exit $rc)." >&2
    if [ "$rc" = "139" ]; then
      echo "       Exit 139 = SIGSEGV. The Nix build's glibc is older than the kernel expects." >&2
      echo "       Try:  nix-env -e tmux; nix profile install nixpkgs#tmux" >&2
      echo "       Or:   nix-channel --update; nix-env -iA nixpkgs.tmux" >&2
    fi
    exit 1
  fi
  refresh_tmux_cache   # cache the freshly-installed binary so the next recycle is silent
  echo "tmux ready: $(tmux -V)"
}

# --- ensure the QoL tmux config exists ----------------------------------------
# ~/.tmux.conf lives in $HOME, which a fresh Replit container wipes — so mouse
# scrolling and big scrollback silently revert to off/2000 on a new container.
# Recreate it if missing (never clobber an existing one). tmux reads it when the
# server starts, so writing it BEFORE new-session means a fresh server picks it
# up; for an already-running server we source it explicitly on reattach below.
ensure_tmux_conf() {
  [ -f "$HOME/.tmux.conf" ] && return 0
  cat > "$HOME/.tmux.conf" <<'CONF'
# ~/.tmux.conf — Claude Code / Replit persistent-session tweaks.
set -g history-limit 50000
set -g mouse on
setw -g mode-keys vi
CONF
  echo "wrote ~/.tmux.conf (mouse scroll on, 50k scrollback)"
}

ensure_tmux
ensure_tmux_conf

# --- reattach if a session already exists -------------------------------------
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Reattaching to existing '$SESSION' tmux session..."
  tmux source-file "$HOME/.tmux.conf" 2>/dev/null || true   # apply mouse/scroll to the running server
  exec tmux attach -t "$SESSION"
fi

# --- locate claude before handing off to tmux --------------------------------
# Resolve the claude binary here, where PATH is known-good, and pass it through
# to the inner shell as CLAUDE_BIN. The tmux server may have been started with
# a stripped PATH, so `command -v claude` inside the new session can fail even
# though it works in this script. Honour an already-set CLAUDE_BIN.
# A set-but-broken CLAUDE_BIN (e.g. the literal "/path/to/claude" placeholder
# copied from the docs) shouldn't masquerade as "claude not installed" — warn
# and fall back to PATH instead of trusting the bad value.
if [ -n "${CLAUDE_BIN:-}" ] && [ ! -x "$CLAUDE_BIN" ]; then
  echo "WARN: CLAUDE_BIN='$CLAUDE_BIN' is not an executable file — ignoring it and searching PATH." >&2
  CLAUDE_BIN=""
fi
CLAUDE_BIN="${CLAUDE_BIN:-$(command -v claude || true)}"
if [ -z "$CLAUDE_BIN" ] || [ ! -x "$CLAUDE_BIN" ]; then
  echo "ERROR: 'claude' not on PATH and CLAUDE_BIN not set." >&2
  echo "       Install with:  npm i -g @anthropic-ai/claude-code" >&2
  echo "       Or pin with:   export CLAUDE_BIN=/path/to/claude" >&2
  exit 1
fi
export CLAUDE_BIN

# --- pick the launcher: prefer the instrumented wrapper, else plain claude ----
if [ -x "$DIR/run-claude.sh" ]; then
  LAUNCHER="$DIR/run-claude.sh"
  END_MSG='[claude session ended — exit code + cause are in claude-logs/*.meta]'
else
  LAUNCHER="$CLAUDE_BIN"
  END_MSG='[claude session ended]'
fi

# Safely quote the launcher path + any forwarded args.
CMD="$(printf '%q' "$LAUNCHER")"
for a in "$@"; do CMD+=" $(printf '%q' "$a")"; done

# Bake CLAUDE_BIN into the command string so it survives a tmux server that
# doesn't propagate our env (e.g. one already running under a different PATH).
# `tmux new-session -e` would also work but requires tmux 3.2+; this is portable.
CMD="CLAUDE_BIN=$(printf '%q' "$CLAUDE_BIN") $CMD"

# Same belt-and-suspenders for the persisted config dir (Step 7), so a
# stripped-env tmux server still points Claude at $REPL_HOME/.config/claude
# (durable across recycles) instead of the wiped-on-recycle ~/.claude.
CMD="CLAUDE_CONFIG_DIR=$(printf '%q' "${CLAUDE_CONFIG_DIR:-$REPL_HOME/.config/claude}") $CMD"

# After claude exits we drop into a shell (exec bash) so the launcher's summary
# stays on screen and the pane stays reattachable.
CMD="$CMD; echo; echo '$END_MSG'; exec bash"

echo "Starting persistent '$SESSION' tmux session..."
echo "  claude bin:              $CLAUDE_BIN"
echo "  detach without killing:  Ctrl-b  then  d"
echo "  reattach later:          ./claude-tmux.sh"
exec tmux new-session -s "$SESSION" "$CMD"
```
<!-- script:claude-tmux.sh:end -->

### `run-claude.sh`

<!-- script:run-claude.sh:begin -->
```bash
#!/usr/bin/env bash
# Wrapper that runs Claude Code with stderr captured to a log file and a
# bigger Node heap, so silent crashes leave a trail and the heap ceiling
# stops being the reason long sessions die.
#
# Usage: ./run-claude.sh [any claude args]
# Logs:  ./claude-logs/claude-<timestamp>.{stderr,meta}

set -u

LOG_DIR="$(dirname "$(readlink -f "$0")")/claude-logs"
mkdir -p "$LOG_DIR"
TS=$(date +%Y%m%d-%H%M%S)
STDERR_LOG="$LOG_DIR/claude-$TS.stderr"
META_LOG="$LOG_DIR/claude-$TS.meta"

# Locate the claude binary. Honour $CLAUDE_BIN if you've pinned it; otherwise
# fall back to whatever is on PATH. Most Repls install Claude Code via
# `npm i -g @anthropic-ai/claude-code` and put it on PATH automatically.
CLAUDE_BIN="${CLAUDE_BIN:-$(command -v claude || true)}"
if [ -z "$CLAUDE_BIN" ] || [ ! -x "$CLAUDE_BIN" ]; then
  echo "ERROR: 'claude' not on PATH and CLAUDE_BIN not set." >&2
  echo "       Install with:  npm i -g @anthropic-ai/claude-code" >&2
  echo "       Or pin with:   export CLAUDE_BIN=/path/to/claude" >&2
  exit 1
fi

{
  echo "[start]    $(date -Is)"
  echo "[pid]      $$"
  echo "[bin]      $CLAUDE_BIN"
  echo "[cgroup]   $(cat /proc/self/cgroup 2>/dev/null)"
  echo "[memmax]   $(cat /sys/fs/cgroup/memory.max 2>/dev/null) bytes"
  echo "[memcur]   $(cat /sys/fs/cgroup/memory.current 2>/dev/null) bytes"
  echo "[args]     $*"
} > "$META_LOG"

# --- recycle-vs-fault check ---------------------------------------------------
# A session can vanish two very different ways on Replit, and they need opposite
# responses:
#   (a) CONTAINER RECYCLE — the whole box gets reclaimed (idle eviction, redeploy,
#       host migration). The kernel reboots, so /proc/stat's `btime` changes.
#       Nothing Claude, the wrapper, or tmux can do survives this — it is NOT a
#       Claude fault and chasing heap size / segfaults is wasted effort.
#   (b) GENUINE FAULT — Claude or its shell dies while the container keeps running,
#       so `btime` is unchanged (V8 heap abort, segfault, SIGHUP from a dropped
#       tab, OOM kill). THIS is worth digging into.
# We can't classify our OWN death (we'd already be gone), so instead we fingerprint
# the boot with `btime`, remember it between runs, and let the NEXT launch classify
# how THIS run ended: a run that left no `[exit]` trailer was killed abruptly —
# whether that was a recycle or a fault is decided purely by whether btime moved.
BTIME=$(awk '/^btime/{print $2}' /proc/stat 2>/dev/null)
BOOTAT=$(date -d "@${BTIME:-0}" -Is 2>/dev/null)
STATE_FILE="$LOG_DIR/.last-run"
RECYCLE_VERDICT="unknown (no prior run recorded)"
PRIOR_CRASHED=0   # 1 = prior run died with no [exit] trailer (recycle OR fault)
if [ -r "$STATE_FILE" ]; then
  # State file format: "<btime> <prev_meta_path>"
  read -r PREV_BTIME PREV_META < "$STATE_FILE"
  if [ -n "${PREV_META:-}" ] && [ -r "$PREV_META" ] && grep -q '^\[exit\]' "$PREV_META"; then
    RECYCLE_VERDICT="prior run exited cleanly (has [exit] trailer) — nothing to explain"
  elif [ -n "$BTIME" ] && [ -n "${PREV_BTIME:-}" ] && [ "$BTIME" != "$PREV_BTIME" ]; then
    RECYCLE_VERDICT="CONTAINER RECYCLE — prior run left no [exit] trailer AND the box rebooted since (btime $PREV_BTIME -> $BTIME). Not a Claude fault; the container was reclaimed."
    PRIOR_CRASHED=1
  elif [ -n "$BTIME" ] && [ "$BTIME" = "${PREV_BTIME:-}" ]; then
    RECYCLE_VERDICT="GENUINE FAULT — prior run died with no [exit] trailer but the container did NOT reboot (btime unchanged). Investigate ${PREV_META:-the prior meta} (check its stderr / exit code)."
    PRIOR_CRASHED=1
  else
    RECYCLE_VERDICT="prior run left no [exit] trailer; btime comparison inconclusive (missing btime)"
    PRIOR_CRASHED=1
  fi
fi
{
  echo "[btime]    $BTIME ($BOOTAT)"
  echo "[recycle]  $RECYCLE_VERDICT"
} >> "$META_LOG"
# Record THIS run's fingerprint so the next launch can classify how it ended.
# Written now, at startup, pointing at this run's meta: by next launch the meta
# will (or won't) carry an [exit] trailer, which is exactly the signal we read.
printf '%s %s\n' "$BTIME" "$META_LOG" > "$STATE_FILE"
echo "Prior session: $RECYCLE_VERDICT"

# --- auto-resume after a crash/recycle ------------------------------------------
# tmux only protects against tab-close/SIGHUP; a container recycle or a hard crash
# still kills the live process. The CONVERSATION survives either way (transcripts
# live in the persisted CLAUDE_CONFIG_DIR — Step 7), but a plain relaunch starts a
# blank session and never picks it up — which, from the user's seat, looks exactly
# like "my context was lost". So: when the prior run died without a clean [exit]
# trailer, relaunch with --continue to resume the last conversation.
# Skipped when the user passed their own session flag (--continue/--resume/-c/-r)
# or a non-interactive mode (-p/--print), when no transcript exists for this
# project, or when disabled with CLAUDE_AUTORESUME=off.
AUTORESUME_NOTE="idle (prior run exited cleanly or no prior run)"
if [ "$PRIOR_CRASHED" = "1" ] && [ "${CLAUDE_AUTORESUME:-on}" = "off" ]; then
  AUTORESUME_NOTE="disabled via CLAUDE_AUTORESUME=off (prior run HAD crashed)"
elif [ "$PRIOR_CRASHED" = "1" ]; then
  WANTS_OWN=0
  for a in "$@"; do
    case "$a" in --continue|-c|--resume|-r|--print|-p) WANTS_OWN=1 ;; esac
  done
  # Claude Code stores transcripts under <config>/projects/<cwd with
  # non-alphanumerics mapped to '-'> — only add --continue if one exists.
  PROJ_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/projects/$(printf '%s' "$PWD" | sed 's|[^A-Za-z0-9]|-|g')"
  if [ "$WANTS_OWN" = "1" ]; then
    AUTORESUME_NOTE="skipped (explicit session flag passed)"
  elif ! ls "$PROJ_DIR"/*.jsonl >/dev/null 2>&1; then
    AUTORESUME_NOTE="skipped (no transcript found in $PROJ_DIR)"
  else
    set -- --continue "$@"
    AUTORESUME_NOTE="on — prior run died without a clean exit; resuming last conversation via --continue"
    echo "Prior session died without a clean exit — RESUMING it (claude --continue)."
    echo "  To start fresh instead:  CLAUDE_AUTORESUME=off claude"
  fi
fi
echo "[resume]   $AUTORESUME_NOTE" >> "$META_LOG"

echo "Logging stderr to: $STDERR_LOG"
echo "Logging meta to:   $META_LOG"
echo

# Give the Node process room before V8's ~4.2 GB default heap ceiling aborts
# it, WITHOUT letting the heap grow large enough to OOM the whole container.
# The container cap is 16 GB, but this Repl already sits at ~4.5 GB baseline
# before Claude grows — so the old canonical 12 GB ceiling (12 + 4.5 = 16.5)
# overshoots the cap and gets SIGKILLed (exit 137) on long sessions. 8 GB
# (8 + 4.5 = 12.5) stays comfortably under 16. Raise toward 10240 only if you
# see exit 134 (V8 heap abort) AND measured baseline usage is lower than 4.5 GB.
# >>> Size this to FREE headroom, not the cap — see the formula in Step 2.
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=8192"
{ echo "[nodeopt] $NODE_OPTIONS"; echo "[tty]     $(tty 2>/dev/null)"; } >> "$META_LOG"

# Run claude. stderr is tee'd: written to the log AND forwarded to the
# terminal so the TUI keeps behaving normally.
"$CLAUDE_BIN" "$@" 2> >(tee -a "$STDERR_LOG" >&2)
EXIT=$?

{
  echo "[exit]     $(date -Is)"
  echo "[code]     $EXIT"
  echo "[memcur]   $(cat /sys/fs/cgroup/memory.current 2>/dev/null) bytes"
  echo "[mempeak]  $(cat /sys/fs/cgroup/memory.peak 2>/dev/null) bytes"
  echo "[oomkill]  $(grep oom_kill /sys/fs/cgroup/memory.events 2>/dev/null)"
} >> "$META_LOG"

echo
echo "claude exited with code $EXIT"
echo "  stderr: $STDERR_LOG"
echo "  meta:   $META_LOG"
case "$EXIT" in
  0)   echo "  (clean exit)" ;;
  129) echo "  (SIGHUP — terminal/tab closed or shell disconnected; the host pane died, not claude itself)" ;;
  130) echo "  (SIGINT / ctrl-c)" ;;
  134) echo "  (SIGABRT — likely V8 'JavaScript heap out of memory'; raise --max-old-space-size further)" ;;
  137) echo "  (SIGKILL — container/OOM kill; cross-check oom_kill in the meta log)" ;;
  139) echo "  (SIGSEGV — segfault, a native crash/bug)" ;;
  143) echo "  (SIGTERM — something asked claude to stop)" ;;
  *)   echo "  (non-standard exit code)" ;;
esac
```
<!-- script:run-claude.sh:end -->

> **⚠️ Maintainers: the `<!-- script:NAME:begin/end -->` markers around this
> block (and the `claude-tmux.sh` / `claude-autostart.sh` blocks) are
> load-bearing.** Every app's daily auto-update hook extracts these fenced
> blocks *by those markers* and installs them over its local scripts (see
> "Auto-update once per day"). When editing a script block, keep the markers
> intact, keep exactly one ```` ```bash ```` fence directly inside them, and
> keep the script valid bash — a client-side `bash -n` gate refuses broken
> extractions, so a malformed edit silently stops propagating instead of
> breaking apps.

> **What the auto-resume block buys you (added 2026-07-04).** Before it existed,
> a container recycle or hard crash meant the next launch started a **blank**
> session — the transcript had survived on disk (Step 7) but nothing reopened
> it, so users reported "the doc promised my context would survive and it
> doesn't." Now `run-claude.sh` classifies how the prior run ended (the
> `[recycle]` verdict in the meta log) and, if it died without a clean `[exit]`,
> relaunches with `--continue`. Behaviours to know: a clean exit (including
> ctrl-c) always starts fresh; an explicit `--continue`/`--resume`/`-c`/`-r`/`-p`
> you pass yourself is never overridden; it only fires when a transcript actually
> exists for this project dir; `CLAUDE_AUTORESUME=off claude` opts out for one
> launch. Honest limit: `--continue` restores the *conversation* — in-flight
> process state (an unfinished tool call, unsaved plan) still dies with the
> recycle. **If this Repl's `run-claude.sh` predates this block, re-apply the
> script above** (keep your Repl's sized `--max-old-space-size` value).

### Make them executable + don't commit the logs

```sh
chmod +x claude-tmux.sh run-claude.sh
grep -qxF 'claude-logs/' .gitignore 2>/dev/null || echo 'claude-logs/' >> .gitignore
```

> **Run the `.gitignore` line immediately — same breath as writing the scripts,
> before Step 4's first launch.** Replit's background Agent auto-checkpoint
> commits new repo-root files within seconds of their creation; on one fresh
> install it grabbed the launcher scripts *and* the just-created `claude-logs/`
> runtime dir in a single auto-commit before the ignore line had run. And a
> **tracked** file overrides `.gitignore` (the same race Part 4 Step 2b
> documents for `.claude/settings.local.json`), so adding the ignore afterwards
> silently does nothing — the confusing symptom is `git check-ignore` reporting
> the path as ignored while the logs keep showing up in `git status`. If a
> checkpoint beat you to it, untrack them (keeps the local files):
>
> ```sh
> git ls-files claude-logs | grep -q . && git rm -r --cached claude-logs
> ```
>
> **None of the Claude-tmux scaffolding needs to be pushed to GitHub.** The
> Part 4 GitHub mirror exists to back up *the app's own code*; everything this
> doc installs is regenerable and therefore optional to track:
>
> | Scaffolding | Why a push adds nothing |
> |---|---|
> | `claude-tmux-setup.md` (this doc) | re-fetched daily from the central app by the auto-update hook |
> | `run-claude.sh` / `claude-tmux.sh` / `claude-autostart.sh` | auto-synced from this doc's marked script blocks (v2 hook) |
> | `claude-logs/`, `.worklog-reported` | runtime state — should be gitignored anyway (above) |
> | `$REPL_HOME/.config/*` (bashrc hooks, claude login) | outside the repo; never committed |
>
> Committing the doc + launcher scripts is still fine and is the default (they
> then ride along on normal pushes — harmless). But if you'd rather keep the
> repo's GitHub history free of scaffolding noise, adding all of them to
> `.gitignore` loses nothing: a fresh container heals itself from the durable
> bashrc hooks and the central app. Either way, **never commit on the
> scaffolding's account alone** — the worklog scope rule in Part 2 applies (a
> setup-only session needs no commit, and its changes never *require* a push).

---

## Step 4 — First run + verify

```sh
./claude-tmux.sh
```

What should happen:

1. If tmux wasn't installed, the script installs it via Nix (~30 s). One-off.
2. A new tmux session named `claude` opens, running Claude Code under
   `run-claude.sh` with the heap ceiling you sized in Step 2 (8 GB on a typical
   busy 16 GB Repl).
3. Inside Claude, the `[bin]` line in `claude-logs/claude-<ts>.meta` shows
   which binary actually got run.

**Verify the session survives a tab close** (this is the whole point):

1. Detach with `Ctrl-b` then `d`. You should see "Logging stderr to: …" and
   drop back to the shell.
2. `tmux ls` should show `claude: 1 windows (created …)`.
3. Run `./claude-tmux.sh` again — it should **reattach to the same session**,
   not start a new one. Your context is preserved.

---

## Step 5 — Quality-of-life tmux config (scrollback + mouse)

> **Now automatic.** `claude-tmux.sh` recreates `~/.tmux.conf` (mouse scroll +
> 50k scrollback) if it's missing on every launch, and sources it on reattach —
> so a fresh container no longer silently reverts to `mouse off` / 2000 lines.
> The manual steps below are kept for reference and for tweaking the settings.

Out of the box tmux runs on defaults that surprise people coming from a normal
terminal:

- **No scrollbar / mouse-wheel scrolling.** tmux owns the screen (alternate
  screen), so the terminal emulator's scrollbar has nothing to scroll. You
  reach history through *copy mode* (`Ctrl-b` then `[`, then arrows/`PgUp`,
  `q` to leave) — not the mouse — unless you turn the mouse on.
- **Tiny scrollback.** The default `history-limit` is 2000 lines, which a
  chatty Claude session blows through fast.

Write a `~/.tmux.conf` to fix both:

```sh
cat > ~/.tmux.conf <<'EOF'
# ~/.tmux.conf — Claude Code / Replit persistent-session tweaks.
#
# Read when a tmux server starts. To apply to an already-running server:
#   tmux source-file ~/.tmux.conf

# Bigger scrollback. Default is 2000 lines, which scrolls away fast in a
# chatty Claude session. (Takes effect for panes created after it's set.)
set -g history-limit 50000

# Mouse wheel scrolls tmux's scrollback (and enters copy mode), plus
# click-to-select pane/window and drag-to-resize.
#
# Trade-off: with mouse on, drag-selecting text copies into tmux's paste
# buffer, not the system clipboard. To use your terminal's NATIVE
# selection/scrollbar instead, hold Shift while selecting or scrolling.
set -g mouse on

# Vi-style keys in copy mode (Ctrl-b [ to enter, q to leave).
setw -g mode-keys vi
EOF
```

A config file is only read when a tmux **server starts**, so apply it to the
session you're already in without restarting:

```sh
tmux source-file ~/.tmux.conf
```

Verify it took on the running server:

```sh
tmux show-options -g | grep -E '^(history-limit|mouse) '
tmux show-window-options -g | grep -E '^mode-keys '
# expect: history-limit 50000 / mouse on / mode-keys vi
```

Two caveats to pass on to the user:

1. **`history-limit` only applies to panes created *after* it's set.** The
   current pane keeps its old 2000-line buffer; new windows/panes (and any
   fresh `./claude-tmux.sh` session) get the full 50000.
2. **With `mouse on`, drag-select copies to tmux's buffer, not the system
   clipboard.** Hold **Shift** while selecting/scrolling to fall back to the
   terminal's native behaviour.

This file lives in `~/` (not the repo), so there's nothing to commit. You no
longer need to re-run it on each fresh Repl — `claude-tmux.sh` recreates it when
missing (see the note at the top of this step). Only re-run the `cat` block
manually if you want to change the settings.

---

## Step 6 — Make `claude` always launch in tmux (MANDATORY)

**Do this — it's required, not optional.** Without it, a fresh container leaves
the user with a bare `claude` that runs *outside* tmux and dies on the next tab
close or SIGHUP — the exact crash Part 1 exists to prevent. The setup isn't done
until plain `claude` automatically runs inside the persistent session **and**
that behaviour survives a container recycle on its own.

Do it by **shadowing the `claude` command** with a shell function in the durable
`$REPL_HOME/.config/bashrc`. Don't bother with a separate `claude-tmux` PATH
command/symlink — shadowing `claude` is simpler, needs nothing in `$HOME`, and
can't be forgotten (typing `claude` just does the right thing).

### Why `$REPL_HOME/.config/bashrc` (not `~/.bashrc` or `~/.profile`)

A Replit Shell tab opens an *interactive non-login* bash that sources the Nix
`~/.bashrc`, which **never reads `~/.profile`** — a block there silently never
runs. And `~/.bashrc` itself is a read-only Nix store symlink (appends fail with
"Permission denied"). But the Nix `~/.bashrc` ends by sourcing
`$REPL_HOME/.config/bashrc`:

```sh
if [[ -f "${BASHRC}" ]] && [[ -z "${REPLIT_MODE}" ]]; then
    source "${BASHRC}"   # BASHRC = ${REPL_HOME}/.config/bashrc
fi
```

So that file is sourced by **every interactive Shell-tab session** (skipped only
in agent/workflow `REPLIT_MODE`, which is fine — those should use the real
binary). And because `$REPL_HOME` is the **workspace**
(`/home/runner/workspace`), it lives alongside the repo and **persists across
container recycles** — the one writable, sourced-every-tab, durable shell-init
hook on Replit.

### Add the shadow function

Append this function to `$REPL_HOME/.config/bashrc`:

```sh
cat >> "$REPL_HOME/.config/bashrc" <<'EOF'

# Always run `claude` inside a persistent tmux session so a dropped Replit tab
# or SIGHUP can't kill it (the "session just ended, back at the shell" crash).
# claude-tmux.sh reattaches to a live session or starts one running the
# instrumented run-claude.sh wrapper. We shadow the `claude` command with a
# function; `command claude` / `type -P claude` still reach the real binary, so
# there's no recursion. If we're already inside tmux, or the wrapper is gone,
# fall straight through to the real CLI.
claude() {
  # Once-per-day setup-doc auto-update (Part 1, "Auto-update once per day"),
  # if that hook is defined — so typing `claude` always triggers the check.
  command -v _setup_doc_autocheck >/dev/null 2>&1 && _setup_doc_autocheck
  local wrapper="$REPL_HOME/claude-tmux.sh"
  if [ -n "${TMUX:-}" ] || [ ! -x "$wrapper" ]; then
    command claude "$@"
  else
    CLAUDE_BIN="$(type -P claude)" "$wrapper" "$@"
  fi
}
EOF
```

Why this is the right approach:

- **Zero new commands to remember** — `claude` just does the right thing, so
  nobody forgets to use the wrapper.
- **Nothing in `$HOME` to heal** — the function lives in the durable workspace
  file; there's no `~/.local/bin` symlink to vanish on a container recycle.
- **Safe fallthroughs** — `command claude` / `type -P claude` still reach the
  real binary (no recursion); inside tmux it runs the real CLI (no nested
  sessions); and if the wrapper script is missing it falls through too.

Verify it took, in a fresh interactive shell the way the Shell tab opens one:

```sh
bash --rcfile ~/.bashrc -ic 'type claude'
# → "claude is a function" (not just the binary path)
```

Caveat: the function only exists in interactive Shell-tab bash sessions
(anything sourcing that bashrc). Scripts, cron, and `REPLIT_MODE` agent
shells still see the real `claude` binary — which is what they should use
anyway.

### Notes

- **`$REPL_HOME` is the workspace, not `$HOME`.** On this Repl
  `$REPL_HOME=/home/runner/workspace`. That's why `$REPL_HOME/.config/bashrc`
  persists with the repo while `~/.local/bin` (in `$HOME`) gets wiped.
- **Don't edit `~/.bashrc` or `~/.profile`.** `~/.bashrc` is a read-only Nix
  store symlink (appends fail with "Permission denied"); `~/.profile` isn't
  read by the interactive Shell tab at all. `$REPL_HOME/.config/bashrc` is the
  correct, writable, sourced-every-tab hook.

---

## Step 7 — Persist Claude's login across container recycles (MANDATORY)

**Do this — without it, every container recycle drops you at a fresh `claude`
login.** Steps 1–6 make the *launcher* survive recycles (the tmux shadow
function lives in the durable `$REPL_HOME/.config/bashrc`; `~/.tmux.conf` is
re-created when missing). But they do **not** persist Claude Code's own config
and OAuth token. By default Claude stores both under `~/.claude` — which is in
`$HOME`, the directory this doc already notes "a fresh Replit container wipes."
So the launcher heals perfectly and you *still* get sent through a login prompt
every morning. This is the common "logging back in is painful" complaint, and
it's a separate problem from the launcher surviving.

The fix follows the same principle as the rest of Part 1: move the durable state
into the persisted workspace. Point `CLAUDE_CONFIG_DIR` at a workspace path and
migrate the existing config once.

### Why `$REPL_HOME/.config/claude` (not `$REPL_HOME/.claude`)

It's tempting to use `$REPL_HOME/.claude`, but on Replit `$REPL_HOME` *is* the
repo root — so `$REPL_HOME/.claude` is the **same directory your repo commits
`.claude/settings.json` into** (Part 2's SessionEnd hook). Putting Claude's
`.credentials.json` there means the OAuth token sits inside a tracked directory,
safe only if the app's `.gitignore` carries an exactly-right `.claude/*` +
`!.claude/settings.json` pair — which most apps don't (a plain `git check-ignore
.claude/.credentials.json` on a typical app comes back *not ignored*).
`$REPL_HOME/.config/claude` sidesteps this entirely: it's the same durable
`$REPL_HOME/.config` dir Step 6 already uses for `bashrc`, it sits outside any
tracked project dir, and Replit's `.config` is gitignored — so the token can't be
committed by accident regardless of the app's rules.

### Set it + migrate

1) Export it from the same durable, sourced-every-tab hook Step 6 uses, so
   **every** invocation (the `claude` shadow function included) uses the
   persisted dir. Append to `$REPL_HOME/.config/bashrc`:

```sh
cat >> "$REPL_HOME/.config/bashrc" <<'EOF'

# Persist Claude Code's own config + OAuth token across container recycles.
# Default ~/.claude is in $HOME, which a fresh Replit container wipes -> forced
# re-login every recycle. Point it at the persisted workspace instead. We use
# $REPL_HOME/.config/claude (gitignored, durable) NOT $REPL_HOME/.claude, which
# == the repo's tracked .claude/ dir — so the token can never be committed.
export CLAUDE_CONFIG_DIR="$REPL_HOME/.config/claude"
EOF
```

2) One-time migration so your current login carries over (no re-login at switch
   time):

```sh
mkdir -p "$REPL_HOME/.config/claude"
cp -rn ~/.claude/. "$REPL_HOME/.config/claude/" 2>/dev/null || true
```

`-n` never clobbers a newer file already in the workspace; `|| true` keeps it
fail-soft if `~/.claude` doesn't exist yet.

3) **Belt-and-suspenders for the launcher** — `CLAUDE_CONFIG_DIR` must be baked
   into the tmux command string in `claude-tmux.sh` exactly like `CLAUDE_BIN`
   is, so a tmux server started with a stripped env still gets it. The
   canonical `claude-tmux.sh` in Step 3 **already includes this** (the
   `CMD="CLAUDE_CONFIG_DIR=…" $CMD"` line right after the `CLAUDE_BIN` baking) —
   verify it's present; only a pre-2026-07 copy of the script needs it added by
   hand (or just let the script auto-sync bring it in).

A new tmux session started from a shell that sourced the Step 6 hook already
inherits `CLAUDE_CONFIG_DIR`, so this only matters when reattaching to a
pre-existing server — same rationale as the `CLAUDE_BIN` baking.

### Verify

```sh
# A fresh interactive shell exports the persisted dir:
bash --rcfile ~/.bashrc -ic 'echo "$CLAUDE_CONFIG_DIR"'
# -> /home/runner/workspace/.config/claude

# The token landed there AND is not committable:
ls "$REPL_HOME/.config/claude/.credentials.json" >/dev/null 2>&1 \
  && (git check-ignore "$REPL_HOME/.config/claude/.credentials.json" >/dev/null \
        && echo "persisted + gitignored (safe)" \
        || echo "WARNING: token present but NOT gitignored — fix before committing") \
  || echo "no token yet — log in once, then re-check"
```

After the next recycle, `claude` should start already logged in: the OAuth token
(which carries a refreshToken and auto-refreshes) survives because it now lives
on the persisted volume. The token is a secret with the same posture as
`RECEIVER_TOKEN` — never commit it, never paste it anywhere. Nothing here needs
re-running per container: the `export` lives in the durable `bashrc` hook and the
migration is one-time.

---

## Step 8 — Optional: headless boot autostart (have the session up before any shell)

> **Optional, and a refinement of the "why not cron" note above — read that
> first.** Everything in Steps 1–7 is self-healing, but it only *fires* when a
> human opens a Shell tab or types `claude`: the durable `bashrc` hook is the
> doc's "runs on every fresh container" mechanism precisely because Replit gives
> no general user-controlled init/systemd you can rely on across recycles. That
> remains true for *arbitrary* boot hooks. But there is **one** thing Replit
> auto-runs on container boot with no shell: the **run-button workflow** in
> `.replit` (`[workflows] runButton = "…"`). Adding the launcher there as a
> parallel task gives genuine *headless* boot autostart — the `claude` tmux
> session is already up to reattach to after a recycle, with nobody opening a
> shell. Set this up only if you want the session live on boot rather than on
> first shell; Steps 1–7 are enough on their own.

### Add `claude-autostart.sh` (idempotent, fail-soft, detached)

A small launcher at the repo root that starts the session **detached** (no TTY
needed) and is a **no-op if the session already exists** — so it's safe to run on
every boot and as a parallel workflow task. Disable with `CLAUDE_AUTOSTART=off`.

<!-- script:claude-autostart.sh:begin -->
```bash
#!/usr/bin/env bash
# Headless boot autostart for the persistent Claude tmux session. Idempotent +
# fail-soft (always exits 0) so it can't block the app's dev servers. Disable
# with CLAUDE_AUTOSTART=off.
set -u
[ "${CLAUDE_AUTOSTART:-on}" = "off" ] && exit 0
SESSION=claude
DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
export REPL_HOME="${REPL_HOME:-$DIR}"
export CLAUDE_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$REPL_HOME/.config/claude}"
TMUX_CACHE_DIR="$REPL_HOME/.config/claude-tmux-bin"
for d in "$HOME/.nix-profile/bin" "$HOME/.local/bin" "$TMUX_CACHE_DIR"; do
  case ":$PATH:" in *":$d:"*) ;; *) PATH="$d:$PATH" ;; esac
done; export PATH
if ! command -v tmux >/dev/null 2>&1 || ! tmux -V >/dev/null 2>&1; then
  command -v nix >/dev/null 2>&1 && { nix profile add nixpkgs#tmux >/dev/null 2>&1 || nix profile install nixpkgs#tmux >/dev/null 2>&1 || true; }
  hash -r 2>/dev/null || true
fi
command -v tmux >/dev/null 2>&1 && tmux -V >/dev/null 2>&1 || exit 0
tmux has-session -t "$SESSION" 2>/dev/null && exit 0   # already up -> no-op
CLAUDE_BIN="${CLAUDE_BIN:-$(command -v claude || true)}"
[ -x "$CLAUDE_BIN" ] || exit 0
[ -x "$DIR/run-claude.sh" ] && LAUNCHER="$DIR/run-claude.sh" || LAUNCHER="$CLAUDE_BIN"
CMD="CLAUDE_BIN=$(printf '%q' "$CLAUDE_BIN") CLAUDE_CONFIG_DIR=$(printf '%q' "$CLAUDE_CONFIG_DIR") $(printf '%q' "$LAUNCHER"); exec bash"
tmux new-session -d -s "$SESSION" "$CMD" || true
exit 0
```
<!-- script:claude-autostart.sh:end -->

`chmod +x claude-autostart.sh`. It bakes `CLAUDE_BIN` and `CLAUDE_CONFIG_DIR`
into the detached command string for the same reason `claude-tmux.sh` does — a
boot-time tmux server may start with a stripped env.

### Wire it into the run workflow in `.replit`

Add it as an extra **parallel** task next to the app's existing dev task(s), so
it starts alongside them on boot:

```toml
[[workflows.workflow]]
name = "Project"            # must match runButton
mode = "parallel"
# ... the app's existing dev task(s) unchanged ...
[[workflows.workflow.tasks]]
task = "shell.exec"
args = "bash claude-autostart.sh"
```

### Belt-and-suspenders in the durable bashrc hook

Covers a shell opened *without* Run (so the session still comes up). Append to
`$REPL_HOME/.config/bashrc` alongside the Step 6/7 blocks:

```sh
[ -z "${REPLIT_MODE:-}" ] && [ -x "$REPL_HOME/claude-autostart.sh" ] && ( "$REPL_HOME/claude-autostart.sh" >/dev/null 2>&1 & )
```

### Two caveats worth knowing

- **The run-button workflow is often Replit-*managed* and not present in
  `.replit`.** Defining it in-file makes the file the source of truth, so you
  must replicate the app's existing dev tasks faithfully (read them from the
  Workflows UI / `ps`) or you'll drop them. If a task used `waitForPort` to bind
  the webview and you omit it, the Run webview's auto-open behavior can change
  (the dev servers still run). All reversible via `git checkout .replit`.
- **It launches Claude Code headless at its prompt** — idle, spending no tokens
  until you attach and type. The first attach may show one-time onboarding
  (theme) for the persisted config dir.

---

## Troubleshooting — known failure modes

### `ERROR: 'claude' not on PATH and CLAUDE_BIN not set`

The Claude Code CLI isn't installed in this Repl, or isn't on PATH.

```sh
# Most common: install via npm
npm i -g @anthropic-ai/claude-code

# If npm global is on a weird prefix and not on PATH:
npm config get prefix    # e.g. /home/runner/workspace/.config/npm/node_global
ls "$(npm config get prefix)/bin/claude"    # confirm it landed
export PATH="$(npm config get prefix)/bin:$PATH"

# Or pin it explicitly (persist to ~/.bashrc):
echo 'export CLAUDE_BIN="/abs/path/to/claude"' >> ~/.bashrc
```

### `ERROR: no Nix package manager — can't auto-install tmux`

Rare on Replit (it ships Nix by default), but possible. Install tmux some
other way then re-run:

```sh
apt-get install -y tmux       # if apt works in this container
# or use the system package manager that does work in this environment
```

### `ERROR: tmux installed but crashes (exit 139)` — segfault at `tmux -V`

What's happening: the legacy `nix-env -iA nixpkgs.tmux` resolved against your
user's Nix **channel**, which on Replit is often a 2021-era snapshot. The
tmux build it shipped is linked against **glibc 2.33** — and on the current
Replit kernel (6.x) that old glibc + new kernel combo segfaults at startup.
`ldd $HOME/.nix-profile/bin/tmux` will show paths like
`/nix/store/…-glibc-2.33-47/lib/libc.so.6`, which is the smoking gun.

Fix — switch to the modern Nix flakes path, which pulls a current build:

```sh
# Remove the broken legacy install
nix-env -e tmux

# Reinstall via flakes (resolves against current nixpkgs)
nix profile install nixpkgs#tmux

# Verify
tmux -V        # expect tmux 3.x+ printed, NOT a segfault
```

If `nix` itself isn't on PATH, refresh the channel instead and retry the
legacy install:

```sh
nix-channel --update
nix-env -iA nixpkgs.tmux
tmux -V
```

The updated launcher in this doc tries flakes **first** and verifies with
`tmux -V` after installing, so it catches this failure mode loudly instead of
handing you a tmux that crashes the moment a session starts. If you're seeing
this on an older copy of `claude-tmux.sh`, pull the updated version.

### `ERROR: tmux still not on PATH after install`

Nix installed it but the current shell hasn't picked it up. The script
already prepends `~/.nix-profile/bin`, so the most likely cause is that the
shell is wrapping `command -v` in a stale hash table.

```sh
export PATH="$HOME/.nix-profile/bin:$PATH"
hash -r
which tmux
./claude-tmux.sh
```

### Exit 134 (SIGABRT — heap exhaustion) still happens

The heap ceiling wasn't enough (very long session, large repo). Before raising
it, re-check the baseline (cgroup `memory.current`, not `free -h` — see
Step 2) — you can only raise the ceiling by as much
free headroom as you actually have, or you'll just convert this into an exit-137
OOM (see below). If there's room, bump it by ~2 GB:

```sh
sed -i 's/--max-old-space-size=8192/--max-old-space-size=10240/' run-claude.sh
```

…and tell the user to restart their session.

### Exit 137 (SIGKILL — container OOM) — *the crash that prompted Step 2's rewrite*

The *container* ran out of memory and the kernel killed Claude. This is the
failure mode that looks identical to exit 134 from the user's seat — blank
screen, context gone — but the cause is different: the heap ceiling was set
**higher than the free headroom**, so V8 grew until total container memory hit
the cap. Confirm it:

```sh
grep oom_kill /sys/fs/cgroup/memory.events     # non-zero count = OOM happened
cat /sys/fs/cgroup/memory.max                  # the cap
cat /sys/fs/cgroup/memory.current              # this container's baseline (not free -h)
```

The fix is **lower the heap ceiling**, not raise it — re-run the Step 2 formula
(`cap − baseline − ~3 GB`) and set `--max-old-space-size` to that. On a 16 GB
Repl with ~4.5 GB baseline that's 8192. Only if the baseline itself is the
problem (other heavy processes, large files loaded) does reducing memory
pressure elsewhere help instead. This is exactly why the doc no longer ships a
flat 12288.

### `claude-tmux.sh` keeps making new sessions instead of reattaching

You probably renamed the session or have a stale dead session. Check
`tmux ls`. If the named session exists but you want a fresh one:

```sh
tmux kill-session -t claude
./claude-tmux.sh
```

**Always scope the kill to the named session — never `tmux kill-server`.**
`kill-server` tears down *every* tmux session on the box, including any unrelated
long-running panes you have open elsewhere, so reaching for it to clear one stuck
`claude` session is an easy way to lose other work. `tmux kill-session -t claude`
(above) removes only the one session and leaves everything else running.

### `claude` is stuck on an old version even after an update

**Symptom:** `claude --version` (or the version in the TUI) is older than the
binary actually installed on disk — even right after Claude Code printed an
"installing update" message.

**Cause:** the persistent tmux session is exactly why. When the `claude` session
already exists, `claude-tmux.sh` takes the reattach branch
(`exec tmux attach -t claude`) — it **does not relaunch the CLI**. So when an
update lands (npm drops a new binary, or Claude self-updates the on-disk
install), the process inside the long-lived pane keeps running the version it was
originally launched with. Reattaching only re-displays that same live process; it
never starts a new one, so you stay on the old version indefinitely. This is the
flip side of the persistence that survives tab closes — an in-place update
doesn't take effect until the session is killed and relaunched.
`npm i -g @anthropic-ai/claude-code` (or the auto-updater) is **not** enough
while a session is live.

**Confirm:**

```sh
ps -eo pid,cmd | grep [c]laude          # note the running binary path
npm view @anthropic-ai/claude-code version   # latest published
"<that-binary>" --version               # what's on disk now
```

If the on-disk version is newer than the running TUI, this is the cause.

**Fix — restart the session (reattach is not enough):**

```sh
# detach (Ctrl-b d) or exit claude first, then from a plain shell:
tmux kill-session -t claude
claude            # or ./claude-tmux.sh — starts a fresh session on the new binary
```

### Scripts from a previous failed attempt are already here

Read them first — they may be a different version. If unsure, replace with
the canonical versions above and re-`chmod +x`. Tell the user what changed.

### Display stuck small — small window ringed with dots, or the input line floats mid-screen

**Symptom:** Claude Code renders in only part of the terminal — either a small
window with a dotted border filling the unused area, or the input line sitting
mid-screen with stale rows below it. `tmux refresh-client` does not help (it only
repaints tmux's existing buffer; it cannot change geometry).

**Cause:** the tmux *window* is smaller than the attached *client* (terminal).
The usual trigger is a manual `tmux resize-window -x/-y`, which pins the window
to a fixed size; if the terminal is later enlarged, the window stays small and
tmux fills the gap with dots. The mid-screen input line is the same bug — the app
draws inside the smaller window while the rest of the terminal is unused.

**Diagnose** (compare the two sizes — a mismatch is the tell):

```sh
tmux list-clients -F "client: #{client_width}x#{client_height}"
tmux list-windows -F "window: #{window_width}x#{window_height}"
```

**Fix** — snap the window back to the client and keep it auto-tracking:

```sh
tmux resize-window -A           # resize window to the attached client
tmux set -g window-size latest  # auto-track the most-recent client from now on
```

`window-size latest` is the default, but a manual `resize-window` overrides it
until the next client resize. `tmux attach -d` (detach others + reattach)
achieves the same reset.

**Prevention:** don't reach for manual `resize-window -x/-y` to fix a half-screen
display — that's what pins the bad size. For a stale/half display use
`resize-window -A` or detach/reattach; reserve `refresh-client` for repainting
artifacts only.

### Republish is invisible to clients — stale `index.html` cached at the edge

> This one is about the *app you're deploying*, not the claude launcher — but it's
> the same "why am I still seeing old code?" confusion as the version-stuck entry
> above, so it lives here. Applies to any single-page app you republish on Replit.

**Symptom:** you republish the Replit deployment, but clients still see the OLD
app — most visibly when the app is embedded in an iframe by another app, or
reached via a **custom domain** (e.g. `metrics.evolvepro.ai`). A fresh/incognito
browser or a headless Playwright fetch shows the NEW build; a normal browser
(even a different one, e.g. Edge) shows the OLD one. Checking the served bundle
(`curl <domain>/ | grep assets/index-`) and grepping it for a string you just
changed confirms whether the edge is actually serving new code.

**Cause:** the SPA's `index.html` is being cached by a layer you don't control —
the browser, an embedding iframe, or (the big one on Replit) the **custom-domain
edge/CDN**. `index.html` references the current content-hashed bundles
(`/assets/index-<hash>.js`); if a stale `index.html` is served, it pulls the old
bundle and the republish is invisible. Serving everything with `express.static`
defaults (`max-age=0` + ETag) is usually fine, but a CDN can still pin it.

**Fix:** split the cache policy — hash-named assets immutable, HTML never cached.
In the Express static handler (e.g. `serveStatic` in `server/vite.ts` on the
Vite + Express stack):

```js
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith("index.html")) {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
  },
}));
// SPA fallback must also send no-cache:
app.use("*", (_req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.resolve(distPath, "index.html"));
});
```

**Two gotchas after applying it:**

1. This is server code (bundled into the deploy) — it only takes effect **after
   you republish**.
2. The header only governs responses served *after* the redeploy. An
   `index.html` the edge/browser **already cached** (with the old cacheable
   headers) persists until it expires or is **purged once** — clients may need
   one hard-refresh, or bust it with a throwaway query param (`&v=2`). Every
   republish *after* that is picked up immediately.

**Quick diagnosis** (is the edge serving old or new?): load the exact failing URL
in a clean headless browser (Part 3) and grep the DOM / loaded chunk for a
known-new string. New there but old in your browser means it's a client/edge
cache, not a bad deploy.

### The auto-generated `Project` runButton silently runs TWO app dev servers

> Another *app-you're-deploying* quirk (like the edge-cache entry above), and a
> close cousin of Step 8 — same `.replit` run-button workflow, opposite problem:
> instead of adding a task you want, the scaffold added one you don't. Worth
> checking on any Agent-scaffolded Repl, because the symptom is invisible until
> side effects double.

**Symptom:** every boot launches **two full instances** of the app's dev server.
The webview only shows one, so nothing looks wrong — until you notice doubled
side effects: a scheduler/cron self-POST firing twice, webhooks processed twice,
two copies of a DB scraper, wasted RAM/CPU (which also eats into the Step 2 heap
headroom).

**Cause:** Replit's Agent frequently scaffolds `.replit` with a parallel
wrapper workflow that *both* shell-execs a dev server on a second port *and*
runs the real workflow — which starts its own dev server:

```toml
[workflows]
runButton = "Project"

[[workflows.workflow]]
name = "Project"
mode = "parallel"
[[workflows.workflow.tasks]]
task = "shell.exec"
args = "PORT=8081 ... pnpm run dev"   # instance A (second port)
[[workflows.workflow.tasks]]
task = "workflow.run"
args = "My App"                       # instance B — also runs `pnpm run dev`
```

There's usually a matching inert `[[ports]] localPort = <second port>` block
left over too.

**Detect it** (any app):

```sh
ps -eo pid,ppid,etime,args | grep -E "run dev|watch|index\.(t|j)s" | grep -v grep
```

Two identical dev-server process trees (often both parented by Replit's
supervisor) means you're running doubles. Corroborate by grepping the app logs
for the startup banner / "listening on" appearing twice per boot, or any
self-POST/heartbeat firing twice.

**Fix** — point the run button straight at the single real workflow and delete
the wrapper plus its extra port:

```toml
[workflows]
runButton = "My App"          # was "Project"

[[workflows.workflow]]
name = "My App"
[[workflows.workflow.tasks]]
task = "shell.exec"
args = "pnpm run dev"
waitForPort = 8080
# (delete the whole `Project` workflow and the second [[ports]] block)
```

Takes effect on the next workflow restart / VM boot; the already-running
duplicate persists until then (kill it or restart the workflow). This is pure
hygiene — it does **not** stop Replit's workspace VM recycles (see "Why this
exists" at the top of Part 1) — but it removes a real, easy-to-miss source of
double side effects. If you later add Step 8's autostart task, you'll be
editing this same workflow — make sure you're extending the *real* one, not
resurrecting the wrapper.

---

## When you're done — what to report back to the user

A short status with the four facts that matter:

1. **Binary:** the `[bin]` line from the meta log (where `claude` actually
   resolved on this Repl).
2. **Container cap + baseline:** what `memory.max` returned, the container
   baseline from cgroup `memory.current`, and which `--max-old-space-size` the
   Step 2 formula gave (`cap − baseline − ~3 GB`).
3. **tmux:** was it already installed, or did you install it via Nix?
4. **Verification:** confirmed the session reattaches across `Ctrl-b d` →
   re-running the launcher, and that the Step 6 `claude` shadow function is in
   `$REPL_HOME/.config/bashrc` (`type claude` → "claude is a function").

Then hand the user this single command to remember:

```sh
claude
```

— from now on, that's how they start a Claude Code session on this Repl. The
Step 6 shadow function transparently runs it inside the persistent tmux session
(`./claude-tmux.sh` still works too), so a dropped tab can't lose their context
any more.

---

# Part 2 — Worklog reporting (per app)

> **This is a handover for the Claude Code session in an app I want to record.**
> Goal: report this app's **commits** and **Claude sessions** to my central
> Worklog receiver (a separate Replit app that shows them on a dashboard).
> Implement the small sender described below — adapt it to this repo; don't ask
> me to paste anything.

**The reporting rule, stated plainly: every commit and every push MUST reach the
recorder.** Recording is not best-effort — a commit that lands in this repo, or a
push that carries commits to GitHub, must also produce a worklog event, or the
dashboard silently under-reports real shipped work. ("MUST" governs the *intent*,
not the mechanism: the hooks that enforce it stay strictly fail-soft — they
always *attempt* to report but never block a commit or a push if the receiver is
down.) The post-commit hook covers commits made through the normal path; the
**pre-push hook (below)** closes the gap where commits reach GitHub without ever
having been reported — history created by tooling/CI, an amend/rebase, or a
session where the post-commit hook was bypassed.

## The contract

POST one JSON event per commit and per session to the receiver:

```
POST https://globalapprecorder.replit.app/api/worklog
```

**Auth header (required by Replit, not by the app):** the receiver itself has no
auth, but it's a published Replit deployment behind Replit's Shield, which
rejects plain external POSTs. So every request must carry a Replit **External
Access Token** as a bearer header:

```
Authorization: Bearer <RECEIVER_TOKEN>
```

I'll give you the token value. (Replit shows two values when it's minted — use
the **bearer** token, the `Authorization: Bearer` one; ignore the "bypass"
query-param token, which is only for clients that can't set headers.) **Don't
hard-code or commit it** — store it as a secret/env var in this app
(`RECEIVER_TOKEN`) and read it in the reporter script. It's a Replit
infrastructure token (it can expire / be rotated), not an app password. (Ignore any older version of this doc that mentions a
`WORKLOG_TOKEN` in the JSON body — that's gone; the only token is this header.)

Only `app` and `type` are required — the receiver is lenient and defaults the
rest. `type` is `"commit"` or `"session"`; `commit` is empty for sessions:

```json
{ "app": "KMG Lawn Estimator", "type": "commit", "branch": "main",
  "summary": "Fixed login bug", "commit": "996f999",
  "files": 2, "insertions": 81, "deletions": 13 }
```

**The `app` field is this app's display name on the dashboard — you set it.**
The receiver stores and shows whatever you send (no registration). Don't use
the `package.json` name (often something useless like `workspace`); pick a clear
human label and hard-code it in the reporter script (see below). If you're
unsure what to call it, propose a name from the repo's purpose and confirm with
me.

The recorded app just needs to be a git repo; `git`, `curl`, and `awk` are
enough (no jq).

## Implement four things

1. **A reporter script** (e.g. `worklog.sh <commit|session>` at the repo root)
   that builds one event and POSTs it. Put the receiver URL and this app's
   display name at the top of the script; read the token from the env var
   `RECEIVER_TOKEN` (do not hard-code it).
   - `commit` mode: short hash + subject of the commit, and file/insertion/deletion
     totals from `git show --numstat` (treat binary `-` as 0). Default to `HEAD`,
     but accept an **optional commit-ish argument** (`worklog.sh commit <hash>`)
     so the pre-push hook can report a specific historical commit, not just the
     tip. After a successful report, append the full hash to a durable, gitignored
     `.worklog-reported` ledger (see hook 4) so the same commit is never reported
     twice.
   - `session` mode: no hash; summary = lines appended to `.worklog` this session
     (then clear the file), falling back to `(session ended)`; volume from
     `git diff HEAD --numstat`.
   - JSON-escape strings yourself (no jq). POST with
     `curl -fsS -m 5 -H "Authorization: Bearer $RECEIVER_TOKEN"`.
   - **Fail-soft: it must never break a commit, a session, or a push — swallow
     errors and exit 0.**

2. **A git post-commit hook** that runs the reporter in `commit` mode in the
   background, **then also flushes the session narrative** by running it in
   `session` mode. Use a versioned `githooks/` dir enabled with
   `git config core.hooksPath githooks` so it travels with the repo (that one
   command is re-applied per fresh Replit container). See the note below for why
   the hook drains `.worklog` at commit time and not only at SessionEnd.

3. **A Claude Code SessionEnd hook** in `.claude/settings.json` that runs the
   reporter in `session` mode (merge into any existing hooks). This catches any
   narrative written *after* the last commit; the post-commit flush (above)
   catches everything up to each commit.

4. **A git pre-push hook** (also in `githooks/`) that reports any commits being
   pushed which the post-commit hook never recorded — the safety net that makes
   the "every push MUST reach the recorder" rule real. git feeds a pre-push hook
   one line per pushed ref on stdin (`<local ref> <local oid> <remote ref>
   <remote oid>`); for each, list the outgoing commits with
   `git rev-list <remote oid>..<local oid>` (use `git rev-list <local oid>
   --not --remotes` when `<remote oid>` is all-zeros, i.e. a brand-new branch),
   skip any hash already in the `.worklog-reported` ledger, and run
   `worklog.sh commit <hash>` for the rest. Because the reporter records each
   hash it ships, a normally-committed change already in the ledger is a no-op
   here — so this only fires for the bypass cases (CI/tooling commits,
   amend/rebase, a push after the hook path was skipped), never double-reporting
   the common case. **Fail-soft: swallow errors and exit 0 so it can never block
   a push.**

> **Why flush the `.worklog` narrative on every commit, not only at SessionEnd.**
> The lines Claude appends to `.worklog` are normally shipped + cleared by the
> SessionEnd hook. But on Replit, when a container is recycled or a session ends
> abnormally, **SessionEnd never fires** — so those lines are neither delivered
> nor queued; they silently accumulate in `.worklog` and the daily digest
> under-reports finished work. (Commits themselves are unaffected — the
> post-commit hook reports them independently.) The fix: have `githooks/post-commit`
> run `worklog.sh session` right after the commit report, so the accumulated
> narrative ships attached to the just-made commit. `session` mode already
> truncates `.worklog`, so this is idempotent (an empty `.worklog` ships nothing)
> and reuses the same fail-soft/outbox path. Net effect: committed work is always
> recorded even if the session never ends cleanly — which, on Replit, it often
> doesn't.

## Recommended

Add to this app's `CLAUDE.md`: *"When you finish a meaningful unit of work,
append one concise line to `.worklog` at the repo root."* — so session entries
say what happened instead of just `(session ended)`. Gitignore `.worklog`.

> **Scope: the worklog records changes to *the app*, not to this supporting
> setup.** Work on the scaffolding itself — installing/updating
> `claude-tmux-setup.md`, adding the screenshot tooling, tweaking the tmux or
> worklog scripts — is *not* app work and should **not** be recorded in
> `.worklog` (and needs no commit on its account). Only log changes to the
> product this Repl actually builds. If a session did nothing but set up or
> update this supporting software, let the entry be `(session ended)` rather
> than narrating the setup.

## Commit & verify

Commit the reporter script, both `githooks/` hooks (post-commit **and**
pre-push), and the `.claude/settings.json` hook so they travel with the repo (per
fresh container, only re-run `git config core.hooksPath githooks`). Gitignore the
`.worklog-reported` ledger — it's per-container dedup state, not source. Then make
an empty commit (`git commit --allow-empty -m "worklog: test"`) and confirm it
shows on the receiver's dashboard; a `git push` afterwards should add nothing new
(the commit is already in the ledger), while a commit made outside the hook and
then pushed should appear exactly once.

> **One more thing must exist per container — but it's not a command you re-run.**
> The `RECEIVER_TOKEN` is a secret, not part of the committed tree, so it has to
> be present in each fresh container too. Normally that's the Replit secret /
> env var (`RECEIVER_TOKEN`); `worklog.sh` also sources a gitignored
> `.worklog.env` / `worklog.env` beside the script as a fallback (e.g. for a
> session that started before the secret was added). Both env files are
> gitignored and NEVER committed. So the per-container checklist is: re-run
> `git config core.hooksPath githooks`, and make sure `RECEIVER_TOKEN` is
> available (Replit secret, or the gitignored env file).

---

# Part 3 — Headless screenshots on Replit (Playwright + Nix Chromium)

> **Strongly recommended for any app with a UI.** This is a handover for the
> Claude Code session in an app I want to be able to *see*. Goal: let you drive
> the running app in a headless browser and save PNGs you can read back, so you
> can verify UI changes yourself instead of asking me to eyeball every one —
> which is how UI regressions slip through. Treat this as part of the standard
> setup, not an optional extra; skip it only for a pure backend/CLI with no
> visual surface. Adapt the script to this app; don't ask me to paste anything.
> **Run the diagnostics first and report**, then install — the browser-launch
> step has a Replit-specific gotcha that wastes an hour if you skip it.

## Why this is non-obvious on Replit

Playwright is easy everywhere *except* a locked-down Nix sandbox:

- **No system browser libs, and you can't apt-install them.** Playwright's own
  downloaded Chromium / headless-shell fails at launch with
  `error while loading shared libraries: libglib-2.0.so.0` (and ~20 more).
  Replit blocks `apt`/`sudo` (it points you at Nix / the System Dependencies
  pane), so `npx playwright install-deps` can't help.
- **The old-Nix-glibc trick that works for tmux does NOT work here.** You might
  think "borrow the libs from a Nix package via `LD_LIBRARY_PATH`" — but
  Playwright's shell is a *modern* binary needing a recent glibc, while the Nix
  packages in Replit's channel are built against **glibc 2.33**. Putting that
  closure on `LD_LIBRARY_PATH` shadows the system libc/`libstdc++` and breaks
  `node` itself (`GLIBC_2.38 not found`, `GLIBCXX_3.4.29 not found`). Dead end.
  (Same glibc-vs-kernel family as the tmux exit-139 section in Part 1.)

**The fix:** don't fight the libs — use a **self-contained Nix Chromium** as
Playwright's `executablePath`. A Nix `chromium` has every dependency baked into
its closure with correct rpaths, so it runs standalone. Keep `node` on the
system libraries (do **not** export the Nix closure into node's environment).
Playwright is pure JS; it just spawns the browser binary you point it at and
talks CDP. The Nix Chromium is old (~v92) but fine for navigation + screenshots.

## Step 1 — Diagnose (do this FIRST, report results)

```sh
# Dev server running, and on what port? (try the usual suspects)
for p in 3000 5000 5173 8080; do
  echo "port $p -> $(curl -s -o /dev/null -w '%{http_code}' -m 2 http://localhost:$p/)"
done

# Is a Chromium ALREADY bundled by Replit? (skip the Nix fetch if so)
echo "REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE=${REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE:-<unset>}"
[ -x "$REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE" ] && echo "→ bundled chromium present (use it directly)"

# Otherwise, can Nix provide a self-contained chromium? (may fetch ~1st time)
[ -n "$REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE" ] || \
  nix-shell -p chromium --run 'command -v chromium && chromium --version'

# Does a plain `npm i -D playwright-core` work in this repo, or is npm broken
# here? (Use playwright-core, NOT playwright — it skips the ~1 GB browser
# download; see Step 2. ROAR's package.json has a `link:` dep that makes `npm i`
# fail with EUNSUPPORTEDPROTOCOL — if so, install into a throwaway dir instead.)
npm ls 2>/dev/null | head -1 || echo "check npm health"

# Does the app even HAVE a login? (no hits => write the no-login variant)
grep -rnE "sign-?in|/login|name=\"(email|password)\"|type=\"submit\"" \
  src artifacts/*/src 2>/dev/null | grep -v node_modules | head
```

Report: dev-server port, whether a Chromium is already bundled (env var) or you
need Nix, whether `npm i` works in-repo, and **whether the app has auth at all**
(no sign-in route/form ⇒ the no-login variant, which is simpler and the common
case). Those shape the install.

## Step 2 — Install Playwright

**Install `playwright-core`, NOT `playwright`.** This is the single biggest
gotcha here, and the one that makes the install "too large to install" on a
disk-quota'd Repl: the `playwright` package runs a **postinstall that downloads
Chromium + Firefox + WebKit (~1 GB+)**. But this whole part launches the browser
via an external `executablePath` (the bundled or Nix Chromium below) — so those
downloaded browsers are **never used**. `playwright-core` is the *same* library
with the *same* `chromium.launch({ executablePath })` API but **no postinstall
and no browser download**, so it's a fraction of the size:

```sh
npm i -D playwright-core
```

**If `npm i` fails in this repo** (ROAR's does, on a `link:` dep), install into a
throwaway dir and expose it on `NODE_PATH` instead of touching the project's
`package.json`:

```sh
mkdir -p /tmp/pw && (cd /tmp/pw && npm init -y && npm i playwright-core)
export NODE_PATH=/tmp/pw/node_modules
```

You do **not** need `npx playwright install` to download a browser — you'll use
the bundled/Nix Chromium. (`playwright-core` *can't* download one anyway, which
is the point; and a downloaded one would hit the missing-libs wall above.)

> **Already have full `playwright` installed?** The script falls back to it, so
> you don't have to reinstall. But if you're starting fresh, or the `playwright`
> install is what blew the disk quota, use `playwright-core`. If you specifically
> need the `playwright` package name (rare), skip just the download with
> `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i -D playwright` — same small result.

> **Check for a Replit-bundled Chromium first — it may already be on the box.**
> Newer Replit images ship a self-contained Playwright Chromium and expose its
> path in the env var **`REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE`**
> (e.g. `/nix/store/…-playwright-browsers-1.55.0-…/chrome-linux/chrome`). If
> `[ -n "$REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE" ]`, point the script's
> `executablePath` at it and skip `nix-shell -p chromium` entirely — it's already
> a closure with correct rpaths, so it Just Works and you save the ~first-run
> Nix fetch. `playwright-core` ships no browsers, so there's nothing to version-
> match on install — but the CDP protocol still wants library and browser roughly
> aligned, so pin `playwright-core@<ver>` to the version baked into that path
> (the `playwright-browsers-1.55.0` segment above ⇒ `playwright-core@1.55.0`).
> Fall back to the Nix Chromium only when the env var is unset.

## Step 3 — The script

A reusable `scripts/screenshot.mjs` (ROAR has a working copy committed). Key
points to keep when adapting:

- **First decide: does this app even have a login?** Don't reach for the
  auth-form machinery by reflex — check the router. Many apps (any public
  dashboard/marketing/docs SPA) have **no auth at all**, and for those the whole
  sign-in step is dead weight that only adds flakiness. Grep the routes /
  `App.tsx` for a sign-in route or an auth guard; if there isn't one, write the
  **no-login variant** below (navigate + shoot, nothing else). Only keep the
  credentials + form-filling bullets when the app genuinely gates its pages.
  *(Worked example: the Global App Recorder app that serves this very doc has
  routes `/` and `/setup` straight to public pages — its committed
  `scripts/screenshot.mjs` is the no-login variant and needs no `SCREENSHOT_*`
  env at all.)*
- **Resolve `playwright-core` via `createRequire`**, trying `playwright-core`
  first then plain `playwright`, so it works whether installed in-repo or via
  `/tmp/pw/node_modules` (require those absolute paths as fallbacks, or set
  `NODE_PATH=/tmp/pw/node_modules`).
- **`executablePath` from env, checking `CHROMIUM_PATH` first, then
  `REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE`** — an explicit user-set `CHROMIUM_PATH`
  overrides the auto-detected bundled browser, while the Replit env var is the
  zero-config default; fall back to Playwright's own browser when both are unset
  (non-Replit). This matches the code sample's
  `CHROMIUM_PATH || REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined` order.
  Launch with `args: ["--no-sandbox"]`.
- **Vite/SPA dev timing:** same `networkidle` trap as Next — Vite keeps an HMR
  websocket open so the network never goes idle and the wait hangs. Use
  `waitUntil: "load"` then a short fixed delay (~800ms) for client render to
  settle, then screenshot (`fullPage: true` to capture below the fold).
- **Data-heavy routes — wait for a real element, not just the fixed delay.** The
  ~800ms floor is fine for static pages, but on a route that fetches *after*
  mount the shot can land on a spinner or an empty state. For those, also wait
  for a concrete element that only exists once content has rendered, before
  shooting — keep the fixed delay as a floor and `.catch()` the wait so a page
  that legitimately lacks the selector still shoots instead of hanging:
  `await page.waitForSelector('table tbody tr, [data-loaded], .card', { timeout: 8000 }).catch(() => {});`
- **Credentials from env** (`SCREENSHOT_EMAIL` / `SCREENSHOT_PASSWORD`) — never
  hard-code or commit them. **(Auth-gated apps only — omit entirely for the
  no-login variant.)**
- **Next.js dev timing (these three bite hard):**
  - Don't wait for `networkidle` — Next dev keeps an HMR websocket open, so the
    network never goes idle and the wait hangs. Use `load` / `domcontentloaded`.
  - The sign-in form is usually a **client component bound to a server action** —
    clicking submit *before React hydrates* does nothing. Wait for `load` then a
    short fixed delay (~1.5s) before filling/submitting.
  - Submitting a server-action form: use `click(sel, { noWaitAfter: true })`
    then `page.waitForURL(u => !u.pathname.endsWith('/sign-in'))`, rather than
    letting `click` auto-wait for a navigation that's slow on a cold dev compile.

### The no-login variant (use this when the app has no auth)

This is the common case and it's tiny — no credentials, no form, no `waitForURL`.
Honour `REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE`, default `BASE_URL` to the app's
dev port, name each PNG after its route:

```js
#!/usr/bin/env node
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Prefer playwright-core (no browser download); fall back to full playwright
// or the throwaway /tmp/pw install — whichever is present.
const require = createRequire(import.meta.url);
let chromium;
for (const mod of ["playwright-core", "playwright",
                   "/tmp/pw/node_modules/playwright-core",
                   "/tmp/pw/node_modules/playwright"]) {
  try { ({ chromium } = require(mod)); break; } catch {}
}

const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const OUT_DIR  = process.env.OUT_DIR  || "/tmp/pw";
const EXEC = process.env.CHROMIUM_PATH
  || process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || undefined; // undefined => Playwright's own download (non-Replit)
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ["/"];

mkdirSync(OUT_DIR, { recursive: true });
const fileFor = (r) =>
  join(OUT_DIR, (r.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9._-]+/gi, "_") || "home") + ".png");

const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: {            // env-overridable; default unchanged
  width:  Number(process.env.VIEWPORT_WIDTH)  || 1440,
  height: Number(process.env.VIEWPORT_HEIGHT) || 900,
} });
for (const route of routes) {
  const url = BASE_URL.replace(/\/$/, "") + (route.startsWith("/") ? route : "/" + route);
  try {
    await page.goto(url, { waitUntil: "load", timeout: 20000 }); // never networkidle (HMR socket)
    await page.waitForTimeout(800);                              // let client render settle
    await page.screenshot({ path: fileFor(route), fullPage: true });
    console.log(`OK   ${url} -> ${fileFor(route)}`);
  } catch (e) { console.error(`FAIL ${url}: ${e.message}`); }
}
await browser.close();
```

Run it (no-login):

```sh
node scripts/screenshot.mjs / /setup    # routes as args; defaults to "/"
# Chromium auto-resolves from $REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE.
# PNGs land in /tmp/pw (or $OUT_DIR); read them back to view.
```

> **Verifying a layout/responsive change — shoot it at two widths.** Layout bugs
> (fixed grids that stretch instead of reflow, page caps that waste wide-screen
> space, lists that look empty) are **invisible at a single 1440px shot** — they
> only show at the extremes. Use the `VIEWPORT_WIDTH/HEIGHT` overrides to capture
> the same route normal **and** wide, then compare:
>
> ```sh
> OUT_DIR=/tmp/pw      node scripts/screenshot.mjs /                  # 1440 (default)
> VIEWPORT_WIDTH=2560 VIEWPORT_HEIGHT=1440 OUT_DIR=/tmp/pw-wide \
>   node scripts/screenshot.mjs /                                     # ultrawide
> ```
>
> The 2560px shot is what makes column-reflow (or a list's wasted space) obvious;
> the 1440px shot alone hides both. Cheap, and it turns "looks fine to me" into
> actual evidence before you call a layout fix done. (See Part 5 for the layout
> kit these widths are meant to exercise.)

Run it (auth-gated app — add credentials + the sign-in step from above):

```sh
export CHROMIUM_PATH="$(nix-shell -p chromium --run 'command -v chromium')"  # only if no bundled Chromium
export SCREENSHOT_EMAIL=admin@example.com SCREENSHOT_PASSWORD=...   # ask the user
node scripts/screenshot.mjs /dashboard /settings
```

## Notes

- **No-login apps are the easy 90% — confirm auth exists before building for it.**
  If the app has no sign-in (check the router, don't assume), use the no-login
  variant above: it's smaller, has nothing to ask the user for, and can't break
  on a hydration/redirect race. The "it wants to log into the app" friction comes
  almost entirely from running the auth-gated script against an app that never
  needed it.
- **Auth-gated apps:** without valid credentials you can only shoot public pages
  (everything else 307-redirects to sign-in). Ask the user for a throwaway/dev
  login; don't persist the password anywhere.
- **Don't commit the browser cache.** `playwright-core` ships none, but if a
  full `playwright` ever lands here its `.cache/ms-playwright` (and `/tmp/pw`)
  are large and must stay out of git — confirm they're gitignored.
- **Old Chromium is fine** for screenshots/navigation. If you ever need
  pixel-accurate modern rendering, the cleaner long-term fix is adding the
  browser system deps via Replit's **System Dependencies** pane.

---

# Part 4 — GitHub push/PR without per-app logins

> **Optional but recommended once you have more than one app.** This is a
> handover for the Claude Code session in an app I want backed up to GitHub.
> Goal: `git push` and `gh pr create` work in **every** Repl with **no
> interactive login, ever**, and the auth survives container recycles — so
> Claude stops asking "should I push / open a PR?" and you get offsite history
> on top of Replit's own backups. **Run the diagnostics first and report**,
> then install — the whole trick is one env var and one credential helper.

> **Shared auth, one repo per app — don't point two apps at the same repo.**
> What's common across all your apps is the *authentication* (the single
> `GH_TOKEN` secret + the credential-helper bashrc block below) — that's what
> removes the per-app logins. The *destination* is **not** shared: each app
> pushes to **its own** GitHub repo. Setting up this doc in app B does **not**
> make it push to app A's repo; in Step 3 you create a new repo for B and wire
> B's own `origin`. Pointing a second app at an existing app's repo would push
> an unrelated codebase into it — different history, conflicts, two projects
> tangled in one repo. So: one token for everything, one repo per app.
>
> | Thing | Shared across apps? |
> |---|---|
> | `GH_TOKEN` secret + `gh`/git auth | ✅ one token, every app, no logins |
> | Credential-helper bashrc block (Step 2) | ✅ identical in every app |
> | The GitHub **repo** + `origin` remote (Step 3) | ❌ one per app |

## Why this is non-obvious on Replit

The natural move — `gh auth login` — is exactly the trap. Its OAuth token is
written under `$HOME` (`~/.config/gh`), and **Replit wipes `$HOME` on every
container recycle** (the same fact behind Parts 1 and 7). So every fresh
container forgets the login and you re-auth through the device-code flow again.
That's the "endless logins" pain. Per-app `gh auth login` also means doing it N
times for N apps.

**The fix:** never log in interactively. Both `gh` *and* git read a
**`GH_TOKEN`** environment variable directly — if it's present, all auth is
silent. Put one token in a **Replit account-wide secret** and it lands in every
Repl's env automatically, surviving recycles (it's re-injected each container,
never stored under `$HOME`). One token, all apps, zero logins.

## Step 0 — Mint the token + add the account secret (one-time, all apps)

These are the only manual steps, and you do them **once for your whole account**
(not per app). Claude can't do them for you — they're GitHub + Replit UI.

Two token types work; pick based on whether you want Claude to *create* repos:

**Option A — classic PAT (simplest, recommended for multi-app, Claude-driven
use).** *Settings → Developer settings → Personal access tokens → Tokens
(classic) → Generate new*. Tick the **`repo`** scope (and `workflow` if you use
Actions). One classic `repo` token gives full private-repo access, push, PR,
**and** can auto-create repos with `gh repo create` — so there's no per-app UI
step. Tradeoff: it's broad (all your repos), can't be scoped down, and the only
expiry options are coarse. Best fit when low friction across many apps matters
more than least privilege.

**Option B — fine-grained PAT (least privilege, but two real gotchas).**
*Fine-grained tokens → Generate new*:
   - **Resource owner:** your personal account (or the org that owns the repos).
   - **Repository access:** **All repositories** — this is mandatory, not just
     for coverage. *"Public repositories (read-only)"* grants **zero** access to
     any private repo (a private repo 404s and `gh` reports 0 private repos), so
     pushes fail. If you instead pick *"Only select repositories"*, every new
     app's repo must be added to the token by hand.
   - **Permissions → Repository permissions:** **Contents: Read and write**
     (push) and **Pull requests: Read and write** (`gh pr create`). GitHub won't
     let you save *Repository access* until you've set at least one permission.
   - **Gotcha that bit us:** a fine-grained PAT **cannot create repositories for
     a personal account** — `gh repo create` and the REST/GraphQL create both
     return 403 *"Resource not accessible by personal access token"*, even with
     Administration:write. (They can create repos only inside an *org*.) So with
     a fine-grained personal token you must **create each repo in the GitHub UI
     first** (Step 3), then push.
   - Pick an expiry you're willing to rotate on (max 1 year). Set a reminder.

   Editing an existing fine-grained token's access/permissions does **not**
   change its value, so you can widen a too-narrow token without re-pasting the
   `GH_TOKEN` secret — just re-check access afterward.
2. **Add it as a Replit account secret** named **`GH_TOKEN`**: Replit avatar →
   *Account → Secrets* (account-wide secrets sync to every Repl). If your plan
   has no account-level secrets, paste it into each app's **Tools → Secrets**
   pane instead — still one-time per app, still no logins. Name it exactly
   `GH_TOKEN` (that's the variable `gh` and the helper below read).

> Treat the PAT like `RECEIVER_TOKEN`: it's a secret, never committed, never
> pasted into a file in the repo. The credential helper below reads it from the
> environment only.

## Step 1 — Diagnose (do this FIRST, report results)

```sh
# Is the token present in this container's env?
[ -n "$GH_TOKEN" ] && echo "GH_TOKEN present" || echo "GH_TOKEN MISSING — add the account secret (Step 0)"

# gh CLI present? (Replit ships it; otherwise install via Nix)
command -v gh && gh --version | head -1 || echo "gh not on PATH"

# Does gh authenticate non-interactively from the token? (no login prompt)
GH_TOKEN="$GH_TOKEN" gh auth status 2>&1 | head -3

# Existing remotes — is there already a github 'origin', or only Replit's gitsafe backup?
git remote -v

# What does Replit set as the managed global gitconfig? (we must NOT clobber it)
echo "GIT_CONFIG_GLOBAL=$GIT_CONFIG_GLOBAL"; git config --get-all credential.helper
```

Report: token present?, gh authed?, existing remotes, and the managed
`GIT_CONFIG_GLOBAL` path. If `GH_TOKEN` is missing, stop and finish Step 0.

## Step 2 — Durable credential helper (in the Step 6/7 bashrc hook)

Do **not** run `gh auth setup-git` or `git config --global …` — both write to a
gitconfig that's either under `$HOME` or Replit's ephemeral `/run/...` path, so
they don't survive a recycle, and overriding `GIT_CONFIG_GLOBAL` would clobber
Replit's managed identity + the `gitsafe` backup remote. Instead inject a
**github.com-scoped** credential helper purely through `GIT_CONFIG_*`
environment variables, from the same durable `$REPL_HOME/.config/bashrc` hook
Steps 6 and 7 use. Append:

```sh
cat >> "$REPL_HOME/.config/bashrc" <<'EOF'

# --- GitHub push/PR without per-app logins (setup doc Part 4) ----------------
# Authenticate git + gh from the GH_TOKEN account-secret instead of `gh auth
# login` (whose token lives under $HOME and is wiped on every container
# recycle -> endless re-logins). We inject a github.com-scoped credential
# helper purely via GIT_CONFIG_* env vars, so we never clobber Replit's managed
# global gitconfig (your identity + the gitsafe backup remote live there). The
# empty helper resets any inherited one; the second delegates to gh, which
# reads GH_TOKEN. Scoped to github.com so the gitsafe git:// remote is
# untouched. No-op until GH_TOKEN is present, so this is safe before the secret
# is set. GH_TOKEN is an account-wide Replit secret -> available in every Repl.
if [ -n "${GH_TOKEN:-}" ]; then
  export GIT_CONFIG_COUNT=2
  export GIT_CONFIG_KEY_0='credential.https://github.com.helper'
  export GIT_CONFIG_VALUE_0=''
  export GIT_CONFIG_KEY_1='credential.https://github.com.helper'
  export GIT_CONFIG_VALUE_1='!gh auth git-credential'
fi
EOF
```

Why this shape:

- **`gh auth git-credential`** is gh's built-in git credential helper; it reads
  `GH_TOKEN` and answers git's `get` with `username=x-access-token` /
  `password=$GH_TOKEN`. No token literal in any file.
- **`GIT_CONFIG_COUNT`/`KEY_n`/`VALUE_n`** inject config without a file. The
  first (empty) `helper` resets any inherited helper so a stale one can't shadow
  ours; the second is the real one. **Caveat:** once `GIT_CONFIG_COUNT` is set,
  git requires every `KEY_n`/`VALUE_n` up to the count to be valid or *all* git
  commands error — keep the pair exactly as above, and the `GH_TOKEN` guard
  means non-GitHub shells are unaffected.
- **Scoped to `https://github.com`** so Replit's `gitsafe` `git://` backup
  remote (which uses no credentials) is never touched.

Apply it to the current shell without reopening the tab:

```sh
source "$REPL_HOME/.config/bashrc"
git config --get-all 'credential.https://github.com.helper'   # -> (blank) then !gh auth git-credential
```

## Step 2b — Make `git push` prompt-free (not just login-free)

Step 2 makes git/gh **authenticate** silently, but that alone does **not** make
`git push` *prompt*-free. On a fresh Repl, Claude Code's auto-mode safety
classifier still gates the first push to the default branch (denial reason
*"Git Push to Default Branch"*) even though the credential helper logs in with no
prompt. So Part 4's goal — "Claude stops asking should I push" — isn't met by
Steps 1–2 alone: the token removes the *login* prompt, not the *permission*
prompt. Pre-approve push with a permission allow rule, in the **gitignored
personal** settings file (not the committed one):

```jsonc
// .claude/settings.local.json
{ "permissions": { "allow": ["Bash(git push:*)"] } }
```

`Bash(git push:*)` is a prefix match, so it covers bare `git push`,
`git push -u origin main`, etc. Permission rules added mid-session take effect
live (no restart needed).

> **Replit gotcha — your personal allow-list can get committed.** On Replit,
> `.claude/settings.local.json` is frequently created **already tracked** (the
> platform's auto-checkpoint / initial commit grabs it before any `.gitignore`
> exists), so the conventional gitignore entry silently has no effect and your
> personal rules get pushed to GitHub. `git check-ignore` returning the path is
> misleading here — a *tracked* file overrides `.gitignore`. Verify and untrack:
>
> ```sh
> git ls-files --error-unmatch .claude/settings.local.json 2>/dev/null \
>   && { git rm --cached .claude/settings.local.json; \
>        grep -qxF '.claude/settings.local.json' .gitignore \
>          || printf '.claude/settings.local.json\n' >> .gitignore; }
> ```

Keep this in the **local** (gitignored) file, not the committed `settings.json`:
a push allow-rule is a personal "don't prompt me" preference that mildly broadens
what runs unattended, so it shouldn't silently pre-approve `git push` for any
future collaborator who clones the repo — same posture as Step 5's "personal
config / secrets never travel to GitHub."

## Step 3 — Point the repo at GitHub (one-time per app, then durable)

The `.git/config` remote lives in the workspace volume, so this is **one-time
per app**, not per recycle. It keeps Replit's `gitsafe` backup remote alongside
the new `origin`.

**With a classic `repo` token (Option A)** — create + wire + push in one shot:

```sh
gh repo create "<repo-name>" --private --source=. --remote=origin --push
```

**With a fine-grained personal token (Option B)** — `gh repo create` will 403,
so create the empty repo in the UI first at <https://github.com/new> (owner +
name, **Private**, and do **not** add a README/.gitignore/license — it must be
empty so your existing history pushes cleanly), then:

```sh
git remote add origin "https://github.com/<owner>/<repo>.git"
git push -u origin main
```

> **Make sure the repo is created Private.** GitHub's *New repository* form
> defaults to **Public**, and a fine-grained token can't flip visibility without
> Administration:write — so a wrongly-public repo means using the UI anyway.
> Pushing a repo public is effectively irreversible (it can be cloned/indexed
> immediately), so confirm **Private** before the first push.

Pick `<repo-name>` to match the app (Claude: propose one from the repo, confirm
with the user). After this, plain `git push` mirrors commits to GitHub, and
`gh pr create` works — both with **no prompt**.

> **Workflow choice.** For simple offsite backup, just push to `main` (Claude's
> default here — don't open PRs unless asked). If you want review, branch and
> `gh pr create` instead. Either way the auth above is identical.

## Step 4 — Verify

```sh
gh auth status                       # "Logged in to github.com ... (GH_TOKEN)"
git ls-remote origin >/dev/null && echo "push/fetch auth OK (no prompt)"
git push                             # mirrors HEAD to GitHub silently
```

After the next container recycle, repeat **nothing**: `GH_TOKEN` is re-injected
from the account secret, the bashrc hook re-exports the helper, and `.git/config`
still has `origin`. No `gh auth login`, ever.

## Step 5 — Never push secrets to GitHub (gitignore your keys)

> **This step is the whole reason the previous ones are safe to use.** The
> moment an app gains a real GitHub remote (Step 3) and silent push auth
> (Step 2), `git push` will mirror **whatever is committed** offsite — to a repo
> that may be public, is cloned/indexed within seconds, and whose history you
> can't truly scrub. So a single committed API key is a leak the instant it's
> pushed. This is not hypothetical: an OpenAI key embedded in an app
> ("DatabaseVizBuilder", `sk-pro…`) was detected leaked and auto-disabled by
> OpenAI — exactly the failure this step prevents. **Before wiring up push,
> make secrets uncommittable.**

The rule, in one line: **secrets live in Replit Secrets / env vars and in
gitignored env files — never in a tracked file, ever.** That already covers
`GH_TOKEN` and `RECEIVER_TOKEN` (both read from the environment), but it must
also cover every *app-level* key — OpenAI/Anthropic/Stripe/DB URLs, service-
account JSON, `.env` files, private keys.

### Add the ignore patterns (run once per app)

Append a secrets block to `.gitignore` if it isn't already there (idempotent —
only adds lines that are missing):

```sh
add_ignore() { grep -qxF "$1" .gitignore 2>/dev/null || echo "$1" >> .gitignore; }
for p in \
  '.env' '.env.*' '!.env.example' \
  '*.env' 'worklog.env' '.worklog.env' \
  '*.key' '*.pem' '*.p12' '*.pfx' \
  '*-service-account*.json' 'service-account*.json' \
  '*credentials*.json' '.credentials.json' \
  'secrets.*' '*.secret'; do
  add_ignore "$p"
done
```

(Keep `.env.example` *tracked* — a committed template of **key names with empty
values** documents what the app needs without leaking anything. The
`!.env.example` negation above preserves it.)

### Catch anything already committed before the first push

`.gitignore` only stops *future* adds — a key committed earlier is still in the
tree and will push. Scan tracked files for the obvious shapes **before** the
Step 3 push, and fix any hit by moving the value to a Secret and replacing it
with an env-var read:

```sh
# Look for live key shapes in tracked files (not history) — review every hit.
git grep -nE 'sk-[A-Za-z0-9_-]{16,}|sk-ant-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN [A-Z ]*PRIVATE KEY-----' \
  -- . ':(exclude)claude-tmux-setup.md' || echo "no obvious keys in tracked files"

# Already tracked an env/secret file by mistake? Untrack it (keeps the local copy):
# git rm --cached .env && git commit -m "stop tracking .env (secret)"
```

If `git grep` finds a real key, treat it as **already compromised**: rotate it
at the provider (don't just delete the line), then scrub it. A key that has
*already been pushed* lives in remote history and any clone — rotation is the
only true fix; rewriting history is best-effort.

### Belt-and-suspenders: a pre-push secret check (optional)

For an app that handles lots of keys, a `pre-commit` hook in the versioned
`githooks/` dir (same mechanism Part 2 uses) can run the `git grep` above
against **staged** changes and abort the commit on a hit — so a key can't reach
a commit, let alone a push. Keep it fail-loud (non-zero exit blocks the commit),
unlike the fail-soft worklog hook.

## Troubleshooting

- **`GH_TOKEN MISSING` even though you added the secret** — a secret added
  *after* a session started is **not** in that already-running container's env;
  Replit only injects secrets into newly-started processes. (Confirm with: a
  pre-existing secret like `DATABASE_URL` is present, the new `GH_TOKEN` isn't.)
  Either open a **fresh Replit Shell tab** (it gets the new secret — you can
  `printf 'GH_TOKEN=%s\n' "$GH_TOKEN" > /tmp/ghtok.env` there and `source` it in
  the old session for one-off use, then delete it), or restart the Repl so every
  process gets it. After the next recycle it's automatic.
- **Token sees 0 private repos / a private repo 404s (`gh api repos/OWNER/NAME`
  → Not Found)** — the fine-grained token's *Repository access* is *"Public
  repositories"* or a *select* list that excludes it. A public-only token can
  read a repo while it's public, then loses it the instant it goes private.
  Fix: set **Repository access → All repositories** on the token (editing it
  doesn't change the value, so the `GH_TOKEN` secret stays valid). Verify with
  `gh api repos/OWNER/NAME --jq .permissions` showing `"push":true`.
- **`createRepository` / repo create returns 403 "Resource not accessible by
  personal access token"** — fine-grained personal tokens can't create repos
  (see Step 0, Option B). Create the repo in the UI, or switch to a classic
  `repo`-scope token (Option A).
- **`gh auth status` shows logged out despite the token** — the token lacks the
  needed scopes, or expired. A fine-grained PAT must list this repo under its
  *Repository access* and have *Contents*/*Pull requests* write. Re-mint and
  update the one secret.
- **All git commands suddenly error with a config message** — a malformed
  `GIT_CONFIG_*` pair (count doesn't match the keys). Re-check the block in
  `$REPL_HOME/.config/bashrc` matches Step 2 exactly.
- **Push asks for a username/password** — the helper isn't active in this shell.
  `source "$REPL_HOME/.config/bashrc"` and confirm
  `git config --get-all 'credential.https://github.com.helper'` shows the gh
  helper. Also confirm the remote is **https://** (the helper is scoped to it),
  not an `ssh`/`git://` URL.
- **Token rotation** — when the PAT expires, mint a new one and update the
  single `GH_TOKEN` account secret. Nothing per-app changes.

---

# Part 5 — Responsive layout kit (per app, any app with a UI)

> **Strongly recommended for any app with a UI** (same bar as Part 3). The same
> width problem recurs in every app: pages cap at a fixed `max-w-*` and use ~25%
> of a wide screen, while fixed `grid-cols-N` card grids either stretch on wide
> monitors or cramp on mobile. A tiny, portable, pure-CSS kit fixes it identically
> everywhere — no JS, no config — so "install" is copying one block and swapping a
> few classes. Verify your changes with the two-width screenshot recipe in Part 3.

## The rule — decide by content type, don't just "fill 100%"

| Content type | Rule | How |
|---|---|---|
| Cards / tiles / charts / data grids | Add MORE columns as width grows; never stretch a cell | `.auto-grid` (below) |
| Forms / inputs / prose / reading text | CAP the width; leftover space stays empty or holds a 2nd column | `max-w-2xl mx-auto` |
| Data/dashboard page shell | Fluid; cap only if the page is mostly text | no cap (or `max-w-screen-2xl`) |

Why: a text field stretched to 2000px is *worse* (the eye loses the label↔input
link; lines over ~75 chars read poorly), so forms get capped. A 4-up tile grid
frozen at 4 columns just makes each tile huge on a wide monitor, so card grids
reflow instead.

## The one utility — copy into the app's global CSS, after `@tailwind`

```css
@layer components {
  /* Adds columns as width allows instead of stretching cells. min(...,100%)
     stops a wide item overflowing on tiny screens. */
  .auto-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(
      auto-fit,
      minmax(min(var(--auto-grid-min, 240px), 100%), 1fr)
    );
  }
  .auto-grid-sm { --auto-grid-min: 180px; }  /* compact tiles, swatches */
  .auto-grid-md { --auto-grid-min: 260px; }  /* stat tiles, KPI cards   */
  .auto-grid-lg { --auto-grid-min: 340px; }  /* content cards, panels   */
}
```

## Apply

```html
<!-- BEFORE: locks at 4 cols past md, then stretches forever on wide screens -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4"> ...tiles... </div>
<!-- AFTER: 1→2→4→6→8 columns automatically as the window grows -->
<div class="auto-grid auto-grid-md"> ...tiles... </div>
```

- Custom min width: `style="--auto-grid-min: 300px"`. Bigger gap: add `gap-6` (a
  Tailwind gap util overrides the default).

## Do / Don't

- ✅ `.auto-grid` for stat/KPI tiles, dashboard cards, image/palette grids, lists of similar boxes.
- ✅ Cap forms & prose: `max-w-2xl mx-auto` (or `max-w-prose` for body text).
- ❌ Don't put `.auto-grid` on form-field pairs (`grid-cols-2` for First/Last name) or tab bars — keep those fixed.
- ❌ Don't wrap a data/dashboard page in a fixed `max-w-6xl mx-auto` — that's the empty-side-margins cause; let it be fluid.
- ⚠️ Bare `grid-cols-5` (no responsive prefix) is cramped on mobile AND stretched on desktop; `.auto-grid` fixes both ends.

## Caveat — a single-column LIST is prose, not cards

The card-vs-form split has a **third** case that's easy to get wrong: the
single-column **list** (a vertical list of items — dashboards, files, rows). A
list behaves like prose, **not** like a card grid.

Hard-won example: a home page had a short dashboards list in a wide card with a
big empty area around it ("cattle farm of wasted space"). The instinct — make the
page full-width **and** convert the list to a multi-column `.auto-grid` of tiles —
was **wrong on both counts** (and rejected outright). Widening a list just grows
the empty margins; tiling it turns a scannable list into a foreign card wall. The
real cause was an artificial **`max-h-*` scroll cap** added earlier (when a search
box went in) that squeezed the list into a tiny 6-row scroll box inside a tall
card — so the "emptiness" was the *capped list*, not the page width. The fix the
user actually wanted: **remove the height cap, let the list run its natural length**
(the page scrolls). One line.

Rules:
- A vertical list = reading content. Don't `.auto-grid` it, and don't widen the
  page to "use the space" around it.
- Before redesigning a list that looks lost in white space, check for a
  `max-h-*`/`overflow` cap — a tiny scroll box in a big card *reads* as wasted
  space. Removing the cap (let it grow) is usually the whole fix.
- `.auto-grid` is for grids of *peer cards/tiles*, not for list rows.
- When unsure whether the user wants "fill width" vs "show more items", **ask** —
  they usually mean longer (more rows visible), not wider.

## Diagnose (do first, report)

```sh
# Fixed grids that may stretch/cramp instead of reflowing:
grep -rhoE "grid-cols-[0-9]+" client/src --include=*.tsx | sort | uniq -c | sort -rn
# Page-level caps on data pages (the empty-margins smell):
grep -rnE "max-w-(5xl|6xl|7xl)" client/src --include=*.tsx
# Any auto-fit already in use?
grep -rl "auto-fit\|auto-grid" client/src --include=*.tsx || echo "none yet"
```

Then: copy the CSS block in, convert genuine card/tile grids to
`auto-grid auto-grid-{sm|md|lg}`, drop page-level caps on data pages, keep forms
capped — and confirm with a normal + wide screenshot (Part 3).
