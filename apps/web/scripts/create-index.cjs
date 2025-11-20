/* eslint-disable */
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");

// TypeScript declarations
const dtsContent = `/**
 * Options for starting the Davia web server.
 */
export interface StartWebServerOptions {
  /**
   * Port to listen on (overrides process.env.PORT).
   * @default 3000
   */
  port?: number | string;

  /**
   * Hostname to bind to (overrides process.env.HOSTNAME).
   * @default '0.0.0.0'
   */
  hostname?: string;
}

/**
 * Start the Davia web server.
 *
 * @param options - Configuration options for the server.
 * @returns A promise that resolves when the server is started.
 *
 * @example
 * \`\`\`typescript
 * import { startWebServer } from '@davia/web';
 * 
 * await startWebServer({ port: 4000, hostname: 'localhost' });
 * \`\`\`
 */
export function startWebServer(options?: StartWebServerOptions): Promise<void>;
`;

// ESM version
const esmContent = `/**
 * Start the Davia web server.
 *
 * @param {Object} [options]
 * @param {number|string} [options.port] - Port to listen on.
 * @param {string} [options.hostname] - Hostname to bind to.
 */
export async function startWebServer(options = {}) {
  const { port, hostname } = options;

  if (port != null) {
    process.env.PORT = String(port);
  }

  if (hostname != null) {
    process.env.HOSTNAME = hostname;
  }

  // Dynamic import of CommonJS server.js
  await import('./server.js');
}

// CLI entry point
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  startWebServer();
}
`;

// CJS version
const cjsContent = `/**
 * Start the Davia web server.
 *
 * @param {Object} [options]
 * @param {number|string} [options.port] - Port to listen on.
 * @param {string} [options.hostname] - Hostname to bind to.
 */
function startWebServer(options = {}) {
  const { port, hostname } = options;

  if (port != null) {
    process.env.PORT = String(port);
  }

  if (hostname != null) {
    process.env.HOSTNAME = hostname;
  }

  require('./server.js');
}

module.exports = {
  startWebServer,
};

if (require.main === module) {
  startWebServer();
}
`;

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(path.join(distDir, "index.d.ts"), dtsContent, "utf8");
fs.writeFileSync(path.join(distDir, "index.mjs"), esmContent, "utf8");
fs.writeFileSync(path.join(distDir, "index.cjs"), cjsContent, "utf8");

console.log("✓ Created dist/index.d.ts (TypeScript declarations)");
console.log("✓ Created dist/index.mjs (ESM)");
console.log("✓ Created dist/index.cjs (CJS)");
