<img src="https://storage.googleapis.com/davia-public-assets/open-package/davia_open_repo_banner.png" alt="Davia Banner" style="border-radius: 20px; width: 100%;" />

<p align="center">
    <a href="https://github.com/davialabs/davia/stargazers" alt="GitHub stars">
        <img src="https://img.shields.io/github/stars/davialabs/davia?style=social" /></a>
    <a href="https://github.com/davialabs/davia/blob/main/LICENSE" alt="License">
        <img src="https://img.shields.io/github/license/davialabs/davia" /></a>
    <a href="https://github.com/davialabs/davia/issues" alt="GitHub Issues">
        <img src="https://img.shields.io/github/issues/davialabs/davia" /></a>
    <a href="https://x.com/DaviaLabs" alt="X follow DaviaLabs">
        <img src="https://img.shields.io/twitter/follow/DaviaLabs?style=social" /></a>
    <a href="https://discord.gg/A79mEzP8me" alt="Discord">
        <img src="https://dcbadge.limes.pink/api/server/A79mEzP8me?style=flat" /></a>
</p>

## What is Davia?

Davia is an **open-source tool** that generates **interactive internal documentation** for your local codebase. Point it at a project path and it writes documentation files locally with **interactive visualizations** that you can edit in a **Notion-like platform** or locally in your **IDE**.

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/davialabs/davia.git
cd davia
pnpm i
```

### 2. Configuration

By default, Davia looks for a **`.env` file** in the root of the project path you provide. Configuration is **only optional** if there are already API keys in the project path you're generating docs from. To configure API keys in the **Davia monorepo** instead:

1. Rename `.env.example` to `.env`
2. Add your AI provider API key (we recommend **Anthropic** for best results)
3. Davia will use the first available key in this order: Anthropic → OpenAI → Google

### 3. Run Docs

```bash
pnpm run docs
```

When prompted, enter the **absolute path** of your project:

```
Enter absolute path of the project to document: [path of the local codebase you want to document]
```

Davia spins up a docs window that populates in real time, and you can edit the pages as they appear.

### 4. View Results (Optional)

If you stopped the process and want to view the results later, you can **launch the visualization app** manually:

```bash
pnpm run open
```

This is the Davia workspace view of your generated docs:

<img src="https://storage.googleapis.com/davia-public-assets/landing-gif/agent-example.png" alt="Design Agent Example" style="border-radius: 20px; width: 100%; max-width: 1200px; display: block; margin: 20px auto;" />

---

## Contributing

Contributions are welcome! We'd love your help to make Davia better:

- **Report bugs or request features** — Open an issue to let us know what's not working or what you'd like to see
- **Improve the codebase** — Submit pull requests with bug fixes, new features, or optimizations
- **Share feedback** — Tell us what you think and help shape Davia's future

---

## Example

https://github.com/user-attachments/assets/6eecb62f-3c13-434a-9aa0-a8dd3840bf49

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
