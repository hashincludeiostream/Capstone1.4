import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distServer = path.join(__dirname, 'dist', 'server.cjs');
const distHtml = path.join(__dirname, 'dist', 'index.html');

// Check if running under tsx in development
const isTsxDev =
  process.execArgv.some((arg) => arg.includes('tsx')) ||
  process.env.VITE_DEV_SERVER === 'true';

// In production / deployed containers, when the pre-compiled server bundle exists and not running under tsx:
const isBuiltProduction =
  !isTsxDev &&
  fs.existsSync(distServer) &&
  fs.existsSync(distHtml);

if (isBuiltProduction) {
  process.env.NODE_ENV = 'production';
  require(distServer);
} else {
  // In development, load server.app.ts
  await import('./server.app.ts');
}
