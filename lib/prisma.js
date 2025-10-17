import { PrismaClient } from '@prisma/client'

if (!globalThis.prisma) {
  globalThis.prisma = new PrismaClient()
}
export default globalThis.prisma
