export const AVAILABLE_PACKAGES = `<available_packages>
Here are the available secondary packages for you to use to build your components:
- @xyflow/react@12.9.1 : A highly customizable React library for building node-based editors, interactive diagrams, and workflow visualizations. It provides a complete solution for creating flowcharts, diagrams, process flows, data pipelines, and any node-based interface.

Important usage notes:
  * NO CSS import needed - do NOT include \`import "@xyflow/react/dist/style.css"\`
  * Wrap ReactFlow in a div with inline style: \`style={ height: "24rem", width: "100%" }\` (increase height if the user asks for a bigger view)
  * Always include \`<Controls showInteractive={false} />\` by default unless user asks to remove them
  * Do NOT use the \`<Background />\` component unless explicitly requested by the user
  * Always pass \`colorMode={theme}\` to ReactFlow and get \`theme\` via \`const { theme } = useTheme()\` from \`next-themes\`
  * Do NOT add a \`ThemeProvider\` from \`next-themes\` (it's already configured)

Example structure:
\`\`\`jsx
import { ReactFlow, Controls } from "@xyflow/react";
import { useTheme } from "next-themes";

// inside your component
const { theme } = useTheme();
...
<div style={ height: "24rem", width: "100%" }>
  <ReactFlow
    nodes={nodes}
    edges={edges}
    onNodesChange={onNodesChange}
    onEdgesChange={onEdgesChange}
    colorMode={theme}
    fitView
  >
    <Controls showInteractive={false} />
  </ReactFlow>
</div>
\`\`\`

IMPORTANT - Available helper functions:
  * Use these standard React Flow utilities - do NOT reinvent them:
\`\`\`jsx
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

// Standard implementations for node and edge changes
const onNodesChange = React.useCallback(
  (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
  [setNodes],
);

const onEdgesChange = React.useCallback(
  (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
  [setEdges],
);

const onConnect = React.useCallback(
  (connection) => setEdges((eds) => addEdge(connection, eds)),
  [setEdges],
);
\`\`\`

Styling:
  * Do NOT add custom styles unless explicitly asked by the user. The frontend already includes default React Flow styles.
  * Reference (already present in the app):
\`\`\`css
/* Container */
.react-flow {
  @apply bg-background text-foreground;
}

/* Nodes */
.react-flow__node {
  @apply rounded-md border border-border shadow-sm bg-card text-card-foreground;
}

/* Background grid */
.react-flow__background {
  @apply fill-background;
}

/* Controls & Minimap */
.react-flow__controls,
.react-flow__minimap {
  @apply border border-border bg-popover text-popover-foreground;
}
\`\`\`

- react-simple-maps@3.0.0 : ideal for lightweight, SVG-based map visualizations (choropleths, small geo overlays).
(careful to set the geoUrl constant inside the component function)

Do not hesitate to look at the documentation on the internet (use the web search tool) of the packages to see how to use them.
</available_packages>`;
