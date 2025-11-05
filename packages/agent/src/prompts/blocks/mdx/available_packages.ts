export const AVAILABLE_PACKAGES = `<available_packages>
Here are the available secondary packages for you to use to build your components:
- @xyflow/react@12.9.1 : A highly customizable React library for building node-based editors, interactive diagrams, and workflow visualizations. It provides a complete solution for creating flowcharts, diagrams, process flows, data pipelines, and any node-based interface.

Important usage notes:
  * NO CSS import needed - do NOT include \`import "@xyflow/react/dist/style.css"\`
  * Always wrap ReactFlow in a div with \`className="w-full h-full"\`
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
<div className="w-full h-full">
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

- maplibre-gl@5.7.3 : add the stylesheet to the head of your page:
<link href="https://unpkg.com/maplibre-gl@<YOUR_MAPLIBRE_VERSION>/dist/maplibre-gl.css" rel="stylesheet" />
You MUST load it via UNPKG (\`<script src="https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.js"></script>\`).

example of how to load it:
React.useEffect(() => {
    const loadMapLibre = () => {
      if (window.maplibregl) {
        setIsLoaded(true);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@5.7.3/dist/maplibre-gl.js';
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    };

    loadMapLibre();
  }, []);
When wanted to use maplibre-gl, you MUST use the search web tool prior to search on https://maplibre.org/maplibre-gl-js/docs/examples (indicate the url in the search tool) to see different examples and use cases (typically how to use geojson data) that would be a match for the user's request.
This is important to write the correct code and have the map displayed correctly - ask the search web tool for the code example given so you can draw inspiration from it.

- react-simple-maps@3.0.0 : ideal for lightweight, SVG-based map visualizations (choropleths, small geo overlays).
(careful to set the geoUrl constant inside the component function)

Do not hesitate to look at the documentation on the internet (use the web search tool) of the packages to see how to use them.
</available_packages>`;
