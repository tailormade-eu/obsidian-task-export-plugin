/**
 * Settings for the Task Export plugin
 */
export interface TaskExportSettings {
	outputPath: string;              // CSV output path (relative to vault)
	customersFolder: string;         // Root customer folder path
	autoExport: boolean;             // Enable auto-export
	exportOnSave: boolean;           // Trigger on file save
	exportOnModify: boolean;         // Trigger on file modify
	showNotifications: boolean;      // Show export notifications
	compressLevels: boolean;         // Remove empty hierarchy columns
	includeHeader: boolean;          // Include CSV header row
	debounceDelay: number;           // Debounce delay in seconds (1-30)
	delimiter: ',' | ';';            // CSV delimiter: comma or semicolon
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: TaskExportSettings = {
	outputPath: 'outstanding_tasks.csv',
	customersFolder: 'Customers',
	autoExport: false,
	exportOnSave: true,
	exportOnModify: false,
	showNotifications: true,
	compressLevels: false,
	includeHeader: true,
	debounceDelay: 3,
	delimiter: ','
};

/**
 * Represents a task extracted from a markdown file with its hierarchical context.
 */
export interface TaskItem {
	customerName: string;
	projectName: string;
	levels: string[];  // Hierarchical headers and parent tasks
	task: string;      // The actual task text
}
