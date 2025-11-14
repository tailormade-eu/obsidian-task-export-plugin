import { TaskItem } from './types';

/**
 * Parses markdown files to extract outstanding tasks with their hierarchical context.
 * Ported from C# MarkdownParser.cs
 */
export class MarkdownParser {
	private static readonly HEADER_REGEX = /^(#{2,})\s+(.+)$/;
	private static readonly TASK_REGEX = /^(\s*)-\s+\[([ ])\]\s+(.+)$/;
	private static readonly COMPLETED_TASK_REGEX = /^(\s*)-\s+\[(x|X)\]/;
	private static readonly CHECKMARK_REGEX = /✅\s+\d{4}-\d{2}-\d{2}/;

	/**
	 * Parses a markdown file and extracts all outstanding tasks.
	 */
	parseFile(content: string, customerName: string, projectName: string): TaskItem[] {
		const tasks: TaskItem[] = [];
		const lines = content.split('\n');
		
		// Use an array to track headers at any depth (0-indexed, where 0 is ##, 1 is ###, etc.)
		const headers: string[] = [];
		
		// Track parent tasks for nested structure
		const parentTaskStack: Array<{indentLevel: number, taskText: string}> = [];
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			
			// Check for headers (##, ###, ####, etc.)
			const headerMatch = line.match(MarkdownParser.HEADER_REGEX);
			if (headerMatch) {
				const headerLevel = headerMatch[1].length - 1; // Subtract 1 because ## is level 1 (index 0)
				const headerText = headerMatch[2].trim();
				
				// Ensure the headers array is large enough
				while (headers.length <= headerLevel) {
					headers.push('');
				}
				
				// Set this header level
				headers[headerLevel] = headerText;
				
				// Clear any deeper levels
				for (let j = headerLevel + 1; j < headers.length; j++) {
					headers[j] = '';
				}
				
				// Clear parent task stack when we hit a new header
				parentTaskStack.length = 0;
				continue;
			}
			
			// Skip completed tasks
			if (MarkdownParser.COMPLETED_TASK_REGEX.test(line)) {
				continue;
			}
			
			// Check for unchecked tasks
			const taskMatch = line.match(MarkdownParser.TASK_REGEX);
			if (taskMatch) {
				const indent = taskMatch[1].length;
				const taskText = taskMatch[3].trim();
				
				// Skip tasks with checkmark indicators
				if (MarkdownParser.CHECKMARK_REGEX.test(taskText)) {
					continue;
				}
				
				// Check if this task has sub-tasks by looking ahead
				const hasSubTasks = this.hasSubTasks(lines, i + 1, indent);
				
				if (hasSubTasks) {
					// This is a parent task, push it onto the stack
					// Remove any parent tasks at the same or deeper level
					while (parentTaskStack.length > 0 && parentTaskStack[parentTaskStack.length - 1].indentLevel >= indent) {
						parentTaskStack.pop();
					}
					parentTaskStack.push({indentLevel: indent, taskText: taskText});
				} else {
					// This is a task to export
					// Remove parent tasks at the same or deeper level
					while (parentTaskStack.length > 0 && parentTaskStack[parentTaskStack.length - 1].indentLevel >= indent) {
						parentTaskStack.pop();
					}
					
					// Build the task item with proper header hierarchy
					const task: TaskItem = {
						customerName: customerName,
						projectName: projectName,
						task: taskText,
						levels: []
					};
					
					// Add document headers - keep all levels including empty ones for proper structure
					const levels: string[] = [];
					
					// Copy all header levels (including empty ones) to preserve hierarchy
					levels.push(...headers);
					
					// Add parent task levels
					if (parentTaskStack.length > 0) {
						const parents = [...parentTaskStack].reverse();
						for (const parent of parents) {
							levels.push(parent.taskText);
						}
					}
					
					task.levels = levels;
					tasks.push(task);
				}
			}
		}
		
		return tasks;
	}
	
	/**
	 * Checks if a task has sub-tasks by looking at following lines.
	 */
	private hasSubTasks(lines: string[], startIndex: number, currentIndent: number): boolean {
		for (let i = startIndex; i < lines.length; i++) {
			const line = lines[i];
			
			// Empty lines don't matter
			if (!line.trim()) {
				continue;
			}
			
			// If we hit a header, no more sub-tasks
			if (MarkdownParser.HEADER_REGEX.test(line)) {
				return false;
			}
			
			// Check if this is a task
			const taskMatch = line.match(MarkdownParser.TASK_REGEX);
			if (taskMatch) {
				const indent = taskMatch[1].length;
				
				// If indented more than current task, it's a sub-task
				if (indent > currentIndent) {
					return true;
				}
				
				// If at same or less indent, no sub-tasks
				if (indent <= currentIndent) {
					return false;
				}
			}
		}
		
		return false;
	}
}
