# Prompt Template

Read every file inside the `.ai/` folder before making any changes.

These documents are the project's source of truth and must be followed throughout the implementation.

---

## Current Task

I will describe one feature at a time.

Only implement the requested feature.

Do not implement future phases.

---

## Before Writing Code

First:

1. Explain your implementation plan.
2. List every file you intend to modify.
3. Explain why each file needs to change.
4. Mention any dependencies that would be required.

Do not start coding until the plan is complete.

---

## While Writing Code

Follow these rules:

- Keep the solution simple.
- Write clean TypeScript.
- Use reusable components.
- Do not duplicate code.
- Do not over-engineer.
- Keep files focused on one responsibility.
- Follow the existing project structure.
- Use Ionic components where appropriate.
- Keep the UI responsive for Android phones, Android tablets, iPhone and iPad.

---

## Boundaries

Do NOT

- Change the project architecture.
- Rename files unnecessarily.
- Modify unrelated files.
- Install new packages without explaining why.
- Refactor working code unless requested.
- Add features that were not requested.
- Remove existing functionality.

Only change the files required for the current task.

---

## Error Handling

Handle all possible errors gracefully.

Never allow silent failures.

Display meaningful error messages when appropriate.

---

## After Writing Code

Verify:

- No TypeScript errors.
- No unused imports.
- No unused variables.
- No broken functionality.
- Existing features still work.

Explain what was implemented.

List every file that changed.

Suggest the next logical task.

---

## Project Goal

Build a simple, modern, offline-first CRM application.

The application has only two main sections:

1. Home
   - Enter lead
   - Review & Save

2. CRM
   - List leads
   - Search
   - Filter
   - Edit
   - Delete
   - Export Excel

Avoid unnecessary complexity.

Every implementation should support Android, Android tablets, iPhone and iPad using the same codebase.