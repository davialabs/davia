export const TIPTAP_HTML_GUIDELINES = `<tiptap_html_guidelines>
## Tiptap HTML Input Guidelines

1. **Use only supported elements**
   Tiptap follows a strict ProseMirror schema. If your HTML includes tags, custom attributes or styles not in that schema, those tags will silently be stripped out.
   - **Block-level**: \`<p>\`, \`<h1>…<h6>\`, \`<blockquote>\`, \`<ul>\`, \`<ol>\`, \`<li>\`, \`<pre><code>\`, \`<hr>\`
   - **Task Lists**: \`<ul data-type="taskList">\` with \`<li data-type="taskItem" data-checked="false"||"true">\` containing \`<input type="checkbox">\` and \`<p>\` for todo items
   - **Inline/text-level**: \`<strong>\`, \`<em>\`, \`<code>\`, \`<a>\`, \`<br>\`
   - **MDX Components**: \`<mdx-component data-path="components/component-name.mdx"></mdx-component>\` for embedding interactive components
   - **Data Views**: \`<database-view data-path="data/path.json"></database-view>\` for displaying top-level array JSON directly in HTML
   - **Excalidraw Whiteboards**: \`<excalidraw data-path="data/diagram.json"></excalidraw>\` for embedding interactive whiteboards
   Anything outside this list (like \`<div>\`, \`<span>\`, \`<img>\`) will be dropped unless the corresponding extension is added.

2. **Well-formed HTML only**
   - Every tag must be properly opened and closed.
   - Lists must be correctly nested: e.g. \`<ul><li>Item text</li></ul>\`
   - Inline tags must be inside blocks: e.g. \`<p>This is <strong>bold</strong> text.</p>\`

3. **No stray inline elements**
   Avoid standalone inline tags or text outside blocks.
   WRONG: \`<strong>bold!</strong><p>Paragraph</p>\`
   CORRECT: \`<p><strong>bold!</strong></p><p>Paragraph</p>\`

4. **Creating Task Lists (Todo Lists)**
   To create interactive todo lists, use the task list structure:
   
   \`\`\`html
   <ul data-type="taskList">
      <li data-checked="false" data-type="taskItem">
         <input type="checkbox">
         <p>Task description here</p>
      </li>
      <li data-checked="true" data-type="taskItem">
         <input type="checkbox" checked>
         <p>Completed task</p>
      </li>
   </ul>
   \`\`\`
   
   - Use \`data-checked="false"\` for unchecked items
   - Use \`data-checked="true"\` and \`checked\` attribute for completed items
   - Each task item contains an \`<input type="checkbox">\` and a \`<p>\` with the task content

5. **Embedding MDX Components**
   To embed interactive components in HTML pages, use the mdx-component element:
   
   \`\`\`html
   <mdx-component data-path="components/component-name.mdx"></mdx-component>
   \`\`\`
   
   * HTML pages are for content structure only - no custom app logic
   * Interactive functionality and complex data handling should live within MDX components

5a. **Embedding Data Views (Top-Level Arrays Only)**
   To directly display JSON data in HTML pages (without an MDX component), use the database-view element:
   
   \`\`\`html
   <database-view data-path="data/path.json"></database-view>
   \`\`\`
   
   - Works only when the JSON file's root is a top-level array (table/list-like datasets)
   - For configs, single-value objects, or nested structures, use an MDX component instead

6. **Spacing Multiple Components**
   When adding multiple \`<mdx-component>\`, \`<database-view>\`, or \`<excalidraw>\` blocks one after another, you MUST separate them with empty paragraphs to ensure proper editor behavior:
   
   \`\`\`html
   <mdx-component data-path="components/component1.mdx"></mdx-component>
   <p></p>
   <database-view data-path="data/list-a.json"></database-view>
   <p></p>
   <excalidraw data-path="data/diagram.json"></excalidraw>
   \`\`\`
   
   This creates editable zones where users can position their cursor and add content

7. **Commenting on the document**
   When the user asks for a comment on the document, you should use one of the valid blockquote tags to wrap the comment. 
   You shouldn't place them inside HTML comments for they would be stripped out.

### Sample Valid HTML
\`\`\`html
<h1>Hello World</h1>
<p>This is a <strong>bold</strong> paragraph.</p>
<ul>
   <li>First item</li>
   <li>Second <em>item</em></li>
</ul>
<blockquote>A nice quote.</blockquote>
<pre><code>console.log('hi');</code></pre>
<hr />
\`\`\`

### Example of Invalid HTML
\`\`\`html
<div>A div tag</div>
<span style="color:red;">Red text</span>
<p>Some <unknown>weird</unknown> tag.</p>
\`\`\`
</tiptap_html_guidelines>`;
