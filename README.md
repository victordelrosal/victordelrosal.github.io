# victordelrosal.com

Personal website and blog for Victor del Rosal - AI Educator, Author, and Chief AI Officer.

## Description

This is the main personal website featuring a portfolio, blog (Waves), daily AI news scans, and professional information. The site includes gamification features with Supabase integration, a leaderboard system, and a sophisticated visual design.

## Project Structure

- .github/ - GitHub workflows
- cloudflare-worker/ - Cloudflare Worker scripts
- css/ - Stylesheets
- docs/ - Documentation
- img/ - Image assets
- js/ - JavaScript files
- misc/ - Miscellaneous files
- supabase/ - Supabase configuration
- waves/ - Blog posts
- daily-ai-news-scan-*/ - Daily AI news directories
- index.html - Main landing page
- 404.html - Custom 404 page
- build-waves.js - Blog build script
- CNAME - Custom domain configuration

## Features

- Modern, responsive personal portfolio
- Waves blog system with automated build
- Daily AI News Scan feature
- Gamification with XP and leaderboard system
- Supabase integration for user data
- Aquarium wave visual effects on hero section
- Interactive technology wheel
- AI chat integration

## Key Sections

- Hero with animated wave effects
- About/Bio
- Blog (Waves)
- Daily AI Intelligence reports
- CV/Resume (PDF)

## Technology Stack

- HTML5/CSS3/JavaScript
- Supabase for backend
- GitHub Pages hosting
- Cloudflare Workers
- Custom build scripts for blog automation

## Related Projects

### Flux: My Notes
The "Waves" blog content originates from Flux (My Notes app). Both projects share the same Supabase instance (`azzzrjnqgkqwpqnroost`).

**Important:** If experiencing database issues (timeouts, waves not loading), check:
- `flux/docs/MAINTENANCE-LOG.md` - Database incident history and fixes
- Run `ANALYZE notes;` in Supabase SQL Editor if statistics are stale

### Supabase Project
- **Project ref:** `azzzrjnqgkqwpqnroost`
- **Shared tables:** `notes`, `published_posts`, `wave_reactions`, etc.
- **Scheduled maintenance:** pg_cron runs `ANALYZE notes` every 6 hours (job ID: 12)
