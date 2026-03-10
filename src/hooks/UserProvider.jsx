import { createContext, useContext, useEffect, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser]       = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('needsOnboarding'); // bersihkan flag juga
    };

    // Dipanggil setelah onboarding selesai — update user di context & storage
    const updateUser = (patch) => {
        setUser((prev) => {
            const updated = { ...prev, ...patch };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    const value = { user, login, logout, updateUser, isLoading };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};