import dotenv from 'dotenv';

// Load once, before any module reads process.env (Prisma pool, JWT, etc.).
dotenv.config({ quiet: true });
