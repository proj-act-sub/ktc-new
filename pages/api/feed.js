import prisma from '../../lib/prisma'

function escapeHtml(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

export default async function handler(req, res) {
  const events = await prisma.event.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: 'asc' },
    take: 50
  })
  const base = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`

  const items = events.map(ev => `
    <item>
      <title>${escapeHtml(ev.title)}</title>
      <link>${base}/event/${ev.id}</link>
      <guid>${ev.id}</guid>
      <pubDate>${new Date(ev.createdAt).toUTCString()}</pubDate>
      <description>${escapeHtml(ev.description)}</description>
    </item>
  `).join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Kerala TechConnect — Events</title>
      <link>${base}</link>
      <description>Upcoming tech events in Kerala</description>
      ${items}
    </channel>
  </rss>`

  res.setHeader('Content-Type', 'application/rss+xml')
  res.status(200).send(rss)
}
