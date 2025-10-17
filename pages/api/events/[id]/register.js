import prisma from '../../../../lib/prisma'
import { getSession } from 'next-auth/react'

export default async function handler(req, res) {
  const { id } = req.query
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { name, email } = req.body || {}
  if (!email) return res.status(400).json({ message: 'Email required' })

  const ev = await prisma.event.findUnique({ where: { id } })
  if (!ev) return res.status(404).json({ message: 'Event not found' })

  if (ev.capacity) {
    const count = await prisma.attendee.count({ where: { eventId: id } })
    if (count >= ev.capacity) return res.status(400).json({ message: 'Event is full' })
  }

  const attendee = await prisma.attendee.create({
    data: { eventId: id, name: name || null, email }
  })

  try {
    const io = res.socket.server.io
    if (io) io.to(`event:${id}`).emit('event:registered', { eventId: id, attendee })
  } catch (e) {
    console.warn('Socket emit failed', e)
  }

  return res.status(201).json(attendee)
}
