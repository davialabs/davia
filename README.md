<img src="https://storage.googleapis.com/davia-public-assets/open-package/davia_open_repo_banner.png" alt="Davia Banner" style="border-radius: 20px; width: 100%;" />

<div align="center">

# Davia

Interactive internal documentation that writes itself. Point Davia at any codebase and watch as it:

</div>

- **Understands your code structure** — Analyzes files, dependencies, and architecture automatically
- **Generates comprehensive documentation** — Creates clear, detailed explanations of how everything works
- **Brings code to life** — Transforms complex relationships into interactive visual diagrams

## Features

- 🎯 Auto-generated documentation from any codebase

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/davialabs/davia.git
cd davia
pnpm i
```

### 2. Configuration (Optional)

By default, Davia looks for a `.env` file in the root of the project path you provide. To configure API keys in the Davia monorepo instead:

1. Rename `.env.example` to `.env`
2. Add your AI provider API key (we recommend **Anthropic** for best results)
3. Davia will use the first available key in this order: Anthropic → OpenAI → Google

### 3. Run Docs

```bash
pnpm run docs
```

### Viewing Results

After documentation generation completes, Davia automatically opens the visualization app. You can also launch it manually:

```bash
pnpm run open
```

## How It Works

Coming soon...

## Contributing

Contributions are welcome! We'd love your help to make Davia better:

- **Report bugs or request features** — Open an issue to let us know what's not working or what you'd like to see
- **Improve the codebase** — Submit pull requests with bug fixes, new features, or optimizations
- **Share feedback** — Tell us what you think and help shape Davia's future

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
