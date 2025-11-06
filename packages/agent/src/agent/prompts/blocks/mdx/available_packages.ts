export const AVAILABLE_PACKAGES = `<available_packages>
Here are the available secondary packages for you to use to build your components:
- @xyflow/react@12.9.1 : A highly customizable React library for building node-based editors, interactive diagrams, and workflow visualizations. It provides a complete solution for creating flowcharts, diagrams, process flows, data pipelines, and any node-based interface.

Important usage notes:
  * NO CSS import needed - do NOT include \`import "@xyflow/react/dist/style.css"\`
  * Wrap ReactFlow in a div with inline style: \`style={{ height: "24rem", width: "100%" }}\` (increase height if the user asks for a bigger view)
  * Always include \`<Controls showInteractive={false} />\` by default unless user asks to remove them
  * Do NOT use the \`<Background />\` component unless explicitly requested by the user
  * Always pass \`colorMode={theme}\` to ReactFlow and get \`theme\` via \`const { theme } = useTheme()\` from \`next-themes\`
  * Do NOT add a \`ThemeProvider\` from \`next-themes\` (it's already configured)
  * ALWAYS include \`position\` property for each node in the data (e.g., \`"position": { "x": 0, "y": 0 }\`)
  * ALWAYS make nodes draggable by default - nodes are draggable by default in ReactFlow, so do NOT set \`nodesDraggable={false}\` or \`draggable: false\` on nodes unless the user explicitly asks for non-draggable nodes

Example:
\`\`\`json
// data/flow-example.json
{
  "nodes": [
    {
      "id": "1",
      "data": { "label": "Node 1" },
      "position": { "x": 0, "y": -50 }
    },
    {
      "id": "2",
      "data": { "label": "Node 2" },
      "position": { "x": 0, "y": 50 }
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2"
    }
  ]
}
\`\`\`

\`\`\`mdx
// components/flow-example.mdx
import flowData from "~/data/flow-example.json";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
} from "@xyflow/react";
import { useDebounceCallback } from "usehooks-ts";
import { useTheme } from "next-themes";

export function FlowExample() {
  const { theme } = useTheme();
  const { data, updateData } = useData(flowData);
  const [nodes, setNodes, onNodesChange] = useNodesState(data.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(data.edges);

  const onConnect = React.useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const debouncedSave = useDebounceCallback(
    (currentNodes, currentEdges) =>
      updateData({ nodes: currentNodes, edges: currentEdges }),
    300
  );

  // React to changes in nodes and edges
  React.useEffect(() => {
    debouncedSave(nodes, edges);
    return () => {
      debouncedSave.cancel();
    };
    // IMPORTANT: Don't include debouncedSave in the dependency array because it will cause a infinite loop
  }, [nodes, edges]);

  return (
    <div style={{ height: "24rem", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={theme}
        fitView
      >
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

<FlowExample />
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

- usehooks-ts@3.1.1 : React hooks library, written in Typescript and easy to use. It provides a set of hooks that enables you to build your React applications faster.
Do not hesitate to look at the documentation on the internet (use the web search tool) of the packages to see how to use them.
</available_packages>`;
