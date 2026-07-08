import { exec } from 'child_process'

/**
 * Opens desktop applications on Windows using a multi-strategy PowerShell approach.
 * Strategy order:
 *  1. Direct Start-Process (apps in PATH — e.g. notepad, calc, chrome)
 *  2. Search %LOCALAPPDATA%\Programs (user-installed apps — e.g. Discord, Slack, VS Code)
 *  3. Search %ProgramFiles% and %ProgramFiles(x86)% (system-wide installs)
 *  4. Get-StartApps (UWP / Microsoft Store apps)
 */
export function openApp(appName: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    if (!appName || !appName.trim()) {
      return resolve({ success: false, output: 'App name is required' })
    }

    const name = appName.trim()

    // Build a PowerShell script with 4 fallback strategies
    const ps = `
$ErrorActionPreference = 'Stop'
$appName = '${name.replace(/'/g, "''")}' # Escape single quotes

# Strategy 1: Direct Start-Process (apps already in PATH or well-known names)
try {
  Start-Process $appName
  Write-Output "Opened: $appName (direct)"
  exit 0
} catch {}

# Strategy 2: Search common user & system install directories
$searchPaths = @(
  "$env:LOCALAPPDATA\\Programs",
  $env:LOCALAPPDATA,
  $env:APPDATA,
  $env:ProgramFiles,
  "$env:ProgramFiles\\WindowsApps",
  \${env:ProgramFiles(x86)}
)

foreach ($dir in $searchPaths) {
  if ($dir -and (Test-Path $dir)) {
    $exe = Get-ChildItem -Path $dir -Recurse -Filter "${appName}.exe" -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -notlike '*uninstall*' -and $_.Name -notlike '*setup*' } |
      Select-Object -First 1
    if ($exe) {
      Start-Process $exe.FullName
      Write-Output "Opened: $($exe.FullName)"
      exit 0
    }
  }
}

# Strategy 3: Fuzzy search — partial name match in common install dirs
foreach ($dir in $searchPaths) {
  if ($dir -and (Test-Path $dir)) {
    $exe = Get-ChildItem -Path $dir -Recurse -Filter "*.exe" -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "*${appName}*" -and $_.Name -notlike '*uninstall*' -and $_.Name -notlike '*setup*' } |
      Select-Object -First 1
    if ($exe) {
      Start-Process $exe.FullName
      Write-Output "Opened (fuzzy): $($exe.FullName)"
      exit 0
    }
  }
}

# Strategy 4: Get-StartApps (UWP / Microsoft Store apps)
$startApp = Get-StartApps | Where-Object { $_.Name -like "*${appName}*" } | Select-Object -First 1
if ($startApp) {
  Start-Process "explorer.exe" "shell:AppsFolder\\$($startApp.AppID)"
  Write-Output "Opened (UWP): $($startApp.Name)"
  exit 0
}

Write-Error "Could not find application: $appName"
exit 1
`.trim()

    console.log(`[skills] Opening application: "${name}"`)

    const base64Script = Buffer.from(ps, 'utf16le').toString('base64')

    exec(
      `powershell -NonInteractive -NoProfile -EncodedCommand ${base64Script}`,
      { shell: 'cmd.exe', timeout: 15000 },
      (err, stdout, stderr) => {
        if (err) {
          const errMsg = (stderr || err.message || '').trim()
          console.error(`[skills] Failed to open "${name}": ${errMsg}`)
          return resolve({
            success: false,
            output: `Could not open "${name}". Make sure the app is installed. Error: ${errMsg}`
          })
        }
        const result = (stdout || '').trim()
        console.log(`[skills] open_app result: ${result}`)
        return resolve({ success: true, output: result || `Successfully opened ${name}` })
      }
    )
  })
}
