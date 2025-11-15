import { App, Notice, Plugin, TFile } from 'obsidian';
import { TaskExportSettings, DEFAULT_SETTINGS } from './types';
import { TaskExportSettingTab } from './settings';
import { TaskExporter } from './exporter';
import { FileWatcher } from './file-watcher';

/**
 * Main plugin class for Task Export Tool.
 */
export default class TaskExportPlugin extends Plugin {
	settings: TaskExportSettings;
	exporter: TaskExporter;
	fileWatcher: FileWatcher;
	statusBarItem: HTMLElement;
	lastExportTime: Date | null = null;
	exportInProgress: boolean = false;

	async onload() {
		await this.loadSettings();

		// Initialize exporter
		this.exporter = new TaskExporter(this.app);

		// Initialize file watcher
		this.fileWatcher = new FileWatcher(
			() => this.autoExport(),
			this.settings.debounceDelay,
			this.settings.customersFolder
		);

		// Add ribbon icon
		this.addRibbonIcon('file-text', 'Export Outstanding Tasks', async () => {
			await this.exportTasks();
		});

		// Add command: Export Outstanding Tasks
		this.addCommand({
			id: 'export-tasks',
			name: 'Export Outstanding Tasks',
			callback: async () => {
				await this.exportTasks();
			}
		});

		// Add command: Toggle Auto-Export
		this.addCommand({
			id: 'toggle-auto-export',
			name: 'Toggle Auto-Export',
			callback: async () => {
				this.settings.autoExport = !this.settings.autoExport;
				await this.saveSettings();
				this.updateFileWatcher();
				
				const status = this.settings.autoExport ? 'enabled' : 'disabled';
				new Notice(`Auto-export ${status}`);
			}
		});

		// Add command: Open Export Settings
		this.addCommand({
			id: 'open-settings',
			name: 'Open Export Settings',
			callback: () => {
				// @ts-ignore - accessing private API
				this.app.setting.open();
				// @ts-ignore - accessing private API
				this.app.setting.openTabById(this.manifest.id);
			}
		});

		// Add settings tab
		this.addSettingTab(new TaskExportSettingTab(this.app, this));

		// Add status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar();

		// Register file events
		this.registerFileEvents();

		// Update file watcher state
		this.updateFileWatcher();

		console.debug('Task Export Plugin loaded');
	}

	onunload() {
		// Disable file watcher
		this.fileWatcher.disable();
		console.debug('Task Export Plugin unloaded');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Registers file modification events.
	 */
	private registerFileEvents() {
		// Register vault modify event (fires when files are modified)
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && this.fileWatcher.shouldTrigger(file)) {
					if (this.settings.exportOnModify || this.settings.exportOnSave) {
						this.fileWatcher.trigger();
					}
				}
			})
		);
	}

	/**
	 * Updates the file watcher based on current settings.
	 */
	updateFileWatcher() {
		if (this.settings.autoExport) {
			this.fileWatcher.enable();
			this.fileWatcher.setDebounceDelay(this.settings.debounceDelay);
			this.fileWatcher.setCustomersFolder(this.settings.customersFolder);
		} else {
			this.fileWatcher.disable();
		}
	}

	/**
	 * Performs automatic export (called by file watcher).
	 */
	private async autoExport() {
		try {
			await this.exportTasks(false); // Silent mode for auto-export
		} catch (error) {
			console.error('Auto-export failed:', error);
		}
	}

	/**
	 * Exports tasks to CSV.
	 */
	async exportTasks(showNotice: boolean = true) {
		// Prevent concurrent exports
		if (this.exportInProgress) {
			if (showNotice) {
				new Notice('Export already in progress...');
			}
			return;
		}

		this.exportInProgress = true;

		try {
			// Extract tasks
			const tasks = await this.exporter.extractTasks(this.settings.customersFolder, false);

			if (tasks.length === 0) {
				if (showNotice && this.settings.showNotifications) {
					new Notice('No outstanding tasks found');
				}
				return;
			}

			// Export to CSV
			await this.exporter.exportToFile(
				tasks,
				this.settings.outputPath,
				this.settings.compressLevels,
				this.settings.includeHeader,
				this.settings.delimiter
			);

			// Update last export time
			this.lastExportTime = new Date();
			this.updateStatusBar();

			// Show success notification
			if (showNotice && this.settings.showNotifications) {
				new Notice(`Exported ${tasks.length} task(s) to ${this.settings.outputPath}`);
			}
		} catch (error) {
			console.error('Export failed:', error);
			if (showNotice && this.settings.showNotifications) {
				new Notice(`Export failed: ${error.message}`);
			}
		} finally {
			this.exportInProgress = false;
		}
	}

	/**
	 * Updates the status bar with last export time.
	 */
	private updateStatusBar() {
		if (!this.lastExportTime) {
			this.statusBarItem.setText('');
			return;
		}

		const now = new Date();
		const diff = now.getTime() - this.lastExportTime.getTime();
		const minutes = Math.floor(diff / 60000);
		
		let timeText = '';
		if (minutes < 1) {
			timeText = 'just now';
		} else if (minutes === 1) {
			timeText = '1 minute ago';
		} else if (minutes < 60) {
			timeText = `${minutes} minutes ago`;
		} else {
			const hours = Math.floor(minutes / 60);
			if (hours === 1) {
				timeText = '1 hour ago';
			} else {
				timeText = `${hours} hours ago`;
			}
		}

		this.statusBarItem.setText(`✅ Last export: ${timeText}`);
		
		// Update again in a minute
		window.setTimeout(() => this.updateStatusBar(), 60000);
	}
}
