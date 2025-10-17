const { PrismaClient } = require('@prisma/client')
const argon2 = require('argon2')
const crypto = require('crypto')
const prisma = new PrismaClient()

function makeCode() {
  const b = crypto.randomBytes(6)
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function main(){
  const pwHash = await argon2.hash('password123', { type: argon2.argon2id })
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ktc.test' },
    update: {},
    create: { name: 'Admin User', email: 'admin@ktc.test', password: pwHash, role: 'admin' }
  })

  await prisma.inviteCode.deleteMany()
  // create one organizer invite and two participant invites
  const invites = [
    { code: makeCode(), role: 'organizer' },
    { code: makeCode(), role: 'participant' },
    { code: makeCode(), role: 'participant' }
  ]
  for(const i of invites){
    await prisma.inviteCode.create({ data: { code: i.code, role: i.role, createdBy: admin.id } })
  }

  await prisma.event.deleteMany()
  const now = new Date()
  await prisma.event.createMany({
    data: [
      {
        title: 'Kerala Hackathon 2025',
        slug: 'kerala-hackathon-2025',
        college: 'College of Engineering, Trivandrum',
        description: '24-hour hackathon for students',
        date: new Date(now.getTime() + 7*24*3600*1000).toISOString(),
        location: 'Trivandrum',
        type: 'Hackathon',
        capacity: 150,
        createdBy: admin.id
      },
      {
        title: 'Web Dev Workshop',
        slug: 'web-dev-workshop',
        college: 'NIT Calicut',
        description: 'Hands-on workshop on React + MUI',
        date: new Date(now.getTime() + 14*24*3600*1000).toISOString(),
        location: 'Calicut',
        type: 'Workshop',
        capacity: 80,
        createdBy: admin.id
      }
    ]
  })

  console.log('Seed done. Admin:', admin.email)
  console.log('Invite codes:')
  for (const it of invites) console.log(`${it.role}: ${it.code}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => process.exit())
