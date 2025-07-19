import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
    typography: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        color: '#0A0A0A',
        button: {
            fontSize: 16,
            fontWeight: 600
        }
    },
    palette: {
        primary: {
            main: '#013169',
        },
        secondary: {
            main: '#E0EFFF',
        },
    },
    spacing: 4,
    breakpoints: {
        values: {
            xs: 0,
            sm: 40,
            md: 48,
            lg: 64,
            xl: 80,
        },
        unit: 'rem',
    },
});

export function MuiThemeProvider({ children }) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
