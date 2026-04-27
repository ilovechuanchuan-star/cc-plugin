async function readStdin() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input.trim();
}

const rawInput = await readStdin();
let hookInput = {};

if (rawInput) {
  try {
    hookInput = JSON.parse(rawInput);
  } catch {
    hookInput = {};
  }
}

// NOTE: copilot-proxy 的 parseSubagentMarkerFromSystemReminder (proxy/handler.go:2684)
// 强制要求 marker 被 <system-reminder>...</system-reminder> 标签配对包裹，且
// JSON 的 session_id / agent_id / agent_type 三字段均非空，否则不会触发
// detectInitiator 的 Priority 1（agent 命中）。历史版本这里输出的是裸 marker
// （没有 <system-reminder> 包装且字段允许为 null），proxy 识别不到，等于白发。
// 对齐 copilot-api claude-plugin 的 subagent-start-marker.ts 实现。
const sessionId = hookInput.session_id ?? "claude-code-subagent";
const agentId = hookInput.agent_id ?? "claude-code";
const agentType = hookInput.agent_type ?? "subagent";

const marker = `<system-reminder>__SUBAGENT_MARKER__${JSON.stringify({
  session_id: sessionId,
  agent_id: agentId,
  agent_type: agentType,
})}</system-reminder>`;

const payload = {
  hookSpecificOutput: {
    hookEventName: "SubagentStart",
    additionalContext: marker,
  },
};

process.stdout.write(`${JSON.stringify(payload)}\n`);
