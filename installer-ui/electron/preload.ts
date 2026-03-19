import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('installer', {
    onProgress: (cb: (data: { percent: number; label: string }) => void) => {
        ipcRenderer.on('install-progress', (_e, data) => cb(data))
    },
    onError: (cb: (msg: string) => void) => {
        ipcRenderer.on('install-error', (_e, msg) => cb(msg))
    },
    close: () => ipcRenderer.invoke('close-installer'),
    getLogoFrames: () => ipcRenderer.invoke('get-logo-frames'),
})
