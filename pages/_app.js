import '../styles/globals.css'
import { SessionProvider } from 'next-auth/react'
import ToastProvider from '../components/ToastProvider'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#6750A4' }, secondary: { main: '#006d3b' } },
  shape: { borderRadius: 8 }
})

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
