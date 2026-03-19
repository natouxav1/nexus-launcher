import { useState, useEffect, useRef } from 'react'
import './App.css'

const electron = (window as any).electron

// ============ SVG ICONS (Lucide-style) ============
const Icons = {
    home: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
    ),
    changelog: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
        </svg>
    ),
    zap: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    chevronDown: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    ),
    shield: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    folder: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    fileText: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    settings: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    logout: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    globe: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    ),
}

// ============ LOG HELPERS ============
function getLogColor(line: string): string {
    if (/\]\[ERROR\/|\]\[FATAL\//.test(line)) return '#f87171'  // red
    if (/\]\[WARN\//.test(line)) return '#fbbf24'  // yellow
    if (/\]\[INFO\//.test(line)) return '#4ade80'  // green
    if (/\]\[DEBUG\//.test(line)) return '#60a5fa'  // blue
    return '#a1a1aa'                                            // gray (launcher lines)
}

function isNetworkLog(line: string): boolean {
    // Categorize logs containing these terms as "network" logs
    return /Matchmaking|Network|SessionDetail|NexusRetention|BattlEye/i.test(line)
}

// ============ TYPES ============
type PageType = 'home' | 'settings' | 'logs' | 'changelog'

interface ChangelogEntry {
    version: string
    date: string
    title?: string
    changes: string[]
    type?: string
}

// ============ ANIMATED LOGO COMPONENT ============
function AnimatedLogo({ frames, size }: { frames: string[]; size: number }) {
    const [currentFrame, setCurrentFrame] = useState(0)
    useEffect(() => {
        if (frames.length <= 1) return
        const interval = setInterval(() => {
            setCurrentFrame((prev) => (prev + 1) % frames.length)
        }, 100)
        return () => clearInterval(interval)
    }, [frames])
    if (!frames.length) return null
    return (
        <img
            src={frames[currentFrame]}
            width={size}
            height={size}
            alt="Logo"
            style={{ borderRadius: '8px', objectFit: 'contain' }}
        />
    )
}

function App() {
    // Auth state
    const [authView, setAuthView] = useState<'login' | 'register'>('login')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [username, setUsername] = useState('')
    const [authError, setAuthError] = useState('')
    const [authSuccess, setAuthSuccess] = useState('')
    const [authLoading, setAuthLoading] = useState(false)

    // Login fields
    const [loginUser, setLoginUser] = useState('')
    const [loginPass, setLoginPass] = useState('')
    const [rememberMe, setRememberMe] = useState(true)

    // Register fields
    const [regUser, setRegUser] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regPass, setRegPass] = useState('')

    // License field
    const [licenseKey, setLicenseKey] = useState('')
    const [licenseStatus, setLicenseStatus] = useState<{ active: boolean, licenses: any[] }>({ active: false, licenses: [] })

    // Animated logo frames
    const [logoFrames, setLogoFrames] = useState<string[]>([])

    // Navigation
    const [activePage, setActivePage] = useState<PageType>('home')

    // Changelog
    const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([])
    const [changelogLoading, setChangelogLoading] = useState(false)

    // Launcher state
    const [isSyncing, setIsSyncing] = useState(true)
    const [syncStatus, setSyncStatus] = useState('Initializing...')
    const [syncProgress, setSyncProgress] = useState(0)
    const [splashError, setSplashError] = useState(false)
    const [splashLogs, setSplashLogs] = useState<string[]>([])
    const [logs, setLogs] = useState<string[]>([])
    const [logFilter, setLogFilter] = useState<'main' | 'network' | 'all'>('main')
    const logsEndRef = useRef<HTMLDivElement>(null)
    const logsContainerRef = useRef<HTMLDivElement>(null)
    const logsAtBottom = useRef(true)
    const [gtaEnhancedPath, setGtaEnhancedPath] = useState('')
    const [gtaLegacyPath, setGtaLegacyPath] = useState('')
    const [isGameRunning, setIsGameRunning] = useState(false)
    const [method, setMethod] = useState<'Vanilla' | 'NX Hook'>('NX Hook')
    const [store, setStore] = useState<'Social Club' | 'Steam' | 'Epic Games'>('Social Club')
    const [version, setVersion] = useState<'Enhanced' | 'Legacy'>('Enhanced')
    const [isGameSelectOpen, setIsGameSelectOpen] = useState(false)
    const [isVersionSelectOpen, setIsVersionSelectOpen] = useState(false)
    const gameSelectRef = useRef<HTMLDivElement>(null)
    const versionSelectRef = useRef<HTMLDivElement>(null)
    const [launchStatus, setLaunchStatus] = useState<'Idle' | 'Launching' | 'Injecting' | 'Success' | 'Error'>('Idle')
    const [progressText, setProgressText] = useState('')
    const [isBypassOpen, setIsBypassOpen] = useState(false)
    const [isStoreOpen, setIsStoreOpen] = useState(false)

    const [isModActive, setIsModActive] = useState(false)
    const [serverProgress, setServerProgress] = useState('')
    const [winmmDetected, setWinmmDetected] = useState(false)
    const bypassRef = useRef<HTMLDivElement>(null)
    const storeRef = useRef<HTMLDivElement>(null)
    const [isAdmin, setIsAdmin] = useState(true)

    // Update system
    const [updateAvailable, setUpdateAvailable] = useState<any>(null)
    const [isUpdateDownloading, setIsUpdateDownloading] = useState(false)
    const [appVersion, setAppVersion] = useState('...')
    const [dlProgress, setDlProgress] = useState<{ downloaded: number; total: number; speed: number; percent: number } | null>(null)

    const refreshLogoFrames = async () => {
        const result = await electron?.getLogoFrames()
        if (result?.frames?.length) {
            setLogoFrames(result.frames)
            return true
        }
        return false
    }

    // Helper: map product identifier -> friendly label (handle common variants/misspellings)
    const mapProductLabel = (lic: any) => {
        const raw = (lic.product || lic.product_name || (lic.products && lic.products.join(' ')) || (lic.product_types && lic.product_types.join(' ')) || '').toString().toLowerCase()
        if (!raw) return (lic.product || lic.product_name || 'Product').toString()
        if (raw.includes('enhanced') || raw.includes('gta_enhanced') || raw.includes('gta_enchanced') || raw.includes('gta_ench')) return 'GTA Enhanced'
        if (raw.includes('legacy') || raw.includes('classic') || raw.includes('gta_legacy') || raw.includes('gta legacy')) return 'GTA Legacy'
        if (raw.includes('gta') || raw.includes('gta-v') || raw.includes('gta_v')) return 'GTA V'
        return (lic.product || lic.product_name || raw).toString()
    }

    // Helper: check if current account has access for a given version
    const hasAccessFor = (ver: 'Enhanced' | 'Legacy') => {
        if (!licenseStatus || !licenseStatus.active || !licenseStatus.licenses) return false
        return licenseStatus.licenses.some((lic: any) => {
            const raw = (lic.products || lic.product || lic.product_name || (lic.product_types && lic.product_types.join(' ')) || '').toString().toLowerCase()
            if (ver === 'Enhanced') return raw.includes('enhanced') || raw.includes('gta_enhanced') || raw.includes('gta_enchanced')
            return raw.includes('legacy') || raw.includes('classic') || raw.includes('gta_legacy')
        })
    }

    // Helper: get licenses for a given version (normalized check)
    const getLicensesForVersion = (ver: 'Enhanced' | 'Legacy') => {
        if (!licenseStatus || !licenseStatus.licenses) return []
        return licenseStatus.licenses.filter((lic: any) => {
            const raw = (lic.products || lic.product || lic.product_name || (lic.product_types && lic.product_types.join(' ')) || '').toString().toLowerCase()
            if (ver === 'Enhanced') return raw.includes('enhanced') || raw.includes('gta_enhanced') || raw.includes('gta_enchanced')
            return raw.includes('legacy') || raw.includes('classic') || raw.includes('gta_legacy')
        })
    }

    const formatExpiry = (ts: number) => {
        try {
            const target = new Date(ts).getTime()
            const diff = target - Date.now()
            if (isNaN(target)) return '—'
            if (diff <= 0) return 'Expiré'
            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            if (days >= 1) return `${days}j`
            const hours = Math.floor(diff / (1000 * 60 * 60))
            if (hours >= 1) return `${hours}h`
            const minutes = Math.floor(diff / (1000 * 60))
            if (minutes >= 1) return `${minutes}m`
            return '<1m'
        } catch (e) { return '—' }
    }

    useEffect(() => {
        // Initial checks complete (Clean & Sober)

        // Sync Listener
        const removeSyncListener = electron?.on('sync-progress', (status: string) => {
            setSplashLogs(prev => [...prev.slice(-19), status]) // Keep last 20 lines
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${status}`]) // Add to logs page
            setSyncStatus(status)

            if (status.toLowerCase().includes('error')) {
                setSplashError(true)
                return
            } else {
                setSplashError(false)
            }

            if (status.includes('Updating assets')) setSyncProgress(30)
            if (status.includes('Extracting')) setSyncProgress(60)
            if (status.includes('Assets synchronized') || status.includes('Sync complete')) {
                refreshLogoFrames()
                setSyncProgress(100)
                setTimeout(() => setIsSyncing(false), 800)
            }
        })

        electron?.authCheck().then(async (result: any) => {
            if (result?.loggedIn) {
                setIsLoggedIn(true)
                setUsername(result.username)
                if (result.licenses && Array.isArray(result.licenses)) {
                    setLicenseStatus({ active: result.licenses.length > 0, licenses: result.licenses })
                } else {
                    const lic = await electron?.authLicenseStatus()
                    if (lic) setLicenseStatus(lic)
                }
            }
            if (result?.savedCredentials) {
                setLoginUser(result.savedCredentials.username || '')
                setLoginPass(result.savedCredentials.password || '')
                setRememberMe(true)
            }
        })

        electron?.getAppVersion().then((v: string) => {
            if (v) setAppVersion(v)
        })

        electron?.getGtaPath().then((paths: { enhanced: string, legacy: string }) => {
            if (paths.enhanced) setGtaEnhancedPath(paths.enhanced)
            if (paths.legacy) setGtaLegacyPath(paths.legacy)
            if (paths.enhanced && !paths.legacy) setGtaLegacyPath(paths.enhanced)
            if (paths.legacy && !paths.enhanced) setGtaEnhancedPath(paths.legacy)
        })

        refreshLogoFrames()

        electron?.on('launch-progress', (text: string) => {
            setProgressText(text)
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [Launch] ${text}`])
        })

        electron?.on('server-update-progress', (text: string) => {
            setServerProgress(text)
            setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] [Update] ${text}`])
        })

        electron?.onModLog((line: string) => {
            setLogs(prev => [...prev, line])
        })

        const removeProfileListener = electron?.onProfileUpdated((newName: string) => {
            setUsername(newName)
        })

        const removeForceLogout = electron?.onForceLogout(() => {
            setIsLoggedIn(false)
            setUsername('')
        })

        const removeLicensesListener = electron?.onLicensesUpdated((licenses: any[]) => {
            setLicenseStatus({ active: Array.isArray(licenses) && licenses.length > 0, licenses })
        })

        electron?.onDownloadProgress((info: { downloaded: number; total: number; speed: number; percent: number }) => {
            setDlProgress(info)
        })

        const interval = setInterval(async () => {
            const running = await electron?.checkGameRunning()
            setIsGameRunning(running)
            if (running) {
                const modActive = await electron?.checkModActive()
                setIsModActive(modActive)
            } else {
                setIsModActive(false)
            }
        }, 2000)

        const removeAdminListener = electron?.onAdminStatus((status: boolean) => {
            setIsAdmin(status)
        })

        const handleClickOutside = (event: MouseEvent) => {
            if (gameSelectRef.current && !gameSelectRef.current.contains(event.target as Node)) setIsGameSelectOpen(false)
            if (versionSelectRef.current && !versionSelectRef.current.contains(event.target as Node)) setIsVersionSelectOpen(false)
            if (bypassRef.current && !bypassRef.current.contains(event.target as Node)) setIsBypassOpen(false)
            if (storeRef.current && !storeRef.current.contains(event.target as Node)) setIsStoreOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            clearInterval(interval)
            document.removeEventListener('mousedown', handleClickOutside)
            if (removeSyncListener && typeof removeSyncListener === 'function') removeSyncListener()
            if (removeAdminListener && typeof removeAdminListener === 'function') removeAdminListener()
            if (removeProfileListener && typeof removeProfileListener === 'function') removeProfileListener()
            if (removeForceLogout && typeof removeForceLogout === 'function') removeForceLogout()
            if (removeLicensesListener && typeof removeLicensesListener === 'function') removeLicensesListener()
        }
    }, [])

    const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development' || location.hostname === 'localhost'

    const handleCheckUpdates = async (manual = false) => {
        if (isDev && !manual) {
            console.log('[Update Check] Skipped (dev mode)')
            return
        }
        try {
            if (window.electron?.checkUpdates) {
                const result = await window.electron.checkUpdates()
                if (result?.success) {
                    if (result.needsUpdate) {
                        setUpdateAvailable(result)
                    } else if (manual) {
                        // Show "up to date" modal by creating a dummy updateAvailable state
                        setUpdateAvailable({
                            success: true,
                            needsUpdate: false,
                            latest: result.latest || appVersion,
                            current: appVersion,
                            changelog: "You are currently running the latest version of Nexus Launcher. No updates are required at this time.",
                            isUpToDateModal: true
                        } as any)
                    }
                }
            }
        } catch (e) {
            console.error('Failed to check for updates:', e)
            if (manual) alert('Failed to check for updates')
        }
    }

    // Auto-update and Profile Check Loop (Every 5 seconds)
    useEffect(() => {
        const interval = setInterval(async () => {
            // 1. Check for App Updates
            if (!updateAvailable && !isUpdateDownloading) {
                // Silent check
                handleCheckUpdates(false)
            }

            // 2. Check for Username/Profile Updates
            // Even if cached, we double-check if the main process has a newer name
            if (isLoggedIn) {
                try {
                    const result = await electron?.authCheck()
                    if (result && result.loggedIn && result.username && result.username !== username) {
                        console.log('[AutoCheck] Username updated:', result.username)
                        setUsername(result.username)
                    }
                } catch (e) { /* ignore */ }
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [updateAvailable, isUpdateDownloading, isLoggedIn, username])

    // Check for updates on app startup (skip in dev)
    useEffect(() => {
        if (!isDev) {
            handleCheckUpdates(false)
        }
    }, [])

    // Check winmm.dll (FSL) presence when path or version changes
    useEffect(() => {
        const currentPath = version === 'Enhanced' ? gtaEnhancedPath : gtaLegacyPath
        if (!currentPath) { setWinmmDetected(false); return }
        const check = async () => {
            const result = await electron?.checkFSL({ gamePath: currentPath })
            setWinmmDetected(result?.exists ?? false)
        }
        check()
        const id = setInterval(check, 3000)
        return () => clearInterval(id)
    }, [version, gtaEnhancedPath, gtaLegacyPath])

    // Auto-scroll logs to bottom only if user is already at the bottom
    useEffect(() => {
        if (logsAtBottom.current) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [logs])

    // Fetch data when page changes
    useEffect(() => {
        if (activePage === 'changelog' && changelogs.length === 0) {
            fetchChangelogs()
        }

    }, [activePage])

    const fetchChangelogs = async () => {
        setChangelogLoading(true)
        try {
            const res = await fetch('https://api.nexus-mod.com/api/changelogs')
            if (res.ok) {
                const data = await res.json()
                setChangelogs(data)
            }
        } catch (e) {
            console.error('Failed to fetch changelogs:', e)
            // Fallback data
            setChangelogs([
                { version: '2.1.8', date: '2026-02-09', title: 'Launcher Integration', changes: ['Added API-based file updates', 'NX Hook auto-install', 'Auto-injection after game launch', 'Authentication system'], type: 'major' },
                { version: '2.1.7', date: '2026-02-08', title: 'Session Stability', changes: ['Improved NX Hook session joins', 'BattlEye heartbeat fixes', 'Packet handling optimizations'], type: 'minor' },
                { version: '2.1.6', date: '2026-02-07', title: 'Recovery Tools', changes: ['Free shopping improvements', 'Heist payout customization', 'Money script fixes'], type: 'patch' },
            ])
        }
        setChangelogLoading(false)
    }

    const handleLogin = async () => {
        setAuthError('')
        setAuthLoading(true)
        try {
            const result = await electron?.authLogin({ username: loginUser, password: loginPass, rememberMe })
            if (result?.success) {
                setIsLoggedIn(true)
                setUsername(loginUser)
                // Fetch license status after login
                const lic = await electron?.authLicenseStatus()
                if (lic) setLicenseStatus(lic)
            } else {
                setAuthError(result?.error || 'Login failed')
            }
        } catch (e) {
            setAuthError('Connection error')
        }
        setAuthLoading(false)
    }

    const handleRegister = async () => {
        setAuthError('')
        setAuthSuccess('')
        setAuthLoading(true)
        try {
            const result = await electron?.authRegister({ username: regUser, email: regEmail, password: regPass })
            if (result?.success) {
                setAuthSuccess(result.message || 'Account created! You can now login.')
                setAuthView('login')
                setLoginUser(regUser)
            } else {
                setAuthError(result?.error || 'Registration failed')
            }
        } catch (e) {
            setAuthError('Connection error')
        }
        setAuthLoading(false)
    }

    const handleClaimLicense = async () => {
        setAuthError('')
        setAuthSuccess('')
        setAuthLoading(true)
        try {
            const result = await electron?.authClaimLicense({ key: licenseKey })
            if (result?.success) {
                setAuthSuccess(result.message || 'License activated!')
                setLicenseKey('')
                // Refresh license status
                const lic = await electron?.authLicenseStatus()
                if (lic) setLicenseStatus(lic)
            } else {
                setAuthError(result?.error || 'Activation failed')
            }
        } catch (e) {
            setAuthError('Connection error')
        }
        setAuthLoading(false)
    }

    const handleLogout = async () => {
        await electron?.authLogout()
        setIsLoggedIn(false)
        setUsername('')
        setLoginUser('')
        setLoginPass('')
    }

    const handleDownloadUpdate = async () => {
        setIsUpdateDownloading(true)
        setDlProgress(null)
        try {
            const result = await window.electron?.downloadUpdate({
                version: updateAvailable?.latest,
                downloadUrl: updateAvailable?.downloadUrl
            })
            if (result?.success) {
                // Download succeeded, now install
                const installResult = await window.electron?.installUpdate({ installerPath: result.path! })
                if (!installResult?.success) {
                    setIsUpdateDownloading(false)
                    alert('Install failed: ' + (installResult?.error || 'Unknown error'))
                }
                // App will quit and installer will launch
            } else {
                setIsUpdateDownloading(false)
                alert('Download failed: ' + (result?.error || 'Unknown error'))
            }
        } catch (e) {
            setIsUpdateDownloading(false)
            console.error('Download error:', e)
            alert('Download error')
        }
    }

    const handleInstallUpdate = async () => {
        // Not used directly anymore, install is chained from download
    }


    const handleSkipUpdate = () => {
        setUpdateAvailable(null)
    }

    const handleStart = async () => {
        setLaunchStatus('Launching')
        try {
            const gtaPath = version === 'Enhanced' ? gtaEnhancedPath : gtaLegacyPath
            setProgressText('Updating Files...')
            const updateResult = await electron?.updateFiles()
            if (updateResult && updateResult.error) {
                setLaunchStatus('Error')
                setProgressText('Update Failed')
                setTimeout(() => setLaunchStatus('Idle'), 5000)
                return
            }

            if (isGameRunning) {
                setProgressText('Injecting')
                const result = await electron?.injectMenu({ path: gtaPath })
                if (result && result.success) {
                    setLaunchStatus('Success')
                    setProgressText('Done')
                    setTimeout(() => setLaunchStatus('Idle'), 5000)
                } else {
                    setLaunchStatus('Error')
                    setProgressText(result?.error || 'Failed')
                    setTimeout(() => setLaunchStatus('Idle'), 5000)
                }
            } else {
                if (method === 'NX Hook') {
                    setProgressText('Installing NX Hook...')
                    const fslResult = await electron?.manageFSL({ gamePath: gtaPath, action: 'install' })
                    if (fslResult && fslResult.error) {
                        setLaunchStatus('Error')
                        setProgressText('FSL Install Failed')
                        setTimeout(() => setLaunchStatus('Idle'), 3000)
                        return
                    }
                } else {
                    await electron?.manageFSL({ gamePath: gtaPath, action: 'remove' })
                }

                setProgressText('Starting Game...')
                const result = await electron?.launchGameOnly({ path: gtaPath, store })
                if (!result || !result.success) {
                    setLaunchStatus('Error')
                    setProgressText(result?.error || 'Launch Failed')
                    setTimeout(() => setLaunchStatus('Idle'), 5000)
                    return
                }

                setProgressText('Waiting for GTA...')
                let found = false
                for (let i = 0; i < 40; i++) {
                    await new Promise(r => setTimeout(r, 3000))
                    const running = await electron?.checkGameRunning()
                    if (running) { found = true; break }
                    setProgressText(`Waiting for GTA... (${(i + 1) * 3}s)`)
                }

                if (!found) {
                    setLaunchStatus('Error')
                    setProgressText('Game not detected')
                    setTimeout(() => setLaunchStatus('Idle'), 5000)
                    return
                }

                setProgressText('Game detected, loading...')
                await new Promise(r => setTimeout(r, 5000))

                setProgressText('Injecting...')
                const injectResult = await electron?.injectMenu({ path: gtaPath })
                if (injectResult && injectResult.success) {
                    setLaunchStatus('Success')
                    setProgressText('Done ✓')
                    setTimeout(() => setLaunchStatus('Idle'), 5000)
                }
            }
        } catch (err) {
            setLaunchStatus('Error')
            setProgressText('Error')
            setTimeout(() => setLaunchStatus('Idle'), 5000)
        }
    }



    const navigateTo = (page: PageType) => {
        setActivePage(page)
        setAuthError('')
        setAuthSuccess('')
    }

    // ============ SPLASH SCREEN ============
    // ============ SPLASH SCREEN ============
    if (isSyncing) {
        return (
            <div className="splash-screen" style={{
                background: splashError ? 'radial-gradient(circle at center, #270707 0%, #030303 100%)' : '#030303',
                transition: 'background 0.8s ease'
            }}>
                <div className="background-container">
                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                </div>
                <div className={`splash-content ${splashError ? 'splash-shake' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
                    <div className="splash-logo" style={{
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        filter: splashError
                            ? 'drop-shadow(0 0 25px rgba(220, 38, 38, 0.6))'
                            : 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.4))',
                        transition: 'filter 0.6s ease'
                    }}>
                        {logoFrames.length > 0 ? (
                            <AnimatedLogo frames={logoFrames} size={80} />
                        ) : (
                            <div className="loading-spinner"></div>
                        )}
                    </div>
                    <div className="loading-bar-container" style={{ width: '100%' }}>
                        <div className="loading-text" style={{
                            fontSize: '13px',
                            color: splashError ? '#f87171' : '#a1a1aa',
                            marginBottom: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            transition: 'color 0.4s ease'
                        }}>
                            <span>{splashError ? 'Sync Error — Check Connection' : syncStatus}</span>
                            {!splashError && <span>{syncProgress}%</span>}
                        </div>
                        <div className="loading-bar" style={{
                            transition: 'background 0.4s ease'
                        }}>
                            <div className={`loading-progress ${splashError ? 'loading-progress-error' : ''}`} style={{
                                width: splashError ? '100%' : `${syncProgress}%`
                            }}></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ============ AUTH SCREEN ============
    if (!isLoggedIn) {
        return (
            <div className="app-container">
                <div className="background-container">
                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                </div>

                <div className="drag-region">
                    <div className="window-controls">
                        <button onClick={() => electron?.windowControls('minimize')}>—</button>
                        <button onClick={() => electron?.windowControls('close')}>✕</button>
                    </div>
                </div>

                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {logoFrames.length > 0 ? (
                                <AnimatedLogo frames={logoFrames} size={56} />
                            ) : (
                                <svg viewBox="0 0 100 100" width="56" height="56" style={{ marginBottom: 12, opacity: 0.95 }}>
                                    <circle cx="50" cy="50" r="48" fill="none" stroke="#71c96f" strokeWidth="2" />
                                    <path d="M 35 50 L 45 60 L 65 40" fill="none" stroke="#71c96f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>

                        {authError && <div className="auth-error">{authError}</div>}
                        {authSuccess && <div className="auth-success">{authSuccess}</div>}

                        <div className="auth-tabs">
                            <button
                                className={'active'}
                                onClick={() => { setAuthError('') }}
                            >
                                Login
                            </button>
                        </div>

                        {authView === 'login' && (
                            <div className="auth-form">
                                <input type="text" placeholder="Username" value={loginUser}
                                    onChange={(e) => setLoginUser(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                                <input type="password" placeholder="Password" value={loginPass}
                                    onChange={(e) => setLoginPass(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                                <label className="remember-me">
                                    <input type="checkbox" checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)} />
                                    <span className="remember-check"></span>
                                    <span>Remember me</span>
                                </label>
                                <button className="auth-btn" onClick={handleLogin}
                                    disabled={authLoading || !loginUser || !loginPass}>
                                    {authLoading ? 'Connecting...' : 'Sign In'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ============ PAGE CONTENT ============
    const renderPage = () => {
        switch (activePage) {
            case 'changelog':
                return (
                    <div className="central-dashboard">
                        <div className="welcome-section">
                            <h2>License<span className="highlight">s</span></h2>
                            <p className="subtitle">Manage your active licenses.</p>
                        </div>
                        {hasAccessFor(version) ? (
                            <>
                                <div className="license-tabs">
                                    <button className="btn-ghost" onClick={() => setIsBypassOpen(!isBypassOpen)} disabled={!hasAccessFor(version)}>Bypass</button>
                                    <button className="btn-ghost" onClick={() => setIsStoreOpen(!isStoreOpen)}>Store</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: 12, color: '#f97316', fontWeight: 600 }}>Aucun abonnement actif — aucun accès au jeu ou aux fonctionnalités.</div>
                        )}
                        {authSuccess && <div className="auth-success" style={{ marginBottom: '16px' }}>{authSuccess}</div>}

                        {licenseStatus.active ? (
                            <div className="settings-grid">
                                {licenseStatus.licenses && licenseStatus.licenses.length > 0 ? licenseStatus.licenses.map((lic: any, i: number) => {
                                    const expires = lic.expiresAt ? new Date(lic.expiresAt) : null

                                    // Compute remaining time in ms and human readable string
                                    const remainingMs = expires ? Math.max(0, expires.getTime() - Date.now()) : null
                                    const daysNum = remainingMs != null ? Math.floor(remainingMs / (1000 * 60 * 60 * 24)) : null
                                    const hoursNum = remainingMs != null ? Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : null
                                    const minutesNum = remainingMs != null ? Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)) : null
                                    let humanRemaining: string | null = null
                                    if (remainingMs === 0) humanRemaining = 'Expired'
                                    else if (remainingMs != null) {
                                        if (daysNum != null && daysNum >= 1) humanRemaining = `${daysNum} day${daysNum > 1 ? 's' : ''}`
                                        else if (hoursNum != null && hoursNum >= 1) humanRemaining = `${hoursNum}h ${minutesNum}m`
                                        else if (minutesNum != null) humanRemaining = `${minutesNum}m`
                                    }

                                    // Numeric daysLeft for color/legacy logic
                                    const computedDaysLeft = daysNum != null ? daysNum : (typeof lic.daysLeft === 'number' ? lic.daysLeft : null)
                                    const daysLeft = typeof lic.daysLeft === 'number' ? lic.daysLeft : computedDaysLeft

                                    // Progress percent: prefer startedAt->expires if available, otherwise fallback
                                    let pct = 0
                                    if (expires && lic.startedAt) {
                                        const started = new Date(lic.startedAt).getTime()
                                        const total = expires.getTime() - started
                                        if (total > 0) {
                                            pct = Math.min(100, Math.max(0, Math.round(((Date.now() - started) / total) * 100)))
                                        } else pct = 100
                                    } else if (lic.duration && daysLeft != null) {
                                        // Show percent based on remaining duration
                                        pct = Math.min(100, Math.max(0, Math.round(((lic.duration - daysLeft) / lic.duration) * 100)))
                                    } else if (daysLeft) {
                                        pct = Math.min(100, Math.round((daysLeft / 365) * 100))
                                    }

                                    const color = (daysLeft != null && daysLeft > 30) ? '#22c55e' : (daysLeft != null && daysLeft > 7) ? '#eab308' : '#ef4444'

                                    return (
                                        <div key={i} className="settings-card">
                                            <div className="settings-card-header">
                                                <span className="settings-icon">{Icons.shield}</span>
                                                <span>{mapProductLabel(lic).toUpperCase()} License</span>
                                            </div>

                                            <div className="settings-item">
                                                <span className="settings-label">License Key</span>
                                                <span className="settings-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                                    {(
                                                        lic.key || lic.license_key || lic.licenseKey || lic.code || (lic.license && lic.license.key) || '—'
                                                    )}
                                                </span>
                                            </div>

                                            <div className="settings-item">
                                                <span className="settings-label">Status</span>
                                                <span className="settings-value" style={{ color: lic.active === false ? '#ef4444' : '#22c55e' }}>{lic.active === false ? 'Inactive' : 'Active'}</span>
                                            </div>

                                            <div className="settings-item">
                                                <span className="settings-label">Time Remaining</span>
                                                <span className="settings-value" style={{ color }}>{humanRemaining != null ? humanRemaining : (daysLeft != null ? `${daysLeft} days` : '—')}</span>
                                            </div>

                                            <div className="settings-item">
                                                <span className="settings-label">Expires</span>
                                                <span className="settings-value">{expires ? expires.toLocaleString() : (lic.expiresAt || '—')}</span>
                                            </div>

                                            {lic.product_types && lic.product_types.length > 0 && (
                                                <div className="settings-item">
                                                    <span className="settings-label">Product Types</span>
                                                    <span className="settings-value">{lic.product_types.join(', ')}</span>
                                                </div>
                                            )}

                                            {lic.startedAt && (
                                                <div className="settings-item">
                                                    <span className="settings-label">Started</span>
                                                    <span className="settings-value">{new Date(lic.startedAt).toLocaleString()}</span>
                                                </div>
                                            )}

                                            {lic.claimedAt && (
                                                <div className="settings-item">
                                                    <span className="settings-label">Claimed</span>
                                                    <span className="settings-value">{new Date(lic.claimedAt).toLocaleString()}</span>
                                                </div>
                                            )}

                                            <div className="license-progress-bar">
                                                <div className="license-progress-fill" style={{ width: `${pct}%`, background: color }}></div>
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="settings-card">
                                        <div style={{ padding: 16 }}>No active licenses found on your account.</div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="auth-form" style={{ maxWidth: '420px' }}>
                                <input type="text" placeholder="XXXXX-XXXXX-XXXXX"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                                    style={{ textAlign: 'center', letterSpacing: '2px', fontFamily: 'monospace' }} />
                                <button className="auth-btn" onClick={handleClaimLicense}
                                    disabled={authLoading || !licenseKey}>
                                    {authLoading ? 'Activating...' : 'Activate License'}
                                </button>
                            </div>
                        )}
                    </div>
                )

            case 'logs':
                const filteredLogs = logs.filter(log => {
                    const isNet = isNetworkLog(log)
                    if (logFilter === 'all') return true
                    if (logFilter === 'network') return isNet
                    return !isNet // 'main' view filters OUT network logs
                })

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '24px 28px 0', boxSizing: 'border-box' }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', flexShrink: 0, gap: '20px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#fafafa' }}>
                                    Log<span className="highlight">s</span>
                                </h2>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#52525b' }}>
                                    {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'} visible
                                </p>
                            </div>

                            {/* Log Tabs/Filter */}
                            <div className="header-nav" style={{ padding: '3px', marginLeft: '20px' }}>
                                <button
                                    className={logFilter === 'main' ? 'active' : ''}
                                    onClick={() => setLogFilter('main')}
                                >
                                    Main
                                </button>
                                <button
                                    className={logFilter === 'network' ? 'active' : ''}
                                    onClick={() => setLogFilter('network')}
                                >
                                    Network
                                </button>
                                <button
                                    className={logFilter === 'all' ? 'active' : ''}
                                    onClick={() => setLogFilter('all')}
                                >
                                    Everything
                                </button>
                            </div>

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                {/* Copy button */}
                                <button
                                    title="Copy visible logs"
                                    onClick={() => navigator.clipboard.writeText(filteredLogs.join('\n')).catch(() => { })}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #27272a',
                                        borderRadius: '6px',
                                        color: '#71717a',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: 0,
                                        transition: 'color 0.15s, border-color 0.15s',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fafafa'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#52525b' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#71717a'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#27272a' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                </button>
                                {/* Clear button */}
                                <button
                                    title="Clear all logs"
                                    onClick={() => setLogs([])}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #27272a',
                                        borderRadius: '6px',
                                        color: '#71717a',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: 0,
                                        transition: 'color 0.15s, border-color 0.15s',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#7f1d1d' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#71717a'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#27272a' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Log area — takes remaining height, scrolls internally */}
                        <div
                            ref={logsContainerRef}
                            onScroll={() => {
                                const el = logsContainerRef.current
                                if (!el) return
                                logsAtBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
                            }}
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                lineHeight: '1.6',
                                color: '#a1a1aa',
                                userSelect: 'text',
                                WebkitUserSelect: 'text',
                                paddingBottom: '16px',
                            }}
                        >
                            {filteredLogs.length === 0 ? (
                                <div style={{ color: '#3f3f46', paddingTop: '60px', textAlign: 'center' }}>
                                    No {logFilter === 'all' ? '' : logFilter} logs yet...
                                </div>
                            ) : (
                                filteredLogs.map((log, i) => (
                                    <div key={i} style={{ marginBottom: '2px', wordBreak: 'break-all', color: getLogColor(log) }}>
                                        {log}
                                    </div>
                                ))
                            )}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                )

            case 'settings':
                return (
                    <div className="central-dashboard">
                        <div className="welcome-section">
                            <h2>Set<span className="highlight">tings</span></h2>
                            <p className="subtitle">Configure your launcher preferences.</p>
                        </div>
                        <div className="settings-grid">
                            <div className="settings-card">
                                <div className="settings-card-header">
                                    <span className="settings-icon">{Icons.shield}</span>
                                    <span>Account</span>
                                </div>
                                <div className="settings-item">
                                    <span className="settings-label">Username</span>
                                    <span className="settings-value">{username}</span>
                                </div>
                                <div className="settings-item">
                                    <span className="settings-label">Status</span>
                                    <span className="settings-value" style={{ color: '#22c55e' }}>Active</span>
                                </div>
                                <div className="settings-item" style={{ marginTop: '12px' }}>
                                    <button className="settings-btn-small" onClick={handleLogout}>Logout</button>
                                </div>
                            </div>

                            <div className="settings-card">
                                <div className="settings-card-header">
                                    <span className="settings-icon">{Icons.zap}</span>
                                    <span>Game Directories</span>
                                </div>
                                <div className="settings-item-col">
                                    <span className="settings-label">GTA V Enhanced</span>
                                    <div className="settings-input-row">
                                        <input type="text" value={gtaEnhancedPath} onChange={(e) => setGtaEnhancedPath(e.target.value)} placeholder="Path to GTA5_Enhanced.exe" />
                                        <button className="settings-btn-small" onClick={async () => {
                                            const p = await electron?.getGtaPath()
                                            if (p) setGtaEnhancedPath(p.enhanced || p.legacy || '')
                                        }}>AUTO</button>
                                    </div>
                                </div>
                                <div className="settings-item-col" style={{ marginTop: '12px' }}>
                                    <span className="settings-label">GTA V Legacy</span>
                                    <div className="settings-input-row">
                                        <input type="text" value={gtaLegacyPath} onChange={(e) => setGtaLegacyPath(e.target.value)} placeholder="Path to GTA5.exe" />
                                        <button className="settings-btn-small" onClick={async () => {
                                            const p = await electron?.getGtaPath()
                                            if (p) setGtaLegacyPath(p.legacy || p.enhanced || '')
                                        }}>AUTO</button>
                                    </div>
                                </div>
                                <div className="settings-item" style={{ marginTop: '16px' }}>
                                    <button className="settings-btn-small" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => electron?.openExternal(gtaEnhancedPath)}>
                                        {Icons.folder} Open Game Folder
                                    </button>
                                </div>
                            </div>


                            <div className="settings-card">
                                <div className="settings-card-header">
                                    <span className="settings-icon">{Icons.changelog}</span>
                                    <span>Updates</span>
                                </div>
                                <div className="settings-item">
                                    <span className="settings-label">Current Version</span>
                                    <span className="settings-value">{appVersion}</span>
                                </div>
                                <div className="settings-item" style={{ marginTop: '12px' }}>
                                    <button className="settings-btn-small" onClick={() => handleCheckUpdates(true)}>Check for Updates</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )

            default: // home
                return (
                    <div className="central-dashboard">
                        <div className="welcome-section">
                            <h2>Welcome, <span className="highlight">{username}</span></h2>
                            {!isAdmin && (
                                <div className="admin-warning" style={{
                                    marginTop: '8px',
                                    fontSize: '11px',
                                    color: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    {Icons.shield} Launch as Administrator recommended
                                    <button
                                        onClick={() => electron?.requestAdmin()}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            color: '#ef4444',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '10px',
                                            marginLeft: '4px'
                                        }}
                                    >
                                        FIX
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="status-row">
                            <div className="stat-item">
                                <span className="label">Process</span>
                                <span className={`value ${isGameRunning ? 'green' : ''}`}>
                                    {isGameRunning ? 'Active' : 'Closed'}
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="label">Edition</span>
                                <span className="value">{version} Build</span>
                            </div>
                            <div className="stat-item" style={{ cursor: 'pointer' }} onClick={() => {
                                const currentPath = version === 'Enhanced' ? gtaEnhancedPath : gtaLegacyPath
                                if (currentPath) electron?.openFolder(currentPath)
                            }} title="Click to open folder">
                                <span className="label">Directory</span>
                                <span className="value" style={{ fontSize: '10px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '200px' }} title={version === 'Enhanced' ? gtaEnhancedPath : gtaLegacyPath}>
                                    {(version === 'Enhanced' ? gtaEnhancedPath : gtaLegacyPath) || 'Searching...'}
                                </span>
                            </div>
                        </div>

                        <div className="selects-row">
                            <div className="select-wrapper" ref={bypassRef}>
                                <div className="select-trigger" onClick={() => setIsBypassOpen(!isBypassOpen)}>
                                    <span>{method}</span>
                                    <span className="select-chevron">{Icons.chevronDown}</span>
                                </div>
                                {isBypassOpen && (
                                    <div className="select-content">
                                        <div className={`select-option ${method === 'Vanilla' ? 'selected' : ''}`}
                                            onClick={() => { setMethod('Vanilla'); setIsBypassOpen(false) }}>
                                            Vanilla (Default)
                                        </div>
                                        <div className={`select-option ${method === 'NX Hook' ? 'selected' : ''}`}
                                            onClick={() => { setMethod('NX Hook'); setIsBypassOpen(false) }}>
                                            NX Hook (Enhanced)
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="select-wrapper" ref={storeRef}>
                                <div className="select-trigger" onClick={() => setIsStoreOpen(!isStoreOpen)}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {store === 'Social Club' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Rockstar_Games_Logo.svg/330px-Rockstar_Games_Logo.svg.png" alt="" className="platform-icon" />}
                                        {store === 'Steam' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/960px-Steam_icon_logo.svg.png" alt="" className="platform-icon" />}
                                        {store === 'Epic Games' && <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Epic_Games_logo.png/610px-Epic_Games_logo.png" alt="" className="platform-icon" />}
                                        {store}
                                    </span>
                                    <span className="select-chevron">{Icons.chevronDown}</span>
                                </div>
                                {isStoreOpen && (
                                    <div className="select-content">
                                        <div className={`select-option ${store === 'Social Club' ? 'selected' : ''}`}
                                            onClick={() => { setStore('Social Club'); setIsStoreOpen(false) }}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Rockstar_Games_Logo.svg/330px-Rockstar_Games_Logo.svg.png" alt="" className="platform-icon" />
                                            Social Club
                                        </div>
                                        <div className={`select-option ${store === 'Steam' ? 'selected' : ''}`}
                                            onClick={() => { setStore('Steam'); setIsStoreOpen(false) }}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/960px-Steam_icon_logo.svg.png" alt="" className="platform-icon" />
                                            Steam
                                        </div>
                                        <div className={`select-option ${store === 'Epic Games' ? 'selected' : ''}`}
                                            onClick={() => { setStore('Epic Games'); setIsStoreOpen(false) }}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Epic_Games_logo.png/610px-Epic_Games_logo.png" alt="" className="platform-icon" />
                                            Epic Games
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="action-bar">
                            {/* Wrap button in span with title so tooltip shows even when disabled */}
                            <span title={!hasAccessFor(version) ? 'Il faut acheter une licence pour lancer le jeu' : ''} style={{ display: 'inline-block' }}>
                                <button className="btn-primary" onClick={handleStart}
                                    disabled={launchStatus !== 'Idle' || !(version === 'Enhanced' ? gtaEnhancedPath : gtaLegacyPath) || (isGameRunning && isModActive) || !hasAccessFor(version)}>
                                    {launchStatus === 'Idle' ? (
                                        isGameRunning ? (isModActive ? 'Already Active' : 'Inject Menu') : 'Launch Game'
                                    ) : (
                                        progressText.toUpperCase()
                                    )}
                                </button>
                            </span>
                            {winmmDetected && (
                                <button
                                    title="NX Hook (winmm.dll) détecté — cliquer pour supprimer"
                                    onClick={async () => {
                                        const gtaPath = version === 'Enhanced' ? gtaEnhancedPath : gtaLegacyPath
                                        await electron?.manageFSL({ gamePath: gtaPath, action: 'remove' })
                                        setWinmmDetected(false)
                                    }}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid rgba(180,40,40,0.45)',
                                        borderRadius: '8px',
                                        color: '#f87171',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        padding: '0 14px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: 'none',
                                        transition: 'background 0.15s, border-color 0.15s',
                                        flexShrink: 0,
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(180,40,40,0.12)'; e.currentTarget.style.borderColor = 'rgba(180,40,40,0.7)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(180,40,40,0.45)' }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                    Remove NX Hook
                                </button>
                            )}
                        </div>
                    </div>
                )
        }
    }

    // ============ MAIN LAYOUT ============
    return (
        <div className="app-container">
            <div className="background-container">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            <div className="drag-region">
                <div className="window-controls">
                    <button onClick={() => electron?.windowControls('minimize')}>—</button>
                    <button onClick={() => electron?.windowControls('close')}>✕</button>
                </div>
            </div>

            <div className="layout">
                <aside className="sidebar">
                    <div style={{ marginBottom: '24px' }}>
                        <AnimatedLogo frames={logoFrames} size={36} />
                    </div>
                    <nav className="sidebar-nav">
                        <div className="nav-item-wrapper">
                            <div className={`nav-item ${activePage === 'home' ? 'active' : ''}`}
                                onClick={() => navigateTo('home')}>
                                {Icons.home}
                            </div>
                            <div className="nav-tooltip">Home</div>
                        </div>

                        <div className="nav-item-wrapper">
                            <div className={`nav-item ${activePage === 'logs' ? 'active' : ''}`}
                                onClick={() => navigateTo('logs')}>
                                {Icons.fileText}
                            </div>
                            <div className="nav-tooltip">Logs</div>
                        </div>

                        <div className="nav-item-wrapper">
                            <div className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
                                onClick={() => navigateTo('settings')}>
                                {Icons.settings}
                            </div>
                            <div className="nav-tooltip">Settings</div>
                        </div>

                        <div className="nav-item-wrapper">
                            <div className="nav-item nav-item-logout" onClick={handleLogout}>
                                {Icons.logout}
                            </div>
                            <div className="nav-tooltip">Logout</div>
                        </div>
                    </nav>
                </aside>

                <main className="main-content">
                    <header className="header" />

                    {renderPage()}

                    {activePage !== 'settings' && activePage !== 'logs' && (
                        <footer className="footer-v2">
                            <div className="footer-left">
                                {isLoggedIn && (() => {
                                    const licForVer = getLicensesForVersion(version)
                                    const lic = licForVer?.[0]
                                    const expires = lic ? (lic.expiresAt || lic.expires || lic.expiry || lic.expires_at || 0) : 0
                                    const keyRaw: string = lic ? (lic.key || lic.license_key || lic.code || (lic.license && lic.license.key) || '') : ''
                                    const keyShort = keyRaw ? keyRaw.slice(0, 8).toUpperCase() + '…' : '—'
                                    const expiryLabel = expires ? formatExpiry(expires) : '—'
                                    const isExpired = expires && new Date(expires).getTime() - Date.now() <= 0
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600, letterSpacing: '0.4px' }}>
                                                    {username}
                                                </span>
                                                <span style={{ fontSize: '10px', color: '#52525b' }}>
                                                    {keyShort}
                                                </span>
                                            </div>
                                            <div style={{ width: '1px', height: '20px', background: '#27272a' }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                <span style={{ fontSize: '10px', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expires</span>
                                                <span style={{ fontSize: '11px', color: isExpired ? '#f87171' : '#4ade80', fontWeight: 600 }}>
                                                    {expiryLabel}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </div>

                            <div className="footer-right">
                                <div className="footer-actions-v2">
                                    <div className="game-select-v3" ref={gameSelectRef}>
                                        <div className="game-trigger-v3" onClick={() => setIsGameSelectOpen(!isGameSelectOpen)}>
                                            <div className="game-icon-v3">
                                                <img src="https://www.freepnglogos.com/uploads/gta-5-logo-png/gta-v-green-4.png" alt="GTA V" />
                                            </div>
                                            <span className="game-label-v3">Grand Theft Auto V</span>
                                            <span className="select-chevron-v3">{Icons.chevronDown}</span>
                                        </div>
                                        {isGameSelectOpen && (
                                            <div className="game-dropdown-v3">
                                                <div className="game-option-v3 selected">
                                                    <div className="option-icon">
                                                        <img src="https://www.freepnglogos.com/uploads/gta-5-logo-png/gta-v-green-4.png" alt="GTA V" />
                                                    </div>
                                                    <span>Grand Theft Auto V</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="game-select-v3" ref={versionSelectRef}>
                                        <div className="game-trigger-v3" onClick={() => setIsVersionSelectOpen(!isVersionSelectOpen)}>
                                            <span className="game-label-v3">{version} Edition</span>
                                            <span className="select-chevron-v3">{Icons.chevronDown}</span>
                                        </div>
                                        {isVersionSelectOpen && (
                                            <div className="game-dropdown-v3">
                                                <div className={`game-option-v3 ${version === 'Enhanced' ? 'selected' : ''}`}
                                                    onClick={() => { setVersion('Enhanced'); setIsVersionSelectOpen(false) }}>
                                                    Enhanced Edition
                                                </div>
                                                <div className={`game-option-v3 ${version === 'Legacy' ? 'selected' : ''}`}
                                                    onClick={() => { setVersion('Legacy'); setIsVersionSelectOpen(false) }}>
                                                    Legacy Edition
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </footer>
                    )}
                </main>

                {/* Sleek Update Overlay - Bottom Anchored & Professional */}
                {updateAvailable && (
                    <div style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 99999,
                        backgroundColor: 'rgba(9, 9, 11, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '20px 40px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '40px',
                            position: 'relative'
                        }}>
                            {/* Top accent line */}
                            <div style={{
                                position: 'absolute',
                                top: -1,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '150px',
                                height: '1px',
                                background: 'linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.5), transparent)'
                            }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: 'rgba(124, 58, 237, 0.12)',
                                        border: '1px solid rgba(124, 58, 237, 0.3)',
                                        color: '#c084fc',
                                        fontSize: '10px',
                                        fontWeight: 800,
                                        letterSpacing: '0.8px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {updateAvailable.isUpToDateModal ? 'Status' : 'Update'}
                                    </div>
                                    <h2 style={{
                                        fontSize: '22px',
                                        fontWeight: 800,
                                        color: 'white',
                                        margin: 0,
                                        letterSpacing: '-0.5px'
                                    }}>
                                        v{updateAvailable.latest}
                                    </h2>
                                </div>

                                <div style={{
                                    fontSize: '14px',
                                    color: '#a1a1aa',
                                    fontWeight: 400,
                                    lineHeight: '1.4',
                                    maxWidth: '500px'
                                }}>
                                    {updateAvailable.isUpToDateModal ? (
                                        "Nexus Launcher is currently up to date."
                                    ) : (
                                        <span style={{ color: '#d4d4d8' }}>
                                            {updateAvailable.changelog || "Critical performance updates and new features are ready for installation."}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: isUpdateDownloading ? '240px' : 'auto' }}>
                                {isUpdateDownloading ? (
                                    <div style={{ width: '240px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a', fontSize: '11px', marginBottom: '8px', fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1.5s linear infinite', color: '#a78bfa' }}>
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                </svg>
                                                Downloading...
                                            </div>
                                            <span style={{ color: '#e4e4e7' }}>{dlProgress?.percent || 0}%</span>
                                        </div>
                                        <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${dlProgress?.percent || 0}%`,
                                                background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
                                                boxShadow: '0 0 10px rgba(124, 58, 237, 0.3)',
                                                transition: 'width 0.3s ease-out'
                                            }} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSkipUpdate}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '8px',
                                                background: 'transparent',
                                                color: '#71717a',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                border: '1px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = 'white', e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a', e.currentTarget.style.background = 'transparent')}
                                        >
                                            {updateAvailable.isUpToDateModal ? 'Close' : 'Later'}
                                        </button>
                                        <button
                                            onClick={handleDownloadUpdate}
                                            style={{
                                                padding: '10px 24px',
                                                borderRadius: '8px',
                                                background: '#7c3aed',
                                                color: 'white',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = '#8b5cf6', e.currentTarget.style.transform = 'translateY(-1px)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = '#7c3aed', e.currentTarget.style.transform = 'translateY(0)')}
                                        >
                                            {updateAvailable.isUpToDateModal ? 'Refresh' : 'Install Update'}
                                            {!updateAvailable.isUpToDateModal && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 5v14M5 12l7 7 7-7" />
                                                </svg>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default App
