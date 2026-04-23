# MC Account Database Manager

A local desktop app for tracking Minecraft account data with a modern Electron + React UI and SQLite storage.

## Features

- Full account management (email, username, password, account type, status)
- In-place account editing in a centered details modal with tabs (Info, Notes, Bans)
- Password visibility toggles (hidden by default)
- Interactive Minecraft skin previews:
  - 2D head avatar in the accounts list
  - 3D draggable skin viewer in account details (walking animation, bright lighting, NameMC-style angle)
- Notes and ban history management (create, edit, delete, activate/expire)
- CSV import/export and database backup support
- Smooth 300ms morph-style transitions across pages, tabs, and modals
- App lock screen with local credentials
- Password encryption at rest in SQLite

## Screenshots

Add screenshots to show the main flows in your app listing:

- Dashboard overview
- Accounts table with 2D heads
- Account details modal (Info tab + 3D skin viewer)
- Notes tab
- Bans tab
- Lock screen

Example markdown:

```md
![Dashboard](./docs/screenshots/dashboard.png)
![Accounts](./docs/screenshots/accounts.png)
![Account Details](./docs/screenshots/account-details.png)
```

Tip: create `docs/screenshots/` and keep filenames stable so README links do not break.

## Tech Stack

- Electron
- React + TypeScript
- Vite
- Tailwind CSS
- SQLite (`better-sqlite3`)
- `skinview3d` for dynamic 3D skin rendering

## Requirements

- Node.js 18+
- npm
- Windows is recommended for packaging flow (`electron-builder` + NSIS)

## Setup

```bash
npm install
npm run rebuild
```

## Development

```bash
npm run dev
```

## Build

Build UI only:

```bash
npm run build:ui
```

Build Electron main process only:

```bash
npm run build:electron
```

Build full distributable app:

```bash
npm run build
```

## Security

- Account passwords are encrypted before being saved.
- Encryption key source:
  - If `MC_MANAGER_ENCRYPTION_SECRET` is set, a 32-byte key is derived from it.
  - Otherwise, a per-install key file is generated in Electron `userData` as `encryption.key`.
- App-lock credentials are hashed with PBKDF2 (`sha512`) and random salt.

Important: if you change/remove `MC_MANAGER_ENCRYPTION_SECRET` or lose the generated key file, previously encrypted passwords cannot be decrypted.

## Optional Environment Variable

Create a local `.env` to keep encryption consistent across machines/builds:

```env
MC_MANAGER_ENCRYPTION_SECRET=replace-with-your-own-long-random-secret
```

Never commit `.env` files or private key/certificate files.

## Known Limitations

- The 3D skin viewer (`skinview3d` + three.js) increases renderer bundle size.
- Skin preview depends on external skin endpoints; unavailable services can cause temporary fallback behavior.
- Packaging instructions are primarily tested on Windows (NSIS target).

## Project Structure

- `src/` - renderer UI (pages, components, styles)
- `electron/` - main process, IPC handlers, repositories, security utilities
- `electron/database/` - schema and repositories
- `electron/security/` - password hashing and encryption key management

## Scripts

- `npm run dev` - run renderer and Electron in development mode
- `npm run build:ui` - compile renderer
- `npm run build:electron` - compile Electron TypeScript
- `npm run build` - build production package
- `npm run rebuild` - rebuild native modules for Electron ABI
