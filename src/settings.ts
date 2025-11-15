import { App, PluginSettingTab, Setting } from 'obsidian';
import TaskExportPlugin from './main';

/**
 * Settings tab for the Task Export plugin.
 */
export class TaskExportSettingTab extends PluginSettingTab {
	plugin: TaskExportPlugin;

	constructor(app: App, plugin: TaskExportPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Task Export Tool Settings' });

		// Output Path
		new Setting(containerEl)
			.setName('Output path')
			.setDesc('CSV file location (relative to vault root)')
			.addText(text => text
				.setPlaceholder('outstanding_tasks.csv')
				.setValue(this.plugin.settings.outputPath)
				.onChange(async (value) => {
					this.plugin.settings.outputPath = value || 'outstanding_tasks.csv';
					await this.plugin.saveSettings();
				}));

		// Customers Folder
		new Setting(containerEl)
			.setName('Customers folder')
			.setDesc('Root folder containing customer files')
			.addText(text => text
				.setPlaceholder('Customers')
				.setValue(this.plugin.settings.customersFolder)
				.onChange(async (value) => {
					this.plugin.settings.customersFolder = value || 'Customers';
					await this.plugin.saveSettings();
					this.plugin.updateFileWatcher();
				}));

		// Auto Export Toggle
		new Setting(containerEl)
			.setName('Auto export')
			.setDesc('Automatically export tasks when files change')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoExport)
				.onChange(async (value) => {
					this.plugin.settings.autoExport = value;
					await this.plugin.saveSettings();
					this.plugin.updateFileWatcher();
				}));

		// Export on Save
		new Setting(containerEl)
			.setName('Export on save')
			.setDesc('Trigger export when files are saved')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.exportOnSave)
				.onChange(async (value) => {
					this.plugin.settings.exportOnSave = value;
					await this.plugin.saveSettings();
				}));

		// Export on Modify
		new Setting(containerEl)
			.setName('Export on modify')
			.setDesc('Trigger export when files are modified (more frequent)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.exportOnModify)
				.onChange(async (value) => {
					this.plugin.settings.exportOnModify = value;
					await this.plugin.saveSettings();
				}));

		// Show Notifications
		new Setting(containerEl)
			.setName('Show notifications')
			.setDesc('Display notifications on export completion')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showNotifications)
				.onChange(async (value) => {
					this.plugin.settings.showNotifications = value;
					await this.plugin.saveSettings();
				}));

		// Compress Levels
		new Setting(containerEl)
			.setName('Compress levels')
			.setDesc('Remove empty hierarchy columns from CSV output')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.compressLevels)
				.onChange(async (value) => {
					this.plugin.settings.compressLevels = value;
					await this.plugin.saveSettings();
				}));

		// Include Header
		new Setting(containerEl)
			.setName('Include header')
			.setDesc('Include CSV header row in output')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeHeader)
				.onChange(async (value) => {
					this.plugin.settings.includeHeader = value;
					await this.plugin.saveSettings();
				}));

		// CSV Delimiter
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

		// Debounce Delay
		new Setting(containerEl)
			.setName('Debounce delay')
			.setDesc('Wait time after changes before exporting (1-30 seconds)')
			.addSlider(slider => slider
				.setLimits(1, 30, 1)
				.setValue(this.plugin.settings.debounceDelay)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.debounceDelay = value;
					await this.plugin.saveSettings();
					this.plugin.updateFileWatcher();
				}));
	}
}
