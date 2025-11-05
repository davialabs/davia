export const DATA_GUIDELINES = `<data_guidelines>
## Data Guidelines

### Purpose and Scope
Data files provide structured, persistent data that components can access and modify. Data can be shared across multiple components and HTML pages.

### File Location and Naming
- **Path Format**: \`data/[name].json\` (arbitrary names and nested folders allowed)
- **Examples**: \`data/projects.json\`, \`data/analytics/sales.json\`
- **Many-to-Many**: A single data file can be used by many components, and a component can use multiple data files
- **Directory Structure**: Organize logically for reuse

### Data File Structure
**CRITICAL**: Data files must be valid JSON. For display via Data Views, the file's root MUST be a top-level array.

**PREFERRED STRUCTURE**: Use top-level arrays whenever possible, similar to database tables.

### Data Structure Guidelines

1. **Top-Level Arrays (Preferred)**
   - Use when data feels like it belongs in a database table
   - Examples: \`data/users.json\`, \`data/products.json\`, \`data/orders.json\`
   - Structure: \`[...]\` - the JSON file should start with an array
   - Each array item represents a record/row

2. **JSON Objects (Use Sparingly)**
   - Only for configuration, settings, or single-value data
   - Examples: \`data/config.json\` (app settings), \`data/counter.json\` (single counter value)
   - Avoid for data that could be tabular

3. **Denormalized Data Structure (IMPORTANT)**
   - **Try to keep all related data in a single file** - Preferably do not split into multiple files with references
   - **Repeat information as needed** - denormalization is preferred over normalization
   - Avoid nested objects and arrays as property values - keep properties flat and primitive
   - Example (Good): 
\`\`\`json
     [
       {"order_id": 1, "user_name": "Alice", "user_email": "alice@example.com", "product": "Widget", "price": 29.99},
       {"order_id": 2, "user_name": "Alice", "user_email": "alice@example.com", "product": "Gadget", "price": 49.99}
     ]
\`\`\`
   - Example (Bad - nested objects):
\`\`\`json
     [
       {"order_id": 1, "user": {"name": "Alice", "email": "alice@example.com"}, "product": {"name": "Widget", "price": 29.99}}
     ]
\`\`\`

### Embedding Data Directly in HTML (Data View)

You can embed JSON directly in HTML using the Data View element without creating an MDX component:

\`\`\`html
<database-view data-path="data/analytics/sales.json"></database-view>
\`\`\`

- Works only when the JSON file's root is a top-level array
- Best for table/list-like datasets

**Minimal JSON example for Data View**

\`\`\`json
[
  { "id": 1, "name": "Alice" }
]
\`\`\`

### Best Practices

1. **Data Organization**
   - Use meaningful property names
   - Include sensible default values
   - Prefer flat, tabular structures over nested ones

2. **Content Guidelines**
   - Store component configuration, settings, and state
   - Include sample data for charts, tables, and lists
   - Define form defaults and validation parameters
   - Store user preferences and customization options
   - Create separate files for related but distinct data types

### Common Mistakes to Avoid

1. **Missing Defaults**: Always provide sensible default values in the data file
2. **Hardcoding state in components**: Import JSON and use \`useData(importedSource)\` instead
3. **Nested Properties**: Avoid arrays and objects as property values within objects
4. **Over-normalization**: Prefer data repetition over splitting into multiple linked files

**CRITICAL REMINDER**: Always maintain the exact JSON structure format shown above. The data must be a properly formatted JSON object that can be parsed and used by the component system.
</data_guidelines>`;
