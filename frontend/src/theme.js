import { createTheme } from '@mui/material/styles'

const easing = 'cubic-bezier(0.4, 0, 0.2, 1)'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ccff00' },
    secondary: { main: '#10b981' },
    background: {
      default: 'transparent',
      paper: 'rgba(255,255,255,0.04)',
    },
    text: {
      primary: '#ebebeb',
      secondary: 'rgba(235,235,235,0.6)',
    },
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: '"Space Grotesk", sans-serif',
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.06em',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.06em',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.05em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      fontFamily: '"Space Grotesk", sans-serif',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          transition: `transform .25s ${easing}, box-shadow .25s ${easing}, background-color .25s ${easing}`,
        },
        contained: {
          boxShadow: '0 0 30px rgba(204,255,0,0.25)',
        },
      },
    },
  },
})
