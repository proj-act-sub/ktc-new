import prisma from '../lib/prisma'
import EventCard from '../components/EventCard'
import { useState } from 'react'
import Link from 'next/link'
import { Container, Grid, TextField, MenuItem, Box, Button, Typography } from '@mui/material'

export async function getServerSideProps(){
  const events = await prisma.event.findMany({ orderBy: { date: 'asc' } })
  return { props: { events: JSON.parse(JSON.stringify(events)) } }
}

export default function Home({ events: initial }) {
  const [events] = useState(initial)
  const [q, setQ] = useState('')
  const [type, setType] = useState('')

  const types = Array.from(new Set(initial.map(e => e.type).filter(Boolean)))

  const filtered = events.filter(e => {
    if (type && e.type !== type) return false
    if (q && !(e.title + (e.college||'') + e.description).toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return (
    <Container sx={{ py: 4 }}>
      <Box display="flex" gap={2} mb={3}>
        <TextField label="Search events" value={q} onChange={e=>setQ(e.target.value)} fullWidth />
        <TextField select label="Type" value={type} onChange={e=>setType(e.target.value)} sx={{ width: 200 }}>
          <MenuItem value=''>All</MenuItem>
          {types.map(t=> <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <Link href="/dashboard" passHref><Button>Organizer</Button></Link>
      </Box>

      <Grid container spacing={2}>
        {filtered.map(e=> (
          <Grid item xs={12} sm={6} md={4} key={e.id}>
            <EventCard event={e} />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
