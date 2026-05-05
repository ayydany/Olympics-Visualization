import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, StyledEngineProvider } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#cba6f7',
    },
    secondary: {
      main: '#89b4fa',
    },
    background: {
      default: '#1e1e2e',
      paper: '#181825',
    },
    text: {
      primary: '#cdd6f4',
      secondary: '#bac2de',
    },
    divider: '#313244',
  },
  typography: {
    fontFamily: '"Montserrat", sans-serif',
    h1: { fontWeight: 900 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#1e1e2e',
          color: '#cdd6f4',
        },
      },
    },
  },
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
};
