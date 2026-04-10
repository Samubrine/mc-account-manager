# MC Account Database Manager

Desktop app for managing Minecraft account records locally with Electron, React, TypeScript, and SQLite.

## What It Does

- Manage account records (email, username, account type, status)
- Store and edit account notes and ban history
- Encrypt account passwords at rest
- Import/export account data via CSV
- Create local database backups
- App-level lock screen with local user credentials

## Tech Stack

- Electron
- React + TypeScript
- Vite
- Tailwind CSS
- SQLite (`better-sqlite3`)

## Project Structure

- `src/` - renderer UI (pages, components, styles)
- `electron/` - main process, IPC handlers, DB repositories, security utilities
- `electron/database/` - schema and repositories
- `electron/security/` - password hashing and encryption key management

## Security Notes

- Account passwords are encrypted before being saved in SQLite.
- Encryption key strategy:
  - If `MC_MANAGER_ENCRYPTION_SECRET` is set, a 32-byte key is derived from it.
  - Otherwise, the app creates a local per-install key file in Electron `userData` (`encryption.key`).
- App-lock passwords are hashed using PBKDF2 (`sha512`) with random salt.

Important: if you change/remove the encryption secret or lose the local key file, previously encrypted account passwords cannot be decrypted.

## Requirements

- Node.js 18+
- npm
- Windows recommended for packaging flow shown here

## Setup

```bash
npm install
npm run rebuild
```

## Run in Development

```bash
npm run dev
```

## Build

UI only:

```bash
npm run build:ui
```

Full app package:

```bash
npm run build
```

## Environment Variables (Optional)

Create a local `.env` file if you want deterministic encryption across machines/builds:

```env
MC_MANAGER_ENCRYPTION_SECRET=replace-with-your-own-long-random-secret
```

Do not commit `.env` or any key/cert files.

## GitHub Push Checklist

Before pushing:

1. Ensure `.gitignore` is present (this repo includes one).
2. Make sure `node_modules/`, `dist/`, `dist-electron/`, `release/`, and `*.db` are not tracked.
3. Never commit `.env`, `*.pfx`, `*.pem`, `*.key`, or local key files.
4. Verify no hardcoded secrets remain in code.

## Common Scripts

- `npm run dev` - run renderer and Electron in dev mode
- `npm run build:ui` - compile renderer
- `npm run build:electron` - compile Electron TypeScript
- `npm run build` - full production package build
- `npm run rebuild` - rebuild native modules for Electron ABI
