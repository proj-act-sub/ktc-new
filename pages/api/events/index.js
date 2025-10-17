import prisma from '../../../lib/prisma'
import { getSession } from 'next-auth/react'
import slugify from 'slugify'
import { nanoid } from 'nanoid'
import validator from 'validator'

export default async function handler(req, res){
  if(req.method === 'GET'){
    const { q, type, dateFrom, dateTo } = req.query
    const where = {}
    if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { college: { contains: q, mode: 'insensitive' } }]
    if (type) where.type = type
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }
    const events = await prisma.event.findMany({ where, orderBy: { date: 'asc' } })
    return res.json(events)
  }

  if(req.method === 'POST'){
    const session = await getSession({ req })
    if (!session || (session.user.role !== 'organizer' && session.user.role !== 'admin')) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { title, college, description, date, location, type, capacity, image } = req.body
    if (!title || !date) return res.status(400).json({ message: 'Missing required fields' })
    if (!validator.isISO8601(date)) return res.status(400).json({ message: 'Invalid date' })

    const slug = slugify(title, { lower: true, strict: true }) + '-' + nanoid(6)
    const ev = await prisma.event.create({
      data: {
        title, college, description, date: new Date(date), location, type, capacity: capacity ? Number(capacity) : null, image, slug, createdBy: session.user.id
      }
    })

    // emit socket update if available
    try {
      const io = res.socket.server.io
      if (io) io.emit('event:created', { eventId: ev.id })
    } catch(e) { /* ignore */ }

    return res.status(201).json(ev)
  }

  res.setHeader('Allow', ['GET','POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
