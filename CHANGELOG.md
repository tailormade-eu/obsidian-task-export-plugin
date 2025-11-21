# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2025-11-21
### Added
- Include folder subfolders as hierarchical `Level1..LevelN` CSV columns. Folder segments under the configured `Customers` folder are now emitted as Level columns before the project filename and markdown headers.
- README examples updated to use generic placeholders (`<CustomerName>`, `<Subfolder>`, `<ProjectName>`, `<Task>`).

### Changed
- CSV header format changed to: `CustomerName,Level1,Level2,...,Task` (project filename moved into `Level` columns to maintain consistent hierarchical ordering).
- CSV writer now uses a canonical `levels` array on parsed tasks which contains: folder segments, project filename, document headers, and parent task text.

### Notes
- The plugin bundle (`main.js`) should be rebuilt after the version bump. Run `npm run build` locally before publishing.
- If you distribute the plugin via GitHub Releases, create a release tagged `v1.0.5` and attach the rebuilt `main.js`, `manifest.json`, and `styles.css`.

---

## Previous releases
- See repository history for older versions.
