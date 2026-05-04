import path from 'node:path';
import type { PrismaConfig } from 'prisma';

const config: PrismaConfig = {
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
};

export default config;