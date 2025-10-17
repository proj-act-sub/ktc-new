import React, { createContext, useContext, useState } from 'react'
import { Snackbar, Alert } from '@mui/material'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

export default function ToastProvider({ children }) {
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' })

  function show(message, severity = 'info', duration = 4000) {
    setToast({ open: true, message, severity, duration })
  }
  function close() {
    setToast(t => ({ ...t, open: false }))
  }

  return (
    <ToastContext.Provider value={{ show, close }}>
      {children}
      <Snackbar open={toast.open} autoHideDuration={toast.duration || 4000} onClose={close} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={close} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  )
}
