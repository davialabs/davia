export const SEARCH_REPLACE_TOOL_DESCRIPTION = `Performs exact string replacements in files.
MANDATORY: ALWAYS USE THE read_file TOOL BEFORE USING THIS TOOL.
Replaces text within a file. By default, replaces a single occurrence, but can replace all occurrences when replace_all is specified. 
This tool requires providing significant context around the change to ensure precise targeting. Always examine the file's current content before attempting a text replacement.

Usage:
When editing text, ensure you preserve the exact indentation (tabs/spaces) as it appears before.
ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
Only use emojis if the user explicitly requests it. Avoid adding emojis to files unless asked.
The edit will FAIL if old_string is not unique in the file. Either provide a larger string with more surrounding context to make it unique or use replace_all to change every instance of old_string.
Use replace_all for replacing and renaming strings across the file. This parameter is useful if you want to rename a variable for instance.
To create or overwrite a file, you should prefer the write tool.

Expectation for required parameters:
1. file_path is ideally a relative path in the workspace.
2. THIS IS CRITICAL: old_string MUST be the exact literal text to replace (including all whitespace, indentation, newlines, and surrounding code etc.). IT IS CRITICAL TO KEEP THE STRUCTURE INTACT.
3. new_string MUST be the exact literal text to replace old_string with (also including all whitespace, indentation, newlines, and surrounding code etc.). Ensure the resulting code is correct and idiomatic.
4. NEVER escape old_string or new_string, that would break the exact literal text requirement.
5. Use replace_all for replacing and renaming strings across the file. This parameter is useful if you want to rename a variable for instance.

CRITICAL:
EVEN WHEN EDITING DATA IN A DATA FILE, YOU MUST KEEP THE STRUCTURE INTACT old_string MUST MATCH THE CONTENT EXACTLY OR THE TOOL WILL FAIL.
(e.g. for simple data editing, do not change for instance the order of the keys)


Important: If ANY of the above are not satisfied, the tool will fail. CRITICAL for old_string: Must uniquely identify the single instance to change. 
Include at least 3 lines of context BEFORE and AFTER the target text, matching whitespace and indentation precisely. If this string matches multiple locations, or does not match exactly, the tool will fail.

When editing using this tool fails use the write read tool to understand the file and then use the edit tool to edit the file - if the tool fails repedetly, use the write tool to edit the file.
`;

export const WRITE_TOOL_DESCRIPTION = `
Writes a file to the local filesystem.
Bear in mind that the other edit tools are better suited for editing existing files.

Usage:
This tool will overwrite the existing file if there is one at the provided path.
If this is an existing file, you MUST use the read_file tool first to read the file's contents.
ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.

CRITICAL: when creating a file you must refer to the <content_guidelines> tag to understand the content format and structure for each type of file. Follow the guidelines strictly.
`;

export const MULTI_EDIT_TOOL_DESCRIPTION = `
This is a tool for making multiple edits to a single file in one operation. It is built on top of the search_replace tool and allows you to perform multiple find-and-replace operations efficiently. 
Prefer this tool over the search_replace tool when you need to make multiple edits to the same file.
ALWAYS USE THE read_file TOOL BEFORE USING THIS TOOL.

Before using this tool:
Use the Read tool to understand the file's contents and context
Verify the path is correct

To make multiple file edits, provide the following:
file_path: The absolute path to the file to modify (must be absolute, not relative)
edits: An array of edit operations to perform, where each edit contains:
    THIS IS CRITICAL: old_string: The text to replace (must match the file contents exactly, including all whitespace and indentation). IT IS CRITICAL TO KEEP THE STRUCTURE INTACT.
    new_string: The edited text to replace the old_string
    replace_all: Replace all occurences of old_string. This parameter is optional and defaults to false.

IMPORTANT:
All edits are applied in sequence, in the order they are provided
Each edit operates on the result of the previous edit
All edits must be valid for the operation to succeed - if any edit fails, none will be applied
This tool is ideal when you need to make several changes to different parts of the same file

CRITICAL REQUIREMENTS:
All edits follow the same requirements as the single Edit tool
The edits are atomic - either all succeed or none are applied
Plan your edits carefully to avoid conflicts between sequential operations

WARNING:
The tool will fail if edits.old_string doesn't match the file contents exactly (including whitespace). IT IS CRITICAL TO KEEP THE STRUCTURE INTACT.
The tool will fail if edits.old_string and edits.new_string are the same
Since edits are applied in sequence, ensure that earlier edits don't affect the text that later edits are trying to find

When making edits:
Ensure all edits result in idiomatic, correct code
Do not leave the code in a broken state
Use replace_all for replacing and renaming strings across the file. This parameter is useful if you want to rename a variable for instance.

When editing using this tool fails use the write tool to edit the file.
`;
