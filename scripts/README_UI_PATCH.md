UI Patch - apply_uin_ui_patch

This folder contains scripts to apply the UI patch, run tests and push the branch.

Files:
- apply_uin_ui_patch.ps1 — PowerShell script (Windows). Run from repo root: `powershell -ExecutionPolicy Bypass -File .\scripts\apply_uin_ui_patch.ps1`
- apply_uin_ui_patch.sh — Bash script (Linux/Mac). Run from repo root: `bash ./scripts/apply_uin_ui_patch.sh`

What the scripts do:
1. Back up existing files (App.jsx, src/App.test.jsx, package.json) to `.bak` files.
2. Overwrite `packages/uin-ui/App.jsx` with the cleaned/polished component (adds sample selection, send-to-ComfyUI, notifications).
3. Create `packages/uin-ui/src/App.test.jsx` unit test (React Testing Library).
4. Ensure `packages/uin-ui/package.json` has the test script and dev dependencies (`@testing-library/react`, `@testing-library/jest-dom`).
5. Run `npm ci`, `npm test`, and `npm run build` in `packages/uin-ui`.
6. Create a Git branch `feature/ui-polish-tests`, commit the changes, and push it to `origin`. (A workflow will auto-create a PR for any pushed `feature/**` branch and label it `automerge`.)

Notes:
- Scripts assume `node`, `npm`, and `git` are available in PATH and the repo is clean or you are OK with creating a new branch.
- If any step fails, scripts exit with a non-zero status and backups are left in place.
- Review the generated files before running `git push` if you prefer to inspect changes first.

If you want, I can also produce a single `patch.zip` containing the changed files instead of scripts. If you run into permission issues, run the PowerShell script with `-ExecutionPolicy Bypass`.