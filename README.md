<img src="https://storage.googleapis.com/davia-public-assets/open-package/davia_open_repo_banner.png" alt="Davia Banner" style="border-radius: 20px; width: 100%;" />

## What is Davia?

Davia is an open-source tool that generates interactive internal documentation for your local codebase. Point it at a project path and it writes documentation files locally with interactive visualizations that you can edit in a Notion-like platform or locally in your IDE.

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/davialabs/davia.git
cd davia
pnpm i
```

### 2. Configuration

By default, Davia looks for a `.env` file in the root of the project path you provide. Configuration is only optional if there are already API keys in the project path you're generating docs from. To configure API keys in the Davia monorepo instead:

1. Rename `.env.example` to `.env`
2. Add your AI provider API key (we recommend **Anthropic** for best results)
3. Davia will use the first available key in this order: Anthropic → OpenAI → Google

### 3. Run Docs

```bash
pnpm run docs
```

When prompted, enter the absolute path of your project:

```
Enter absolute path of the project to document: [path of the local codebase you want to document]
```

Davia will automatically open a window with the documentation that will start building itself as it analyzes and generates documentation.

### 4. View Results (Optional)

If you stopped the process and want to view the results later, you can launch the visualization app manually:

```bash
pnpm run open
```

Here's an example of how the documentation could look like:

<img src="https://storage.googleapis.com/davia-public-assets/landing-gif/agent-example.png" alt="Design Agent Example" style="border-radius: 20px; width: 100%; max-width: 1200px; display: block; margin: 20px auto;" />

---

## Contributing

Contributions are welcome! We'd love your help to make Davia better:

- **Report bugs or request features** — Open an issue to let us know what's not working or what you'd like to see
- **Improve the codebase** — Submit pull requests with bug fixes, new features, or optimizations
- **Share feedback** — Tell us what you think and help shape Davia's future

---

## Example

<video src="https://storage.googleapis.com/davia-public-assets/landing-gif/davia-docs.mp4" controls style="width: 100%; border-radius: 20px;"></video>

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
