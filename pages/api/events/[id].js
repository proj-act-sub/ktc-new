import prisma from '../../../lib/prisma'
import { getSession } from 'next-auth/react'
import validator from 'validator'

export default async function handler(req,res){
  const { id } = req.query

  if (req.method === 'GET') {
    const ev = await prisma.event.findUnique({ where: { id } })
    if (!ev) return res.status(404).json({ message: 'Not found' })
    return res.json(ev)
  }

  const session = await getSession({ req })
  if (!session) return res.status(401).json({ message: 'Unauthorized' })

  if (req.method === 'PUT') {
    const ev = await prisma.event.findUnique({ where: { id } })
    if (!ev) return res.status(404).json({ message: 'Not found' })
    if (session.user.role !== 'admin' && ev.createdBy !== session.user.id) return res.status(403).json({ message: 'Forbidden' })

    const { title, college, description, date, location, type, capacity, image } = req.body
    const data = {}
    if (title) data.title = title
    if (college) data.college = college
    if (description) data.description = description
    if (date && validator.isISO8601(date)) data.date = new Date(date)
    if (location) data.location = location
    if (type) data.type = type
    if (capacity) data.capacity = Number(capacity)
    if (image) data.image = image

    const updated = await prisma.event.update({ where: { id }, data })

    try {
      const io = res.socket.server.io
      if (io) io.to(`event:${id}`).emit('event:updated', { eventId: id })
    } catch (e) {}

    return res.json(updated)
  }

  if (req.method === 'DELETE') {
    const ev = await prisma.event.findUnique({ where: { id } })
    if (!ev) return res.status(404).json({ message: 'Not found' })
    if (session.user.role !== 'admin' && ev.createdBy !== session.user.id) return res.status(403).json({ message: 'Forbidden' })
    await prisma.event.delete({ where: { id } })
    return res.json({ ok: true })
  }

  res.setHeader('Allow', ['GET','PUT','DELETE'])
  res.status(405).end()
}
