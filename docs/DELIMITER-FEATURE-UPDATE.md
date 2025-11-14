# Add Configurable CSV Delimiter Feature to Obsidian Plugin

## Context

The C# console application (markdown-task-export) has been updated with a configurable CSV delimiter feature. This allows users to choose between comma (`,`) and semicolon (`;`) delimiters.

**Reference Implementation**: [markdown-task-export](https://github.com/tailormade-eu/markdown-task-export)

## Changes in C# Version (Iteration 1)

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

**Priority Level**: Medium
- Not blocking for MVP
- Adds significant value for European users
- Simple to implement (mirrors C# version)
- Should be included in v1.0.0 release

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
