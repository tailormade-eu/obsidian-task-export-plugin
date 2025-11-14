import { App, TFile, normalizePath } from 'obsidian';
import { TaskItem } from './types';
import { MarkdownParser } from './parser';
import { CsvWriter } from './csv-writer';

/**
 * Extracts tasks from a directory structure of markdown files.
 * Ported from C# TaskExtractor.cs
 */
export class TaskExporter {
	private parser: MarkdownParser;
	private csvWriter: CsvWriter;
	private app: App;

	constructor(app: App) {
		this.app = app;
		this.parser = new MarkdownParser();
		this.csvWriter = new CsvWriter();
	}

	/**
	 * Extracts all outstanding tasks from the Customers directory.
	 */
	async extractTasks(customersFolder: string, verbose: boolean = false): Promise<TaskItem[]> {
		const allTasks: TaskItem[] = [];
		
		const normalizedPath = normalizePath(customersFolder);
		
		// Check if folder exists
		const folder = this.app.vault.getAbstractFileByPath(normalizedPath);
		if (!folder) {
			console.error(`Customers directory not found: ${normalizedPath}`);
			return allTasks;
		}

		// Get all markdown files in the vault
		const allFiles = this.app.vault.getMarkdownFiles();
		
		// Filter files that are in the customers folder
		const customerFiles = allFiles.filter(file => 
			file.path.startsWith(normalizedPath + '/')
		);
		
		// Process each file
		for (const file of customerFiles) {
			// Extract customer name and project name from file path
			const { customerName, projectName } = this.extractCustomerAndProject(file, normalizedPath);
			
			// Skip files in hidden directories
			if (customerName.startsWith('.')) {
				continue;
			}
			
			if (verbose) {
				console.log(`Processing: ${customerName} / ${projectName}`);
			}
			
			try {
				const content = await this.app.vault.read(file);
				const tasks = this.parser.parseFile(content, customerName, projectName);
				
				if (tasks.length > 0) {
					allTasks.push(...tasks);
					
					if (verbose) {
						console.log(`  Found ${tasks.length} task(s)`);
					}
				}
			} catch (ex) {
				console.warn(`Failed to process file ${file.path}:`, ex);
			}
		}
		
		return allTasks;
	}

	/**
	 * Exports tasks to CSV file.
	 */
	async exportToFile(
		tasks: TaskItem[], 
		outputPath: string, 
		compressLevels: boolean = false, 
		includeHeader: boolean = true
	): Promise<void> {
		const csv = this.csvWriter.generateCsv(tasks, compressLevels, includeHeader);
		const normalizedPath = normalizePath(outputPath);
		await this.app.vault.adapter.write(normalizedPath, csv);
	}

	/**
	 * Extracts customer name and project name from file path.
	 * Customer name is the first folder under customersFolder.
	 * Project name is the filename without extension.
	 */
	private extractCustomerAndProject(file: TFile, customersFolder: string): { customerName: string, projectName: string } {
		// Remove the customers folder prefix from the path
		let relativePath = file.path.substring(customersFolder.length + 1);
		
		// Split into parts
		const parts = relativePath.split('/');
		
		// Customer name is the first folder
		const customerName = parts[0];
		
		// Project name is the filename without extension
		const projectName = file.basename;
		
		return { customerName, projectName };
	}
}
