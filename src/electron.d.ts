export interface IElectronAPI {
    windowControls: (action: string) => void;
    getGtaPath: () => Promise<string | null>;
    checkGameRunning: () => Promise<boolean>;
    launchGameOnly: (args: any) => Promise<{ success: boolean; error?: string }>;
    injectMenu: (args: any) => Promise<{ success: boolean; error?: string }>;
    manageFSL: (args: any) => Promise<{ success: boolean; error?: string }>;
    rebuildNexus: () => Promise<{ success: boolean }>;
    syncBaseFiles: () => Promise<{ success: boolean; error?: string }>;
    getSplashFrames: () => Promise<string[]>;
    getLogoFrames: () => Promise<string[]>;
    onSyncProgress: (callback: (status: string) => void) => void;
    on: (channel: string, callback: (...args: any[]) => void) => void;
    // Auth - KeyAuth
    authLogin: (args: any) => Promise<any>;
    authRegister: (args: any) => Promise<any>;
    authLicense: (args: any) => Promise<any>;
    authUpgrade: (args: any) => Promise<any>;
    authCheck: () => Promise<any>;
    authLogout: () => Promise<any>;
    // Updates - Nouveau système GitHub
    checkForUpdates: () => Promise<{ success: boolean; updateInfo?: any; error?: string }>;
    downloadUpdate: (args: { downloadUrl: string; version: string; fileName: string }) => Promise<{ success: boolean; error?: string }>;
    openExternal: (url: string) => void;
    getModLogs: () => Promise<string>;
    requestAdmin: () => Promise<void>;
}

declare global {
    interface Window {
        electron: IElectronAPI;
    }
}
