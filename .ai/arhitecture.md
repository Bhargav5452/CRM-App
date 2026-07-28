# Architecture

## Goal

Build a fast, offline-first CRM for Android and iOS using a single codebase.

The application should be simple, responsive, and easy to maintain.

---

## Tech Stack

- React
- TypeScript
- Ionic
- Capacitor
- SQLite
- SheetJS (Excel Export)

---

## Pages

### 1. Home

Purpose:
Capture new leads.

Features:
- Lead form
- Review before save
- Save to SQLite

---

### 2. CRM

Purpose:
Manage saved leads.

Features:
- List leads
- Search
- Filter
- Edit
- Delete
- Export to Excel

---

## Database

One SQLite table:

Leads

- id
- name
- phone
- email
- home_type
- location
- notes
- created_at
- updated_at

---

## Rules

- Offline first
- Mobile first
- Responsive
- One codebase for Android and iOS
- Reusable components
- No unnecessary complexity
- No backend
- No cloud
- No login
- Keep code simple and readable

This document is the project's source of truth.