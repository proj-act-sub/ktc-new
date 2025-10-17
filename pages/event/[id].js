import prisma from '../../lib/prisma'
import { Container, Typography, Box, Button, TextField, List, ListItem, ListItemText } from '@mui/material'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import io from 'socket.io-client'
import { useSession } from 'next-auth/react'

let socket

export async function getServerSideProps({ params }) {
  const ev = await prisma.event.findUnique({ where: { id: params.id } })
  if (!ev) return { notFound: true }
  return { props: { ev: JSON.parse(JSON.stringify(ev)) } }
}

export default function EventDetail({ ev }) {
  const [event, setEvent] = useState(ev)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState([])
  const [registered, setRegistered] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    // fetch comments
    fetch(`/api/events/${ev.id}/comments`).then(r=>r.json()).then(setComments).catch(()=>{})

    // ensure socket endpoint is initialized server-side
    fetch('/api/socket').finally(() => {
      if (!socket) socket = io({ path: '/api/socket_io' })
      socket.emit('join:event', ev.id)

      socket.on('event:updated', (payload) => {
        if (payload.eventId === ev.id) {
          fetch(`/api/events/${ev.id}`).then(r=>r.json()).then(setEvent)
        }
      })
      socket.on('comment:new', (payload) => {
        if (payload.eventId === ev.id) {
          setComments(prev => [payload.comment, ...prev])
        }
      })
      socket.on('event:registered', (payload) => {
        if (payload.eventId === ev.id) {
          setRegistered(true)
        }
      })
    })

    return () => {
      if (socket) {
        socket.emit('leave:event', ev.id)
      }
    }
  }, [ev.id])

  async function register() {
    const email = prompt('Enter email to register for this event:')
    if (!email) return
    try {
      const res = await fetch(`/api/events/${ev.id}/register`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, name: session?.user?.name }) })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        alert(j.message || 'Registration failed')
        return
      }
      const a = await res.json()
      alert('Registered — check your calendar (.ics) or add to Google Calendar.')
      setRegistered(true)
    } catch (err) {
      console.error(err)
      alert('Network error')
    }
  }

  async function postComment(e) {
    e?.preventDefault()
    if (!commentText.trim()) return
    try {
      const res = await fetch(`/api/events/${ev.id}/comments`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: commentText }) })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        alert(j.message || 'Comment failed')
        return
      }
      const c = await res.json()
      setCommentText('')
      setComments(prev => [c, ...prev])
    } catch (err) {
      console.error(err)
    }
  }

  function downloadICS() {
    window.location.href = `/api/events/${ev.id}/ics`
  }

  function addToGoogle(){
    const start = new Date(ev.date).toISOString().replace(/[-:]|\.\d{3}/g,'')
    const end = new Date(new Date(ev.date).getTime()+2*3600*1000).toISOString().replace(/[-:]|\.\d{3}/g,'')
    const g = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(ev.title)}&dates=${start}/${end}&details=${encodeURIComponent(ev.description)}&location=${encodeURIComponent(ev.location)}`
    window.open(g,'_blank')
  }

  function shareTwitter(){
    const u = encodeURIComponent(location.href)
    const t = encodeURIComponent(`${ev.title} — ${ev.location} on ${new Date(ev.date).toLocaleString()}`)
    window.open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`,'_blank')
  }

  function copyLink(){
    navigator.clipboard.writeText(location.href).then(()=> alert('Link copied'))
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4">{event.title}</Typography>
      <Typography color="text.secondary">{event.college} • {new Date(event.date).toLocaleString()}</Typography>
      <Box mt={2}><Typography>{event.description}</Typography></Box>

      <Box mt={3} display="flex" gap={2}>
        <Button variant="contained" onClick={register}>Register</Button>
        <Button variant="outlined" onClick={downloadICS}>Download .ics</Button>
        <Button onClick={addToGoogle}>Add to Google Calendar</Button>
        <Button onClick={shareTwitter}>Share</Button>
        <Button onClick={copyLink}>Copy link</Button>
      </Box>

      <Box mt={4}>
        <Typography variant="h6">Discussion</Typography>
        <Box component="form" onSubmit={postComment} display="flex" gap={2} mt={1}>
          <TextField placeholder="Write a comment" fullWidth value={commentText} onChange={e=>setCommentText(e.target.value)} />
          <Button type="submit">Post</Button>
        </Box>

        <List>
          {comments.map(c => (
            <ListItem key={c.id}><ListItemText primary={c.text} secondary={`${c.name || 'User'} • ${new Date(c.createdAt).toLocaleString()}`} /></ListItem>
          ))}
        </List>
      </Box>

      <Box mt={4}>
        <Link href="/"><Button>Back</Button></Link>
      </Box>
    </Container>
  )
}
