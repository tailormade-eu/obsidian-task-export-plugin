# obsidian-task-export-plugin

Automatically export outstanding tasks from your Obsidian vault to CSV for ManicTime integration.

## Description

An Obsidian plugin that monitors your customer project files and automatically exports outstanding tasks to CSV format. Integrates seamlessly into your Obsidian workflow with command palette support, automatic file watching, and configurable export options.

This is a TypeScript port of the [markdown-task-export](https://github.com/tailormade-eu/markdown-task-export) C# console application, adapted for Obsidian with enhanced UI features.

## Features

- 🎨 **Command Palette Integration** - Export tasks with keyboard shortcuts
- 🔄 **Automatic Export** - Watch for file changes and auto-export
- ⚙️ **Settings Panel** - Fully configurable export behavior
- 🎯 **Ribbon Icon** - Quick access from sidebar
- 📊 **Status Bar** - Shows last export time
- 🔔 **Notifications** - Success/error feedback
- 🚀 **Debounced Updates** - Efficient file watching
- 📁 **Selective Monitoring** - Only watches relevant folders
- ⚡ **High Performance** - Async processing, file caching

## Installation

### From Obsidian Community Plugins

> Plugin not yet published to community store

1. Open Obsidian Settings
2. Navigate to Community Plugins
3. Search for "Task Export Tool"
4. Click Install and Enable

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/tailormade-eu/obsidian-task-export-plugin/releases)
2. Extract `main.js`, `manifest.json`, and `styles.css` to:
   ```
   VaultFolder/.obsidian/plugins/task-export-to-csv/
   ```
3. Reload Obsidian
4. Enable plugin in Settings → Community Plugins

### Development Build

```bash
# Clone repository
git clone https://github.com/tailormade-eu/obsidian-task-export-plugin.git
cd obsidian-task-export-plugin

# Install dependencies
npm install

# Build plugin
npm run build

# For development with auto-reload
npm run dev
```

## Quick Start

1. Install and enable the plugin
2. Open Settings → Task Export Tool
3. Configure "Customers Folder" path (default: `Customers`)
4. Press `Ctrl/Cmd + P` → "Export Outstanding Tasks"
5. Find `outstanding_tasks.csv` in your vault root

## Usage

### Manual Export

**Via Command Palette:**
1. Press `Ctrl/Cmd + P`
2. Type "Export Outstanding Tasks"
3. Press Enter
4. Notification shows export success

**Via Ribbon Icon:**
- Click the export icon (📊) in left sidebar

### Automatic Export

1. Open Settings → Task Export Tool
2. Enable "Auto Export"
3. Choose trigger: "On Save" or "On File Change"
4. Edit any `.md` file in Customers folder
5. CSV automatically updates in background

### Status Bar

View last export time and status in bottom status bar:
- ✅ "Last export: 2 minutes ago" (success)
- ⚠️ "Export failed" (error - click for details)

## Settings

### Configuration Options

| Setting | Description | Default | Type |
|---------|-------------|---------|------|
| **Output Path** | CSV file location (relative to vault) | `outstanding_tasks.csv` | Text |
| **Customers Folder** | Root folder with customer files | `Customers` | Text |
| **Auto Export** | Enable automatic export | `false` | Toggle |
| **Export on Save** | Trigger on file save | `true` | Toggle |
| **Export on Modify** | Trigger on any modification | `false` | Toggle |
| **Show Notifications** | Display export notifications | `true` | Toggle |
| **CSV Delimiter** | Choose comma or semicolon delimiter | `,` (comma) | Dropdown |
| **Compress Levels** | Remove empty hierarchy columns | `false` | Toggle |
| **Include Header** | Include CSV header row in output | `true` | Toggle |
| **Debounce Delay** | Wait time after changes (seconds) | `3` | Number |

**Note for European Users**: If Excel doesn't open the CSV correctly, try changing the delimiter to semicolon in settings. Many European locales use semicolon as the standard CSV delimiter since comma is used as the decimal separator.

### Accessing Settings

Settings → Plugin Options → Task Export Tool

## Commands

| Command | Description | Default Hotkey |
|---------|-------------|----------------|
| **Export Outstanding Tasks** | Manually trigger export | None |
| **Toggle Auto-Export** | Enable/disable automatic export | None |
| **Open Export Settings** | Jump to plugin settings | None |

### Custom Hotkeys

Assign hotkeys via: Settings → Hotkeys → Search "Task Export"

## Input Format

### Vault Structure

```
YourVault/
├── Customers/                  ← Configured folder
│   ├── Customer A/
│   │   ├── Project 1.md
│   │   └── Project 2.md
│   └── Customer B/
│       └── SubFolder/
│           └── Project X.md
├── outstanding_tasks.csv       ← Output file
└── .obsidian/
    └── plugins/
        └── task-export-to-csv/
```

### Markdown Task Format

Standard Markdown task checkboxes:

```markdown
## Section

- [ ] Outstanding task
- [x] Completed task (ignored)
- [ ] Task with sub-items
  - [ ] Sub-task (nested)

### Subsection

- [ ] Another task
```

## Output Format

CSV with dynamic columns (comma-separated by default, configurable to semicolon):

```csv
CustomerName,Level1,Level2,Level3,Task
Customer A,Project 1,Section,Outstanding task
Customer A,Project 1,Section,Task with sub-items
Customer A,Project 1,Section,Sub-task (nested)
Customer A,Project 1,Section,Subsection,Another task
```

Notes:
- **Level columns**: The plugin uses generic `Level1..LevelN` columns for hierarchical path data. These contain, in order: any subfolder segments under the customer folder, then the project (markdown file) name, followed by markdown header segments and parent task text as present.
- **Compression**: When `Compress Levels` is enabled the CSV will omit empty trailing `Level` columns for each row; when disabled rows are padded to the maximum level depth.
- The delimiter can be changed to semicolon (`;`) in the plugin settings for better compatibility with European Excel versions.

Example

For a file under the `Customers` folder such as `Customers/<CustomerName>/<Subfolder...>/<ProjectName>.md` containing a top-level task in a `Section`, a produced CSV row will look like:

```csv
CustomerName,Level1,Level2,Task
<CustomerName>,<Subfolder>,<ProjectName>,Section - Outstanding task
```

## Technical Details

### Technology Stack

- TypeScript
- Obsidian Plugin API
- esbuild (bundling)
- Node.js (development)

### Project Structure

```
obsidian-task-export-plugin/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── settings.ts          # Settings interface
│   ├── exporter.ts          # Export logic
│   ├── parser.ts            # Markdown parsing
│   ├── csv-writer.ts        # CSV generation
│   ├── file-watcher.ts      # File monitoring
│   └── types.ts             # TypeScript interfaces
├── manifest.json            # Plugin metadata
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── esbuild.config.mjs       # Build config
└── README.md
```

### Key APIs Used

- `app.vault.getMarkdownFiles()` - File enumeration
- `app.vault.read(file)` - File reading
- `app.vault.adapter.write()` - CSV writing
- `app.workspace.on('file-modified')` - File watching
- `addCommand()` - Command registration
- `addSettingTab()` - Settings UI
- `addRibbonIcon()` - Sidebar icon
- `addStatusBarItem()` - Status bar

### Performance Optimization

- **File Caching**: Only re-parse modified files
- **Debouncing**: Waits for changes to settle (configurable delay)
- **Async Processing**: Non-blocking file operations
- **Selective Watching**: Only monitors Customers folder
- **Incremental Updates**: Smart change detection

### Expected Performance

- Initial scan of 100 files: < 2 seconds
- Auto-export after file change: < 500ms
- Memory footprint: < 10MB
- CPU usage: Minimal (idle when no changes)

## Development

### Setup

```bash
npm install
```

### Build Commands

```bash
# Development build with watch mode
npm run dev

# Production build (minified)
npm run build

# Type checking
npm run check

# Lint code
npm run lint
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Hot Reload

Install [Hot Reload Plugin](https://github.com/pjeby/hot-reload) for automatic plugin reload during development.

### Debugging

1. Open Developer Tools: `Ctrl/Cmd + Shift + I`
2. Check Console tab for logs
3. Use `console.log()` in code
4. Set breakpoints in Sources tab

## Troubleshooting

### Plugin Not Loading

1. Check console for errors: `Ctrl/Cmd + Shift + I`
2. Verify files in `.obsidian/plugins/task-export-to-csv/`:
   - `main.js`
   - `manifest.json`
   - `styles.css` (optional)
3. Check Obsidian version compatibility in `manifest.json`
4. Disable and re-enable plugin

### Auto-Export Not Working

1. Verify "Auto Export" is enabled in settings
2. Check "Customers Folder" path is correct
3. Ensure files are `.md` format
4. Check console for errors
5. Try manual export first

### CSV Not Generated

1. Verify output path is writable
2. Check at least one unchecked task exists
3. Look for error notifications
4. Check console for detailed errors
5. Try different output location

### Performance Issues

1. Disable "Export on Modify" (use "On Save" instead)
2. Increase "Debounce Delay" in settings
3. Check file cache is working (look for "Using cached" in console with verbose logging)
4. Reduce number of files in Customers folder

## Roadmap

- [x] Basic task extraction
- [x] Command palette integration
- [x] Auto-export on file changes
- [x] Settings panel
- [ ] Export templates
- [ ] Multiple output formats (JSON, XML)
- [ ] Task filtering (by date, tags)
- [ ] Statistics dashboard
- [ ] Direct ManicTime API integration
- [ ] Custom task patterns
- [ ] Scheduled exports
- [ ] Export history

## Contributing

Contributions welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow Obsidian plugin conventions
- Add JSDoc comments for public APIs
- Keep methods focused and testable
- Write tests for new features

## Related Projects

- **[markdown-task-export](https://github.com/tailormade-eu/markdown-task-export)** - C# console application version

## License

MIT License - See [LICENSE](LICENSE) file for details

## Support

- 🐛 **Report Bugs**: [GitHub Issues](https://github.com/tailormade-eu/obsidian-task-export-plugin/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/tailormade-eu/obsidian-task-export-plugin/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/tailormade-eu/obsidian-task-export-plugin/wiki)
- ⭐ **Star** the repo if you find it useful!

## Acknowledgments

- Built with the [Obsidian Plugin Developer Guide](https://docs.obsidian.md/)
- Inspired by the need for better task tracking integration
- Thanks to the Obsidian community

## Author

Created for personal use in managing customer project tasks with time tracking integration.
