# Task Export Tool - Iteration 2 (Obsidian Plugin)

Create an Obsidian plugin that extracts outstanding tasks from Markdown files and exports them to a CSV file for ManicTime time tracking.

## Overview

This iteration builds upon Iteration 1 (C# Console App) by integrating the task export functionality directly into Obsidian as a plugin, providing on-demand and automatic export capabilities.

**Related Repository**: [markdown-task-export](https://github.com/tailormade-eu/markdown-task-export) - C# Console Application (Iteration 1)

**⚠️ IMPORTANT FOR IMPLEMENTATION:**
The C# console application is a **fully working reference implementation** with:
- ✅ Complete task extraction logic (`MarkdownParser.cs`)
- ✅ Hierarchical header parsing with unlimited depth
- ✅ CSV generation with compression support (`CsvExporter.cs`)
- ✅ Customer/Project name extraction (`TaskExtractor.cs`)
- ✅ All edge cases handled (nested tasks, special characters, escaping)

**Use the C# code as a reference** for implementing the TypeScript plugin. The logic should be **identical**, just ported to TypeScript/Obsidian API.

**📋 Detailed Specifications:**
See `docs/REQUIREMENTS.md` for comprehensive technical requirements, API usage, cross-platform considerations, and project structure.

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

- Header row: `CustomerName,ProjectName,Level1,Level2,Level3,...,Task`
- **Dynamic columns**: Automatically adapts to maximum header depth
- **Compression mode**: Optional removal of empty hierarchy columns (--compress-levels equivalent)
- **Header control**: Option to include or exclude CSV header row
- Handle commas within task text by properly escaping with quotes
- Handle quotes within task text by doubling them
- UTF-8 with BOM encoding for Excel compatibility

### 6. Output File

Create `outstanding_tasks.csv` in the configurable location (default: vault root)

## Plugin-Specific Features

### Commands

1. **Export Outstanding Tasks**: Manually trigger task export
2. **Toggle Auto-Export**: Enable/disable automatic export on file changes

### Settings

```typescript
interface TaskExportSettings {
    outputPath: string;              // Path for CSV output (relative to vault)
    customersFolder: string;         // Root folder for customer files
    autoExport: boolean;             // Enable automatic export
    exportOnSave: boolean;           // Export when files are saved
    exportOnModify: boolean;         // Export when files are modified
    showNotifications: boolean;      // Show notifications on export
    compressLevels: boolean;         // Compress empty levels (like --compress-levels)
    includeHeader: boolean;          // Include CSV header row (like --no-header)
    debounceDelay: number;           // Debounce delay in seconds (1-30)
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

### Cross-Platform Support

**Platform Compatibility:**
- ✅ Windows, macOS, Linux (desktop)
- ✅ Android, iOS (mobile)
- ✅ Web version
- **One codebase works everywhere** - Obsidian uses web technologies on all platforms

**Technology Stack:**
- **TypeScript** - Primary language
- **Obsidian Plugin API** - Use exclusively for file operations
- **Node.js** - Development only (not required by users)
- **esbuild** - Fast bundling

**Important API Usage:**
- ✅ Use `this.app.vault.adapter.write()` for file operations
- ✅ Use `this.app.vault.adapter.read()` for reading files
- ✅ Use `normalizePath()` for cross-platform path handling
- ❌ Avoid Node.js modules (`fs`, `path`, `os`) - desktop only
- ❌ Never use absolute paths outside vault on mobile

**Platform Detection:**
```typescript
if (Platform.isMobile) {
    // Mobile: limit to vault directory
} else {
    // Desktop: allow custom paths
}
```

### Best Practices

- Follow Obsidian plugin development best practices
- Properly handle file system operations through Obsidian's API only
- Implement proper error handling and logging
- Add progress indicators for large exports
- Test on multiple platforms before release

## Plugin Structure

```
obsidian-task-export-plugin/
├── src/
│   ├── main.ts                 // Plugin entry point
│   ├── settings.ts             // Settings interface and tab
│   ├── exporter.ts             // Core export logic
│   ├── parser.ts               // Markdown parsing logic
│   ├── csv-writer.ts           // CSV generation
│   ├── file-watcher.ts         // File monitoring
│   └── types.ts                // TypeScript interfaces
├── manifest.json               // Plugin metadata
├── versions.json               // Version compatibility
├── package.json                // Dependencies
├── tsconfig.json               // TypeScript config
├── esbuild.config.mjs          // Build configuration
├── styles.css                  // Optional styling
├── README.md
└── LICENSE
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
