# Slack teammate via the Agents API

This runnable curl application creates a saved, reusable agent named **AI teammate for Slack**, then starts an OpenAI-hosted session with that agent ID and streams its Server-Sent Events (SSE) to the terminal.

The definition preserves the requested `gpt-6-astra`, reasoning, text, single-agent, and live web-search settings. `allowed_domains` and `location` are deliberately omitted instead of set to `null`: the current API treats omitted values as no domain or location restriction. The OpenAI-hosted environment supplies the runtime and executor, so no local sandbox executor needs to be configured.

## Prerequisites

- `bash`, `curl`, and `jq`
- An API key for project `proj_EcuMYpx4au8G02g9Dk9HkRqG`, with `api.agents.read`, `api.agents.write`, and `api.responses.write` permissions

Set the key in your shell. Do not add it to a file or commit it.

```bash
export OPENAI_API_KEY="your_api_key"
```

## Run

```bash
chmod +x agents-api/run-slack-teammate.sh
./agents-api/run-slack-teammate.sh
```

The first run creates the reusable agent with `POST /v1/agents`, saves the returned ID in `agents-api/.state/agent-id`, then invokes `POST /v1/agents/sessions` using that `agent_id`. It sends an initial user message and displays every streamed SSE line as it arrives.

Send a tailored first message:

```bash
./agents-api/run-slack-teammate.sh "Draft a concise reply asking for the Q3 report link and the decision deadline."
```

Create a fresh saved agent rather than reuse the prior ID:

```bash
./agents-api/run-slack-teammate.sh --new-agent "Summarize this Slack discussion: ..."
```

The script writes the latest session ID to `agents-api/.state/session-id` and raw streams to `agents-api/.state/events-*.sse`. It fails on API, session, environment, or root-turn errors and warns if the API requests an application-owned function tool action. This definition has only OpenAI-hosted web search, so its search calls are executed by the API and do not require a local handler.

For a follow-up, open `GET /v1/agents/sessions/{session_id}/events?stream=true` first, then post an `agent.session.input.message` event to `POST /v1/agents/sessions/{session_id}/events`; this ordering ensures no early events are missed. The official events guide includes the exact curl stream command and input-event schema.

For an agent to access actual Slack messages, connect Slack through a configured MCP/service integration or provide those messages and attachments as session input. The current definition intentionally does neither, so it will not claim Slack access.

## References

- [Agents API quickstart](https://developers.openai.com/api/docs/guides/agents-api/quickstart)
- [Saved agent configuration](https://developers.openai.com/api/docs/guides/agents-api/configuration)
- [Agents API web search](https://developers.openai.com/api/docs/guides/agents-api/tools/web-search)
