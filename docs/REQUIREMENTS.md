# Requirements - Obsidian Plugin

Automatically export outstanding tasks from Obsidian vault to CSV for ManicTime time tracking.

## Overview

An Obsidian plugin that integrates task export functionality directly into Obsidian, providing both on-demand and automatic export capabilities with a native user experience.

**Related Repository**: [markdown-task-export](https://github.com/tailormade-eu/markdown-task-export) - C# Console Application (Iteration 1)

**⚠️ REFERENCE IMPLEMENTATION:**
This plugin is a **port of the working C# console application**. Use the C# codebase as a reference:
- `src/MarkdownParser.cs` - Complete parsing logic with all edge cases
- `src/CsvExporter.cs` - CSV generation with compression and header control
- `src/TaskExtractor.cs` - Customer/Project extraction and file enumeration
- `src/Models/TaskItem.cs` - Data structure for tasks

The TypeScript implementation should produce **identical CSV output** to the C# version.

## Functional Requirements

### 1. Plugin Integration

**Obsidian API Integration**
- Use Obsidian Plugin API for all file operations
- Register as a community plugin (follows Obsidian guidelines)
- Compatible with Obsidian desktop (Windows, macOS, Linux)
- Minimal performance impact on Obsidian startup/runtime

**Plugin Lifecycle**
- Load settings on plugin activation
- Initialize file watchers conditionally (based on settings)
- Clean up resources on plugin deactivation
- Save settings changes immediately

### 2. User Interface Components

**Command Palette Commands**
- "Export Outstanding Tasks" - Trigger manual export
- "Toggle Auto-Export" - Enable/disable automatic mode
- "Open Export Settings" - Jump to settings panel

**Ribbon Icon**
- Add icon to left sidebar for quick export access
- Visual feedback on click (spinning/loading state)
- Tooltip: "Export Outstanding Tasks"

**Status Bar Item**
- Display last export timestamp: "Last export: 2 minutes ago"
- Show export status: ✅ success, ⚠️ error
- Clickable to trigger manual export
- Hide when plugin is disabled

**Settings Tab**
- Custom settings panel under Settings → Plugin Options
- Input fields for all configurable options
- Real-time validation of paths
- Reset to defaults button

**Notifications**
- Success: "Exported 49 tasks to outstanding_tasks.csv"
- Error: "Export failed: [error message]"
- Optional (configurable): Show/hide notifications
- Duration: 5 seconds (auto-dismiss)

### 3. Task Detection (Same as Console App)

**Task Identification**
- Find unchecked tasks: `- [ ]`
- Ignore completed: `- [x]`, `✅ 2025-11-11`
- Support nested/indented tasks
- Multi-line task descriptions

**Parsing Logic**
- Use same extraction rules as console app (reference: `MarkdownParser.cs`)
- Extract hierarchical headers (##, ###, ####, etc.) - unlimited depth
- Associate tasks with parent headers
- Handle nested task patterns
- Preserve hierarchy when parent tasks have sub-tasks

**Key Parsing Details from C# Implementation:**
- Headers start at `##` (H2), `#` (H1) is ignored
- Empty header levels are tracked to preserve structure
- Parent tasks (tasks with sub-tasks) become additional header levels
- Indentation-based nesting detection
- Skip tasks with checkmark emojis in the text

### 4. Export Functionality

**Manual Export**
- Triggered by user command
- Scans configured Customers folder
- Generates CSV immediately
- Shows progress for large exports (> 50 files)
- Displays notification on completion

**Automatic Export**
- Triggered by file events (save/modify)
- Debounced to avoid excessive exports (configurable delay)
- Only monitors files in Customers folder
- Runs in background (non-blocking)
- Updates status bar on completion

**File Watching**
- Monitor Obsidian vault file events:
  - `file-modified` event
  - `file-created` event (if new .md files added)
- Filter events to only `.md` files in Customers folder
- Implement debouncing (default: 3 seconds)
- Unsubscribe when auto-export disabled

### 5. Settings Management

**Settings Schema**
```typescript
interface TaskExportSettings {
    outputPath: string;              // CSV output path (relative to vault)
    customersFolder: string;         // Root customer folder path
    autoExport: boolean;             // Enable auto-export
    exportOnSave: boolean;           // Trigger on file save
    exportOnModify: boolean;         // Trigger on file modify
    showNotifications: boolean;      // Show export notifications
    compressLevels: boolean;         // Remove empty hierarchy columns
    includeHeader: boolean;          // Include CSV header row
    debounceDelay: number;           // Debounce delay in seconds (1-30)
}
```

**Default Values**
- outputPath: `outstanding_tasks.csv`
- customersFolder: `Customers`
- autoExport: `false`
- exportOnSave: `true`
- exportOnModify: `false`
- showNotifications: `true`
- compressLevels: `false`
- includeHeader: `true`
- debounceDelay: `3`

**Settings Persistence**
- Saved to `.obsidian/plugins/task-export-plugin/data.json`
- Load on plugin activation
- Save immediately on change
- Validate on load (use defaults if invalid)

### 6. CSV Output (Same as Console App)

**Format**
- Header: `CustomerName,ProjectName,Level1,Level2,Level3,...,Task`
- **Dynamic columns**: Unlimited depth support (Level1, Level2, Level3, etc.)
- **Compression mode**: Optional `compressLevels` setting to remove empty columns
  - When enabled: Each row only outputs non-empty levels (no padding)
  - When disabled: All rows padded to maximum depth with empty columns
- **Header control**: Optional `includeHeader` setting to exclude header row
- Proper CSV escaping (commas, quotes, newlines)
- UTF-8 with BOM encoding for Excel compatibility

**CSV Escaping Rules (from C# implementation):**
- Wrap in quotes if field contains: comma, quote, newline, or carriage return
- Double any quotes inside the field: `"` becomes `""`
- Example: `Task with "quotes"` becomes `"Task with ""quotes"""`

**File Writing**
- Use Obsidian's `vault.adapter.write()` API (cross-platform compatible)
- Atomic write (write to temp, then rename) - optional for reliability
- Handle write failures gracefully
- Output path relative to vault root (mobile-friendly)
- Support absolute paths on desktop only

### 7. Error Handling

**User-Facing Errors**
- Invalid paths (show notification)
- Write permissions issues
- No tasks found (info notification)
- File reading errors (skip file, continue)

**Developer Errors**
- Log to console for debugging
- Don't crash Obsidian
- Provide detailed error messages
- Graceful degradation

**Error Recovery**
- Retry failed operations once
- Fall back to manual export if auto-export fails
- Clear error state after successful export

## Non-Functional Requirements

### Performance

**Target Metrics**
- Plugin activation: < 100ms
- Manual export (100 files): < 2 seconds
- Auto-export after file change: < 500ms
- Memory footprint: < 10MB
- No noticeable UI lag

**Optimization Strategies**
- Cache parsed file content (invalidate on change)
- Async file operations (don't block main thread)
- Debounce file change events
- Process files in batches if needed
- Only watch configured folder

### Compatibility

**Obsidian Version**
- Minimum: Obsidian 1.0.0
- Tested on latest stable release
- Full API compatibility across all platforms

**Platforms (Cross-Platform Support)**
- ✅ Windows 10/11
- ✅ macOS 11+
- ✅ Linux (major distributions)
- ✅ Android 8.0+
- ✅ iOS 13+
- ✅ Web version
- **One codebase works on all platforms**

**Platform-Specific Considerations:**
- Desktop: Full file system access (can save CSV outside vault)
- Mobile: Limited to vault directory only
- Use Obsidian's Vault API exclusively (not Node.js `fs` module)
- Detect platform with `Platform.isMobile`, `Platform.isDesktop`

**Vault Types**
- Local vaults
- Synced vaults (Dropbox, OneDrive, iCloud, etc.)
- Git-based vaults

### Usability

**User Experience**
- Intuitive settings interface
- Clear error messages
- Helpful tooltips
- Keyboard shortcuts (optional)
- Minimal clicks to export

**Documentation**
- README with installation instructions
- Settings descriptions
- Troubleshooting guide
- Example use cases

### Security

**File Access**
- Only read files user has access to
- Only write to configured output path
- Don't expose sensitive file contents
- Validate all user inputs

**Data Privacy**
- No external network requests
- No telemetry/analytics
- All processing local
- No data leaves user's machine

## Technical Requirements

### Technology Stack

**Development Environment**
- **Visual Studio Code** - Primary IDE
- **Microsoft Stack** - Preferred tooling where applicable
- **Extensions**:
  - ESLint - Code quality
  - Prettier - Code formatting
  - TypeScript - Language support
  - Obsidian Plugin Dev Tools (if available)

**Required**
- TypeScript 4.0+
- Obsidian Plugin API (latest)
- Node.js 16+ (development only, not needed by users)
- esbuild (fast bundling, replaces Rollup)

**Cross-Platform Compatibility**
- ✅ Use Obsidian's Vault API exclusively
- ✅ Use `normalizePath()` for path handling
- ✅ Use `app.vault.adapter.read()` for file reading
- ✅ Use `app.vault.adapter.write()` for file writing
- ❌ Avoid Node.js modules: `fs`, `path`, `os` (desktop-only)
- ❌ Never use absolute paths outside vault on mobile

**API Examples:**
```typescript
// ✅ Good - cross-platform
const content = await this.app.vault.adapter.read(filePath);
await this.app.vault.adapter.write(outputPath, csvContent);
const normalized = normalizePath(userPath);

// ❌ Bad - desktop only
import * as fs from 'fs';
fs.readFileSync(filePath);
```

**Optional Libraries**
- None required (use vanilla TypeScript/Obsidian API)
- Consider: Built-in CSV generation (no external dependencies)

### Project Structure

**Directory Layout:**
```
obsidian-task-export-plugin/          ← Repository root
├── .vscode/                          ← VS Code settings
│   ├── settings.json
│   └── extensions.json
├── src/                              ← All source code here
│   ├── main.ts                       # Plugin entry, command registration
│   ├── settings.ts                   # Settings interface and tab
│   ├── exporter.ts                   # Core export logic
│   ├── parser.ts                     # Markdown parsing
│   ├── csv-writer.ts                 # CSV generation
│   ├── file-watcher.ts               # File monitoring and debouncing
│   └── types.ts                      # TypeScript interfaces
├── tests/
│   ├── exporter.test.ts
│   ├── parser.test.ts
│   └── fixtures/                     # Test markdown files
├── manifest.json                     ← Plugin metadata (root level)
├── versions.json                     ← Version compatibility (root level)
├── package.json                      ← Dependencies (root level)
├── tsconfig.json                     ← TypeScript config (root level)
├── esbuild.config.mjs                ← Build configuration (root level)
├── styles.css                        ← Optional styling (root level)
├── .eslintrc.json                    ← Linting config
├── .prettierrc                       ← Formatting config
├── README.md
└── LICENSE
```

**Project Structure Rules:**
- ✅ All source code in `src/` folder
- ✅ Configuration files at root level
- ✅ No solution file needed (TypeScript project, not .NET)
- ✅ Use VS Code workspace for development

### Build System

**Development**
```bash
npm run dev        # Watch mode with source maps
```

**Production**
```bash
npm run build      # Minified build for distribution
```

**Testing**
```bash
npm test           # Run unit tests
npm run test:coverage  # Generate coverage report
```

**Build Tool**: esbuild (fast, modern bundler)

### Plugin Manifest

```json
{
  "id": "task-export-plugin",
  "name": "Task Export Tool",
  "version": "1.0.0",
  "minAppVersion": "1.0.0",
  "description": "Export outstanding tasks to CSV for time tracking",
  "author": "Raoul Jacobs",
  "authorUrl": "https://github.com/tailormade-eu",
  "isDesktopOnly": false
}
```

## Implementation Details

### Core Classes

**TaskExportPlugin (main.ts)**
- Extends `Plugin` class
- Registers commands, ribbon icon, status bar
- Manages file watcher lifecycle
- Handles settings loading/saving
- Reference C# `Program.cs` for command-line argument patterns

**TaskExportSettings (settings.ts)**
- Extends `PluginSettingTab`
- Builds settings UI
- Validates user inputs
- Saves settings on change

**TaskExporter (exporter.ts)**
- Main export orchestration
- File enumeration via Obsidian API
- Calls parser for each file
- Aggregates results
- Writes CSV output
- Reference C# `TaskExtractor.cs` for logic

**MarkdownParser (parser.ts)**
- Parses markdown content
- Extracts headers and tasks
- Maintains hierarchical context
- Returns structured data
- **Port directly from C# `MarkdownParser.cs`** - proven logic with all edge cases

**CsvWriter (csv-writer.ts)**
- Formats data as CSV
- Handles escaping (use RFC 4180 standard)
- Writes to file via Obsidian API
- Implements compression mode
- **Port directly from C# `CsvExporter.cs`**

**FileWatcher (file-watcher.ts)**
- Subscribes to file events
- Implements debouncing
- Filters relevant files
- Triggers exports

### State Management

**Plugin State**
- Current settings
- Last export timestamp
- Export in progress flag
- Cached file content (optional)

**No Persistent State Required**
- All state derived from vault files
- Settings persisted by Obsidian

### Event Handling

**File Events**
```typescript
this.registerEvent(
  this.app.workspace.on('file-modified', (file) => {
    if (shouldExport(file)) {
      debouncedExport();
    }
  })
);
```

**Command Events**
```typescript
this.addCommand({
  id: 'export-tasks',
  name: 'Export Outstanding Tasks',
  callback: () => this.exportTasks()
});
```

## Testing Requirements

### Unit Tests

**Parser Tests**
- Task detection patterns
- Header hierarchy extraction
- Nested task handling
- Edge cases (empty files, no tasks)

**CSV Writer Tests**
- Proper escaping (commas, quotes)
- Dynamic column generation
- UTF-8 encoding

**Exporter Tests**
- Customer/Project name extraction
- File enumeration
- Error handling

### Integration Tests

**Manual Export**
- Command execution
- Progress indication
- Notification display
- File writing

**Auto Export**
- File watching activation
- Debouncing behavior
- Background processing

### Test Fixtures

Sample vault structure:
```
test-vault/
├── Customers/
│   ├── Customer A/
│   │   └── Project 1.md
│   └── Customer B/
│       └── Project 2.md
└── outstanding_tasks.csv
```

Sample markdown files with:
- Various task patterns
- Different header structures
- Special characters
- Nested tasks

## Publishing Requirements

### Obsidian Community Plugin Submission

**Required Files**
- `manifest.json` - Plugin metadata
- `main.js` - Compiled plugin code
- `styles.css` - Optional styling
- `README.md` - Documentation
- `LICENSE` - Open source license (MIT recommended)

**Review Criteria**
- Code quality and security
- No external network requests
- Proper error handling
- Clear documentation
- Follows Obsidian guidelines

**Submission Process**
1. Create GitHub repository
2. Add plugin to Obsidian community plugins list (PR)
3. Wait for review and approval
4. Plugin listed in Obsidian's plugin browser

### Release Process

**Version Tagging**
- Follow semantic versioning: `v1.0.0`
- Create GitHub release with:
  - Release notes
  - Attached `main.js`, `manifest.json`, `styles.css`

**Changelog**
- Maintain `CHANGELOG.md`
- Document breaking changes
- List new features and fixes

## Success Criteria

The plugin is successful if it:

1. ✅ Installs and activates without errors
2. ✅ Correctly exports all unchecked tasks from test vault
3. ✅ Auto-export works reliably with file changes
4. ✅ Settings persist across Obsidian restarts
5. ✅ No performance impact on Obsidian UI
6. ✅ Handles errors gracefully without crashing
7. ✅ Compatible with latest Obsidian version
8. ✅ CSV validates successfully in ManicTime
9. ✅ Has 80%+ code coverage in tests
10. ✅ Passes Obsidian plugin review (if submitted)

## Future Enhancements (Out of Scope for v1)

- Mobile support (iOS/Android)
- Export templates (custom CSV formats)
- Multiple output formats (JSON, XML)
- Task filtering (by date, tags, priority)
- Statistics dashboard
- Direct ManicTime API integration
- Scheduled exports (daily, weekly)
- Export history viewer
- Task completion tracking
- Custom task patterns (beyond `- [ ]`)
