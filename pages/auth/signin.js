// pages/auth/signin.js
import React, { useState } from 'react'
import { getCsrfToken, signIn } from 'next-auth/react'
import { Container, Box, TextField, Button, Typography, Alert } from '@mui/material'
import { useRouter } from 'next/router'

export default function SignIn({ csrfToken }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const router = useRouter()

  async function submit(e){
    e.preventDefault()
    setError('')

    const res = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    })

    if (res?.error) setError(res.error)
    else router.push('/')
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h5" mb={2}>Sign in</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Box component="form" onSubmit={submit} display="grid" gap={2}>
        {/* CSRF token included for forms that submit to NextAuth endpoints.
            It's safe to render null here if token isn't available. */}
        <input name="csrfToken" type="hidden" value={csrfToken ?? ''} />
        <TextField label="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <TextField label="Password" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <Box display="flex" gap={2}>
          <Button type="submit" variant="contained">Sign in</Button>
        </Box>
      </Box>
    </Container>
  )
}

export async function getServerSideProps(context) {
  // getCsrfToken() can return undefined — coalesce to null so Next can serialize safely
  const token = await getCsrfToken(context)
  return { props: { csrfToken: token ?? null } }
}
