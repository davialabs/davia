export const EXCALIDRAW_GUIDELINES = `<excalidraw_guidelines>
## Excalidraw Whiteboards (MANDATORY FOR VISUALS)

### Purpose
Excalidraw elements embed interactive whiteboards directly in HTML pages. Whiteboards can contain diagrams, visual workflows, sketches, notes, and other visual content. **Whiteboards are the primary visual tool** - use them liberally to explain concepts visually.

### When to Create Whiteboards
- **ALWAYS when user asks for a visual, chart, diagram, or flow**
- **By default, be ultra-visual** - add whiteboards even if not explicitly requested
- Use for: architecture diagrams, data flows, backend requests, frontend journeys, deployments, schemas, processes, workflows

### Creating Excalidraw Data

**Mermaid Auto-Conversion (MANDATORY -  Use This)**
1. **ALWAYS create mermaid files** in the \`mermaids/\` folder (which already exists in assets)
2. **Mermaid workflow:**
   - Create a \`.mmd\` file in \`mermaids/\` folder (e.g., \`mermaids/architecture-flow.mmd\`)
   - **CRITICAL**: Write the mermaid syntax DIRECTLY in the file - DO NOT use code fences like \`\`\`mermaid\`\`\`
   - Just write the raw mermaid diagram syntax (e.g., \`graph TD\`, \`flowchart LR\`, etc.)
   - The mermaid file will be automatically converted to an Excalidraw JSON file in \`data/\` folder
   - **IMPORTANT**: When embedding in HTML, always point to the JSON file in \`data/\`, NOT the mermaid file
   - Example: If mermaid is \`mermaids/architecture-flow.mmd\`, the converted JSON will be \`data/architecture-flow.json\`
   - Embed using: \`<excalidraw data-path="data/architecture-flow.json"></excalidraw>\`

**Direct JSON Creation (Only for Edge Cases)**
- Only use if mermaid cannot represent what you need
- Create a JSON file with an "elements" property containing ExcalidrawElement objects
- Structure:
\`\`\`json
{
  "elements": [
    // array of ExcalidrawElement objects
  ]
}
\`\`\`

### Embedding in HTML
\`\`\`html
<excalidraw data-path="data/flow-example.json"></excalidraw>
\`\`\`

### Editing Excalidraw Data
- **Small modifications** (colors, styling, minor text changes): Edit the JSON file directly in \`data/\`
- **Structural changes** (adding/removing elements, changing layout): 
  1. Read the current JSON file from \`data/\`, understand its structure, and create/update the corresponding mermaid file in \`mermaids/\` with the same name (using \`.mmd\` extension) - replicate the structure as mermaid syntax with your edits applied (write mermaid syntax directly, no code fences)
  2. The mermaid will be re-converted to JSON automatically

### Text Formatting in Excalidraw
- Do NOT use \`<br>\` for line breaks, use \`\\n\` instead
- This applies when creating text content within Excalidraw elements

</excalidraw_guidelines>`;
