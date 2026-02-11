# Mighty Go Library Editor

A lightweight, browser-based editor for the Mighty Go library. It supports folder-based editing and ZIP import/export, with strict validation.

## Requirements
- Node.js 18+

## Install
```bash
cd editor
npm install
```

## Run locally
```bash
npm run dev
```

## Usage
- **Open Folder**: Select the repo root to edit files in place.
- **Import ZIP**: Load a library ZIP for editing.
- **Export ZIP**: Save a validated library ZIP for someone else to commit.
- **Save To Folder**: Write changes back to the opened folder.

## Notes
- Folder mode uses the File System Access API (Chromium-based browsers recommended).
- Export is blocked until validation passes.
