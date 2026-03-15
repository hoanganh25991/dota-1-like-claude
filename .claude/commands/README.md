# Cursor custom commands

Type `/` in Cursor chat to see and run these.

## `/complete-plan` — work until the plan is done

Runs the agent on a **detail plan** and keeps going until every step is complete (or the run hits Cursor’s iteration limit).

**Usage:**

- In chat, type: `/complete-plan`
- Then describe the goal or paste your plan, e.g.:
  - "Add a settings screen with dark mode toggle and font size"
  - Or: "1. Add Settings UI. 2. Add dark mode toggle. 3. Add font size slider. 4. Wire to localStorage."

The agent will create a plan if you only give a goal, then execute each step without stopping to ask. It will end with **PLAN_COMPLETE** when done, or **PLAN_PAUSED** and remaining steps if it had to stop (e.g. limit). You can run `/complete-plan` again with "Continue from: [remaining steps]" to resume.

---

## True “infinite” loop (multiple runs)

Cursor limits how many steps one agent run can take. To have it **keep re-running** until the plan is fully done:

- **macOS**: Use [cursor-ralph](https://github.com/hexsprite/cursor-ralph). It uses a custom command + `osascript` to re-send the command when the run hits the iteration limit, so the agent effectively loops until it outputs a completion phrase or a max iteration count.
- **Other OS**: Re-run `/complete-plan` manually when you see **PLAN_PAUSED**, pasting the remaining steps as the next message.
