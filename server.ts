import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distServer = path.join(__dirname, 'dist', 'server.cjs');
const distHtml = path.join(__dirname, 'dist', 'index.html');

// In production / deployed containers, when the pre-compiled server bundle exists, execute it directly
const isBuiltProduction =
  fs.existsSync(distServer) &&
  fs.existsSync(distHtml) &&
  process.env.VITE_DEV_SERVER !== 'true';

if (isBuiltProduction) {
  require(distServer);
} else {
  // In development, load server.app.ts
  await import('./server.app.ts');
}
