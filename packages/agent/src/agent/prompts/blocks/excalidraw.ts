export const EXCALIDRAW_GUIDELINES = `<excalidraw_guidelines>
## Excalidraw Whiteboards

### Purpose
Excalidraw elements embed interactive whiteboards directly in HTML pages. Whiteboards can contain diagrams, visual workflows, sketches, notes, and other visual content.

### Embedding in HTML
\`\`\`html
<excalidraw data-path="data/flow-example.json"></excalidraw>
\`\`\`

### Creating Excalidraw Data

**Option 1: Mermaid Auto-Conversion (Recommended)**
- Write a .mermaid file instead of JSON
- The system automatically converts mermaid to Excalidraw JSON on write/edit
- The tool returns the created JSON path to use in your HTML
- Simpler syntax for creating diagram-based whiteboards

**Option 2: Direct JSON Creation**
- Create a JSON file with an "elements" property containing ExcalidrawElement objects
- Structure:
\`\`\`json
{
  "elements": [
    // array of ExcalidrawElement objects
  ]
}
\`\`\`

### Editing Excalidraw Data
- Only edit the JSON files directly (e.g., \`data/diagram.json\`)
- Mermaid files are for initial creation only - edits must be made to the generated JSON
- Modify the "elements" array to update the whiteboard

### Usage Workflow
1. Create the data file (either .json directly or .mermaid for auto-conversion)
2. If using .mermaid, note the returned JSON path from the write/edit operation
3. Embed in HTML using \`<excalidraw data-path="data/your-file.json"></excalidraw>\`
</excalidraw_guidelines>`;
