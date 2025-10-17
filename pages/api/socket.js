import { Server } from 'socket.io'

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io')
    const io = new Server(res.socket.server, {
      path: '/api/socket_io',
      cors: { origin: '*' }
    })
    io.on('connection', socket => {
      socket.on('join:event', (eventId) => {
        socket.join(`event:${eventId}`)
      })
      socket.on('leave:event', (eventId) => {
        socket.leave(`event:${eventId}`)
      })
    })
    res.socket.server.io = io
  }
  res.status(200).end()
}
