/* eslint-disable */
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const indexFile = path.join(distDir, "index.js");

const content = `/**
 * Start the Davia web server.
 *
 * @param {Object} [options]
 * @param {number|string} [options.port] - Port to listen on (overrides process.env.PORT).
 * @param {string} [options.hostname] - Hostname to bind to (overrides process.env.HOSTNAME).
 */
function startWebServer(options = {}) {
  const { port, hostname } = options;

  if (port != null) {
    process.env.PORT = String(port);
  }

  if (hostname != null) {
    process.env.HOSTNAME = hostname;
  }

  // Delegate to the standalone Next.js server generated at build time.
  // This preserves the exact behavior of dist/server.js while allowing
  // consumers to customize port/hostname via the options argument.
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

fs.writeFileSync(indexFile, content, "utf8");
console.log("Created dist/index.js with startWebServer entry point");
