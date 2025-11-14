import { TaskItem } from './types';

/**
 * Exports tasks to CSV format with proper escaping.
 * Ported from C# CsvExporter.cs
 */
export class CsvWriter {
	private delimiter: string;

	constructor(delimiter: ',' | ';' = ',') {
		this.delimiter = delimiter;
	}

	/**
	 * Generates CSV content from tasks with UTF-8 BOM encoding.
	 */
	generateCsv(tasks: TaskItem[], compressLevels: boolean = false, includeHeader: boolean = true): string {
		if (tasks.length === 0) {
			throw new Error('No tasks to export');
		}

		// Determine the maximum level depth based on compression mode
		const maxLevelDepth = compressLevels 
			? this.determineMaxCompressedLevelDepth(tasks) 
			: this.determineMaxLevelDepth(tasks);

		let csv = '';
		
		// Build header row based on max level depth
		if (includeHeader) {
			csv += `CustomerName${this.delimiter}ProjectName`;
			for (let i = 1; i <= maxLevelDepth; i++) {
				csv += `${this.delimiter}Level${i}`;
			}
			csv += `${this.delimiter}Task\n`;
		}

		// Write data rows
		for (const task of tasks) {
			csv += this.escapeField(task.customerName);
			csv += this.delimiter;
			csv += this.escapeField(task.projectName);
			
			if (compressLevels) {
				// Compressed mode: only output non-empty levels, skipping empty slots
				const nonEmptyLevels = task.levels.filter(l => l !== '');
				
				// Output non-empty levels (no padding needed - each row can have different column count)
				for (const level of nonEmptyLevels) {
					csv += this.delimiter;
					csv += this.escapeField(level);
				}
			} else {
				// Non-compressed mode: output all levels including empty slots to preserve hierarchy
				for (let i = 0; i < maxLevelDepth; i++) {
					csv += this.delimiter;
					if (i < task.levels.length) {
						csv += this.escapeField(task.levels[i]);
					}
				}
			}
			
			csv += this.delimiter;
			csv += this.escapeField(task.task);
			csv += '\n';
		}

		// Add UTF-8 BOM for Excel compatibility
		return '\uFEFF' + csv;
	}

	/**
	 * Determines the maximum level depth across all tasks (includes empty slots).
	 */
	private determineMaxLevelDepth(tasks: TaskItem[]): number {
		let maxDepth = 0;
		
		for (const task of tasks) {
			if (task.levels.length > maxDepth) {
				maxDepth = task.levels.length;
			}
		}
		
		return maxDepth;
	}

	/**
	 * Determines the maximum number of non-empty levels across all tasks.
	 */
	private determineMaxCompressedLevelDepth(tasks: TaskItem[]): number {
		let maxDepth = 0;
		
		for (const task of tasks) {
			const nonEmptyCount = task.levels.filter(l => l !== '').length;
			if (nonEmptyCount > maxDepth) {
				maxDepth = nonEmptyCount;
			}
		}
		
		return maxDepth;
	}

	/**
	 * Escapes a CSV field according to RFC 4180.
	 * - Wraps in quotes if contains delimiter, newline, or quote
	 * - Doubles any quotes inside the field
	 */
	private escapeField(field: string): string {
		if (!field) {
			return '';
		}

		// Check if escaping is needed
		const needsQuotes = field.includes(this.delimiter) || field.includes('"') || field.includes('\n') || field.includes('\r');

		if (needsQuotes) {
			// Double any existing quotes
			field = field.replace(/"/g, '""');
			// Wrap in quotes
			return `"${field}"`;
		}

		return field;
	}
}
