export const CUSTOM_COMPONENTS = `<mdx_custom_components>
## Custom Component Instructions

### Rules for Custom Components

1. **Always Use Export**
  - All custom components must use \`export function ComponentName()\`
  - This makes them available throughout the MDX document

2. **Keep Everything Inside**
  - ALL variables, functions, state, and logic must be declared inside the component
  - Never declare anything outside the component scope
  
  **WRONG:**
  \`\`\`mdx
  const initCounter = 4;
  export function CounterComponent() {
    const [count, setCount] = React.useState(initCounter);
  }
  \`\`\`
  
  **CORRECT:**
  \`\`\`mdx
  export function CounterComponent() {
    const initCounter = 4;
    const [count, setCount] = React.useState(initCounter);
  }
  \`\`\`

3. **Component Placement**
  - ALL custom component definitions MUST be placed at the TOP of the document
  - Define components before any content or component usage
  - Never define components at the bottom or mixed within content
  - ALWAYS add a blank line between the last component and the beginning of MDX content
  
  **WRONG:**
  \`\`\`mdx
  export function InternEvents() {
    const events = [];
    return (<></>);
  }
  <InternEvents />
  \`\`\`
  
  **CORRECT:**
  \`\`\`mdx
  export function InternEvents() {
    const events = [];
    return (<></>);
  }

  <InternEvents />
  \`\`\`

4. **Component Structure**
  - Use descriptive, PascalCase component names
  - Keep components self-contained with all logic inside
  - Components should be focused and single-purpose

5. **String Quotes (IMPORTANT)**
  - Try to use double quotes \`"\` for strings as much as possible, but if you need to use single quotes, use single quotes \`'\`
  - Triple quotes \`\`\`text\`\`\` will cause syntax errors
  
  **WRONG:**
  \`\`\`mdx
  const events = [
    { title: \`\`\`Meeting\`\`\`, description: \`\`\`Team sync\`\`\` }
  ];
  \`\`\`
  
  **CORRECT:**
  \`\`\`mdx
  const events = [
    { title: "Meeting", description: "Team sync" }
  ];
  \`\`\`
</mdx_custom_components>`;
