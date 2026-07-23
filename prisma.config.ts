import { defineConfig } from 'prisma/config';
import fs from 'fs';
import path from 'path';

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const firstEqual = trimmed.indexOf('=');
          const key = trimmed.slice(0, firstEqual).trim();
          let value = trimmed.slice(firstEqual + 1).trim();
          
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (key === 'DATABASE_URL') {
            databaseUrl = value;
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error reading .env file:', err);
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl || '',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
