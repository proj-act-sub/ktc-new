import React from 'react'
import { Card, CardContent, CardMedia, Typography, Button, Box, Chip } from '@mui/material'
import Link from 'next/link'

export default function EventCard({ event }){
  return (
    <Card sx={{ borderRadius: 2 }}>
      {event.image && <CardMedia component="img" height={140} image={event.image} alt={event.title} />}
      <CardContent>
        <Box display="flex" justifyContent="space-between">
          <div>
            <Link href={`/event/${event.id}`} legacyBehavior><Typography variant="h6" component="a" sx={{ textDecoration: 'none', color: 'inherit' }}>{event.title}</Typography></Link>
            <Typography variant="body2" color="text.secondary">{event.college} • {new Date(event.date).toLocaleString()}</Typography>
          </div>
          <Chip label={event.type} size="small" />
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }}>{event.description}</Typography>
        <Box mt={2} display="flex" gap={1}>
          <Link href={`/event/${event.id}`} legacyBehavior><Button size="small">View</Button></Link>
        </Box>
      </CardContent>
    </Card>
  )
}
