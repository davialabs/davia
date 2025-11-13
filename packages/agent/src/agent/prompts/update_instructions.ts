export const UPDATE_INSTRUCTIONS = (
  repository_content: string,
  existingHtmlFiles: Array<{ path: string; content: string }>
) => `<update_documentation_instructions>
You are in DOCUMENTATION UPDATE mode.
**Your mission: UPDATE existing documentation files based on the user's request.**

**CRITICAL - What You're Doing:**
- **WORKING WITH existing documentation** - files already exist in the assets directory
- **UPDATE, DON'T REINITIATE** - you're modifying existing files, not creating from scratch
- **PRESERVE STRUCTURE** - keep the same file names and paths
- **WRITE TO PROPOSED DIRECTORY** - all updates go to the proposed directory (same project ID structure)
- **ONLY UPDATE WHAT'S NEEDED** - if a file doesn't need changes, you don't need to update it
- **MAINTAIN CONSISTENCY** - keep the same style, format, and structure as existing files

---

## EXISTING DOCUMENTATION FILES

The following HTML files already exist in the assets directory. These are the files you should update:

${existingHtmlFiles
  .map(
    (file) => `### File: ${file.path}

\`\`\`html
${file.content}
\`\`\`
`
  )
  .join("\n")}

---

## UPDATE WORKFLOW

**CRITICAL STEPS:**
1. **Read the existing HTML files** - understand the current documentation structure
2. **Read relevant MDX and data files if necessary** - use the read_file tool to read only what's relevant to the update context:
   - MDX component files that are directly linked to the update (e.g., components referenced in HTML that need changes)
   - Data files that are directly linked to the update (e.g., data files referenced in components that need changes)
   - Only read files that are necessary to understand what needs to be updated, not every MDX and data file
3. **Analyze the user's request** - determine what needs to be updated
4. **Read relevant source code** - if needed, check the repository to understand changes
5. **Update files in proposed directory** - write updated versions to the proposed directory
   - Use the SAME file paths as in assets (e.g., if assets has hr-ai-agent.html, write to hr-ai-agent.html in proposed)
   - Keep the same directory structure
   - If updating components or data files, update them in proposed directory too
6. **Only update what's needed** - if a file doesn't need changes based on the user's request, you can skip it

---

## FILE WRITING RULES

**CRITICAL:**
- **Write to proposed directory** - destination path is the proposed directory
- **Use exact same file paths** - maintain the same relative paths as in assets
- **Preserve file structure** - keep the same organization (components/, data/, etc.)
- **Update content, not structure** - modify the content based on user's request, but keep the same file organization

**UPDATING EXISTING FILES:**
- If assets has: hr-ai-agent.html
- Write to proposed: hr-ai-agent.html (same path, same name)
- If assets has: hr-ai-agent/architecture.html
- Write to proposed: hr-ai-agent/architecture.html (same path, same name)

**CREATING NEW FILES (IMPORTANT):**
- **You CAN create new pages in PROPOSED** - if the user's request requires new documentation
- **BUT if you create a NEW file in PROPOSED, you MUST also create an EMPTY version in ASSETS first**
- **Workflow for new files:**
  1. First, create an EMPTY file in ASSETS (same path as you'll create in PROPOSED)
  2. Then, create the actual content in PROPOSED
- **This ensures the file structure matches between assets and proposed**
- **Example:**
  - If creating new file: new-page.html in PROPOSED
  - First create: new-page.html in ASSETS (empty content, just an empty string or minimal placeholder)
  - Then create: new-page.html in PROPOSED (with actual content)
- **Same applies to new components and data files:**
  - New MDX component: create empty in ASSETS/components/, then content in PROPOSED/components/
  - New data file: create empty in ASSETS/data/, then content in PROPOSED/data/

---

## CONTENT UPDATE GUIDELINES

**When updating:**
- **Read relevant MDX and data files if necessary** - use read_file tool to read only what's relevant to the update:
  - Components that are directly linked to the update context (e.g., components that need to be modified based on the user's request)
  - Data files that are directly linked to the update context (e.g., data files that need changes)
  - Only read files that are necessary to understand what needs to be updated, not every file
- **Follow existing style** - match the tone, format, and structure of existing files
- **Maintain component references** - keep the same MDX component paths if they still exist
- **Update data files if needed** - if components use data files, update those too
- **Keep visual components** - preserve React Flow diagrams and interactive components unless they need updates
- **Update text content** - modify HTML content based on user's request
- **Reference file paths** - continue to include relative file paths to source code
- **Move files if needed** - if the user's request requires reorganizing, you can move files (create in new location, delete old if needed)

**What NOT to do:**
- Don't recreate files from scratch - you're updating, not creating
- Don't change file names or paths unnecessarily
- Don't remove components or data files unless explicitly requested
- Don't change the overall structure unless the user requests it

---

## REPOSITORY CONTEXT

The repository source code is provided below for reference. Use it to understand what needs to be updated:

<repository_content>
${repository_content}
</repository_content>

---

## SUMMARY

- **Mode**: UPDATE (not INITIATE)
- **Source**: Existing HTML files in assets directory
- **Destination**: Proposed directory (same project ID structure)
- **Action**: Update files based on user's request
- **Preserve**: File names, paths, structure, style
- **Update**: Content, components, data as needed
- **Read dependencies**: Read relevant MDX and data files only if necessary to understand what needs updating
- **New files**: Can create new pages in PROPOSED, but must create empty version in ASSETS first
</update_documentation_instructions>`;

export const UPDATE_HUMAN_MESSAGE = `Existing documentation files have been provided. Please UPDATE them based on the user's request.

CRITICAL REQUIREMENTS:
- **UPDATE mode** - you're modifying existing files, not creating from scratch
- **Read relevant MDX and data files if necessary** - use read_file tool to read only components and data files that are directly relevant to the update context
- **Write to proposed directory** - all updates go to the proposed directory
- **Use same file paths** - maintain exact same paths as in assets directory
- **Only update what's needed** - if a file doesn't need changes, you can skip it
- **Preserve structure** - keep the same file names, paths, and organization
- **Follow existing style** - match the tone and format of existing files
- **Update content based on user's request** - modify HTML, components, and data as needed
- **New files allowed** - you CAN create new pages in PROPOSED if needed, but MUST create empty version in ASSETS first`;
