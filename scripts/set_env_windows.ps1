<#
Set user PATH entries for Git and Node.js on Windows.
Usage: Run in an elevated shell or normal shell (will modify user env):
  powershell -ExecutionPolicy Bypass -File scripts\set_env_windows.ps1
#>
[CmdletBinding()]
param(
    [switch]$AddGit = $true,
    [switch]$AddNode = $true
)

function Normalize-PathEntry($p) {
    $item = Get-Item -Path $p -ErrorAction SilentlyContinue
    if ($null -ne $item) { return $item.FullName } else { return $null }
}

Write-Output "Detecting Git and Node installations..."
$gitCandidates = @(
    "$env:ProgramFiles\Git\cmd",
    "$env:ProgramFiles\Git\bin",
    "C:\Program Files\Git\cmd",
    "C:\Program Files\Git\bin"
)
$nodeCandidates = @(
    "$env:ProgramFiles\nodejs",
    "C:\Program Files\nodejs"
)

$gitFound = $null
foreach ($p in $gitCandidates) { if (Test-Path $p) { $gitFound = Normalize-PathEntry $p; break } }
$nodeFound = $null
foreach ($p in $nodeCandidates) { if (Test-Path $p) { $nodeFound = Normalize-PathEntry $p; break } }

# Try where.exe fallback
if (-not $gitFound) {
    try { $g = (where.exe git 2>$null | Select-Object -First 1); if ($g) { $gitFound = Split-Path $g -Parent } } catch {}
}
if (-not $nodeFound) {
    try { $n = (where.exe node 2>$null | Select-Object -First 1); if ($n) { $nodeFound = Split-Path $n -Parent } } catch {}
}

$toAdd = @()
if ($AddGit -and $gitFound) { if (-not ($env:Path -split ';' | Where-Object { $_ -eq $gitFound })) { $toAdd += $gitFound } }
if ($AddNode -and $nodeFound) { if (-not ($env:Path -split ';' | Where-Object { $_ -eq $nodeFound })) { $toAdd += $nodeFound } }

if ($toAdd.Count -eq 0) {
    Write-Output "Nothing to add to user PATH. Current versions (if available):"
    try { & git --version } catch { Write-Output "git: not found" }
    try { & node --version } catch { Write-Output "node: not found" }
    try { & npm --version } catch { Write-Output "npm: not found" }
    exit 0
}

# Update user PATH (avoid duplicates)
$currentUserPath = [Environment]::GetEnvironmentVariable('Path','User')
$newParts = $currentUserPath -split ';' | Where-Object { $_ -ne '' }
foreach ($p in $toAdd) { if (-not ($newParts -contains $p)) { $newParts += $p } }
$newPath = ($newParts -join ';')

try {
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
    # Also update current session
    $env:Path = $env:Path + ";" + ($toAdd -join ';')
    Write-Output "Updated user PATH with: $($toAdd -join ', ')"
    Write-Output "Note: Existing open terminals may need to be restarted to pick up changes."
    Write-Output "Current quick check:"
    try { & git --version } catch { Write-Output "git: not found after update" }
    try { & node --version } catch { Write-Output "node: not found after update" }
    try { & npm --version } catch { Write-Output "npm: not found after update" }
} catch {
    Write-Error "Failed to update user PATH: $_"
}

Write-Output "If binaries are still not found, consider installing Git from https://git-scm.com/downloads and Node.js from https://nodejs.org/"
