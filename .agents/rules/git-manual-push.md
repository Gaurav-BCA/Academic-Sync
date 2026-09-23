---
description: Manual Git Push and Commit Enforcement
---

# Manual Git Push & Commit Enforcement Policy

1. **NO Automatic Background Commits or Pushes**:
   - The assistant MUST NEVER execute `git commit` or `git push` automatically after completing tasks or making edits.
   - All code edits must remain saved strictly in the local working directory.

2. **Explicit User Directive Required**:
   - `git commit` and `git push` commands may ONLY be executed when the user explicitly requests a commit/push in their prompt (e.g., "Push code to GitHub", "commit and push changes").

3. **Local Work Isolation**:
   - Always verify changes locally (`npx tsc --noEmit`, `npm run build`, `git status`) and leave unstaged/staged files in the working directory for user inspection.
