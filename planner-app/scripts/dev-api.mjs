/**
 * Local development API server
 *
 * Runs the Vercel serverless functions locally on port 3001.
 * Loads environment variables from .env.local.
 * Routes requests to the appropriate handler based on URL path.
 *
 * Usage: node scripts/dev-api.mjs
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Load .env.local
function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // File doesn't exist, skip
  }
}

loadEnvFile(resolve(ROOT, '.env.local'));

// Dynamic import of the handlers (TypeScript via tsx)
const PORT = 3001;

async function startServer() {
  // Import handlers - requires tsx or ts-node for TypeScript
  const handlers = {};

  try {
    const parseTaskMod = await import('../api/parse-task.ts');
    handlers['/api/parse-task'] = parseTaskMod.default;
  } catch (err) {
    console.error('Failed to import api/parse-task.ts:', err.message);
    console.error('Make sure you have tsx installed: npm install -D tsx');
    process.exit(1);
  }

  try {
    const generateNoteMod = await import('../api/generate-note.ts');
    handlers['/api/generate-note'] = generateNoteMod.default;
  } catch (err) {
    console.error('Failed to import api/generate-note.ts:', err.message);
    console.error('Make sure you have tsx installed: npm install -D tsx');
    process.exit(1);
  }

  const server = createServer(async (req, res) => {
    // Collect body for POST requests
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      // Parse the URL path (strip query string)
      const urlPath = (req.url || '/').split('?')[0];

      // Find the matching handler
      const handler = handlers[urlPath];
      if (!handler) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: `No handler for ${urlPath}` }));
        return;
      }

      // Create mock VercelRequest/VercelResponse-compatible objects
      const vercelReq = {
        method: req.method,
        headers: req.headers,
        body: body ? JSON.parse(body) : undefined,
        query: {},
      };

      const vercelRes = {
        _statusCode: 200,
        _headers: {},
        _body: null,
        status(code) {
          this._statusCode = code;
          return this;
        },
        setHeader(key, value) {
          this._headers[key] = value;
          return this;
        },
        json(data) {
          this._body = JSON.stringify(data);
          res.writeHead(this._statusCode, {
            ...this._headers,
            'Content-Type': 'application/json',
          });
          res.end(this._body);
          return this;
        },
        end() {
          res.writeHead(this._statusCode, this._headers);
          res.end();
          return this;
        },
      };

      try {
        await handler(vercelReq, vercelRes);
      } catch (err) {
        console.error('Handler error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`API dev server running at http://localhost:${PORT}`);
    console.log(`CLAUDE_API_KEY: ${process.env.CLAUDE_API_KEY ? 'set' : 'NOT SET'}`);
    console.log('');
    console.log('Available endpoints:');
    for (const path of Object.keys(handlers)) {
      console.log(`  POST ${path}`);
    }
    console.log('');
    console.log('Vite proxy will forward /api requests here.');
    console.log('Press Ctrl+C to stop.');
  });
}

startServer();
