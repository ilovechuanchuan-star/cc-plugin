# cc-plugin

Claude Code plugin for copilot-proxy project.

## 功能

此插件为 `copilot-proxy` 项目提供以下功能：

- **SessionStart Hook**: 在会话开始时注入特定规则（如禁止直接询问用户、禁止后台运行 agent）
- **UserPromptSubmit Hook**: 用户提交提示时的处理
- **SubagentStart Hook**: 子代理启动时注入标记上下文

## 安装

```bash
# 从 GitHub 安装
claude plugin install ilovechuanchuan-star/cc-plugin

# 或从本地目录安装
claude plugin install /Users/xzh106501/workspace/cc-plugin --scope user
```

## 配置

插件支持以下环境变量控制规则启用：

- `CLAUDE_PLUGIN_ENABLE_QUESTION_RULES=1` - 启用"必须使用 question 工具"规则
- `CLAUDE_PLUGIN_ENABLE_NO_BACKGROUND_AGENTS_RULE=1` - 启用"禁止后台运行 agent"规则

## 结构

```
cc-plugin/
├── .claude-plugin/
│   └── plugin.json          # 插件元数据
├── hooks/
│   └── hooks.json           # Hook 配置
├── scripts/
│   ├── session-start-rules.js
│   ├── subagent-start-marker.js
│   └── user-prompt-submit-reminder.js
└── README.md
```
