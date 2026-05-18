# Dynamic Reports: Industrial Pivot Engine Workflow

## 1. Core Architecture Overview
Ang Dynamic Reports module ay isang advanced BI (Business Intelligence) tool na may kakayahang mag-transform ng raw flat data patungo sa isang multi-dimensional pivot matrix.

### Key Components:
- **`DynamicReportsModule.tsx`**: Ang Orchestrator. Dito kinukuha ang data mula sa API at pinamamahalaan ang global state ng Pivot Zones.
- **`PivotBuilder.tsx`**: Ang Control Center. Isang Unified DnD (Drag-and-Drop) interface para sa configuration ng Rows, Columns, Values, at Filters.
- **`PivotTableView.tsx`**: Ang Visualization Layer. Isang high-density table na gumagamit ng TanStack Table para sa matrix rendering.
- **`tanstack-pivot-adapter.tsx`**: Ang Brain. Dito nangyayari ang "Data Compression" at "Cross-Tabulation" logic.

---

## 2. Design Standards (The Industrial Aesthetic)
Lahat ng UI updates ay dapat sumunod sa mga sumusunod na standards:
- **Typography**: Gumamit ng `font-black`, `uppercase`, at `tracking-tighter` para sa lahat ng module headers at table headers.
- **Color Accents (Fixed Borders)**:
  - **Rows**: Blue (`blue-500`)
  - **Columns**: Purple (`purple-500`)
  - **Values**: Emerald (`emerald-500`)
  - **Filters**: Amber (`amber-500`)
- **Container Styling**: `rounded-md`, `border-border/50`, `bg-background` na compatible sa Light at Dark mode.

---

## 3. Data Transformation Logic (The "True Pivot" Engine)

### A. Label Formatting Utility
Ginamit ang isang "Smart Regex" formatter upang gawing human-readable ang database keys:
```typescript
const formatHeader = (key) => key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').toUpperCase().trim();
```
*Dapat gamitin ito sa parehong Sidebar at Table Headers para sa 100% consistency.*

### B. Matrix Generation (Cross-Tabulation)
- **Vertical Axis**: Kinukuha mula sa `config.rowFields`.
- **Horizontal Axis**: Binubuo nang dinamiko base sa unique values ng `config.columnFields[0]`.
- **Cell Aggregation**: Ang mga values ay aggregated (SUM, COUNT, AVG) sa intersection ng Row at Column.

### C. Data Compression (Excel-Style)
- Ang data ay dapat **Aggregated at Source**.
- **Summary Rows**: Pinapakita ang final calculated result (Emerald Green text).
- **Leaf Rows**: Naka-collapse at naka-mask (gamit ang dashes `-`) upang ma-highlight ang summary insights.

---

## 4. Operational Workflow for Development

### Step 1: Data Acquisition
- Siguraduhin na ang `fetchReportData` ay nagbabalik ng `normalizedData`.
- Awtomatikong i-map ang Object Keys bilang `availableFields`.

### Step 2: Configuration Persistence
- Gamitin ang `loadLayout` at `saveLayout` (localStorage) upang hindi mawala ang DnD configuration ng user pagkatapos ng refresh.

### Step 3: Matrix Rendering
- Kapag nagbago ang `zones` state, dapat mag-trigger ang `createPivotColumns` sa adapter.
- Ang `PivotTableView` ay dapat suportahan ang `colSpan` para sa multi-level headers.

---

## 5. Future Development Roadmap (Next Steps)
- [ ] **Multi-Value Support**: Payagan ang higit sa isang metric sa "Values" section nang sabay.
- [ ] **Advanced Date Grouping**: Implementasyon ng Day/Month/Year transformation sa backend/adapter layer.
- [ ] **Grand Totals**: Pagdaragdag ng "Total" column sa pinaka-kanan at "Grand Total" row sa pinaka-ibaba.
- [ ] **Conditional Formatting**: Paglalagay ng heat-map colors base sa value threshold.

---
*Created by Antigravity AI - Document Version 1.0*
