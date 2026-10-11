#!/usr/bin/env bash
# Starts or continues a durable Agents API session using curl only.
set -euo pipefail

readonly API_BASE="https://api.openai.com/v1"
readonly PROJECT_ID="proj_EcuMYpx4au8G02g9Dk9HkRqG"
readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly AGENT_CONFIG="$ROOT_DIR/slack-teammate-agent.json"
readonly STATE_DIR="$ROOT_DIR/.state"
readonly AGENT_ID_FILE="$STATE_DIR/agent-id"
readonly SESSION_ID_FILE="$STATE_DIR/session-id"

usage() {
  cat <<'EOF'
Usage:
  ./agents-api/run-slack-teammate.sh [--new-agent] [message]

Without --session, a new durable session is created. Without --new-agent, the
saved reusable agent ID is reused after the first run. All streaming events are
saved under agents-api/.state/events-*.sse.
EOF
}

fail() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

[[ -n "${OPENAI_API_KEY:-}" ]] || fail "Set OPENAI_API_KEY before running this script."
require_command curl
require_command jq

force_new_agent=false
message=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --new-agent)
      force_new_agent=true
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    --)
      shift
      message="$*"
      break
      ;;
    *)
      if [[ -n "$message" ]]; then
        message+=" $1"
      else
        message="$1"
      fi
      ;;
  esac
  shift
done

if [[ -z "$message" ]]; then
  message="I was added to a Slack thread. Please introduce yourself, state what context you need, and explain how you can help without claiming access to Slack."
fi

mkdir -p "$STATE_DIR"

headers=(
  -H "OpenAI-Beta: agents=v1"
  -H "Authorization: Bearer $OPENAI_API_KEY"
  -H "OpenAI-Project: $PROJECT_ID"
  -H "Content-Type: application/json"
)

create_agent() {
  local response_file agent_id
  response_file="$(mktemp)"
  trap 'rm -f "$response_file"' RETURN

  printf 'Creating saved agent definition...\n' >&2
  if ! curl --silent --show-error --fail-with-body \
    -X POST "$API_BASE/agents" \
    "${headers[@]}" \
    --data-binary "@$AGENT_CONFIG" \
    -o "$response_file"; then
    cat "$response_file" >&2
    fail "Could not create the saved agent. Verify the key belongs to project $PROJECT_ID and has api.agents.write."
  fi

  agent_id="$(jq -er '.id' "$response_file")" || {
    cat "$response_file" >&2
    fail "The create-agent response did not contain an ID."
  }
  printf '%s\n' "$agent_id" > "$AGENT_ID_FILE"
  printf 'Saved agent ID: %s\n' "$agent_id" >&2
  printf '%s' "$agent_id"
}

if [[ "$force_new_agent" == true || ! -s "$AGENT_ID_FILE" ]]; then
  agent_id="$(create_agent)"
else
  agent_id="$(<"$AGENT_ID_FILE")"
  printf 'Reusing saved agent ID: %s\n' "$agent_id" >&2
fi

request_body="$(jq -n \
  --arg agent_id "$agent_id" \
  --arg input "$message" \
  '{agent_id: $agent_id, environment: {type: "openai_hosted"}, input: $input, stream: true}')"

endpoint="$API_BASE/agents/sessions"
printf 'Starting a new OpenAI-hosted session with agent: %s\n' "$agent_id" >&2

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
event_log="$STATE_DIR/events-$timestamp.sse"
curl_error="$STATE_DIR/curl-$timestamp.log"
terminal_status="$STATE_DIR/terminal-$timestamp.status"
rm -f "$terminal_status"

set +e
curl --no-buffer --silent --show-error --fail-with-body \
  -X POST "$endpoint" \
  "${headers[@]}" \
  --data "$request_body" \
  2>"$curl_error" | tee "$event_log" | while IFS= read -r line; do
    printf '%s\n' "$line"
    case "$line" in
      'data: '*)
        event_json="${line#data: }"
        event_type="$(printf '%s' "$event_json" | jq -r '.type // empty' 2>/dev/null)"
        case "$event_type" in
          agent.session.created)
            new_session_id="$(printf '%s' "$event_json" | jq -r '.session.id // .session_id // empty' 2>/dev/null)"
            [[ -n "$new_session_id" ]] && printf '%s\n' "$new_session_id" > "$SESSION_ID_FILE"
            ;;
          error|agent.session.turn.failed|agent.session.failed|agent.session.environment.failed|agent.session.turn.cancelled)
            printf 'Terminal session event: %s\n' "$event_type" >&2
            printf '%s\n' "$event_type" > "$terminal_status"
            ;;
          agent.session.requires_action)
            printf 'Required action detected. This definition has only hosted web search; add a function handler before using custom function tools.\n' >&2
            ;;
        esac
        ;;
    esac
  done
stream_status=${PIPESTATUS[0]}
set -e

if [[ $stream_status -ne 0 ]]; then
  cat "$curl_error" >&2
  fail "The session request failed. See the response above and $event_log."
fi

if [[ -s "$terminal_status" ]]; then
  fail "The session ended with $(<"$terminal_status"). See $event_log."
fi

if [[ -s "$SESSION_ID_FILE" ]]; then
  printf 'Session ID saved to %s: %s\n' "$SESSION_ID_FILE" "$(<"$SESSION_ID_FILE")" >&2
fi
printf 'Event stream saved to %s\n' "$event_log" >&2
