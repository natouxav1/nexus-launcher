import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'

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
        center: true,
        transparent: false,
        icon: app.isPackaged
            ? path.join(process.resourcesPath, '..', 'icon.ico')
            : path.join(__dirname, '../../icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
        backgroundColor: '#030303',
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(DIST, 'index.html'))
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.whenReady().then(() => {
    createWindow()
    startInstallation()
})

// ─── Load animated logo frames (same path as launcher) ─────────────────────
ipcMain.handle('get-logo-frames', async () => {
    const framesDir = path.join(os.homedir(), 'Documents', 'Nexus', 'logo_frames')
    try {
        if (!fs.existsSync(framesDir)) return { frames: [], count: 0 }
        const files = fs.readdirSync(framesDir)
            .filter(f => f.endsWith('.png'))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        const frames: string[] = []
        for (const file of files) {
            const data = fs.readFileSync(path.join(framesDir, file))
            frames.push(`data:image/png;base64,${data.toString('base64')}`)
        }
        return { frames, count: frames.length }
    } catch {
        return { frames: [], count: 0 }
    }
})

// ─── Installation logic ────────────────────────────────────────────────────
async function startInstallation() {
    // Wait for window to be ready
    await new Promise(r => setTimeout(r, 800))

    // Find the bundled NSIS installer in resources
    const nsisExe = app.isPackaged
        ? path.join(process.resourcesPath, 'nsis-installer.exe')
        : path.join(__dirname, '../../release/nsis-installer.exe')

    if (!fs.existsSync(nsisExe)) {
        win?.webContents.send('install-error', 'Installer not found: ' + nsisExe)
        return
    }

    // Simulate realistic progress while NSIS installs silently
    let progress = 0
    const phases = [
        { label: 'Preparing installation...', target: 10, delay: 400 },
        { label: 'Extracting files...', target: 45, delay: 3000 },
        { label: 'Installing files...', target: 75, delay: 3000 },
        { label: 'Creating shortcuts...', target: 88, delay: 1500 },
        { label: 'Finalizing...', target: 96, delay: 1500 },
    ]

    let phaseIdx = 0
    const progressInterval = setInterval(() => {
        const phase = phases[phaseIdx]
        if (!phase) return

        if (progress < phase.target) {
            progress += Math.random() * 3 + 1
            if (progress > phase.target) progress = phase.target
            win?.webContents.send('install-progress', {
                percent: Math.round(progress),
                label: phase.label,
            })
        }
    }, 80)

    // Advance phases on timer
    for (const phase of phases) {
        await new Promise(r => setTimeout(r, phase.delay))
        phaseIdx++
    }

    // Launch NSIS silent installer
    const proc = spawn(nsisExe, ['/S'], { detached: false })

    proc.on('close', (code) => {
        clearInterval(progressInterval)
        if (code === 0) {
            win?.webContents.send('install-progress', { percent: 100, label: 'Installation complete!' })
            setTimeout(() => {
                // Launch the freshly installed Nexus Launcher (perMachine → Program Files)
                const launcherPath = path.join(
                    process.env.PROGRAMFILES || 'C:\\Program Files',
                    'Nexus Launcher', 'Nexus Launcher.exe'
                )
                if (fs.existsSync(launcherPath)) {
                    spawn(launcherPath, [], { detached: true, stdio: 'ignore' }).unref()
                }
                app.quit()
            }, 1500)
        } else {
            win?.webContents.send('install-error', `Installer exited with code ${code}`)
        }
    })
}

ipcMain.handle('close-installer', () => { app.quit() })
