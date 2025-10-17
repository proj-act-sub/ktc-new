import prisma from '../../../../lib/prisma'

function fmtICS(d) {
  return d.toISOString().replace(/[-:]|\.\d{3}/g, '')
}
function escapeText(s=''){ return String(s || '').replace(/\n/g,'\\n').replace(/,/g,'\\,') }

export default async function handler(req, res) {
  const { id } = req.query
  const ev = await prisma.event.findUnique({ where: { id } })
  if (!ev) return res.status(404).send('Not found')

  const start = new Date(ev.date)
  const end = new Date(start.getTime() + 2*60*60*1000)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KeralaTechConnect//EN',
    'BEGIN:VEVENT',
    `UID:${ev.id}`,
    `DTSTAMP:${fmtICS(new Date())}`,
    `DTSTART:${fmtICS(start)}`,
    `DTEND:${fmtICS(end)}`,
    `SUMMARY:${escapeText(ev.title)}`,
    `DESCRIPTION:${escapeText(ev.description)}`,
    `LOCATION:${escapeText(ev.location)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${ev.slug || ev.title}.ics"`)
  res.status(200).send(ics)
}
