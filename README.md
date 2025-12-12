<img src="https://storage.googleapis.com/davia-public-assets/open-package/davia_open_repo_banner.png" alt="Davia Banner" style="border-radius: 20px; width: 100%;" />

---

<div align="center">

[![Website](https://storage.googleapis.com/davia-public-assets/open-package/badges/website-badge.svg?v=1)](https://davia.ai?utm_source=github-readme)
&nbsp;
[![Docs](https://storage.googleapis.com/davia-public-assets/open-package/badges/docs-badge.svg?v=1)](https://docs.davia.ai?utm_source=github-readme)
&nbsp;
[![Package](https://storage.googleapis.com/davia-public-assets/open-package/badges/package-badge.svg?v=1)](https://www.npmjs.com/package/davia?utm_source=github-readme)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
[![Discord](https://storage.googleapis.com/davia-public-assets/open-package/badges/discord-badge.svg?v=1)](https://discord.gg/A79mEzP8me)
&nbsp;
[![Cloud](https://storage.googleapis.com/davia-public-assets/open-package/badges/cloud-badge.svg?v=1)](https://davia.ai/login?utm_source=github-readme)

</div>

## What is Davia?

Davia is an **open-source tool** designed for **AI coding agents** to generate **interactive internal documentation** for your codebase. When your AI coding agent uses Davia, it writes documentation files locally with **interactive visualizations** and **editable whiteboards** that you can edit in a **Notion-like platform** or locally in your **IDE**.

<img src="https://storage.googleapis.com/davia-public-assets/landing-gif/excalidraw.png" alt="Excalidraw Example" style="border-radius: 20px; width: 100%; max-width: 400px; display: block; margin: 20px auto;" />

---

## Quick Start

> 📚 For detailed documentation, visit [docs.davia.ai](https://docs.davia.ai/)

### 1. Install Davia CLI

```bash
npm i -g davia
```

### 2. Initialize Davia

Initialize Davia with your coding agent:

```bash
davia init --agent=[name of your coding agent]
```

Replace `[name of your coding agent]` with the name of your coding agent (e.g., `cursor`, `github-copilot`, `windsurf`, `claude-code`, `augment`).

### 3. Generate Documentation

Ask your AI coding agent to write the documentation for your project. Your agent will use Davia's tools to generate interactive documentation with visualizations and editable whiteboards.

### 4. View Your Documentation

Once your agent has generated the documentation, open the Davia workspace:

```bash
davia open
```

If the page doesn't load immediately, **refresh the page** in your browser.

### 5. Collaborate with Your Team

Sync your local documentation to a remote workspace where you can collaborate with your team in real-time:

```bash
davia push
```

This command will:

- Ask you to log in if you haven't already (opens browser for authentication)
- Create a new workspace for your project
- Upload your documentation to the cloud
- Open your workspace in the browser

> **📝 Note:** Currently, updating a workspace you've already pushed isn't supported yet, but we'll be adding this feature very soon!

This is the view you'll have after sending your docs to the workspace:

<img src="https://storage.googleapis.com/davia-public-assets/landing-gif/workspace-view.png" alt="Design Agent Example" style="border-radius: 20px; width: 100%; max-width: 1200px; display: block; margin: 20px auto;" />

---

## Contributing

Contributions are welcome! We'd love your help to make Davia better:

- **Report bugs or request features** — Open an issue to let us know what's not working or what you'd like to see
- **Improve the codebase** — Submit pull requests with bug fixes, new features, or optimizations
- **Share feedback** — Share your feedback on [Discord](https://discord.gg/A79mEzP8me) and help shape Davia's future

---

## Example

https://github.com/user-attachments/assets/dc2121c3-811d-47da-8762-0d5afd5c845d

Another example with flows:

https://github.com/user-attachments/assets/6eecb62f-3c13-434a-9aa0-a8dd3840bf49

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
    <a href="https://github.com/davialabs/davia/stargazers" alt="GitHub stars">
        <img src="https://img.shields.io/github/stars/davialabs/davia?style=social" /></a>
    <a href="https://github.com/davialabs/davia/blob/main/LICENSE" alt="License">
        <img src="https://img.shields.io/github/license/davialabs/davia?style=flat&cacheSeconds=0" /></a>
    <a href="https://github.com/davialabs/davia/issues" alt="GitHub Issues">
        <img src="https://img.shields.io/github/issues/davialabs/davia" /></a>
    <a href="https://www.npmjs.com/package/davia" alt="npm">
        <img src="https://img.shields.io/npm/v/davia" /></a>
    <a href="https://x.com/DaviaLabs" alt="X follow DaviaLabs">
        <img src="https://img.shields.io/twitter/follow/DaviaLabs?style=social" /></a>
    <a href="https://discord.gg/A79mEzP8me" alt="Discord">
        <img src="https://dcbadge.limes.pink/api/server/A79mEzP8me?style=flat" /></a>
    <a href="https://www.reddit.com/r/davia_ai/" alt="Reddit">
        <img src="https://img.shields.io/reddit/subreddit-subscribers/davia_ai?style=social&label=r/davia_ai" /></a>
    <a href="https://docs.davia.ai/" alt="Documentation">
        <img src="https://img.shields.io/badge/docs-davia.ai-blue?style=flat" /></a>
</p>
