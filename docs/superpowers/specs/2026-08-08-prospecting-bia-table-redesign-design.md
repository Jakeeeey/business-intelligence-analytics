# Design Specification: Prospecting BIA Grouped Table Redesign

Design document detailing the visual styling changes for the grouped table view in the Prospecting BIA module to make it colorful, engaging, and premium.

## Goals
* Remove plain table cells and raw grid lines.
* Add dynamic visual indicators (avatars, pin icons).
* Implement custom store-type badge color schemes.
* Highlight probability using status pill colors.

## Proposed Layout & Styles

### 1. Table Borders and Grid Lines
* Use soft dividing borders: `border-border/50`.
* Add custom hover transition effects on rows: `hover:scale-[1.005] hover:shadow-xs transition-all duration-200`.

### 2. Column Accents
* **Salesman cell:** Add `border-l-4 border-primary` on the left of the cell. Prepend a circular initials avatar.
* **Area (Province) cell:** Add a Lucide `MapPin` icon. Capitalize and format text in Title Case.

### 3. Store Type Badge Palette
Map colors dynamically based on the parsed store type string:
* `Market Stall` / `Market`: Amber (`bg-amber-500/10 text-amber-700 border-amber-500/20`)
* `Supermarket` / `Groceries`: Purple (`bg-indigo-500/10 text-indigo-700 border-indigo-500/20`)
* `Convenience Store` / `Minimart`: Blue (`bg-sky-500/10 text-sky-700 border-sky-500/20`)
* `Wholesale` / `Dealer`: Emerald (`bg-emerald-500/10 text-emerald-700 border-emerald-500/20`)
* Others: Slate (`bg-muted/50 text-muted-foreground border-border/50`)

### 4. Probability Badges
* Green badge for high probability ($\ge 70\%$).
* Yellow/Amber badge for medium probability ($40\% - 69\%$).
* Red badge for low probability ($< 40\%$).
