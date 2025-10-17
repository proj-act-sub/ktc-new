import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'

export default function ConfirmDialog({ open, title='Confirm', description, onCancel, onConfirm, confirmLabel='Confirm', cancelLabel='Cancel' }) {
  return (
    <Dialog open={!!open} onClose={onCancel} aria-labelledby="confirm-title" aria-describedby="confirm-desc">
      <DialogTitle id="confirm-title">{title}</DialogTitle>
      <DialogContent>
        {description && <Typography id="confirm-desc">{description}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button onClick={onConfirm} variant="contained" autoFocus>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  )
}
