#!/bin/bash
set -e

echo "🚀 MokshaPass Deployment"
echo "========================"

# 1. Build check
echo "▶ Checking build..."
npm run build

# 2. Git push
echo ""
echo "▶ Pushing to GitHub..."
git add -A
if git diff --staged --quiet; then
  echo "  No changes to commit."
else
  git commit -m "chore: deploy $(date '+%Y-%m-%d %H:%M')" \
    -m "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
  git push
fi

# 3. Vercel deploy to production
echo ""
echo "▶ Deploying to Vercel..."
vercel --prod --yes

echo ""
echo "✅ Deployed! Visit https://mokshapass.com"
