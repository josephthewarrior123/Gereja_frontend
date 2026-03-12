import { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export function LoadingProvider(props) {
    const [loading, setLoading] = useState(false);

    const start = () => setLoading(true);
    const stop = () => setLoading(false);

    const value = {
        start,
        stop,
    };

    return (
        <LoadingContext.Provider value={value}>
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {loading && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.65)',
                        backdropFilter: 'blur(3px)',
                    }}>
                        <div style={{
                            width: 44,
                            height: 44,
                            border: '3.5px solid #f0f0f0',
                            borderTop: '3.5px solid #F5B800',
                            borderRadius: '50%',
                            animation: 'global-spin 0.8s linear infinite',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }} />
                        <style>{`
                            @keyframes global-spin {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                )}
                {props.children}
            </div>
        </LoadingContext.Provider>
    );
}

export const useLoading = () => useContext(LoadingContext);
