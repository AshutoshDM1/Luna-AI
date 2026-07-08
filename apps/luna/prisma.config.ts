import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './src/backend/prisma/schema.prisma',
  datasource: {
    url: 'file:./src/backend/src/db/dev.db'
  }
})
