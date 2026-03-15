# Plan: <TITLE>

## Requirement
<Original requirement or user goal — paste verbatim or summarize>

## Analysis
<What exists in the codebase today, what's missing, key design decisions>

## Workstreams

### Workstream 1: <title>
- **domain:** <ui | gameplay | ai | scene | audio | core | docs | general>
- **parallel-group:** <A | B | C ...>
- **depends-on:** <workstream number, or "none">
- **files:** <list of files to modify or create>
- **tasks:**
  1. <specific task with file and location hints>
  2. <specific task>

### Workstream 2: <title>
- **domain:** <domain tag>
- **parallel-group:** <group letter>
- **depends-on:** <workstream number, or "none">
- **files:** <file list>
- **tasks:**
  1. <task>

<!-- Add more workstreams as needed -->

### Workstream N: Update docs
- **domain:** docs
- **parallel-group:** <last group, after all implementation>
- **depends-on:** all previous workstreams
- **files:** `docs/index.md`
- **tasks:**
  1. Update Done / WIP / Backlog sections to reflect implemented changes

## Execution order
1. **Parallel group A** (run simultaneously): Workstream 1, 3
2. **Parallel group B** (after A): Workstream 2
3. **Sequential last:** Workstream N (docs update)

## Risks / open questions
- <anything implementers should watch out for>
- <open design questions that couldn't be resolved during planning>
