# Coding Rules

Version: 1.0

This document defines the coding standards for the project.

Every AI assistant and developer must follow these rules.

---

# General Rules

- Write clean, readable code.
- Prefer simplicity over cleverness.
- Do not over-engineer.
- Every file should have a single responsibility.
- Do not create unnecessary abstractions.

---

# TypeScript

- Use TypeScript for every file.
- Never use `any`.
- Define proper interfaces and types.
- Enable strict typing.

---

# Components

- Keep components small and reusable.
- One component = one responsibility.
- Move repeated UI into reusable components.
- Never duplicate component code.

---

# State Management

- Use React hooks.
- Use Context only if necessary.
- Avoid unnecessary global state.
- Keep state as close to the component as possible.

---

# Database

- Never write SQL inside UI components.
- All database operations must go through `database.ts`.
- Never duplicate database logic.
- Always handle database errors.

---

# Styling

- Use Ionic components.
- Use Tailwind utilities when needed.
- No inline styles unless absolutely required.
- Keep spacing consistent.
- Design for phones first.
- Ensure layouts adapt to tablets.

---

# Performance

- Avoid unnecessary re-renders.
- Memoize only when needed.
- Do not optimize prematurely.
- Keep screens responsive.

---

# File Organization

Each file should have one purpose.

Do not mix:

- UI
- Database
- Business logic

inside the same file.

---

# Dependencies

Never install a new package without approval.

Before adding a dependency, explain:

- Why it is needed.
- Why existing libraries are insufficient.

---

# Editing Existing Code

When modifying code:

- Change only what is required.
- Never rewrite unrelated files.
- Never remove working functionality.
- Preserve existing behavior.

---

# Error Handling

Every operation should:

- Handle failures gracefully.
- Display meaningful messages.
- Never fail silently.

---

# Naming

Use descriptive names.

Good:

LeadForm

LeadCard

saveLead()

searchLeads()

Bad:

Data

Helper

temp()

value()

---

# Comments

Write comments only when necessary.

Code should explain itself.

Avoid obvious comments.

---

# Before Writing Code

Always:

1. Explain the implementation plan.
2. List the files that will change.
3. Wait for approval before making major structural changes.

---

# After Writing Code

Always:

- Check for TypeScript errors.
- Remove unused imports.
- Remove unused variables.
- Ensure formatting is consistent.

---

# AI Boundaries

Never:

- Change project architecture.
- Rename files unnecessarily.
- Introduce new patterns without approval.
- Refactor unrelated code.
- Add features not requested.

---

# Project Philosophy

This application is intentionally simple.

The goal is:

- Easy to understand.
- Easy to maintain.
- Easy to extend.

Every implementation decision should support those goals.