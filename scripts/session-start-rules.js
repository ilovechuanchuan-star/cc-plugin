async function readStdin() {
  let input = "";
  for await (const chunk of process.stdin) {
    input += chunk;
  }
  return input.trim();
}

function isTruthy(value) {
  return /^(1|true|yes|on)$/i.test(value ?? "");
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

const rules = [];

// copilot-proxy 特定规则：禁止直接询问用户，必须使用 AskUserQuestion 工具
if (isTruthy(process.env.CLAUDE_PLUGIN_ENABLE_QUESTION_RULES)) {
  rules.push(
    "- Prohibited from directly asking questions to users, MUST use AskUserQuestion tool.",
    "- Once you can confirm that the task is complete, MUST use AskUserQuestion tool to make user confirm. The user may respond with feedback if they are not satisfied with the result, which you can use to make improvements and try again, after try again, MUST use AskUserQuestion tool to make user confirm again.",
  );
}

// copilot-proxy 特定规则：禁止后台运行 agent，避免代理延迟导致错误
if (isTruthy(process.env.CLAUDE_PLUGIN_ENABLE_NO_BACKGROUND_AGENTS_RULE)) {
  rules.push(
    '- NEVER set `run_in_background: true` on Agent tool - proxy latency causes "No task found" errors. ALWAYS run agents foreground.',
  );
}

// copilot-proxy 默认注入：SessionStart subagent marker。
// 作用：让 copilot-proxy 的 parseSubagentMarkerFromFirstUser (proxy/handler.go:2658)
// 在 detectInitiator Priority 1 命中 → x-initiator=agent，从而避免新 session 启动时
// 注入的 CLAUDE.md / hook context 被误判为 user 而消耗 Premium 额度。
// 字段必须非空（proxy 端强校验），session_id 优先用 hook stdin 里的值。
// 注意：和 subagent-start-marker.js 共用同一段 proxy 识别路径。
const sessionId = hookInput.session_id ?? "claude-code-session";
const marker = `<system-reminder>__SUBAGENT_MARKER__${JSON.stringify({
  session_id: sessionId,
  agent_id: "copilot-proxy",
  agent_type: "session-bootstrap",
})}</system-reminder>`;

// marker 放在最前面：Claude Code 会把 additionalContext 原样注入首条 user
// 消息的首个 text 块；proxy 的 parseSubagentMarkerFromSystemReminder 会扫整段
// 文本找 <system-reminder> 配对，位置不敏感，但放在最前面更显眼、也避免与
// 后续 rules 文本语义纠缠。
const additionalContext = `${marker}\n${rules.join("\n")}\n`;

const payload = {
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext,
  },
};

process.stdout.write(`${JSON.stringify(payload)}\n`);
