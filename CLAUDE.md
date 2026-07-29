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

### Supabase egress discipline (Jul 29, 2026 incident)
The site's Supabase (project flux, `azzzrjnqgkqwpqnroost`) has a 5 GB/month egress cap.
`published_posts` is ~15 MB with content (8 legacy posts hold base64-inline images = 89% of it).
- NEVER fetch `select=*` from `published_posts` for lists, nav, or thumbnails; use
  `PostsAPI.fetchPostsLight()` + `getPostImage()` (posts.js). Full content only via `fetchPostBySlug`.
- `build-waves.js` skips the full fetch via `.waves-fingerprint`; `FORCE_REBUILD=1` bypasses.
- Legacy post thumbnails live in `img/wave-thumbs/` + the `WAVE_THUMBS` map in posts.js.
