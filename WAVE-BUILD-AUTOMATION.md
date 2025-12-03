# Wave Build Automation

Automatic generation of static wave pages with proper Open Graph meta tags for social sharing.

## Problem Solved

When sharing waves on LinkedIn, X, or Bluesky, social media crawlers don't execute JavaScript - they only read the initial HTML. Without static pages, shared links showed generic images instead of the wave's actual image.

## Solution Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Flux App  │────▶│   Supabase   │     │  GitHub Actions │────▶│ GitHub Pages │
│  (publish)  │     │ (published_  │     │ (build-waves.js)│     │   (static    │
│             │──┐  │    posts)    │     │                 │     │  wave pages) │
└─────────────┘  │  └──────────────┘     └─────────────────┘     └──────────────┘
                 │                              ▲
                 │  Trigger via GitHub API      │
                 └──────────────────────────────┘
```

## Components

### 1. Build Script (`build-waves.js`)

Node.js script that:
- Fetches all published posts from Supabase
- Extracts the first image from each post's content
- Generates static HTML files with correct `og:image` meta tags
- Creates folder structure: `/{slug}/index.html`

**Run manually:**
```bash
node build-waves.js
```

### 2. Wave Loader (`/js/wave-loader.js`)

Shared JavaScript module that:
- Loads wave content dynamically from Supabase
- Used by both `404.html` (catch-all) and generated static pages
- Handles all interactivity (comments, reactions, sharing)

### 3. GitHub Actions Workflow (`.github/workflows/build-waves.yml`)

Triggers:
- `repository_dispatch` - Called by Flux after publishing
- `workflow_dispatch` - Manual trigger from GitHub UI
- `schedule` - Every 30 minutes as fallback

### 4. Flux Integration (`/flux/app/lib/publishService.ts`)

Added `triggerWaveBuild()` function that:
- Calls GitHub Actions API after successful publish
- Fire-and-forget (doesn't block publishing)
- Requires `NEXT_PUBLIC_GITHUB_TOKEN` in `.env.local`

## Setup (Already Complete)

### GitHub Token Configuration

1. Created Fine-grained Personal Access Token at:
   https://github.com/settings/tokens?type=beta

2. Token settings:
   - Name: `flux-wave-build`
   - Expiration: No expiration
   - Repository: `victordelrosal/victordelrosal.github.io`
   - Permissions:
     - Contents: Read and write
     - Metadata: Read-only (required)

3. Added to Flux `.env.local`:
   ```
   NEXT_PUBLIC_GITHUB_TOKEN=github_pat_...
   ```

## Flow When Publishing

1. User publishes wave in Flux
2. Flux saves to Supabase `published_posts` table
3. Flux calls GitHub API to trigger `wave-published` event
4. GitHub Actions workflow starts
5. `build-waves.js` fetches posts and generates HTML files
6. Changes auto-committed and pushed to GitHub Pages
7. Wave page is live with correct `og:image` within ~1 minute

## Generated File Structure

```
victordelrosal.com/
├── hello-world/
│   └── index.html          # Static page with og:image
├── my-second-wave/
│   └── index.html
├── build-waves.js          # Build script
├── js/
│   └── wave-loader.js      # Shared content loader
└── .github/
    └── workflows/
        └── build-waves.yml # GitHub Actions workflow
```

## Testing Social Sharing

Use these validators to verify preview images:
- **LinkedIn**: https://www.linkedin.com/post-inspector/
- **X/Twitter**: https://cards-dev.twitter.com/validator
- **Facebook**: https://developers.facebook.com/tools/debug/

## Troubleshooting

### Wave pages not updating?

1. Check GitHub Actions: https://github.com/victordelrosal/victordelrosal.github.io/actions
2. Manually trigger: Go to Actions → "Build Wave Pages" → "Run workflow"
3. Run locally: `node build-waves.js && git add . && git commit -m "Rebuild waves" && git push`

### Trigger not working from Flux?

1. Verify token in `.env.local` is correct
2. Check browser console for errors after publishing
3. Ensure token has `Contents: Read and write` permission

### Social preview not showing?

1. Wait 1-2 minutes for GitHub Pages to deploy
2. Clear cache on social platform's validator
3. Verify the wave page exists: `https://victordelrosal.com/{slug}/`

## Files Modified

| File | Location | Purpose |
|------|----------|---------|
| `build-waves.js` | victordelrosal.com | Generates static wave pages |
| `wave-loader.js` | victordelrosal.com/js | Loads wave content |
| `build-waves.yml` | victordelrosal.com/.github/workflows | GitHub Actions workflow |
| `publishService.ts` | flux/app/lib | Triggers build after publish |
| `.env.local` | flux | GitHub token storage |

---

*Created: December 2024*
