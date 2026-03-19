import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'node:path'
import { spawn, exec } from 'node:child_process'
import fs from 'node:fs'
import dgram from 'node:dgram'

import https from 'node:https'
import updateManager from './update-manager'
import keyAuth from './keyauth'

// API Configuration
const API_BASE_URL = 'https://api.nexus-mod.com'

const downloadFile = (url: string, dest: string, onProgress?: (info: { downloaded: number; total: number; speed: number; percent: number }) => void): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest)
        file.on('error', (err) => {
            console.error(`[Download] Stream error for ${dest}:`, err.message)
            file.close()
            fs.unlink(dest, () => { })
            reject(err)
        })
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlink(dest, () => { })
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`))
                return
            }
            const total = parseInt(response.headers['content-length'] || '0', 10)
            let downloaded = 0
            let lastBytes = 0
            let lastTime = Date.now()

            response.on('data', (chunk: Buffer) => {
                downloaded += chunk.length
                const now = Date.now()
                const elapsedSec = (now - lastTime) / 1000
                if (onProgress && elapsedSec >= 0.4) {
                    const speed = (downloaded - lastBytes) / elapsedSec
                    const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0
                    onProgress({ downloaded, total, speed, percent })
                    lastBytes = downloaded
                    lastTime = now
                }
            })

            response.pipe(file)
            file.on('finish', () => {
                if (onProgress && total > 0) {
                    onProgress({ downloaded: total, total, speed: 0, percent: 100 })
                }
                file.close(() => resolve(true))
            })
        }).on('error', (err) => {
            console.error(`[Download] Error downloading ${url}:`, err.message)
            fs.unlink(dest, () => { })
            reject(err)
        })
    })
}

const DIST = path.join(__dirname, '../dist')
process.env.DIST = DIST
process.env.VITE_PUBLIC = app.isPackaged ? DIST : path.join(DIST, '../public')

let win: BrowserWindow | null = null

function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 650,
        frame: false,
        resizable: false,
        icon: path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, '..'), 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        backgroundColor: '#0F0C18'
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(DIST, 'index.html'))
    }

    // Prevent reload shortcuts (Ctrl/Cmd+R, Ctrl+Shift+R, F5) from reloading the renderer
    // This avoids accidental refreshes when the user presses Ctrl+R.
    win.webContents.on('before-input-event', (_event, input) => {
        try {
            const key = (input.key || '').toString().toLowerCase()
            const ctrlOrCmd = !!(input.control || input.meta)
            // Block Ctrl/Cmd+R and F5
            if ((ctrlOrCmd && key === 'r') || key === 'f5') {
                _event.preventDefault()
            }
        } catch (e) { /* ignore */ }
    })
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// ============ BASE SYNC SYSTEM ============
// Smart copy: only updates missing or newer files, never overwrites user data
function getBaseDir(): string {
    if (app.isPackaged) {
        return path.join(process.resourcesPath, 'base')
    }
    const possiblePaths = [
        path.join(__dirname, '../../base'),
        path.join(app.getAppPath(), '../base'),
        path.join(process.cwd(), 'base'),
        'C:/Users/Nox/Desktop/yim/base'
    ]
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return p
    }
    return possiblePaths[0]
}

function syncDirectoryRecursive(srcDir: string, destDir: string, report?: (msg: string) => void): { copied: number, skipped: number, updated: number } {
    const stats = { copied: 0, skipped: 0, updated: 0 }
    if (!fs.existsSync(srcDir)) return stats
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

    const entries = fs.readdirSync(srcDir, { withFileTypes: true })
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name)
        const destPath = path.join(destDir, entry.name)
        if (entry.isDirectory()) {
            const sub = syncDirectoryRecursive(srcPath, destPath, report)
            stats.copied += sub.copied; stats.skipped += sub.skipped; stats.updated += sub.updated
        } else if (entry.isFile()) {
            const skip = ['.obj', '.pdb', '.ilk', '.exp', '.lib', 'CMakeCache.txt', '.tlog', '.log', '.recipe']
            if (skip.some(p => entry.name.endsWith(p))) { stats.skipped++; continue }

            if (!fs.existsSync(destPath)) {
                fs.copyFileSync(srcPath, destPath)
                stats.copied++
                if (report) report(`Copying: ${entry.name}`)
            } else {
                const srcStat = fs.statSync(srcPath)
                const destStat = fs.statSync(destPath)
                if (srcStat.mtimeMs > destStat.mtimeMs) {
                    fs.copyFileSync(srcPath, destPath)
                    stats.updated++
                    if (report) report(`Updating: ${entry.name}`)
                } else stats.skipped++
            }
        }
    }
    return stats
}

function performBaseSync(report?: (msg: string) => void) {
    const baseDir = getBaseDir()
    const nexusDir = path.join(app.getPath('documents'), 'Nexus')
    const foldersToSync = ['logo_frames', 'Fonts', 'Outfits']
    const filesToSync = ['500x500_logo.png', '500x500_logo.mp4', 'background.jpg']

    for (const f of foldersToSync) {
        const src = path.join(baseDir, f)
        const dest = path.join(nexusDir, f)
        if (fs.existsSync(src)) syncDirectoryRecursive(src, dest, report)
    }
    for (const f of filesToSync) {
        const src = path.join(baseDir, f)
        const dest = path.join(nexusDir, f)
        if (fs.existsSync(src) && (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs)) {
            fs.copyFileSync(src, dest)
        }
    }
}

// NexusService removed (Clean & Sober)

async function syncFromAPI(event?: any): Promise<{ success: boolean }> {
    const report = (status: string) => {
        if (event) event.sender.send('sync-progress', status)
        else if (win) win.webContents.send('sync-progress', status)
        console.log(`[Sync] ${status}`)
    }
    const nexusDir = path.join(app.getPath('documents'), 'Nexus')
    if (!fs.existsSync(nexusDir)) fs.mkdirSync(nexusDir, { recursive: true })

    try {
        const framesDir = path.join(nexusDir, 'logo_frames')

        // Ensure folder exists even if empty
        if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true })

        const zipDest = path.join(nexusDir, 'logo_frames.zip')
        if (fs.readdirSync(framesDir).length < 10) { // Reduced check count
            report('Updating assets (ZIP)...')
            try {
                // Silently skip if server returns 404 or other non-critical errors
                const response = await new Promise<boolean>((resolve) => {
                    const file = fs.createWriteStream(zipDest)
                    file.on('error', (err) => {
                        console.warn('[Sync] Could not write zip:', err.message)
                        file.close()
                        fs.unlink(zipDest, () => { })
                        resolve(false)
                    })
                    const request = https.get(`${API_BASE_URL}/api/files/logo_frames.zip`, (res) => {
                        if (res.statusCode === 404) {
                            file.close()
                            fs.unlink(zipDest, () => { })
                            resolve(false) // 404 is expected if assets not available
                            return
                        }
                        if (res.statusCode !== 200) {
                            file.close()
                            fs.unlink(zipDest, () => { })
                            resolve(false)
                            return
                        }
                        res.pipe(file)
                        file.on('finish', () => {
                            file.close()
                            resolve(true)
                        })
                    }).on('error', () => {
                        file.close()
                        fs.unlink(zipDest, () => { })
                        resolve(false)
                    })
                })

                if (response) {
                    report('Extracting...')
                    await new Promise<void>((resolve) => {
                        const ps = spawn('powershell.exe', ['-Command', `Expand-Archive -Path "${zipDest}" -DestinationPath "${nexusDir}" -Force`])
                        ps.on('close', () => {
                            try { fs.unlinkSync(zipDest) } catch (e) { }
                            resolve()
                        })
                        ps.on('error', () => resolve())
                    })
                } else {
                    // It's OK if assets aren't available - not critical
                }
            } catch (e) {
                console.warn('[Sync] Assets download skipped (non-critical):', (e as Error).message)
            }
        }

        // Asset sync (logo frames, etc)
        // Service ensures removed from here

        report('Sync complete')
        return { success: true }
    } catch (e) {
        console.error('[Sync] Fatal error:', e)
        report('Sync complete') // Fail gracefully
        return { success: true }
    }
}

app.whenReady().then(async () => {
    const isAdmin = await checkIsAdmin()
    console.log(`[Startup] Running as admin: ${isAdmin}`)

    createWindow()

    // One-time cleanup of residual service processes to unblock the PC
    try {
        const killCmd = `Stop-Process -Name "NexusService" -Force -ErrorAction SilentlyContinue; Get-Process -Name "RuntimeBroker" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Local\\Microsoft\\RuntimeBroker*" } | Stop-Process -Force -ErrorAction SilentlyContinue`
        exec(`powershell -NoProfile -Command "${killCmd}"`, () => {
            console.log('[Startup] Cleaned up residual processes.')
        })
    } catch (e) { }

    try {
        // Wait for renderer to be ready to receive IPC
        await new Promise(r => setTimeout(r, 1500))

        if (win) win.webContents.send('admin-status', isAdmin)

        const report = (msg: string) => {
            if (win) win.webContents.send('sync-progress', msg)
        }

        report('Initializing...')
        performBaseSync(report)
        await syncFromAPI()

        report('Sync complete')
        startProfileMonitor()

        // Vérifier les mises à jour après le démarrage
        setTimeout(async () => {
            try {
                console.log('[UPDATE] Checking for updates...')
                const updateInfo = await updateManager.checkForUpdates()
                
                if (updateInfo && updateInfo.hasUpdate) {
                    console.log(`[UPDATE] New version available: ${updateInfo.newVersion}`)
                    
                    // Afficher la dialog de mise à jour
                    const shouldDownload = await updateManager.showUpdateDialog(updateInfo)
                    
                    if (shouldDownload) {
                        await updateManager.downloadAndInstallUpdate(
                            updateInfo.downloadUrl,
                            updateInfo.newVersion,
                            updateInfo.fileName
                        )
                    }
                } else {
                    console.log('[UPDATE] No updates available')
                }
            } catch (e) {
                console.error('[UPDATE] Error checking for updates:', e)
            }
        }, 5000) // Vérifier 5 secondes après le démarrage
    } catch (e) {
        console.error('[Startup] Sync error:', e)
        const report = (msg: string) => { if (win) win.webContents.send('sync-progress', msg) }
        report('Sync complete')
    }
})

ipcMain.on('window-controls', (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (action === 'minimize') win.minimize()
    if (action === 'close') win.close()
})

ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url)
})

ipcMain.handle('open-folder', async (event, folderPath: string) => {
    if (!folderPath) return { success: false, error: 'No path provided' }
    try {
        const result = await shell.openPath(folderPath)
        return { success: result === '', error: result || undefined }
    } catch (e) {
        return { success: false, error: (e as Error).message }
    }
})

ipcMain.handle('get-gta-path', async () => {
    const drives = 'BCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const commonFolders = [
        'Grand Theft Auto V Enhanced',
        'Grand Theft Auto V',
        'SteamLibrary/steamapps/common/Grand Theft Auto V',
        'SteamLibrary/steamapps/common/Grand Theft Auto V Enhanced',
        'Epic Games/GTAV',
        'Program Files/Rockstar Games/Grand Theft Auto V Enhanced',
        'Program Files/Rockstar Games/Grand Theft Auto V',
        'Program Files (x86)/Steam/steamapps/common/Grand Theft Auto V',
        'Program Files (x86)/Steam/steamapps/common/Grand Theft Auto V Enhanced',
        'Games/Grand Theft Auto V'
    ]

    let foundEnhanced = ''
    let foundLegacy = ''

    // 1. High priority check
    for (const drive of ['C', 'D', 'E']) {
        for (const folder of commonFolders) {
            const p = path.join(`${drive}:/`, folder)
            try {
                if (fs.existsSync(path.join(p, 'GTA5.exe')) || fs.existsSync(path.join(p, 'GTA5_Enhanced.exe'))) {
                    if (folder.toLowerCase().includes('enhanced') && !foundEnhanced) {
                        foundEnhanced = p
                    } else if (!foundLegacy) {
                        foundLegacy = p
                    }
                }
            } catch (e) { }
            if (foundEnhanced && foundLegacy) break
        }
        if (foundEnhanced && foundLegacy) break
    }

    // 2. Comprehensive Drive Scan if not both found
    if (!foundEnhanced || !foundLegacy) {
        for (const drive of drives) {
            const root = `${drive}:/`
            try {
                if (!fs.existsSync(root)) continue
                const items = fs.readdirSync(root)
                for (const item of items) {
                    const fullPath = path.join(root, item)
                    const isDir = fs.lstatSync(fullPath).isDirectory()
                    if (!isDir) continue

                    if (item.toLowerCase().includes('gta') || item.toLowerCase().includes('grand theft auto')) {
                        if (fs.existsSync(path.join(fullPath, 'GTA5.exe')) || fs.existsSync(path.join(fullPath, 'GTA5_Enhanced.exe'))) {
                            if (item.toLowerCase().includes('enhanced') && !foundEnhanced) {
                                foundEnhanced = fullPath
                            } else if (!foundLegacy) {
                                foundLegacy = fullPath
                            }
                        }
                    }
                    if (foundEnhanced && foundLegacy) break
                }
            } catch (e) { }
            if (foundEnhanced && foundLegacy) break
        }
    }

    return { enhanced: foundEnhanced, legacy: foundLegacy }
})

// Imports handled at top of file
// ...
ipcMain.handle('check-game-running', async () => {
    return new Promise((resolve) => {
        // Check for process AND visible window to avoid early injection errors
        exec('powershell -NoProfile -Command "Get-Process | Where-Object { $_.Name -match \'GTA5\' -and $_.MainWindowTitle } | Select-Object -ExpandProperty Name"', (err, stdout) => {
            const out = stdout.toString().toLowerCase().trim()
            const isRunning = out.includes('gta5')
            if (isRunning) console.log(`GTA V Window Detected: ${out}`)
            resolve(isRunning)
        })
    })
})

ipcMain.handle('launch-game-only', async (event, { path: gtaPath, store }) => {
    try {
        console.log(`[Launch] Attempting to launch without BattlEye: ${gtaPath} (Store: ${store})`)

        const args = ['-nobattleye']
        const playGta = path.join(gtaPath, 'PlayGTAV.exe')
        const launcherExe = path.join(gtaPath, 'GTAVLauncher.exe')

        if (fs.existsSync(playGta)) {
            console.log(`[Launch] Spawning PlayGTAV.exe with -nobattleye`)
            spawn(playGta, args, { detached: true, stdio: 'ignore' }).unref()
            return { success: true }
        } else if (fs.existsSync(launcherExe)) {
            console.log(`[Launch] Spawning GTAVLauncher.exe with -nobattleye`)
            spawn(launcherExe, args, { detached: true, stdio: 'ignore' }).unref()
            return { success: true }
        }

        // Fallback to store-specific URI if it's NOT a custom "Enhanced" path 
        // Or if we specifically want the store behavior
        if (store === 'Steam' && !gtaPath.toLowerCase().includes('enhanced')) {
            // Steam URL with args (using // separator)
            await shell.openExternal('steam://run/271590//-nobattleye')
            return { success: true }
        } else if (store === 'Epic Games' && !gtaPath.toLowerCase().includes('enhanced')) {
            await shell.openExternal('com.epicgames.launcher://apps/9d2d0eb405ad4227ae03dc9cf756D8C8?action=launch&silent=true')
            return { success: true }
        }

        // Final fallback: try direct exe (might still cause ERR_NO_LAUNCHER but last resort)
        const enhancedExe = path.join(gtaPath, 'GTA5_Enhanced.exe')
        const directExe = path.join(gtaPath, 'GTA5.exe')

        if (fs.existsSync(enhancedExe)) {
            spawn(enhancedExe, args, { detached: true, stdio: 'ignore' }).unref()
        } else if (fs.existsSync(directExe)) {
            spawn(directExe, args, { detached: true, stdio: 'ignore' }).unref()
        } else {
            return { success: false, error: 'No executable found in game folder' }
        }

        return { success: true }
    } catch (e) {
        return { success: false, error: 'Could not trigger launcher' }
    }
})

// Embedded injector script (LoadLibraryA injection via CreateRemoteThread)
const INJECTOR_PS1 = `
param (
    [string]$ProcessName,
    [string]$DllPath
)

$code = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class Injector {
    [DllImport("kernel32.dll")]
    public static extern IntPtr OpenProcess(int dwDesiredAccess, bool bInheritHandle, int dwProcessId);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr GetModuleHandle(string lpModuleName);

    [DllImport("kernel32", CharSet = CharSet.Ansi, ExactSpelling = true, SetLastError = true)]
    public static extern IntPtr GetProcAddress(IntPtr hModule, string procName);

    [DllImport("kernel32.dll", SetLastError = true, ExactSpelling = true)]
    public static extern IntPtr VirtualAllocEx(IntPtr hProcess, IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool WriteProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress, byte[] lpBuffer, uint nSize, out IntPtr lpNumberOfBytesWritten);

    [DllImport("kernel32.dll")]
    public static extern IntPtr CreateRemoteThread(IntPtr hProcess, IntPtr lpThreadAttributes, uint dwStackSize, IntPtr lpStartAddress, IntPtr lpParameter, uint dwCreationFlags, IntPtr lpThreadId);

    [DllImport("kernel32.dll")]
    public static extern bool CloseHandle(IntPtr hObject);

    const int PROCESS_CREATE_THREAD = 0x0002;
    const int PROCESS_QUERY_INFORMATION = 0x0400;
    const int PROCESS_VM_OPERATION = 0x0008;
    const int PROCESS_VM_WRITE = 0x0020;
    const int PROCESS_VM_READ = 0x0010;

    const uint MEM_COMMIT = 0x00001000;
    const uint MEM_RESERVE = 0x00002000;
    const uint PAGE_READWRITE = 0x04;

    public static void Inject(int processId, string dllPath) {
        IntPtr hProcess = OpenProcess(PROCESS_CREATE_THREAD | PROCESS_QUERY_INFORMATION | PROCESS_VM_OPERATION | PROCESS_VM_WRITE | PROCESS_VM_READ, false, processId);
        if (hProcess == IntPtr.Zero) throw new Exception("Could not open process.");

        IntPtr loadLibraryAddr = GetProcAddress(GetModuleHandle("kernel32.dll"), "LoadLibraryA");
        if (loadLibraryAddr == IntPtr.Zero) { CloseHandle(hProcess); throw new Exception("Could not find LoadLibraryA."); }

        uint size = (uint)((dllPath.Length + 1) * Marshal.SizeOf(typeof(char)));
        IntPtr allocMemAddress = VirtualAllocEx(hProcess, IntPtr.Zero, size, MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
        if (allocMemAddress == IntPtr.Zero) { CloseHandle(hProcess); throw new Exception("Could not allocate memory."); }

        byte[] bytes = Encoding.Default.GetBytes(dllPath);
        IntPtr bytesWritten;
        WriteProcessMemory(hProcess, allocMemAddress, bytes, (uint)bytes.Length, out bytesWritten);

        IntPtr hThread = CreateRemoteThread(hProcess, IntPtr.Zero, 0, loadLibraryAddr, allocMemAddress, 0, IntPtr.Zero);
        if (hThread == IntPtr.Zero) { CloseHandle(hProcess); throw new Exception("Could not create remote thread."); }

        CloseHandle(hThread);
        CloseHandle(hProcess);
    }
}
"@

Add-Type -TypeDefinition $code

try {
    $proc = Get-Process -Name $ProcessName -ErrorAction Stop
    [Injector]::Inject($proc.Id, $DllPath)
    Write-Host "Injection successful."
} catch {
    Write-Error "Error: $_"
    exit 1
}
`

ipcMain.handle('inject-menu', async (event) => {
    // 1. Detect exactly which process is running
    let processName = ''
    try {
        const check = await new Promise<string>((resolve) => {
            exec('tasklist /NH /FO CSV', (err, stdout) => {
                resolve(stdout.toString().toLowerCase())
            })
        })
        if (check.includes('"gta5_enhanced.exe"')) processName = 'GTA5_Enhanced'
        else if (check.includes('"gta5.exe"')) processName = 'GTA5'
    } catch (e) {
        return { success: false, error: 'Process detection failed' }
    }

    if (!processName) return { success: false, error: 'Game not found' }

    // 2. CHECK IF ALREADY INJECTED (Prevent double injection)
    try {
        const isLoaded = await new Promise<boolean>((resolve) => {
            exec(`tasklist /m NexusV2.dll /FI "IMAGENAME eq ${processName}.exe"`, (err, stdout) => {
                resolve(stdout.toString().includes('NexusV2.dll'))
            })
        })
        if (isLoaded) {
            return { success: false, error: 'Menu already active in game' }
        }
    } catch (e) { }

    console.log(`Injecting into: ${processName}`)

    // 3. DLL Path (Documents/Nexus)
    const nexusDir = path.join(app.getPath('documents'), 'Nexus')
    const dllPath = path.join(nexusDir, 'NexusV2.dll')
    const report = (status: string) => event.sender.send('launch-progress', status)

    if (!fs.existsSync(dllPath)) {
        return { success: false, error: 'NexusV2.dll not found — update files first' }
    }

    report('Injecting...')

    // 4. Write embedded injector to temp file and run
    const tempDir = app.getPath('temp')
    const injectorPath = path.join(tempDir, 'nexus_injector.ps1')
    fs.writeFileSync(injectorPath, INJECTOR_PS1)

    console.log(`Using embedded injector at: ${injectorPath}`)

    return new Promise((resolve) => {
        const ps = spawn('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', injectorPath,
            processName,
            dllPath
        ])

        ps.stdout.on('data', (data) => console.log(`Injector: ${data}`))
        ps.stderr.on('data', (data) => console.error(`Injector Error: ${data}`))

        ps.on('close', (code) => {
            console.log(`Injector exited with code: ${code}`)
            // Cleanup temp file
            try { fs.unlinkSync(injectorPath) } catch (e) { }
            resolve({ success: code === 0 })
        })
    })
})

ipcMain.handle('manage-fsl', async (event, { gamePath, action }) => {
    // action: 'install' | 'remove'
    if (!gamePath) return { success: false, error: 'No game path provided' }

    const sourceDir = path.join(app.getPath('documents'), 'Nexus')
    const sourcePath = path.join(sourceDir, 'winmm.dll')
    const destPath = path.join(gamePath, 'winmm.dll')

    console.log(`[FSL] Action: ${action} | Source: ${sourcePath} | Dest: ${destPath}`)
    console.log(`[FSL] Source exists: ${fs.existsSync(sourcePath)}`)
    console.log(`[FSL] Game dir exists: ${fs.existsSync(gamePath)}`)

    try {
        if (action === 'remove') {
            if (fs.existsSync(destPath)) {
                // Try direct first, fallback to elevated
                try {
                    fs.unlinkSync(destPath)
                } catch (e) {
                    console.log('[FSL] Direct delete failed, trying elevated...')
                    await runElevated(`Remove-Item -Force '${destPath}'`)
                }
                console.log('[FSL] Removed winmm.dll from game folder')
            }
            return { success: true }
        }

        if (action === 'install') {
            if (!fs.existsSync(sourcePath)) {
                console.error('[FSL] Source winmm.dll not found at:', sourcePath)
                return { success: false, error: 'winmm.dll missing in Nexus folder' }
            }

            // Try direct copy first, fallback to elevated PowerShell
            try {
                fs.copyFileSync(sourcePath, destPath)
                console.log('[FSL] Installed winmm.dll (direct copy)')
            } catch (e) {
                console.log('[FSL] Direct copy failed, trying elevated...')
                await runElevated(`Copy-Item -Force '${sourcePath}' '${destPath}'`)
                console.log('[FSL] Installed winmm.dll (elevated copy)')
            }
            return { success: true }
        }
    } catch (e) {
        const msg = (e as Error).message
        console.error('[FSL] ERROR:', msg)
        return { success: false, error: msg }
    }
    return { success: false, error: 'Invalid action' }
})

ipcMain.handle('check-fsl', async (_event, { gamePath }) => {
    if (!gamePath) return { exists: false }
    const destPath = path.join(gamePath, 'winmm.dll')
    return { exists: fs.existsSync(destPath) }
})

function runElevated(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const ps = spawn('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command',
            `Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command',"${command.replace(/"/g, '`"')}" -Verb RunAs -Wait`
        ])
        ps.on('close', (code) => {
            if (code === 0) resolve()
            else reject(new Error(`Elevated command exited with code ${code}`))
        })
        ps.on('error', reject)
    })
}

const API_URL = 'https://api.nexus-mod.com'

ipcMain.handle('update-files', async (event) => {
    const report = (status: string) => event.sender.send('launch-progress', status)
    try {
        const nexusDir = path.join(app.getPath('documents'), 'Nexus')
        if (!fs.existsSync(nexusDir)) fs.mkdirSync(nexusDir, { recursive: true })

        const nexusConfigDir = path.join(app.getPath('appData'), 'Nexus')
        const cacheDir = path.join(nexusConfigDir, 'cache')
        if (fs.existsSync(cacheDir)) {
            report('Clearing cache...')
            try { fs.rmSync(cacheDir, { recursive: true, force: true }) } catch (e) { }
        }

        const filesToDownload = ['winmm.dll', 'NexusV2.dll']
        for (const fileName of filesToDownload) {
            const dest = path.join(nexusDir, fileName)

            // Stratégie : utiliser un nom de fichier temporaire pour éviter EBUSY
            const tempFileName = fileName.replace('.dll', '_new.dll')
            const tempDest = path.join(nexusDir, tempFileName)

            report(`Downloading ${fileName}...`)
            try {
                // Télécharger dans le fichier temporaire
                await downloadFile(`${API_URL}/api/files/${fileName}`, tempDest)

                // Si le fichier original existe, essayer de le supprimer
                if (fs.existsSync(dest)) {
                    try {
                        fs.unlinkSync(dest)
                    } catch (e) {
                        // Si le fichier est verrouillé (EBUSY), on essaie de tuer les processus GTA
                        if ((e as NodeJS.ErrnoException).code === 'EBUSY') {
                            console.log(`[Update] File ${fileName} is locked, trying to kill GTA processes...`)
                            try {
                                // Tuer tous les processus GTA de manière plus agressive
                                exec('taskkill /F /IM GTA5.exe /T', () => { })
                                exec('taskkill /F /IM GTA5_Enhanced.exe /T', () => { })
                                exec('taskkill /F /IM PlayGTAV.exe /T', () => { })
                                exec('taskkill /F /IM GTAVLauncher.exe /T', () => { })

                                // Attendre plus longtemps que les processus se terminent
                                console.log(`[Update] Waiting for processes to terminate...`)
                                await new Promise(resolve => setTimeout(resolve, 3000))

                                // Vérifier si les processus sont bien terminés
                                const processesStillRunning = await new Promise<string>((resolve) => {
                                    exec('tasklist /FI "IMAGENAME eq GTA5.exe" /FO CSV', (err, stdout) => {
                                        resolve(stdout.toString())
                                    })
                                })

                                if (processesStillRunning.includes('GTA5.exe')) {
                                    console.log(`[Update] GTA5 still running, waiting more...`)
                                    await new Promise(resolve => setTimeout(resolve, 2000))
                                }

                                // Réessayer la suppression
                                try {
                                    fs.unlinkSync(dest)
                                    console.log(`[Update] Successfully deleted ${fileName}`)
                                } catch (e2) {
                                    // Si toujours verrouillé, demande l'élévation
                                    console.log(`[Update] Still locked, requesting elevation for ${fileName}`)
                                    await runElevated(`Remove-Item -Force "${dest}"`)
                                }
                            } catch (e3) {
                                // Si même l'élévation échoue, on continue avec le fichier existant
                                console.log(`[Update] Could not replace ${fileName}, keeping existing version`)
                                try { fs.unlinkSync(tempDest) } catch (ex) { }
                                continue
                            }
                        } else {
                            // Si erreur différente de EBUSY, on demande l'élévation
                            console.log(`[Update] Need elevation to delete ${fileName}`)
                            await runElevated(`Remove-Item -Force "${dest}"`)
                        }
                    }
                }

                // Renommer le fichier temporaire en fichier final
                if (fs.existsSync(tempDest)) {
                    fs.renameSync(tempDest, dest)
                    console.log(`[Update] Successfully updated ${fileName}`)
                }
            } catch (e) {
                console.log(`[Update] Download failed, trying elevated: ${fileName}`)
                // Téléchargement avec élévation si échec
                try {
                    await downloadFile(`${API_URL}/api/files/${fileName}`, tempDest)
                    await runElevated(`Copy-Item -Force "${tempDest}" "${dest}"`)
                    try { fs.unlinkSync(tempDest) } catch (ex) { }
                } catch (e2) {
                    console.log(`[Update] Elevated download also failed for ${fileName}`)
                }
            }
        }

        report('Files up to date')
        return { success: true }
    } catch (e) {
        console.error('[Update] Error:', (e as Error).message)
        return { success: false, error: (e as Error).message }
    }
})

ipcMain.handle('request-admin', async () => {
    const exePath = app.getPath('exe')
    const args = process.argv.slice(1).map(a => `"${a}"`).join(',')

    // Use powershell to relaunch elevated
    const command = `Start-Process "${exePath}" -ArgumentList ${args || "''"} -Verb RunAs`

    spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command])

    setTimeout(() => {
        app.quit()
    }, 500)

    return { success: true }
})

ipcMain.handle('check-mod-active', async () => {
    return new Promise((resolve) => {
        exec('tasklist /m NexusV2.dll', (err, stdout) => {
            const isLoaded = stdout.toString().includes('NexusV2.dll')
            resolve(isLoaded)
        })
    })
})

ipcMain.handle('get-mod-logs', async () => {
    try {
        const logPath = path.join(app.getPath('appData'), 'NexusV2', 'cout.log')
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf-8')
            return content.split('\n').slice(-100).join('\n') // Last 100 lines
        }
        return ''
    } catch (e) {
        return ''
    }
})

// Handler pour vérifier les mises à jour manuellement
ipcMain.handle('check-for-updates', async () => {
    try {
        console.log('[UPDATE] Manual update check requested')
        const updateInfo = await updateManager.checkForUpdates()
        
        if (!updateInfo) {
            return { success: false, error: 'Unable to check for updates' }
        }
        
        return { success: true, updateInfo }
    } catch (e) {
        console.error('[UPDATE] Error checking for updates:', e)
        return { success: false, error: (e as Error).message }
    }
})

// Handler pour télécharger et installer une mise à jour
ipcMain.handle('download-update', async (event, { downloadUrl, version, fileName }) => {
    try {
        console.log(`[UPDATE] Downloading update: ${version}`)
        const success = await updateManager.downloadAndInstallUpdate(downloadUrl, version, fileName)
        return { success }
    } catch (e) {
        console.error('[UPDATE] Error downloading update:', e)
        return { success: false, error: (e as Error).message }
    }
})
})




// ============ KEYAUTH AUTHENTICATION SYSTEM ============

// ============ KEYAUTH AUTHENTICATION SYSTEM ============

const tokenPath = path.join(app.getPath('userData'), 'auth.json')

interface AuthData {
    username: string;
    password?: string;
    rememberMe: boolean;
    sessionValid: boolean;
}

let memoryAuth: AuthData | null = null

function saveAuth(data: AuthData): void {
    memoryAuth = data
    try {
        const toSave: any = {
            username: data.username,
            rememberMe: data.rememberMe,
            sessionValid: data.sessionValid
        }
        if (data.rememberMe && data.password) {
            toSave.password = Buffer.from(data.password).toString('base64')
        }
        fs.writeFileSync(tokenPath, JSON.stringify(toSave))
    } catch (e) {
        console.error('[Auth] Save error:', e)
    }
}

function loadAuth(): AuthData | null {
    if (memoryAuth) return memoryAuth
    
    try {
        if (fs.existsSync(tokenPath)) {
            const data = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
            const auth: AuthData = {
                username: data.username,
                rememberMe: data.rememberMe || false,
                sessionValid: data.sessionValid || false
            }
            if (data.password) {
                auth.password = Buffer.from(data.password, 'base64').toString()
            }
            memoryAuth = auth
            return auth
        }
    } catch (e) {
        console.error('[Auth] Load error:', e)
    }
    return null
}

function clearAuth(): void {
    memoryAuth = null
    try {
        if (fs.existsSync(tokenPath)) {
            fs.unlinkSync(tokenPath)
        }
    } catch (e) {
        console.error('[Auth] Clear error:', e)
    }
    keyAuth.logout()
}

// Periodically check session
function startProfileMonitor(intervalMs = 60000) {
    const runCheck = async () => {
        const auth = loadAuth()
        if (!auth || !auth.sessionValid) return

        try {
            const isValid = await keyAuth.check()
            if (!isValid) {
                // Session expired, try to re-login if credentials saved
                if (auth.rememberMe && auth.password) {
                    const result = await keyAuth.login(auth.username, auth.password)
                    if (result.success) {
                        saveAuth({ ...auth, sessionValid: true })
                        if (win) win.webContents.send('profile-updated', auth.username)
                        return
                    }
                }
                
                // Session invalid and can't re-login
                clearAuth()
                if (win) win.webContents.send('force-logout')
            }
        } catch (e) {
            console.error('[Auth] Monitor error:', e)
        }
    }

    runCheck()
    setInterval(runCheck, intervalMs)
}

function checkIsAdmin(): Promise<boolean> {
    return new Promise((resolve) => {
        // En développement, on considère qu'on est admin pour éviter le warning
        if (!app.isPackaged) {
            resolve(true)
            return
        }

        // Méthode plus fiable pour détecter les droits admin
        exec('whoami /groups | find "S-1-16-12288"', (err, stdout) => {
            // S-1-16-12288 est le SID du groupe Administrators
            resolve(!err && stdout.length > 0)
        })
    })
}

ipcMain.handle('auth-login', async (event, { username, password, rememberMe }) => {
    try {
        console.log('[KeyAuth] Login attempt:', username)
        
        // Initialize KeyAuth if not already done
        await keyAuth.init()
        
        const result = await keyAuth.login(username, password)
        
        if (result.success && result.info) {
            saveAuth({
                username: result.info.username,
                password: rememberMe ? password : undefined,
                rememberMe: rememberMe || false,
                sessionValid: true
            })
            
            console.log('[KeyAuth] Login successful:', result.info.username)
            
            return {
                success: true,
                user: {
                    username: result.info.username,
                    subscriptions: result.info.subscriptions,
                    createdate: result.info.createdate,
                    lastlogin: result.info.lastlogin
                }
            }
        }
        
        console.error('[KeyAuth] Login failed:', result.message)
        return { success: false, error: result.message }
    } catch (e) {
        console.error('[KeyAuth] Login error:', e)
        return { success: false, error: (e as Error).message }
    }
})

ipcMain.handle('auth-register', async (event, { username, password, license }) => {
    try {
        console.log('[KeyAuth] Register attempt:', username)
        
        await keyAuth.init()
        
        const result = await keyAuth.register(username, password, license)
        
        if (result.success) {
            console.log('[KeyAuth] Registration successful')
            return { success: true, message: 'Account created successfully' }
        }
        
        console.error('[KeyAuth] Registration failed:', result.message)
        return { success: false, error: result.message }
    } catch (e) {
        console.error('[KeyAuth] Register error:', e)
        return { success: false, error: (e as Error).message }
    }
})

ipcMain.handle('auth-license', async (event, { license }) => {
    try {
        console.log('[KeyAuth] License login attempt')
        
        await keyAuth.init()
        
        const result = await keyAuth.license(license)
        
        if (result.success && result.info) {
            saveAuth({
                username: result.info.username,
                rememberMe: false,
                sessionValid: true
            })
            
            console.log('[KeyAuth] License login successful')
            
            return {
                success: true,
                user: {
                    username: result.info.username,
                    subscriptions: result.info.subscriptions
                }
            }
        }
        
        console.error('[KeyAuth] License login failed:', result.message)
        return { success: false, error: result.message }
    } catch (e) {
        console.error('[KeyAuth] License error:', e)
        return { success: false, error: (e as Error).message }
    }
})

ipcMain.handle('auth-upgrade', async (event, { username, license }) => {
    try {
        console.log('[KeyAuth] Upgrade attempt:', username)
        
        await keyAuth.init()
        
        const result = await keyAuth.upgrade(username, license)
        
        if (result.success) {
            console.log('[KeyAuth] Upgrade successful')
            return { success: true, message: 'License upgraded successfully' }
        }
        
        console.error('[KeyAuth] Upgrade failed:', result.message)
        return { success: false, error: result.message }
    } catch (e) {
        console.error('[KeyAuth] Upgrade error:', e)
        return { success: false, error: (e as Error).message }
    }
})

ipcMain.handle('auth-check', async () => {
    const auth = loadAuth()
    
    if (!auth || !auth.sessionValid) {
        return { loggedIn: false, savedCredentials: null }
    }

    // Try to validate session
    try {
        await keyAuth.init()
        const isValid = await keyAuth.check()
        
        if (isValid) {
            return {
                loggedIn: true,
                username: auth.username,
                savedCredentials: auth.rememberMe ? {
                    username: auth.username,
                    password: auth.password || ''
                } : null
            }
        }
        
        // Session expired, try auto-login if credentials saved
        if (auth.rememberMe && auth.password) {
            const result = await keyAuth.login(auth.username, auth.password)
            if (result.success && result.info) {
                saveAuth({ ...auth, sessionValid: true })
                return {
                    loggedIn: true,
                    username: result.info.username,
                    savedCredentials: {
                        username: auth.username,
                        password: auth.password
                    }
                }
            }
        }
        
        // Can't restore session
        clearAuth()
        return { loggedIn: false, savedCredentials: null }
    } catch (e) {
        console.error('[KeyAuth] Check error:', e)
        clearAuth()
        return { loggedIn: false, savedCredentials: null }
    }
})

ipcMain.handle('auth-logout', async () => {
    clearAuth()
    return { success: true }
})

// ============ ANIMATED LOGO FRAMES ============
ipcMain.handle('get-logo-frames', async () => {
    const framesDir = path.join(app.getPath('documents'), 'Nexus', 'logo_frames')
    try {
        if (!fs.existsSync(framesDir)) return { frames: [], count: 0 }

        const files = fs.readdirSync(framesDir)
            .filter(f => f.endsWith('.png'))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

        // Read frames in batches to avoid memory pressure
        const frames: string[] = []
        for (const file of files) {
            const data = fs.readFileSync(path.join(framesDir, file))
            frames.push(`data:image/png;base64,${data.toString('base64')}`)
        }

        return { frames, count: frames.length }
    } catch (e) {
        console.error('Failed to load logo frames:', e)
        return { frames: [], count: 0 }
    }
})

// ============ APP VERSION ============
ipcMain.handle('get-app-version', () => {
    return app.getVersion()
})

// ============ AUTO-UPDATE SYSTEM ============
ipcMain.handle('check-updates', async () => {
    try {
        const currentVersion = app.getVersion()
        console.log(`[UPDATE] Checking for updates... Current: ${currentVersion}`)
        const response = await new Promise((resolve, reject) => {
            https.get(`${API_BASE_URL}/api/updates/check?v=${currentVersion}`, (res) => {
                let data = ''
                res.on('data', chunk => data += chunk)
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data))
                    } catch (e) {
                        reject(e)
                    }
                })
            }).on('error', reject)
        })
        return response
    } catch (error) {
        console.error('[UPDATE] Error:', error)
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('download-update', async (event, { version, downloadUrl }) => {
    try {
        console.log(`[UPDATE] Downloading v${version}...`)
        const downloadPath = path.join(app.getPath('downloads'), `Nexus-Launcher-${version}.exe`)

        const url = downloadUrl.startsWith('http') ? downloadUrl : `${API_BASE_URL}${downloadUrl}`

        await downloadFile(url, downloadPath, (info) => {
            event.sender.send('download-progress', info)
        })

        console.log(`[UPDATE] Download completed: ${downloadPath}`)
        return { success: true, path: downloadPath }
    } catch (error) {
        console.error('[UPDATE] Download error:', error)
        return { success: false, error: (error as Error).message }
    }
})

ipcMain.handle('install-update', async (event, { installerPath }) => {
    try {
        console.log(`[UPDATE] Launching installer: ${installerPath}`)

        spawn(installerPath, [], { detached: true })

        // Close app after delay
        setTimeout(() => {
            app.quit()
        }, 1000)

        return { success: true }
    } catch (error) {
        console.error('[UPDATE] Install error:', error)
        return { success: false, error: (error as Error).message }
    }
})

// ============ DLL LOG UDP RECEIVER ============
// The DLL sends log lines via UDP to 127.0.0.1:45678.
// No connection, no blocking, no integrity-level issues.
const LOG_UDP_PORT = 45678

function startLogUdpServer() {
    const server = dgram.createSocket('udp4')

    server.on('message', (msg: Buffer) => {
        if (!win) return
        const line = msg.toString('utf8').replace(/\r?\n$/, '')
        if (line.trim()) win.webContents.send('mod-log', line)
    })

    server.on('error', (err: Error) => {
        console.warn('[LogUDP] Error:', err.message)
    })

    server.bind(LOG_UDP_PORT, '127.0.0.1', () => {
        console.log('[LogUDP] Listening on UDP 127.0.0.1:' + LOG_UDP_PORT)
    })

    app.on('before-quit', () => server.close())
}

app.whenReady().then(() => startLogUdpServer())
