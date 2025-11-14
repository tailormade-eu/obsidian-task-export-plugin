import { TFile } from 'obsidian';

/**
 * Manages file watching with debouncing for automatic export.
 */
export class FileWatcher {
	private debounceTimer: number | null = null;
	private callback: () => void;
	private debounceDelay: number;
	private isEnabled: boolean = false;
	private customersFolder: string;

	constructor(callback: () => void, debounceDelay: number, customersFolder: string) {
		this.callback = callback;
		this.debounceDelay = debounceDelay * 1000; // Convert to milliseconds
		this.customersFolder = customersFolder;
	}

	/**
	 * Updates the debounce delay.
	 */
	setDebounceDelay(seconds: number): void {
		this.debounceDelay = seconds * 1000;
	}

	/**
	 * Updates the customers folder path.
	 */
	setCustomersFolder(folder: string): void {
		this.customersFolder = folder;
	}

	/**
	 * Triggers the debounced callback.
	 */
	trigger(): void {
		if (!this.isEnabled) {
			return;
		}

		// Clear existing timer
		if (this.debounceTimer !== null) {
			window.clearTimeout(this.debounceTimer);
		}

		// Set new timer
		this.debounceTimer = window.setTimeout(() => {
			this.callback();
			this.debounceTimer = null;
		}, this.debounceDelay);
	}

	/**
	 * Checks if a file should trigger an export.
	 */
	shouldTrigger(file: TFile | null): boolean {
		if (!this.isEnabled || !file) {
			return false;
		}

		// Only trigger for markdown files
		if (file.extension !== 'md') {
			return false;
		}

		// Only trigger for files in the customers folder
		if (!file.path.startsWith(this.customersFolder + '/')) {
			return false;
		}

		return true;
	}

	/**
	 * Enables the file watcher.
	 */
	enable(): void {
		this.isEnabled = true;
	}

	/**
	 * Disables the file watcher and cancels any pending callbacks.
	 */
	disable(): void {
		this.isEnabled = false;
		if (this.debounceTimer !== null) {
			window.clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}

	/**
	 * Returns whether the watcher is enabled.
	 */
	isWatcherEnabled(): boolean {
		return this.isEnabled;
	}
}
