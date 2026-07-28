# Database

Version: 1.0

This document defines the database structure and rules.

---

# Database

SQLite

The application stores all data locally.

No internet is required.

SQLite is the single source of truth.

---

# Tables

## leads

| Column | Type | Required |
|---------|------|----------|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | Yes |
| name | TEXT | Yes |
| phone | TEXT | Yes |
| home_type | TEXT | Yes |
| location | TEXT | Yes |
| email | TEXT | No |
| notes | TEXT | No |
| created_at | TEXT | Yes |
| updated_at | TEXT | Yes |

---

# Rules

Phone numbers should be unique.

If the same phone number already exists,

Show

"This lead already exists."

Allow

- View
- Edit
- Cancel

Do not create duplicate records.

---

# Create

When saving a lead

- Validate required fields.
- Check duplicate phone.
- Save to SQLite.
- Store current date and time.
- Return success or error.

---

# Read

CRM page should display

- Latest records first.
- Search instantly.
- Filter results.
- Show total number of leads.

---

# Update

When editing

- Update only modified fields.
- Keep created_at unchanged.
- Update updated_at.

---

# Delete

Before deleting

Show confirmation.

Delete only after user confirms.

Never delete automatically.

---

# Search

Search should work on

- Name
- Phone
- Email
- Location
- Notes

Search should ignore uppercase/lowercase.

Results should update instantly.

---

# Filters

Support filtering by

- Today
- Yesterday
- This Week
- This Month
- Custom Date Range
- Location
- Home Type

Filters can be combined.

---

# Sorting

Default

Newest first.

Future

Oldest first.

Alphabetical.

---

# Export

Export filtered results only.

Supported format

- Excel (.xlsx)

The exported file should contain

- Name
- Phone
- Home Type
- Location
- Email
- Notes
- Created Date

---

# Error Handling

Every database operation must return

Success

or

Readable error message.

Never fail silently.

---

# Future Compatibility

Database design should allow adding

- Follow-up status
- Assigned executive
- Multiple projects

without changing existing records.

---

# AI Rules

Never change the table structure without approval.

Never remove columns.

Never delete user data automatically.

Always use parameterized SQL queries.

Always validate user input before saving.