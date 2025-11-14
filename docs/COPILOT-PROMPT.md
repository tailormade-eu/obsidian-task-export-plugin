# Task Export Tool - Iteration 2 (Obsidian Plugin)

Create an Obsidian plugin that extracts outstanding tasks from Markdown files and exports them to a CSV file for ManicTime time tracking.

## Overview

This iteration builds upon Iteration 1 (C# Console App) by integrating the task export functionality directly into Obsidian as a plugin, providing on-demand and automatic export capabilities.

## Requirements

### 1. Plugin Features

- **Manual Export**: Add a command to the command palette to export tasks on demand
- **Automatic Export**: Watch for file changes and automatically regenerate the CSV when markdown files are modified
- **Settings Panel**: Allow users to configure:
  - Output file location
  - Customers folder path
  - Enable/disable automatic export
  - Export trigger options (on save, on file change, manual only)

### 2. Task Detection (Same as Iteration 1)

Find all unchecked tasks marked with `- [ ]` (checkbox syntax in markdown)
- Ignore completed tasks marked with `- [x]`
- Ignore tasks with checkmarks like `✅ 2025-11-11`

### 3. Hierarchical Structure Parsing (Same as Iteration 1)

- Extract markdown headers (##, ###, ####) as Header1, Header2, Header3
- Associate each task with its parent headers in the hierarchy
- Handle nested/indented tasks (sub-bullets under parent tasks)
- When a task has sub-tasks (indented bullets), treat the parent task text as an additional header level

### 4. Customer and Project Name Extraction (Same as Iteration 1)

- **CustomerName** = the folder name directly under `Customers/` (e.g., "Belgian Recycling Network (BRN)", "I.Deeds", "Cetec")
- **ProjectName** = the markdown filename without extension (e.g., "Billit implementation", "Webshop")
- Handle nested customer folders (e.g., `Customers/I.Deeds/Cetec/` → Customer: "I.Deeds", look in subfolder for projects)

### 5. CSV Output Format (Same as Iteration 1)

- Header row: `CustomerName,ProjectName,Header1,Header2,Header3,Task`
- **Only include header columns that have values** (no empty trailing commas)
- If Header2 doesn't exist, row should be: `CustomerName,ProjectName,Header1,Task` (skip empty Header2 and Header3 columns)
- Handle commas within task text by properly escaping with quotes
- Handle quotes within task text by doubling them

### 6. Output File

Create `outstanding_tasks.csv` in the configurable location (default: vault root)

## Plugin-Specific Features

### Commands

1. **Export Outstanding Tasks**: Manually trigger task export
2. **Toggle Auto-Export**: Enable/disable automatic export on file changes

### Settings

```typescript
interface TaskExportSettings {
    outputPath: string;              // Path for CSV output
    customersFolder: string;         // Root folder for customer files
    autoExport: boolean;             // Enable automatic export
    exportOnSave: boolean;           // Export when files are saved
    exportOnModify: boolean;         // Export when files are modified
    showNotifications: boolean;      // Show notifications on export
}
```

### User Interface

- Add ribbon icon for quick export
- Show status bar item with last export time
- Display notice/notification on successful export
- Show error notifications if export fails

### File Watching

- Monitor the `Customers/` folder for changes
- Debounce file changes (wait 2-3 seconds after last change before exporting)
- Only trigger export for `.md` files
- Handle bulk operations efficiently

## Technical Details

- Use **TypeScript** with Obsidian API
- Follow Obsidian plugin development best practices
- Use `obsidian` module for API access
- Properly handle file system operations through Obsidian's API
- Implement proper error handling and logging
- Add progress indicators for large exports

## Plugin Structure

```
task-export-plugin/
├── main.ts                 // Plugin entry point
├── settings.ts             // Settings interface and tab
├── export.ts               // Core export logic
├── parser.ts               // Markdown parsing logic
├── csv-writer.ts           // CSV generation
├── manifest.json           // Plugin manifest
└── styles.css             // Optional styling
```

## Example User Workflows

### Workflow 1: Manual Export
1. User opens command palette (Ctrl/Cmd + P)
2. Types "Export Outstanding Tasks"
3. Plugin scans Customers folder
4. CSV is generated and saved
5. Notification shows "Exported 49 tasks to outstanding_tasks.csv"

### Workflow 2: Automatic Export
1. User enables auto-export in settings
2. User edits a markdown file in Customers folder
3. User saves the file
4. Plugin automatically regenerates CSV in background
5. Status bar updates to show last export time

## Error Handling

- Handle missing Customers folder gracefully
- Show helpful error messages for invalid file paths
- Log errors to console for debugging
- Don't block Obsidian if export fails
- Validate CSV output before saving

## Performance Considerations

- Cache parsed files to avoid re-parsing unchanged files
- Use debouncing for file change events
- Process files asynchronously to avoid blocking UI
- Consider limiting auto-export to files in Customers folder only

## Future Enhancements (Iteration 3?)

- Filter tasks by date range
- Support custom task formats beyond `- [ ]`
- Export to multiple formats (JSON, XML, etc.)
- Integration with ManicTime API for direct import
- Task statistics dashboard in Obsidian
- Support for task priorities and tags
