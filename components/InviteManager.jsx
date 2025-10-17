import React, { useEffect, useState } from 'react'
import { Box, Button, Typography, List, ListItem, ListItemText, IconButton, CircularProgress, Tooltip, MenuItem, Select, FormControl, InputLabel } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import RefreshIcon from '@mui/icons-material/Refresh'
import ConfirmDialog from './ConfirmDialog'
import { useToast } from './ToastProvider'
import { useSession } from 'next-auth/react'

export default function InviteManager() {
  const { data: session } = useSession()
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [newRole, setNewRole] = useState('participant')
  const toast = useToast()

  useEffect(() => { if (session) load() }, [session])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/invites')
      if (!res.ok) throw new Error('Failed to load invites')
      const data = await res.json()
      setInvites(data)
    } catch (err) {
      console.error(err); toast.show('Unable to fetch invite codes', 'error')
    } finally { setLoading(false) }
  }

  async function createOne(role = 'participant') {
    setCreating(true)
    try {
      const res = await fetch('/api/invites', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ count: 1, role }) })
      if (!res.ok) throw new Error('Create failed')
      const newItems = await res.json()
      toast.show('Created invite', 'success')
      setInvites(prev => [...newItems, ...prev])
    } catch (err) {
      console.error(err); toast.show('Failed to create invite', 'error')
    } finally { setCreating(false) }
  }

  function copyToClipboard(code) {
    navigator.clipboard.writeText(code).then(() => toast.show('Copied to clipboard', 'success')).catch(() => toast.show('Copy failed', 'error'))
  }

  function confirmRevoke(inv) {
    setConfirm(inv)
  }

  async function doRevoke(id, revoke) {
    setConfirm(null)
    try {
      const res = await fetch('/api/invites', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, revoke }) })
      if (!res.ok) throw new Error('Revoke failed')
      const updated = await res.json()
      setInvites(prev => prev.map(i => i.id === updated.id ? updated : i))
      toast.show(revoke ? 'Invite revoked' : 'Invite unlocked', 'success')
    } catch (err) { console.error(err); toast.show('Failed to update invite', 'error') }
  }

  if (!session || !['organizer', 'admin'].includes(session.user?.role)) {
    return null
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Invite codes</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <Tooltip title="Refresh list">
            <IconButton onClick={load} aria-label="refresh invites"><RefreshIcon /></IconButton>
          </Tooltip>

          <FormControl sx={{ minWidth: 140 }}>
            <InputLabel id="create-role-label">Role</InputLabel>
            <Select labelId="create-role-label" value={newRole} label="Role" onChange={(e)=>setNewRole(e.target.value)}>
              <MenuItem value="participant">Participant</MenuItem>
              <MenuItem value="organizer">Organizer</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={() => createOne(newRole)} disabled={creating}>
            {creating ? <CircularProgress size={18} /> : 'Create'}
          </Button>
        </Box>
      </Box>

      {loading ? <CircularProgress /> : (
        <List dense aria-label="invite list">
          {invites.length === 0 && <Typography variant="body2" color="text.secondary">No invites yet</Typography>}
          {invites.map(i => (
            <ListItem key={i.id} secondaryAction={
              <Box display="flex" gap={1} alignItems="center">
                <Tooltip title="Copy invite code"><IconButton onClick={() => copyToClipboard(i.code)} aria-label={`copy ${i.code}`}><ContentCopyIcon /></IconButton></Tooltip>
                <Button size="small" onClick={() => confirmRevoke(i)}>{i.revoked ? 'Unrevoke' : 'Revoke'}</Button>
              </Box>
            }>
              <ListItemText primary={<span style={{ fontFamily: 'monospace' }}>{i.code}</span>} secondary={`role: ${i.role} • ${i.usedAt ? 'Used' : 'Unused'} • ${i.revoked ? 'Revoked' : 'Active'} • created ${new Date(i.createdAt).toLocaleString()}`} />
            </ListItem>
          ))}
        </List>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.revoked ? 'Unrevoke invite?' : 'Revoke invite?'}
        description={`Invite ${confirm?.code} will ${confirm?.revoked ? 'become active again' : 'no longer be usable by new signups'}.`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => doRevoke(confirm.id, !confirm.revoked)}
        confirmLabel={confirm?.revoked ? 'Unrevoke' : 'Revoke'}
      />
    </Box>
  )
}
