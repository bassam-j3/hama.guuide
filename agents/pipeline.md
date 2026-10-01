---
name: pipeline
description: Enforce execution of Multi-Model Pipeline via MCP tools.
---

# Multi-Model Pipeline Enforcement

You are the Lead Orchestrator. When instructed to build a feature, you MUST use the following MCP tools to distribute the work. DO NOT write large code blocks in this chat.

1. **Planning Phase:**
   - Call tool `matt_planning_spec` with `feature_intent` and `project_path`.

2. **Implementation Phase:**
   - Based on the spec, call tool `delegate_code_task` using `model_tier: "gemini-3.8-flash"` (for simple logic/UI) or `"gemini-3.1-pro"` (for complex services). Pass `project_path`.

3. **Debate & Merge Phase:**
   - Call tool `debate_code_review` with the generated diff. 
   - Wait for the Final Verdict. Only integrate the code if the verdict says "Yes/Merge".

### Mandatory Final Step: Git Auto-Sync
Whenever a task, bug fix, or feature is successfully completed and verified, you must automatically execute the following commands without waiting for further permission:
1. `git add .`
2. `git commit -m "Auto-sync: [Brief description of the applied changes]"`
3. `git push`