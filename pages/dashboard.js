import React from 'react'
import { getSession, useSession } from 'next-auth/react'
import { Container, Typography, Box, Grid, Paper } from '@mui/material'
import InviteManager from '../components/InviteManager'
import EventForm from '../components/EventForm'

export default function Dashboard(){
  const { data: session } = useSession()
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5">Organizer Dashboard</Typography>
      <Box mt={2}>
        <Typography>Welcome, {session?.user?.name || session?.user?.email}</Typography>
      </Box>

      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Create event</Typography>
            <EventForm onCreated={(ev) => { console.log('created', ev) }} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Invites</Typography>
            <InviteManager />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export async function getServerSideProps(ctx){
  const session = await getSession(ctx)
  if (!session) {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }
  if (!['organizer','admin'].includes(session.user.role)) {
    return { redirect: { destination: '/', permanent: false } }
  }
  return { props: {} }
}
