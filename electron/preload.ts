import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electron', {
    windowControls: (action: string) => ipcRenderer.send('window-controls', action),
    getGtaPath: () => ipcRenderer.invoke('get-gta-path'),
    checkGameRunning: () => ipcRenderer.invoke('check-game-running'),
    launchGameOnly: (args: any) => ipcRenderer.invoke('launch-game-only', args),
    injectMenu: (args: any) => ipcRenderer.invoke('inject-menu', args),
    manageFSL: (args: any) => ipcRenderer.invoke('manage-fsl', args),
    checkFSL: (args: any) => ipcRenderer.invoke('check-fsl', args),
    updateFiles: () => ipcRenderer.invoke('update-files'),
    requestAdmin: () => ipcRenderer.invoke('request-admin'),
    checkModActive: () => ipcRenderer.invoke('check-mod-active'),
    getModLogs: () => ipcRenderer.invoke('get-mod-logs'),
    // Auth - KeyAuth
    authLogin: (args: any) => ipcRenderer.invoke('auth-login', args),
    authRegister: (args: any) => ipcRenderer.invoke('auth-register', args),
    authLicense: (args: any) => ipcRenderer.invoke('auth-license', args),
    authUpgrade: (args: any) => ipcRenderer.invoke('auth-upgrade', args),
    authCheck: () => ipcRenderer.invoke('auth-check'),
    authLogout: () => ipcRenderer.invoke('auth-logout'),
    getLogoFrames: () => ipcRenderer.invoke('get-logo-frames'),
    // Updates
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: (args: any) => ipcRenderer.invoke('download-update', args),
    onSyncProgress: (callback: (status: string) => void) => {
        ipcRenderer.on('sync-progress', (_event, status) => callback(status))
    },
    // NOTE: avoid exposing a generic `on` that allows arbitrary channel subscription from renderer.
    // Only expose specific event helpers above (e.g., onSyncProgress, onAdminStatus, on)
    onAdminStatus: (callback: (isAdmin: boolean) => void) => {
        ipcRenderer.on('admin-status', (_event, isAdmin) => callback(isAdmin))
    },
    onProfileUpdated: (callback: (username: string) => void) => {
        ipcRenderer.on('profile-updated', (_event, username) => callback(username))
    },
    onForceLogout: (callback: () => void) => {
        ipcRenderer.on('force-logout', () => callback())
    },
    onModLog: (callback: (line: string) => void) => {
        ipcRenderer.on('mod-log', (_event, line) => callback(line))
    },
    onLicensesUpdated: (callback: (licenses: any[]) => void) => {
        ipcRenderer.on('licenses-updated', (_event, licenses) => callback(licenses))
    },
    onDownloadProgress: (callback: (info: { downloaded: number; total: number; speed: number; percent: number }) => void) => {
        ipcRenderer.on('download-progress', (_event, info) => callback(info))
    },
    openExternal: (url: string) => ipcRenderer.send('open-external', url),
    openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),
    on: (channel: string, callback: Function) => {
        const subscription = (_event: any, ...args: any[]) => callback(...args)
        ipcRenderer.on(channel, subscription)
        return () => ipcRenderer.removeListener(channel, subscription)
    }
})
