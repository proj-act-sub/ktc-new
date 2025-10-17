import React, { useState, useRef, useMemo } from 'react'
import {
  Box, TextField, Button, Typography, MenuItem, Grid, InputLabel,
  FormControl, Select, FormHelperText, CircularProgress, IconButton
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DeleteIcon from '@mui/icons-material/Delete'
import slugify from 'slugify'
import ConfirmDialog from './ConfirmDialog'
import { useToast } from './ToastProvider'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

const DEFAULT_TYPES = ['Hackathon', 'Workshop', 'Meetup', 'Talk', 'Other']

export default function EventForm({ onCreated }){
  const { data: session } = useSession()
  const toast = useToast()
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    college: '',
    date: '',
    location: '',
    type: '',
    customType: '',
    capacity: '',
    description: ''
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const slugPreview = useMemo(() => {
    if (!form.title) return ''
    return slugify(form.title, { lower: true, strict: true }).slice(0, 120)
  }, [form.title])

  function handleChange(k) {
    return (e) => {
      const v = e?.target?.value ?? e
      setForm(prev => ({ ...prev, [k]: v }))
      setErrors(prev => ({ ...prev, [k]: undefined }))
    }
  }

  function handleFile(e){
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast.show('Only image files are allowed', 'error')
      return
    }
    const maxMB = 5
    if (f.size > maxMB * 1024 * 1024) {
      toast.show(`Image too large (max ${maxMB} MB)`, 'error')
      return
    }
    setImageFile(f)
    const url = URL.createObjectURL(f)
    setImagePreview(url)
  }

  function removeImage(){
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validate(){
    const e = {}
    if (!form.title || form.title.trim().length < 3) e.title = 'Title is required (min 3 chars).'
    if (!form.date) e.date = 'Date & time is required.'
    else {
      const dt = new Date(form.date)
      if (isNaN(dt.getTime())) e.date = 'Invalid date/time'
      else if (dt.getTime() <= Date.now()) e.date = 'Date & time must be in the future.'
    }
    if (!form.location) e.location = 'Location is required.'
    const chosenType = form.type === 'Other' ? form.customType : form.type
    if (!chosenType) e.type = 'Choose or enter an event type.'
    if (form.capacity) {
      const n = Number(form.capacity)
      if (!Number.isInteger(n) || n <= 0) e.capacity = 'Capacity must be a positive integer.'
    }
    if (!form.description || form.description.trim().length < 10) e.description = 'Description should be at least 10 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function uploadImage(file){
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.error || 'Upload failed')
      }
      const j = await res.json()
      return j.url
    } catch (err) {
      throw err
    }
  }

  async function doCreate(){
    if (!validate()) return
    setConfirmOpen(false)
    setSubmitting(true)

    try {
      let imageUrl = null
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const payload = {
        title: form.title.trim(),
        college: form.college.trim() || null,
        date: (new Date(form.date)).toISOString(),
        location: form.location.trim(),
        type: form.type === 'Other' ? (form.customType.trim() || 'Other') : form.type,
        capacity: form.capacity ? Number(form.capacity) : null,
        description: form.description.trim(),
        image: imageUrl
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to create event')
      }

      toast.show('Event created successfully', 'success')
      setForm({ title: '', college: '', date: '', location: '', type: '', customType: '', capacity: '', description: '' })
      removeImage()
      if (onCreated) onCreated(data)
      if (data?.id) {
        router.push(`/event/${data.id}`)
      }
    } catch (err) {
      console.error(err)
      toast.show(err.message || 'Create failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e){
    e?.preventDefault()
    if (!validate()) return
    setConfirmOpen(true)
  }

  if (!session || !['organizer','admin'].includes(session.user?.role)) {
    return <Typography color="text.secondary">You need to be an organizer or admin to create events.</Typography>
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate aria-label="Create event form">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField label="Title" value={form.title} onChange={handleChange('title')} fullWidth required error={!!errors.title} helperText={errors.title} />
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>Slug preview: <code>{slugPreview || '—'}</code></Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="College / Organizer" value={form.college} onChange={handleChange('college')} fullWidth helperText="Optional" />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Date & time"
            type="datetime-local"
            value={form.date}
            onChange={handleChange('date')}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            error={!!errors.date}
            helperText={errors.date || 'Local timezone'}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="Location" value={form.location} onChange={handleChange('location')} fullWidth required error={!!errors.location} helperText={errors.location} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.type}>
            <InputLabel id="type-label">Event type</InputLabel>
            <Select labelId="type-label" label="Event type" value={form.type} onChange={handleChange('type')}>
              <MenuItem value=""><em>None</em></MenuItem>
              {DEFAULT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              <MenuItem value="Other">Other (enter below)</MenuItem>
            </Select>
            <FormHelperText>{errors.type || 'Choose a category for discoverability'}</FormHelperText>
          </FormControl>
        </Grid>

        {form.type === 'Other' && (
          <Grid item xs={12}>
            <TextField label="Custom type" value={form.customType} onChange={handleChange('customType')} fullWidth required />
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <TextField label="Capacity" value={form.capacity} onChange={handleChange('capacity')} type="number" fullWidth error={!!errors.capacity} helperText={errors.capacity || 'Optional — leave blank for unlimited'} inputProps={{ min: 1 }} />
        </Grid>

        <Grid item xs={12}>
          <TextField label="Description" value={form.description} onChange={handleChange('description')} fullWidth multiline rows={5} required error={!!errors.description} helperText={errors.description || 'Describe the event, agenda, prerequisites, contact info.'} />
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" gap={2} alignItems="center">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} id="event-image" />
            <label htmlFor="event-image">
              <Button component="span" startIcon={<UploadFileIcon />} aria-label="Upload event image">
                {imageFile ? 'Change image' : 'Upload cover image'}
              </Button>
            </label>

            {imagePreview && (
              <Box display="flex" alignItems="center" gap={1}>
                <Box component="img" src={imagePreview} alt="Preview" sx={{ width: 100, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)' }} />
                <IconButton onClick={removeImage} aria-label="Remove image"><DeleteIcon /></IconButton>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              Accepted: images up to 5MB.
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} display="flex" justifyContent="flex-end">
          <Button onClick={() => {
            setForm({ title: '', college: '', date: '', location: '', type: '', customType: '', capacity: '', description: '' })
            removeImage()
            setErrors({})
            toast.show('Form cleared', 'info')
          }} disabled={submitting}>Clear</Button>

          <Box sx={{ ml: 2 }}>
            <Button type="submit" variant="contained" disabled={submitting} aria-disabled={submitting}>
              {submitting ? <CircularProgress size={20} /> : 'Publish event'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmOpen}
        title="Publish event?"
        description={`You're about to publish "${form.title}". This will be visible to participants.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doCreate}
        confirmLabel="Publish"
      />
    </Box>
  )
}
