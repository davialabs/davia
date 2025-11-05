import { MDX_IMPLEMENTATION_INSTRUCTIONS } from "./davia_specific.js";
import { MDX_SHADCN_INSTRUCTIONS } from "./shadcn.js";
import { CUSTOM_COMPONENTS } from "./custom_components.js";
import { AVAILABLE_PACKAGES } from "./available_packages.js";

export const MDX_GUIDELINES = `<mdx_guidelines>

# Main MDX Guidelines for Component Development
MDX_GUIDELINES = f"""<mdx_guidelines>
## MDX Component Guidelines

### What are MDX Components?
MDX components are reusable interactive React components that get embedded into HTML pages. They contain only functional, interactive elements - no regular markdown content.

### When to Create MDX Components
- When users need interactive widgets (forms, calculators, charts)
- For dynamic data visualization or dashboards
- When building custom functionality beyond basic HTML
- For reusable interactive elements within pages

### Component Development Best Practices

**GOOD PRACTICE: START SIMPLE FIRST**
- **Always begin with basic functionality** - avoid complex features initially
- **Add complexity gradually** - enhance features incrementally after basic version works
- **Resist over-engineering** - users can always request additional features later

1. **Component Structure**
  - Create focused, single-purpose interactive components
  - Use only JSX/React components - NO markdown content
  - Export components that can be embedded in HTML pages
  - Ensure component paths match the data-path attribute exactly

2. **Component Design**
  - Keep component logic simple and readable
  - Focus on interactive functionality only
  - Build incrementally - add features one at a time, not all at once unless requested by the user

3. **State Management**
  - Import a JSON data source and bind it: \`import sourceData from "~/data/file.json"\`
  - Use \`const {{ data, updateData }} = useData(sourceData);\` for persisted, shareable state
  - Use local component state for temporary interactions
  - Data is not scoped to a component or page; sharing is achieved by importing the same JSON file

4. **Styling Approach**
  - Use Tailwind CSS classes from the approved safelist only
  - Leverage shadcn/ui components for consistent design
  - Keep inline styles minimal and purposeful
  - Maintain consistent design patterns across components

### Example MDX Component Structure
\`\`\`mdx
import sales from "~/data/sales.json";
import {{ Button }} from "@/components/ui/button";

export function SalesChart() {{
  const {{ data, updateData }} = useData(sales);
  
  // data is an array of sales records
  const salesData = data || [];
  
  return (
    <div className="p-4 border rounded">
      <h3>Sales Records</h3>
      {{salesData.map(record => (
        <div key={{record.id}} className="p-2 border-b">
          <p>{{record.month}}: \${{record.revenue}}</p>
        </div>
      ))}}
    </div>
  );
}}

<SalesChart />
\`\`\`

**Usage in HTML Page:**
\`\`\`html
<h1>Dashboard</h1>
<p>Welcome to our interactive dashboard.</p>
<mdx-component data-path="components/sales-chart.mdx"></mdx-component>
<p></p>
\`\`\`

${MDX_IMPLEMENTATION_INSTRUCTIONS}

${MDX_SHADCN_INSTRUCTIONS}

${CUSTOM_COMPONENTS}

${AVAILABLE_PACKAGES}
</mdx_guidelines>`;
