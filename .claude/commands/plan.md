---
description: "/plan <request> — instrument → plan → implement with subagents"
---

Do these steps in order for the user's request:

1. **Trace** — check `$CURSOR_TRACE`; if set, emit `started` via `python3 ~/.cursor-observability/bin/trace_event.py --agent planner --event started --task-id <kebab-slug>`.

2. **Read specs** — read `docs/index.md`, confirm the task is in scope, then read the relevant linked spec. If not in scope, ask before proceeding.

3. **Explore** — launch an `explore` subagent: find all relevant files, existing patterns, and similar features. Wait for results before continuing.

4. **Plan** — use `TodoWrite` to break the task into ordered steps (one per file group/system). Mark the first `in_progress`.

5. **Implement** — **use subagents when possible** (e.g. `mcp_task`) so work runs **fast in parallel**. Using the plan from the Planner:
   - **Parallel**: Launch all implementers that have no dependency on each other in a **single batch** (multiple `mcp_task` calls in one turn). Prefer the `fast` model for implementers to minimize latency.
   - **Sequential across groups**: If a step depends on another (e.g. scene before UI), run that group only after its dependency completes.
   - Pick implementer by domain:
     - `implementer-gameplay` → combat, heroes, skills, items, creeps, towers
     - `implementer-scene` → map, 3D models, particles, animations, camera
     - `implementer-ai` → bot behavior, difficulty, decision-making
     - `implementer-audio` → sound effects, music, announcer
     - `implementer-ui` → HUD, menus, HTML/CSS, controls
     - `implementer-general` → anything cross-domain or not listed above
   - Each implementer prompt must include: the workstream tasks, relevant file paths, and spec excerpt. Agent specs live in `.cursor/agents/`.

6. **Verify** — launch the `verifier` agent with: the original requirement, the Planner's plan, and all implementer reports. It outputs a PASS / PASS_WITH_WARNINGS / FAIL verdict. If FAIL, re-run the affected implementers with the verifier's issues.

7. **Update docs** — move the completed item to **Done** in `docs/index.md`. Emit `completed` trace if tracing.
