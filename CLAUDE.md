# CLAUDE.md — victordelrosal.com

**This file is read automatically by Claude Code at session start.**

## Project Overview

Personal website + automated content systems for Victor del Rosal.

## Subdirectory Contexts

When working in these directories, also read their local CLAUDE.md:

| Directory | Purpose | Local Context |
|-----------|---------|---------------|
| `ai-daily-intel/` | Daily AI News Scan (DAINS) automation | `ai-daily-intel/CLAUDE.md` |

## Key Files

- `README.md` — Project overview
- `prd.md` — Product requirements
- `.github/workflows/` — GitHub Actions automation

## Git Workflow

- Main branch: `main`
- Always pull before pushing
- Commit messages should be descriptive

## Common Patterns

### Wave pages
Static HTML pages in `<slug>/index.html` format, built from Supabase `published_posts` table.

### Build automation
- `build-waves.js` — Generates wave pages from Supabase
- `ai-daily-intel/build-scan.js` — Generates daily AI news scan
