# Cleanup script to remove backup and stray files from the repo and commit
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\cleanup_ui_patch.ps1
$ErrorActionPreference = 'Stop'

$toRemove = @(
  'packages/uin-ui/App.jsx.bak',
  'packages/uin-ui/package.json.bak',
  'packages/uin-ui/src/App.test.jsx.bak',
  'packages/uin-ui/App (2).jsx'
)

foreach ($f in $toRemove) {
  if (Test-Path $f) {
    Remove-Item $f -Force -Recurse
    Write-Host "Removed $f"
  } else {
    Write-Host "Not found: $f"
  }
}

# Stage removal and commit if git available
try {
  $git = Get-Command git -ErrorAction Stop
  git add -A
  $status = (& git status --porcelain)
  if ($status) {
    git commit -m "chore(ui): cleanup backup and stray files"
    git push
    Write-Host "Committed and pushed cleanup"
  } else {
    Write-Host "No changes to commit"
  }
} catch {
  Write-Host "Git not available or commit failed: $_"
}
