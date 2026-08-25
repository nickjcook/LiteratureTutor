#!/usr/bin/env bash
# claude-status.sh — post this app's Claude Code session state to the local
# fleet board, so Nick can see at a glance which of his open sessions is
# working, waiting on him, or stuck on a permission prompt.
#
# CANONICAL COPY. This file is the fleet's reference implementation (setup doc
# Part 8) and is installed at .claude/hooks/claude-status.sh in every app.
# Change it here, then re-run the installer in the doc.
#
# Usage (from Claude Code hooks): claude-status.sh working|working-ping|waiting|needs-attention
#   UserPromptSubmit → working          (detail = the prompt, from stdin JSON;
#                                        clears last turn's activity)
#   PostToolUse      → working-ping     (activity = the tool and its target, at most
#                                        one POST every 5s; also re-asserts "working"
#                                        when a turn keeps grinding after Stop:
#                                        background tasks, subagents)
#   Stop             → waiting          (detail = last .worklog line, if any; clears
#                                        the activity and the ping throttle, so
#                                        waiting→working flips on the next tool call)
#   Notification     → needs-attention  (ONLY for permission prompts — Claude Code
#                                        also fires Notification for plain "idle,
#                                        waiting for your input", which is waiting,
#                                        not an emergency)
#
# Two fields, two questions, and keeping them apart is the point:
#   detail   what the session was ASKED to do  -> the board's "Doing" column
#   activity what it is doing about it NOW     -> the board's "Activity" column
#
# Fail-soft by design: a status hiccup must NEVER break a session, so every path
# ends in exit 0 and nothing is printed (UserPromptSubmit stdout is injected
# into Claude's context). Stale states are worthless — no outbox, a failed POST
# is simply dropped.
#
# Two things this replaces, both of which silently emptied the board (25 Aug 2026):
#   - the endpoint. It used to be https://globalapprecorder.replit.app, which is
#     depublished. Nine of ten apps were still posting there, so a board with
#     four live sessions showed one. Local API only now.
#   - the detail. The inline-curl variant of this hook sent no detail at all, so
#     the board's "Doing" column read "—" for every app. The prompt is the one
#     thing that says what a session is doing, and the hook is handed it.

STATUS_URL="${FLEET_STATUS_URL:-http://127.0.0.1:8180/api/claude-status}"
STATE="${1:-working}"
# Per-app throttle marker: a shared /tmp/.fleet-ping made two apps working at
# once suppress each other's pings.
PING_MARK="/tmp/.fleet-ping-$(basename "${CLAUDE_PROJECT_DIR:-$PWD}" | tr -cd 'a-zA-Z0-9')"

# PostToolUse fires on every tool call. The old throttle was 60s, which was
# right when the ping only re-asserted "working" -- but it now also carries the
# ACTIVITY, and a minute-old activity is not an activity. The board polls every
# 5s, so match it: frequent enough to read as live, still bounded against a
# burst of parallel tool calls.
if [ "$STATE" = "working-ping" ]; then
  NOW="$(date +%s)"
  LAST="$(cat "$PING_MARK" 2>/dev/null || echo 0)"
  [ $((NOW - LAST)) -lt 5 ] && exit 0
  echo "$NOW" > "$PING_MARK" 2>/dev/null || true
  STATE="working"
  PING=1
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$ROOT" 2>/dev/null || exit 0

# The token: env first (the launchers source each app's .env), then the
# gitignored fallbacks the worklog reporter uses.
if [ -z "${RECEIVER_TOKEN:-}" ]; then
  [ -f "$ROOT/.env" ] && . "$ROOT/.env" 2>/dev/null
  [ -f "$ROOT/.worklog.env" ] && . "$ROOT/.worklog.env" 2>/dev/null
  [ -f "$ROOT/worklog.env" ]  && . "$ROOT/worklog.env"  2>/dev/null
fi
[ -z "${RECEIVER_TOKEN:-}" ] && exit 0

# App identity, same order as the worklog reporter. The DISPLAY name, not the
# directory: "Database Dashboard Builder", not "DatabaseVizBuilder". Getting
# this wrong doesn't fail — it silently opens a second row on the board.
APP="${WORKLOG_APP:-}"
[ -z "$APP" ] && [ -f "$ROOT/.worklog-app" ] && APP="$(head -n1 "$ROOT/.worklog-app" 2>/dev/null)"
[ -z "$APP" ] && APP="$(basename "$ROOT")"

# stdin is JSON for the events that have any; read it once, before anything
# else can consume it.
PAYLOAD="$(cat 2>/dev/null)"

# ACTIVITY is a different question from DETAIL: detail is what the session was
# ASKED to do (the prompt), activity is what it is doing about it this second
# (the tool and its target). The fleet board has a column for each -- the
# activity one is the slot the retired frame streamer used to occupy.
ACTIVITY=""
ACTIVITY_SET=0
NOTE=""
if [ "${PING:-0}" = "1" ]; then
  ACTIVITY_SET=1
  ACTIVITY="$(printf '%s' "$PAYLOAD" | python3 -c '
import json, os, sys
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
tool = d.get("tool_name") or ""
i = d.get("tool_input") or {}
if not isinstance(i, dict):
    i = {}
# The most useful half-dozen words: which tool, on what. Paths are shown as
# basenames -- the full path is noise in a narrow column.
target = ""
for k in ("file_path", "notebook_path"):
    if i.get(k):
        target = os.path.basename(str(i[k]))
        break
else:
    for k in ("command", "pattern", "query", "description", "url", "prompt"):
        if i.get(k):
            target = " ".join(str(i[k]).split())
            break
print(" ".join(f"{tool} {target}".split())[:120])' 2>/dev/null)"
fi

case "$STATE" in
  working)
    # The prompt IS "what this session is doing". Extract with python3 — a sed
    # regex over JSON drops everything after the first quote or newline in the
    # prompt, which is most of them.
    NOTE="$(printf '%s' "$PAYLOAD" | python3 -c 'import sys,json
try:
    t = (json.load(sys.stdin).get("prompt") or "")
except Exception:
    t = ""
print(" ".join(t.split())[:200])' 2>/dev/null)"
    # A new prompt starts a new turn: whatever tool ran last turn is not what
    # this session is doing now, so clear it rather than leave it standing.
    [ "${PING:-0}" = "1" ] || ACTIVITY_SET=1
    ;;
  waiting)
    rm -f "$PING_MARK" 2>/dev/null || true
    ACTIVITY_SET=1
    [ -s "$ROOT/.worklog" ] && NOTE="$(tail -n1 "$ROOT/.worklog" 2>/dev/null)"
    ;;
  needs-attention)
    printf '%s' "$PAYLOAD" | grep -qi permission || exit 0
    NOTE="$(printf '%s' "$PAYLOAD" | python3 -c 'import sys,json
try:
    t = (json.load(sys.stdin).get("message") or "")
except Exception:
    t = ""
print(" ".join(t.split())[:200])' 2>/dev/null)"
    [ -z "$NOTE" ] && NOTE="waiting on a permission prompt"
    ACTIVITY_SET=1
    ACTIVITY="waiting for you to approve a tool"
    ;;
esac

TS="$(date -Is 2>/dev/null || date)"

# Build the body in python3 and pipe it: shell-quoting a prompt into JSON breaks
# on the first quote, backslash or newline it contains. An empty note is omitted
# entirely — the server preserves the stored detail rather than clearing it, so
# a keepalive ping can't wipe what the prompt hook recorded.
BODY="$(APP="$APP" STATE="$STATE" NOTE="$NOTE" TS="$TS" \
        ACTIVITY="$ACTIVITY" ACTIVITY_SET="$ACTIVITY_SET" python3 -c '
import json, os
b = {"app": os.environ["APP"], "state": os.environ["STATE"], "ts": os.environ["TS"]}
n = os.environ.get("NOTE", "").strip()
if n:
    b["note"] = n[:300]
# Omitted preserves, null clears -- so only send the key when this event has
# something to say about the activity, and send null when it means "nothing".
if os.environ.get("ACTIVITY_SET") == "1":
    a = os.environ.get("ACTIVITY", "").strip()
    b["activity"] = a[:200] if a else None
print(json.dumps(b))' 2>/dev/null)"
[ -z "$BODY" ] && exit 0

curl -fsS -m 5 -X POST \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $RECEIVER_TOKEN" \
  --data "$BODY" "$STATUS_URL" >/dev/null 2>&1 || true

exit 0
