# Add Configurable CSV Delimiter Feature to Obsidian Plugin v1.0.1

## Context

The C# console application (markdown-task-export) has been updated to **version 1.0.1** with a configurable CSV delimiter feature. This allows users to choose between comma (`,`) and semicolon (`;`) delimiters.

**Reference Implementation**: [markdown-task-export v1.0.1](https://github.com/tailormade-eu/markdown-task-export/releases/tag/1.0.1)

## Task Overview

**Implement the delimiter feature** from the C# version (v1.0.1) into the Obsidian plugin and:
1. Add delimiter configuration to settings
2. Update CSV generation logic
3. Update field escaping logic
4. Build the plugin (`npm run build`)
5. Test with both delimiters
6. Update version to 1.0.1
7. Commit and prepare for release

## Changes in C# Version (Iteration 1 - v1.0.1)

### 1. ExportOptions.cs
Added `Delimiter` property:
```csharp
public char Delimiter { get; set; } = ',';
```

### 2. CsvExporter.cs
- Added constructor parameter to accept delimiter
- Updated all hardcoded commas to use `_delimiter` field
- Updated `EscapeField()` method to check for the configured delimiter

```csharp
public CsvExporter(char delimiter = ',')
{
    _delimiter = delimiter;
}

private string EscapeField(string field)
{
    bool needsQuotes = field.Contains(_delimiter) || field.Contains('"') || ...
    // Rest of escaping logic
}
```

### 3. Program.cs
Added command-line argument:
```bash
-d, --delimiter <value>  CSV delimiter: 'comma' or 'semicolon' (default: comma)
```

Accepts: `comma`, `,`, `semicolon`, or `;`

### 4. Usage Examples
```bash
# Use semicolon delimiter (useful for Excel in Europe)
dotnet run -- -i "./Customers" --delimiter semicolon

# Short form
dotnet run -- -i "./Customers" -d ";"

# Default comma
dotnet run -- -i "./Customers"
```

## Required Changes for Obsidian Plugin (Iteration 2)

### 1. Update TaskExportSettings Interface

Add delimiter setting:

```typescript
interface TaskExportSettings {
    outputPath: string;
    customersFolder: string;
    autoExport: boolean;
    exportOnSave: boolean;
    exportOnModify: boolean;
    showNotifications: boolean;
    compressLevels: boolean;
    includeHeader: boolean;
    debounceDelay: number;
    delimiter: ',' | ';';           // NEW: CSV delimiter
}
```

Default value should be `','` (comma).

### 2. Update Settings UI

Add a dropdown/toggle in the settings panel:

```typescript
new Setting(containerEl)
    .setName('CSV Delimiter')
    .setDesc('Choose delimiter for CSV output. Comma is standard, semicolon is common in Europe.')
    .addDropdown(dropdown => dropdown
        .addOption(',', 'Comma (,)')
        .addOption(';', 'Semicolon (;)')
        .setValue(this.plugin.settings.delimiter)
        .onChange(async (value) => {
            this.plugin.settings.delimiter = value as ',' | ';';
            await this.plugin.saveSettings();
        }));
```

### 3. Update CSV Writer/Exporter

Update the CSV generation logic to use the configured delimiter:

```typescript
class CsvWriter {
    private delimiter: string;

    constructor(delimiter: ',' | ';' = ',') {
        this.delimiter = delimiter;
    }

    private escapeField(field: string): string {
        if (!field) return '';

        // Check if escaping is needed
        const needsQuotes = field.includes(this.delimiter) || 
                           field.includes('"') || 
                           field.includes('\n') || 
                           field.includes('\r');

        if (needsQuotes) {
            // Double any existing quotes
            field = field.replace(/"/g, '""');
            // Wrap in quotes
            return `"${field}"`;
        }

        return field;
    }

    generateCsv(tasks: TaskItem[], includeHeader: boolean): string {
        const lines: string[] = [];
        
        // Build header
        if (includeHeader) {
            const headerParts = ['CustomerName', 'ProjectName', ...levelHeaders, 'Task'];
            lines.push(headerParts.join(this.delimiter));
        }

        // Build data rows
        for (const task of tasks) {
            const parts = [
                this.escapeField(task.customerName),
                this.escapeField(task.projectName),
                ...task.levels.map(l => this.escapeField(l)),
                this.escapeField(task.task)
            ];
            lines.push(parts.join(this.delimiter));
        }

        return lines.join('\n');
    }
}
```

### 4. Update Export Logic

Pass the delimiter setting to the CSV writer:

```typescript
async exportTasks() {
    const tasks = await this.extractTasks();
    
    const writer = new CsvWriter(this.settings.delimiter);
    const csv = writer.generateCsv(
        tasks, 
        this.settings.includeHeader
    );
    
    await this.app.vault.adapter.write(
        this.settings.outputPath, 
        csv
    );
}
```

### 5. Update Status Bar/Notifications

Optionally show which delimiter was used:

```typescript
new Notice(`Exported ${taskCount} tasks (${delimiterName})`);
```

Where `delimiterName` is:
- `','` → `"comma-separated"`
- `';'` → `"semicolon-separated"`

## Why This Feature?

**Regional Differences:**
- **USA, UK**: Comma is standard CSV delimiter
- **Europe** (Germany, France, etc.): Semicolon is standard because comma is used as decimal separator (1,234.56 → 1.234,56)
- **Excel Behavior**: Excel auto-detects delimiter based on system locale

**Use Cases:**
1. European users need semicolon for Excel to open CSV correctly
2. Data contains many commas (descriptions, addresses) → semicolon avoids escaping
3. Compatibility with time tracking systems expecting specific delimiter

## Testing Requirements

Test both delimiters:

```typescript
// Test cases
const testData = [
    { task: 'Simple task', expected: 'Simple task' },
    { task: 'Task, with comma', expected: '"Task, with comma"' }, // comma mode
    { task: 'Task; with semicolon', expected: '"Task; with semicolon"' }, // semicolon mode
    { task: 'Task with "quotes"', expected: '"Task with ""quotes"""' }, // both modes
];
```

Verify:
- ✅ Comma delimiter (default) works
- ✅ Semicolon delimiter works
- ✅ Field escaping respects the chosen delimiter
- ✅ Setting persists across Obsidian restarts
- ✅ Excel opens files correctly with both delimiters

## Implementation Priority

**Priority Level**: High - Include in v1.0.1 release
- Feature parity with C# version (v1.0.1)
- Adds significant value for European users
- Simple to implement (mirrors C# version)
- Must be included before publishing to Obsidian community

## Build and Release Steps

After implementing the delimiter feature:

### 1. Build the Plugin

```bash
cd obsidian-task-export-plugin

# Install dependencies (if not already done)
npm install

# Build production version
npm run build
```

This generates `main.js` in the root directory.

### 2. Verify Version Numbers

Ensure all version files are updated to **1.0.1**:
- ✅ `manifest.json` → `"version": "1.0.1"`
- ✅ `package.json` → `"version": "1.0.1"`
- ✅ `versions.json` → Add entry `"1.0.1": "1.0.0"`

### 3. Test the Plugin

```bash
# Copy files to test vault
cp main.js manifest.json styles.css ~/.obsidian/plugins/task-export-to-csv/

# Open Obsidian and test:
# 1. Check settings for delimiter dropdown
# 2. Export with comma delimiter
# 3. Export with semicolon delimiter
# 4. Verify CSV output correctness
```

### 4. Commit Changes

```bash
git add .
git commit -m "Release v1.0.1: Add configurable CSV delimiter"
git push origin main
```

### 5. Create Git Tag

```bash
git tag -a 1.0.1 -m "v1.0.1 - Add configurable CSV delimiter"
git push origin 1.0.1
```

### 6. Create GitHub Release

- Go to GitHub Releases
- Tag: `1.0.1`
- Title: `v1.0.1 - Configurable CSV Delimiter`
- Upload files: `main.js`, `manifest.json`, `styles.css`
- Add release notes (see below)

### 7. Update Obsidian Community Plugin PR

Update the PR in obsidian-releases repository:
- Change version to `1.0.1` 
- Ensure release has required files
- Wait for review

## Release Notes Template

```markdown
## What's New in v1.0.1

### ✨ New Features

- **Configurable CSV Delimiter**: Choose between comma (`,`) or semicolon (`;`) in settings
- Improved Excel compatibility for European locales
- Maintains feature parity with C# console app v1.0.1

### 🎨 User Interface

- New dropdown in settings: "CSV Delimiter"
- Options: Comma (standard) or Semicolon (European)

### 🌍 Regional Support

Better support for regions where semicolon is the standard CSV delimiter (many European countries where comma is used as decimal separator).

### 🔧 Technical Details

- Field escaping respects the chosen delimiter
- CSV output follows RFC 4180 standard
- UTF-8 with BOM encoding for Excel compatibility

---

**Full Changelog**: https://github.com/tailormade-eu/obsidian-task-export-plugin/compare/1.0.0...1.0.1
```

## Documentation Updates

Update README.md to mention delimiter option in settings:

```markdown
### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **CSV Delimiter** | Choose comma or semicolon delimiter | Comma |
```

Add usage note:
```markdown
**Note for European Users**: If Excel doesn't open the CSV correctly, try changing the delimiter to semicolon in settings.
```

## Summary

Port the delimiter feature from C# version to Obsidian plugin by:
1. Add `delimiter: ',' | ';'` to settings (default: `','`)
2. Add dropdown in settings UI
3. Update CSV writer to use configurable delimiter
4. Update field escaping to check for the configured delimiter
5. Test with both delimiters
6. Document in README

This maintains feature parity between Iteration 1 (C# console app) and Iteration 2 (Obsidian plugin).
