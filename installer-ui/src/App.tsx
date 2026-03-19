import { useState, useEffect } from 'react'
import './App.css'

const installer = (window as any).installer

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

export default function App() {
    const [percent, setPercent] = useState(0)
    const [label, setLabel] = useState('Initializing...')
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)
    const [logoFrames, setLogoFrames] = useState<string[]>([])

    useEffect(() => {
        // Load animated logo frames from the same path as the launcher
        installer?.getLogoFrames().then((result: { frames: string[] }) => {
            if (result?.frames?.length) setLogoFrames(result.frames)
        })

        installer?.onProgress(({ percent, label }: { percent: number; label: string }) => {
            setPercent(percent)
            setLabel(label)
            if (percent >= 100) setDone(true)
        })
        installer?.onError((msg: string) => {
            setError(msg)
        })
    }, [])

    return (
        <div className="splash-screen">
            <div className="background-container">
                <div className="orb orb-1" />
                <div className="orb orb-2" />
            </div>

            <div className="splash-content">
                {!error ? (
                    <>
                        <div className="splash-logo">
                            {logoFrames.length > 0 ? (
                                <AnimatedLogo frames={logoFrames} size={80} />
                            ) : (
                                <div className="loading-spinner" />
                            )}
                        </div>

                        <div className="loading-bar-container">
                            <div className="loading-text" style={{
                                fontSize: '13px',
                                color: '#a1a1aa',
                                marginBottom: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}>
                                <span>{done ? '✓ Installation complete!' : label}</span>
                                <span style={{ color: done ? '#4ade80' : undefined }}>{percent}%</span>
                            </div>
                            <div className="loading-bar">
                                <div className="loading-progress" style={{ width: `${percent}%` }} />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{
                        width: '100%',
                        background: '#09090b',
                        border: '1px solid #dc2626',
                        borderRadius: '16px',
                        padding: '36px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
                    }}>
                        <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
                        <button
                            onClick={() => installer?.close()}
                            style={{
                                padding: '6px 18px',
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '6px',
                                color: '#f87171',
                                cursor: 'pointer',
                                fontSize: '12px',
                            }}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
