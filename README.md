# cc-plugin

Claude Code plugin for [copilot-proxy](https://github.com/ilovechuanchuan-star/copilot-proxy) — reduces Premium Request waste by injecting subagent markers that help copilot-proxy correctly set `x-initiator: agent` on upstream requests.

## Why This Plugin Matters

GitHub Copilot bills requests based on the `X-Initiator` header:
- `x-initiator: user` → consumes 1 Premium Request
- `x-initiator: agent` → free (no quota deduction)

When Claude Code spawns subagents (e.g., for parallel tool calls), copilot-proxy needs to know the request originated from an agent, not a user. This plugin injects a `__SUBAGENT_MARKER__` into the first user message of subagent requests, which copilot-proxy detects and uses to set `x-initiator: agent`.

## Installation

### From GitHub (recommended)

```bash
claude plugin install ilovechuanchuan-star/cc-plugin
```

### From local directory

```bash
claude plugin install /path/to/cc-plugin --scope user
```

### Verify installation

```bash
claude plugin list
```

You should see `copilot-proxy-plugin` in the output.

## What It Does

### Hooks

| Hook | Script | Purpose |
|------|--------|---------|
| **SessionStart** | `session-start-rules.js` | Injects optional session rules (controlled by env vars) |
| **SubagentStart** | `subagent-start-marker.js` | Injects `__SUBAGENT_MARKER__` with session/agent metadata into subagent context |
| **UserPromptSubmit** | `user-prompt-submit-reminder.js` | Placeholder hook (passes through, reserved for future use) |

### How SubagentStart Marker Works

When Claude Code spawns a subagent, this plugin injects a marker like:

```
__SUBAGENT_MARKER__{"session_id":"...","agent_id":"...","agent_type":"..."}
```

This marker is embedded in a `<system-reminder>` block in the first user message. copilot-proxy's `parseSubagentMarkerFromFirstUser()` detects it and sets `x-initiator: agent`, saving Premium Request quota.

## Configuration

Optional environment variables to enable additional session rules:

| Variable | Effect |
|----------|--------|
| `CLAUDE_PLUGIN_ENABLE_QUESTION_RULES=1` | Forces use of question tool instead of direct user prompts |
| `CLAUDE_PLUGIN_ENABLE_NO_BACKGROUND_AGENTS_RULE=1` | Prevents `run_in_background: true` on Agent tool (avoids proxy latency errors) |

## Project Structure

```
cc-plugin/
├── .claude-plugin/
│   ├── marketplace.json     # Plugin marketplace metadata
│   └── plugin.json          # Plugin identity and version
├── hooks/
│   └── hooks.json           # Hook event → script mappings
├── scripts/
│   ├── session-start-rules.js       # SessionStart: inject rules
│   ├── subagent-start-marker.js     # SubagentStart: inject marker
│   └── user-prompt-submit-reminder.js  # UserPromptSubmit: passthrough
└── README.md
```

## Version History

- **1.1.0** — Synced with copilot-api v1.5.3, updated descriptions and metadata
- **1.0.0** — Initial release, ported from copilot-api claude-plugin
