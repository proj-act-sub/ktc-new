import React, { useMemo } from 'react'
import { LinearProgress, Typography, Box } from '@mui/material'

function scorePassword(p) {
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score += 1
  if (/[A-Z]/.test(p)) score += 1
  if (/[0-9]/.test(p)) score += 1
  if (/[^A-Za-z0-9]/.test(p)) score += 1
  if (p.length >= 12) score += 1
  return score
}

export default function PasswordStrength({ password }) {
  const score = useMemo(() => scorePassword(password), [password])
  const percent = (score / 5) * 100
  const label = score <= 1 ? 'Very weak' : score === 2 ? 'Weak' : score === 3 ? 'Okay' : score === 4 ? 'Strong' : 'Very strong'
  return (
    <Box mt={1} aria-live="polite">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="caption">{label}</Typography>
        <Typography variant="caption">{password ? `${percent}%` : ''}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 2, mt: 0.5 }} />
    </Box>
  )
}
