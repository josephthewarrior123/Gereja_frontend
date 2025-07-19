import { createContext, useContext, useEffect, useState } from 'react';
import { useLoading } from './LoadingProvider';
import { useAlert } from './SnackbarProvider';
import UserDAO from '../daos/UserDAO';

const UserContext = createContext({});

export function UserProvider({ children }) {
    const loading = useLoading();
    const message = useAlert();
    const [data, setData] = useState(null);
    const [token, setToken] = useState(null);

    const getSelfData = async () => {
        try {
            loading.start();
            const selfData = await UserDAO.getSelfData();
            setData(selfData);
        } catch (error) {
            if (error.message === 'TOKEN_EXPIRED') {
                logout();
            }
            message(error?.error_message, 'error');
        } finally {
            loading.stop();
        }
    };

    const login = (tokenData) => {
        setToken(tokenData);
        localStorage.setItem('token', tokenData);
        sessionStorage.setItem('token', tokenData);
        getSelfData();
    };

    const logout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setData(null);
        setToken(null);
    };

    const value = {
        data,
        token,
        login,
        logout,
    };

    useEffect(() => {
        const token =
            localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            setToken(token);
            getSelfData();
        }
    }, []);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
