import prisma from '../../../../lib/prisma'
import { getSession } from 'next-auth/react'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    const comments = await prisma.comment.findMany({ where: { eventId: id }, orderBy: { createdAt: 'desc' } })
    return res.json(comments)
  }

  if (req.method === 'POST') {
    const session = await getSession({ req })
    const { text } = req.body || {}
    if (!text || text.trim().length === 0) return res.status(400).json({ message: 'Comment text required' })

    let userId = null
    let name = null
    if (session) {
      userId = session.user?.id
      name = session.user?.name || session.user?.email
    } else {
      name = req.body.name || 'Guest'
    }

    const comment = await prisma.comment.create({
      data: { eventId: id, userId: userId || undefined, name: name || undefined, text }
    })

    try {
      const io = res.socket.server.io
      if (io) io.to(`event:${id}`).emit('comment:new', { eventId: id, comment })
    } catch (e) {
      console.warn('Socket emit failed', e)
    }

    return res.status(201).json(comment)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end()
}
