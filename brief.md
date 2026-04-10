PROMPT START

You are a senior full-stack desktop application engineer.

Create a complete standalone desktop application called:

"MC Account Database Manager"

Core Requirements

Build a production-ready Electron + React + TypeScript app with SQLite (better-sqlite3).

Priority:

Functionality

Clean and intuitive UI/UX

Maintainable structure

Application Purpose

A standalone desktop database app to manage Minecraft accounts with the following features:

1️⃣ Account CRUD

Each account must contain:

id (auto increment)

email (string)

password (string, encrypted before storing)

username (optional string)

status (Active / Banned / Disabled)

created_at

updated_at

User must be able to:

Create account

Edit account

Delete account

Search accounts

Filter by status

Sort by email, username, created date

2️⃣ Notes CRUD (Linked to Accounts)

Each account can have multiple notes.

Note fields:

id

account_id (foreign key)

title

content (multiline text)

created_at

User must be able to:

Add note to account

Edit note

Delete note

View notes inside account detail panel

3️⃣ Ban Management

Each account can have multiple ban records.

Ban fields:

id

account_id

ban_reason

banned_at (datetime)

unban_at (datetime)

is_active (boolean)

Features:

Add ban record

Auto detect if ban is currently active

Display countdown timer if banned

Mark account status automatically as "Banned" if active ban exists

4️⃣ UI / UX Requirements

Modern clean layout using:

React

TailwindCSS

Component-based design

Responsive layout (minimum 1280px desktop)

Layout:

Left Sidebar:

Dashboard

Accounts

Banned Accounts

Main Area:

Account list table

Search bar

Filters

Add Account button

Clicking an account opens:

Right side drawer or modal with:

Account info

Notes tab

Ban history tab

UX must include:

Confirm delete dialogs

Form validation

Toast notifications

Keyboard shortcuts (Ctrl+N new account)

Dark mode support

5️⃣ Security

Encrypt passwords before saving (use crypto library)

Do NOT store plain text passwords

Prevent SQL injection

Use parameterized queries

6️⃣ Database

Use SQLite (better-sqlite3).

Provide:

Database schema creation

Migration logic if tables don't exist

Clear separation between database layer and UI layer

7️⃣ Project Structure

Use clean structure:

/electron
main.ts
preload.ts
/database
db.ts
account.repository.ts
note.repository.ts
ban.repository.ts
/src
components/
pages/
hooks/
types/
utils/

8️⃣ Additional Features

Export accounts to CSV

Import accounts from CSV

Backup database button

Dashboard statistics:

Total accounts

Active accounts

Currently banned

Accounts created this week

9️⃣ Deliverables

Provide:

Full project structure

package.json

Database schema

All main files

Clear step-by-step setup instructions

How to build for Windows

How to package into .exe

Code must be complete and runnable.

Generate the full implementation step by step.

Do not summarize. Provide full working code.