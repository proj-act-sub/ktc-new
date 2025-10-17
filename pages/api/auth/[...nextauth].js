import prisma from '../../../lib/prisma'
import { hashPassword } from '../../../lib/hash'

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const { name, email, password, invite } = req.body || {}
  if (!email || !password || !invite) return res.status(400).json({ message: 'Missing fields (email, password, invite required)' })

  const inv = await prisma.inviteCode.findUnique({ where: { code: invite } })
  if (!inv) return res.status(400).json({ message: 'Invalid invite code' })
  if (inv.revoked) return res.status(400).json({ message: 'Invite code revoked' })
  if (inv.usedAt) return res.status(400).json({ message: 'Invite already used' })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return res.status(409).json({ message: 'User with this email already exists' })

  // Determine user role from invite
  const role = inv.role || 'participant'

  const hashed = await hashPassword(password)
  const user = await prisma.user.create({ data: { name, email, password: hashed, role } })
  await prisma.inviteCode.update({ where: { id: inv.id }, data: { usedBy: user.id, usedAt: new Date() } })

  return res.status(201).json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}
