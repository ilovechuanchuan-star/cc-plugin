# cc-plugin

[copilot-proxy](https://github.com/ilovechuanchuan-star/copilot-proxy) 的 Claude Code 插件 — 通过注入 subagent 标记，帮助 copilot-proxy 正确设置 `x-initiator: agent`，减少 Premium Request 消耗。

## 为什么需要这个插件

GitHub Copilot 根据 `X-Initiator` 请求头计费：
- `x-initiator: user` → 消耗 1 个 Premium Request
- `x-initiator: agent` → 免费（不扣配额）

当 Claude Code 创建子代理（如并行工具调用）时，copilot-proxy 需要知道该请求来自代理而非用户。本插件会在子代理请求的首条用户消息中注入 `__SUBAGENT_MARKER__`，copilot-proxy 检测到后自动设置 `x-initiator: agent`。

## 安装

### 方式一：通过 Marketplace 安装（推荐）

```bash
# 1. 添加 marketplace
/plugin marketplace add ilovechuanchuan-star/cc-plugin

# 2. 从 marketplace 安装插件
/plugin install copilot-proxy-plugin@cc-plugin-marketplace
```

### 方式二：从 GitHub 直接安装

```bash
claude plugin install ilovechuanchuan-star/cc-plugin
```

### 方式三：从本地目录安装

```bash
claude plugin install /path/to/cc-plugin --scope user
```

### 验证安装

```bash
claude plugin list
```

输出中应包含 `copilot-proxy-plugin`。

## 功能说明

### Hooks

| Hook | 脚本 | 用途 |
|------|------|------|
| **SessionStart** | `session-start-rules.js` | 注入可选的会话规则（通过环境变量控制） |
| **SubagentStart** | `subagent-start-marker.js` | 向子代理上下文注入 `__SUBAGENT_MARKER__` 及会话/代理元数据 |
| **UserPromptSubmit** | `user-prompt-submit-reminder.js` | 占位 Hook（直通，预留扩展） |

### SubagentStart 标记原理

当 Claude Code 创建子代理时，插件会注入如下标记：

```
__SUBAGENT_MARKER__{"session_id":"...","agent_id":"...","agent_type":"..."}
```

该标记嵌入在首条用户消息的 `<system-reminder>` 块中。copilot-proxy 的 `parseSubagentMarkerFromFirstUser()` 检测到后，设置 `x-initiator: agent`，从而节省 Premium Request 配额。

## 配置

可通过环境变量启用额外的会话规则：

| 变量 | 效果 |
|------|------|
| `CLAUDE_PLUGIN_ENABLE_QUESTION_RULES=1` | 强制使用提问工具，禁止直接向用户提问 |
| `CLAUDE_PLUGIN_ENABLE_NO_BACKGROUND_AGENTS_RULE=1` | 禁止 Agent 工具的 `run_in_background: true`（避免代理延迟错误） |

## 项目结构

```
cc-plugin/
├── .claude-plugin/
│   ├── marketplace.json     # Marketplace 元数据
│   └── plugin.json          # 插件身份与版本
├── hooks/
│   └── hooks.json           # Hook 事件 → 脚本映射
├── scripts/
│   ├── session-start-rules.js       # SessionStart: 注入规则
│   ├── subagent-start-marker.js     # SubagentStart: 注入标记
│   └── user-prompt-submit-reminder.js  # UserPromptSubmit: 直通
└── README.md
```

## 版本历史

- **1.2.0** — 新增 Marketplace 支持，完善安装文档
- **1.1.0** — 同步 copilot-api v1.5.3，更新描述和元数据
- **1.0.0** — 首次发布，从 copilot-api claude-plugin 迁移
