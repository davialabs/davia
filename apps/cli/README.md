# Davia CLI

A CLI tool for Davia, installable globally via npm, pnpm, yarn, or bun.

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode (with watch)
pnpm dev

# Build for production
pnpm build

# Run the built CLI locally
pnpm start
```

## Publishing

To publish this CLI globally:

1. Build the package:

   ```bash
   pnpm build --filter=cli
   ```

2. Publish to npm:
   ```bash
   cd apps/cli
   npm publish
   ```

## Installation

After publishing, users can install globally:

```bash
# npm
npm install -g davia

# pnpm
pnpm add -g davia

# yarn
yarn global add davia

# bun
bun install -g davia
```

Once installed, users can run:

```bash
davia
```
