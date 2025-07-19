import { Alert, Snackbar } from '@mui/material';
import React, { createContext, useContext, useState } from 'react';

const SnackbarContext = createContext();

export const useAlert = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useAlert must be used within a SnackbarProvider');
    }
    return context;
};

export const SnackbarProvider = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState('error');

    const showMessage = (msg, severity = 'error') => {
        setMessage(msg);
        setSeverity(severity);
        setOpen(true);
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setOpen(false);
    };

    const getSeverityStyles = () => {
        switch (severity) {
            case 'success':
                return 'border-green-500 text-green-700';
            case 'error':
                return 'border-red-500 text-red-700';
            case 'warning':
                return 'border-yellow-500 text-yellow-700';
            case 'info':
                return 'border-blue-500 text-blue-700';
            default:
                return 'border-gray-500 text-gray-700';
        }
    };

    return (
        <SnackbarContext.Provider value={showMessage}>
            {children}
            {open && (
                <Snackbar
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    open={open}
                    onClose={handleClose}
                    autoHideDuration={5000}
                >
                    <Alert
                        onClose={handleClose}
                        severity={severity}
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {message}
                    </Alert>
                </Snackbar>
            )}
        </SnackbarContext.Provider>
    );
};

{
    /* <div className="fixed bottom-5 right-5 flex w-auto max-w-xs items-center justify-between rounded-md border bg-white px-4 py-3 shadow-lg">
<div className={`flex items-center space-x-2 ${getSeverityStyles()}`}>
  {severity === 'success' && <span className="text-green-500">✔</span>}
  {severity === 'error' && <span className="text-red-500">✖</span>}
  {severity === 'warning' && <span className="text-yellow-500">⚠</span>}
  {severity === 'info' && <span className="text-blue-500">ℹ</span>}
  <span className="text-sm">{message}</span>
</div>
<button onClick={() => setOpen(false)} className="ml-3 text-gray-400 hover:text-gray-600">
  ✖
</button>
</div> */
}
