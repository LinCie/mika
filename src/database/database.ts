import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '@/config'

const adapter = new PrismaLibSql({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
})
const prisma = new PrismaClient({ adapter })

export { prisma }
