<#
Variable-path Windows helper for setting user PATH entries.
Usage examples:
  powershell -ExecutionPolicy Bypass -File scripts\set_env_windows_vars.ps1 -GitPath 'C:\Program Files\Git\cmd' -NodePath 'C:\Program Files\nodejs'
  powershell -ExecutionPolicy Bypass -File scripts\set_env_windows_vars.ps1 -AddPaths 'C:\tools\bin','C:\custom\node\bin'
#>
param(
    [string]$GitPath = '',
    [string]$NodePath = '',
    [string]$NpmPath  = '',
    [string[]]$AddPaths
)

$pathsToAdd = @()
if ($GitPath) { $pathsToAdd += $GitPath }
if ($NodePath) { $pathsToAdd += $NodePath }
if ($NpmPath)  { $pathsToAdd += $NpmPath }
if ($AddPaths) { $pathsToAdd += $AddPaths }

if ($pathsToAdd.Count -eq 0) {
    Write-Output "No paths provided. Use -GitPath, -NodePath, -NpmPath or -AddPaths.";
    exit 0
}

$current = [Environment]::GetEnvironmentVariable('Path','User') -split ';' | Where-Object { $_ -ne '' }
$added = @()
foreach ($p in $pathsToAdd) {
  $itm = Get-Item -LiteralPath $p -ErrorAction SilentlyContinue
  if ($itm) { $norm = $itm.FullName } else { $norm = $null }
    if (-not ($current -contains $norm)) { $current += $norm; $added += $norm }
}

if ($added.Count -gt 0) {
    $new = ($current -join ';')
    [Environment]::SetEnvironmentVariable('Path', $new, 'User')
    # update current session
    $env:Path = $env:Path + ';' + ($added -join ';')
    Write-Output "Added to user PATH: $($added -join ', ')"
    Write-Output "Restart terminals to pick up changes (or run: `$env:Path = '$new')"
} else {
    Write-Output "No new entries were added (all already present or invalid)"
}

# quick checks
try { & git --version } catch { Write-Output 'git: not found' }
try { & node --version } catch { Write-Output 'node: not found' }
try { & npm --version } catch { Write-Output 'npm: not found' }
