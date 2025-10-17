import { getSession } from 'next-auth/react'
import prisma from '../../lib/prisma'
import crypto from 'crypto'

function makeCode(){
  const b = crypto.randomBytes(6)
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export default async function handler(req,res){
  const session = await getSession({ req })
  if (!session) return res.status(401).json({ message: 'Unauthorized' })
  if (!['organizer','admin'].includes(session.user.role)) return res.status(403).json({ message: 'Forbidden' })

  if (req.method === 'GET'){
    const list = await prisma.inviteCode.findMany({ orderBy: { createdAt: 'desc' } })
    return res.json(list)
  }

  if (req.method === 'POST'){
    const { count = 1, role = 'participant' } = req.body || {}
    if (!['participant','organizer','admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' })
    const created = []
    for(let i=0;i<Math.max(1, Math.min(20, Number(count)));i++){
      const code = makeCode()
      const r = await prisma.inviteCode.create({ data: { code, createdBy: session.user.id, role } })
      created.push(r)
    }
    return res.status(201).json(created)
  }

  if (req.method === 'PUT'){
    const { id, revoke } = req.body || {}
    if (!id) return res.status(400).json({ message: 'id required' })
    const updated = await prisma.inviteCode.update({ where: { id }, data: { revoked: !!revoke } })
    return res.json(updated)
  }

  res.setHeader('Allow', ['GET','POST','PUT'])
  res.status(405).end()
}
