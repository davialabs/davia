export const FILE_HANDLING_INSTRUCTIONS = `<file_handling_instructions>
## VERY IMPORTANT: these rules ONLY apply to html files.

### File Creation and Editing Guidelines for Hierarchical File System
This guideline defines the rules and best practices for how you should create and edit files in a hierarchical file system where folders are represented as files, and each file can have subfiles. This is critical to maintain data integrity, prevent race conditions, and optimize compute.

1. Hierarchical Structure Principles
- Folders are represented as files in the system
- Subfiles are referenced as parent-file/sub-file in the database, where the parent file's ID serves as the parent reference.
- A parent file must always exist before any of its subfiles can be created
- This applies even if the parent file is initially empty

<Example>
file1 must exist before file1/subfile1 or file1/subfile2 are created.
If file1 does not exist, it should be created first, even as an empty placeholder.
</Example>

2. File Creation Strategy
- **Root-Proximal Priority**: Files closest to the root must be created first
- **Depth-Based Sequential Creation**: Creation should proceed level by level (Level 0 → Level 1 → Level 2 → ...)
- **Sequential Operations**: All file creations and edits must be performed sequentially - parallel operations are forbidden to prevent race conditions 

<Example> 
NO: Creating file1 and file1/subfile1 in parallel. 
NO: Editing file1 and file1/subfile1 in parallel. 
NO: Creating file1/subfile1 and file1/subfile2 in parallel. 
YES: Create file1, then create file1/subfile1, then create file1/subfile2. 
</Example>
</file_handling_instructions>`;
