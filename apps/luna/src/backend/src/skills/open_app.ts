import { execFile } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

interface OpenAppResult {
  success: boolean
  output: string
}

const COMMAND_TIMEOUT_MS = 20000

const WINDOWS_APP_ALIASES: Record<string, string[]> = {
  calculator: ['Calculator', 'calc'],
  calc: ['Calculator', 'calc'],
  chrome: ['Google Chrome', 'chrome'],
  discord: ['Discord'],
  edge: ['Microsoft Edge', 'msedge'],
  explorer: ['File Explorer', 'explorer'],
  files: ['File Explorer', 'explorer'],
  notepad: ['Notepad', 'notepad'],
  outlook: ['Microsoft Outlook', 'outlook'],
  powershell: ['PowerShell', 'powershell'],
  spotify: ['Spotify'],
  terminal: ['Windows Terminal', 'wt'],
  vscode: ['Visual Studio Code', 'Code', 'code'],
  'vs code': ['Visual Studio Code', 'Code', 'code'],
  word: ['Microsoft Word', 'winword']
}

const MAC_APP_ALIASES: Record<string, string[]> = {
  calculator: ['Calculator'],
  chrome: ['Google Chrome'],
  edge: ['Microsoft Edge'],
  finder: ['Finder'],
  files: ['Finder'],
  notes: ['Notes'],
  safari: ['Safari'],
  spotify: ['Spotify'],
  terminal: ['Terminal'],
  vscode: ['Visual Studio Code'],
  'vs code': ['Visual Studio Code']
}

function runCommand(file: string, args: string[], options: { env?: NodeJS.ProcessEnv } = {}) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(
      file,
      args,
      {
        timeout: COMMAND_TIMEOUT_MS,
        windowsHide: true,
        env: options.env || process.env,
        maxBuffer: 1024 * 1024
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error((stderr || err.message || '').trim()))
          return
        }
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
      }
    )
  })
}

function uniqueCandidates(appName: string, aliases: Record<string, string[]>): string[] {
  const normalized = appName.trim()
  const key = normalized.toLowerCase()
  const candidates = [normalized, ...(aliases[key] || [])]
  return [...new Set(candidates.filter(Boolean))]
}

function normalizeAppName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function collectShortcutFiles(root: string, depth = 0): string[] {
  if (depth > 6 || !root || !fs.existsSync(root)) return []

  try {
    const entries = fs.readdirSync(root, { withFileTypes: true })
    const shortcuts: string[] = []

    for (const entry of entries) {
      const fullPath = path.join(root, entry.name)
      if (entry.isDirectory()) {
        shortcuts.push(...collectShortcutFiles(fullPath, depth + 1))
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.lnk')) {
        shortcuts.push(fullPath)
      }
    }

    return shortcuts
  } catch {
    return []
  }
}

async function tryOpenWindowsShortcut(candidates: string[]): Promise<OpenAppResult | null> {
  const shortcutRoots = [
    path.join(
      process.env.ProgramData || 'C:\\ProgramData',
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs'
    ),
    path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs'
    ),
    path.join(os.homedir(), 'Desktop'),
    path.join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop')
  ]

  const normalizedCandidates = candidates.map(normalizeAppName)
  const shortcuts = shortcutRoots.flatMap((root) => collectShortcutFiles(root))
  const match = shortcuts
    .map((shortcut) => ({
      shortcut,
      normalizedName: normalizeAppName(path.basename(shortcut, '.lnk'))
    }))
    .filter(({ normalizedName }) =>
      normalizedCandidates.some(
        (candidate) => normalizedName === candidate || normalizedName.includes(candidate)
      )
    )
    .sort((a, b) => a.shortcut.length - b.shortcut.length)[0]

  if (!match) return null

  try {
    await runCommand('cmd.exe', ['/d', '/s', '/c', 'start', '', match.shortcut])
    return {
      success: true,
      output: `Opened Start Menu shortcut: ${match.shortcut}`
    }
  } catch {
    return null
  }
}

function escapePowerShellSingleQuoted(value: string): string {
  return value.replace(/'/g, "''")
}

function createWindowsScript(appName: string, candidates: string[]): string {
  const psCandidates = candidates.map((candidate) => `'${escapePowerShellSingleQuoted(candidate)}'`)

  return `
$ErrorActionPreference = 'Stop'
$candidates = @(${psCandidates.join(', ')})
$query = '${escapePowerShellSingleQuoted(appName)}'

function Normalize-Name([string]$value) {
  if (-not $value) { return '' }
  return ($value.ToLowerInvariant() -replace '[^a-z0-9]+', '')
}

function Is-BadExecutable([string]$path) {
  $leaf = [System.IO.Path]::GetFileName($path).ToLowerInvariant()
  return $leaf -match '(unins|uninstall|setup|install|update|crash|helper|service|broker|elevate)'
}

function Try-OpenPath([string]$path, [string]$label) {
  if ($path -and (Test-Path -LiteralPath $path) -and -not (Is-BadExecutable $path)) {
    Start-Process -FilePath $path
    Write-Output "Opened \${label}: \${path}"
    exit 0
  }
}

function Try-OpenCommand([string]$name) {
  try {
    $cmd = Get-Command $name -ErrorAction Stop | Select-Object -First 1
    if ($cmd -and $cmd.Source) {
      Start-Process -FilePath $cmd.Source
      Write-Output "Opened command: $($cmd.Source)"
      exit 0
    }
  } catch {}
}

function Try-OpenStartMenuShortcut {
  $shortcutRoots = @(
    "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs",
    "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs",
    "$env:USERPROFILE\\Desktop",
    "$env:PUBLIC\\Desktop"
  ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

  foreach ($root in $shortcutRoots) {
    $shortcut = Get-ChildItem -LiteralPath $root -Filter '*.lnk' -File -Recurse -ErrorAction SilentlyContinue |
      Where-Object {
        $shortcutName = Normalize-Name $_.BaseName
        ($normalizedCandidates | Where-Object {
          $candidateName = Normalize-Name $_
          $shortcutName -eq $candidateName -or $shortcutName.Contains($candidateName)
        })
      } |
      Sort-Object @{ Expression = { $_.FullName.Length } } |
      Select-Object -First 1

    if ($shortcut) {
      Start-Process -FilePath $shortcut.FullName
      Write-Output "Opened Start Menu shortcut: $($shortcut.FullName)"
      exit 0
    }
  }
}

function Try-OpenAppId([string]$appId, [string]$label) {
  try {
    $appsFolder = (New-Object -ComObject Shell.Application).Namespace('shell:AppsFolder')
    $appItem = $appsFolder.ParseName($appId)
    if ($appItem) {
      $appItem.InvokeVerb('open')
      Write-Output "Opened app id: $label"
      exit 0
    }
  } catch {}

  try {
    Start-Process -FilePath "explorer.exe" -ArgumentList "shell:AppsFolder\\$appId"
    Write-Output "Opened app id through Explorer: $label"
    exit 0
  } catch {}
}

function Read-UninstallApps {
  $roots = @(
    'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
    'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
    'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
  )

  foreach ($root in $roots) {
    Get-ItemProperty $root -ErrorAction SilentlyContinue |
      Where-Object { $_.DisplayName } |
      ForEach-Object {
        [PSCustomObject]@{
          Name = [string]$_.DisplayName
          InstallLocation = [string]$_.InstallLocation
          DisplayIcon = [string]$_.DisplayIcon
        }
      }
  }
}

foreach ($candidate in $candidates) {
  try {
    Start-Process -FilePath $candidate
    Write-Output "Opened directly: $candidate"
    exit 0
  } catch {}

  Try-OpenCommand $candidate
}

$normalizedCandidates = $candidates | ForEach-Object { Normalize-Name $_ }

Try-OpenStartMenuShortcut

$startApp = Get-StartApps -ErrorAction SilentlyContinue |
  Where-Object {
    $appName = Normalize-Name $_.Name
    ($normalizedCandidates | Where-Object { $appName -eq $_ -or $appName.Contains($_) -or $_.Contains($appName) })
  } |
  Sort-Object @{ Expression = { $_.Name.Length } } |
  Select-Object -First 1

if ($startApp) {
  Try-OpenAppId $startApp.AppID $startApp.Name
}

$registeredApp = Read-UninstallApps |
  Where-Object {
    $displayName = Normalize-Name $_.Name
    ($normalizedCandidates | Where-Object { $displayName -eq $_ -or $displayName.Contains($_) })
  } |
  Sort-Object @{ Expression = { $_.Name.Length } } |
  Select-Object -First 1

if ($registeredApp) {
  if ($registeredApp.DisplayIcon) {
    $iconPath = ($registeredApp.DisplayIcon -replace '^"', '' -replace '"$', '') -replace ',\\d+$', ''
    Try-OpenPath $iconPath "registered app"
  }

  if ($registeredApp.InstallLocation -and (Test-Path -LiteralPath $registeredApp.InstallLocation)) {
    $exe = Get-ChildItem -LiteralPath $registeredApp.InstallLocation -Filter '*.exe' -File -Recurse -Depth 3 -ErrorAction SilentlyContinue |
      Where-Object { -not (Is-BadExecutable $_.FullName) } |
      Sort-Object @{ Expression = { if ((Normalize-Name $_.BaseName) -in $normalizedCandidates) { 0 } else { 1 } } }, Length |
      Select-Object -First 1
    if ($exe) {
      Start-Process -FilePath $exe.FullName
      Write-Output "Opened registered install: $($exe.FullName)"
      exit 0
    }
  }
}

$searchRoots = @(
  "$env:LOCALAPPDATA\\Microsoft\\WindowsApps",
  "$env:LOCALAPPDATA\\Programs",
  "$env:ProgramFiles",
  "\${env:ProgramFiles(x86)}"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

foreach ($root in $searchRoots) {
  $match = Get-ChildItem -LiteralPath $root -Filter '*.exe' -File -Recurse -Depth 4 -ErrorAction SilentlyContinue |
    Where-Object {
      $file = Normalize-Name $_.BaseName
      -not (Is-BadExecutable $_.FullName) -and
      (($normalizedCandidates | Where-Object {
        $base = Normalize-Name $_
        $file -eq $base -or $file.Contains($base)
      }))
    } |
    Sort-Object @{ Expression = { $_.FullName.Length } } |
    Select-Object -First 1

  if ($match) {
    Start-Process -FilePath $match.FullName
    Write-Output "Opened discovered executable: $($match.FullName)"
    exit 0
  }
}

Write-Error "Could not find application '$query'. Try the full application name."
exit 1
`.trim()
}

async function openWindowsApp(appName: string): Promise<OpenAppResult> {
  const candidates = uniqueCandidates(appName, WINDOWS_APP_ALIASES)

  const shortcutResult = await tryOpenWindowsShortcut(candidates)
  if (shortcutResult) return shortcutResult

  const script = createWindowsScript(appName, candidates)
  const encodedScript = Buffer.from(script, 'utf16le').toString('base64')

  try {
    const { stdout } = await runCommand('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-EncodedCommand',
      encodedScript
    ])
    return { success: true, output: stdout || `Opened ${appName}` }
  } catch (err: any) {
    return {
      success: false,
      output: `Could not open "${appName}" on Windows. ${err.message || err}`
    }
  }
}

async function tryOpenMacAppByName(candidate: string): Promise<OpenAppResult | null> {
  try {
    await runCommand('/usr/bin/open', ['-a', candidate])
    return { success: true, output: `Opened application: ${candidate}` }
  } catch {
    return null
  }
}

async function findMacAppPath(appName: string, candidates: string[]): Promise<string | null> {
  const env = {
    ...process.env,
    LUNA_APP_QUERY: appName,
    LUNA_APP_CANDIDATES: candidates.join('\n')
  }

  const script = `
set -euo pipefail
normalize() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g'
}

query_norm="$(normalize "$LUNA_APP_QUERY")"
candidate_file="$(mktemp)"
printf '%s\\n' "$LUNA_APP_CANDIDATES" | while IFS= read -r line; do
  [ -n "$line" ] && normalize "$line"
done > "$candidate_file"

search_roots=("/Applications" "$HOME/Applications" "/System/Applications")

if command -v mdfind >/dev/null 2>&1; then
  while IFS= read -r app; do
    [ -d "$app" ] || continue
    base="$(basename "$app" .app)"
    base_norm="$(normalize "$base")"
    if grep -qx "$base_norm" "$candidate_file" || [[ "$base_norm" == *"$query_norm"* ]] || [[ "$query_norm" == *"$base_norm"* ]]; then
      rm -f "$candidate_file"
      printf '%s' "$app"
      exit 0
    fi
  done < <(mdfind 'kMDItemContentType == "com.apple.application-bundle"' 2>/dev/null)
fi

for root in "\${search_roots[@]}"; do
  [ -d "$root" ] || continue
  while IFS= read -r app; do
    base="$(basename "$app" .app)"
    base_norm="$(normalize "$base")"
    if grep -qx "$base_norm" "$candidate_file" || [[ "$base_norm" == *"$query_norm"* ]] || [[ "$query_norm" == *"$base_norm"* ]]; then
      rm -f "$candidate_file"
      printf '%s' "$app"
      exit 0
    fi
  done < <(find "$root" -maxdepth 3 -name "*.app" -type d 2>/dev/null)
done

rm -f "$candidate_file"
exit 1
`.trim()

  try {
    const { stdout } = await runCommand('/bin/bash', ['-lc', script], { env })
    return stdout || null
  } catch {
    return null
  }
}

async function openMacApp(appName: string): Promise<OpenAppResult> {
  const candidates = uniqueCandidates(appName, MAC_APP_ALIASES)

  for (const candidate of candidates) {
    const result = await tryOpenMacAppByName(candidate)
    if (result) return result
  }

  const appPath = await findMacAppPath(appName, candidates)
  if (appPath) {
    try {
      await runCommand('/usr/bin/open', [appPath])
      return { success: true, output: `Opened discovered application: ${appPath}` }
    } catch (err: any) {
      return {
        success: false,
        output: `Found "${appName}" at ${appPath}, but macOS could not open it. ${err.message || err}`
      }
    }
  }

  return {
    success: false,
    output: `Could not find "${appName}" on macOS. Try the full application name.`
  }
}

/**
 * Opens desktop applications by name on Windows and macOS.
 *
 * Windows strategy:
 * 1. Direct process/command lookup.
 * 2. Start Menu app lookup, including Microsoft Store apps.
 * 3. Installed-app registry lookup.
 * 4. Bounded executable search in common install directories.
 *
 * macOS strategy:
 * 1. `open -a` with the requested name and known aliases.
 * 2. Spotlight application-bundle lookup.
 * 3. Bounded `.app` search in common Applications directories.
 */
export async function openApp(appName: string): Promise<OpenAppResult> {
  if (!appName || !appName.trim()) {
    return { success: false, output: 'App name is required' }
  }

  const name = appName.trim()
  console.log(`[skills] Opening application: "${name}" on ${process.platform}`)

  if (process.platform === 'win32') {
    return openWindowsApp(name)
  }

  if (process.platform === 'darwin') {
    return openMacApp(name)
  }

  return {
    success: false,
    output: `Opening desktop applications is only supported on Windows and macOS. Current platform: ${process.platform}`
  }
}
