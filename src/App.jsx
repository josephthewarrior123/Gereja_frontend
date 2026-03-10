import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router';
import { LoadingProvider } from './hooks/LoadingProvider';
import { MuiThemeProvider } from './hooks/MuiThemeProvider';
import { SnackbarProvider } from './hooks/SnackbarProvider';
import { UserProvider } from './hooks/UserProvider';
import AppRoutes from './AppRoutes';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function App() {
    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <BrowserRouter>
                <UserProvider>
                    <MuiThemeProvider>
                        <LoadingProvider>
                            <SnackbarProvider>
                                <AppRoutes />
                            </SnackbarProvider>
                        </LoadingProvider>
                    </MuiThemeProvider>
                </UserProvider>
            </BrowserRouter>
        </GoogleOAuthProvider>
    );
}