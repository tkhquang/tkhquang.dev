# (00) Route Styles Preset

This directory serves as a **boilerplate/preset template** for newly added segmented routes in Next.js.

## Purpose

When creating a new route segment in Next.js (e.g., `(blog)`, `(default)`, `(frames)`), you can copy this `(00)` directory as a starting point for route-specific styles.

## Structure

The preset includes:

- **`index.css`** - Main entry point that imports:
  - Base styles from parent directory (`../_00_core.css`, `../_01_theme.css`, etc.)
  - Route-specific overrides (empty by default)

- **Override files** (empty by default, ready for customization):
  - `_01_theme.css` - Theme variables and color overrides
  - `_02_base.css` - Base element styles
  - `_03_components.css` - Component styles
  - `_04_utilities.css` - Utility classes
  - `_05_external.css` - External library overrides
  - `_zz_overrides.css` - Final overrides (loaded last)

## Usage

1. Copy the entire `(00)` directory
2. Rename it to match your new route segment (e.g., `(newroute)`)
3. Customize the override files as needed for your route-specific styles
4. Import the route's `index.css` in your route layout

## Example

```bash
# Copy the preset
cp -r src/assets/styles/(00) src/assets/styles/(newroute)

# Then customize the files in (newroute) as needed
```
