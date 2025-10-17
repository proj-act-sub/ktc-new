import React, { useState } from 'react'
import { Container, Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material'
import { useRouter } from 'next/router'
import PasswordStrength from '../../components/PasswordStrength'
import { useToast } from '../../components/ToastProvider'

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', invite: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const toast = useToast()
  const router = useRouter()

  function validate() {
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return 'Enter a valid email.'
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters.'
    if (!form.invite) return 'Invite code is required.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const validation = validate()
    if (validation) { setError(validation); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Signup failed')
        setLoading(false)
        return
      }
      toast.show('Account created — redirecting to sign-in', 'success')
      setTimeout(() => router.push('/auth/signin'), 1100)
    } catch (err) {
      console.error(err)
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h5" mb={2}>Create an account (invite only)</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit} display="grid" gap={2} role="form" aria-label="Sign up form">
        <TextField label="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" />
        <TextField label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
        <TextField label="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required helperText="At least 8 characters, use multiple character types." />
        <PasswordStrength password={form.password} />
        <TextField label="Invite code" value={form.invite} onChange={e => setForm({ ...form, invite: e.target.value.trim() })} inputProps={{ inputMode: 'text', 'aria-label': 'Invite code' }} required />
        <Box display="flex" gap={2} alignItems="center">
          <Button type="submit" variant="contained" disabled={loading} aria-disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Create account'}
          </Button>
          <Button variant="outlined" onClick={() => router.push('/')} disabled={loading}>Cancel</Button>
        </Box>
        <Typography variant="caption" color="text.secondary">
          If you don’t have an invite code, ask an organizer. Invite codes are single-use and may be revoked.
        </Typography>
      </Box>
    </Container>
  )
}
