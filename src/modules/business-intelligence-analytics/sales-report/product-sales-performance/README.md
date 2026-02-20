# Product Performance Dashboard

## Overview
Interactive dashboard for analyzing product sales performance across products, suppliers, and locations using the `view_sales_product_performance` API.

## Features

### 4 Main Tabs

#### 1. Overview Tab
- **Total Revenue KPI** - Sum of all sales amounts
- **Total Transactions** - Count of all sales
- **Average Transaction Value** - Mean revenue per transaction
- **Top Product** - Highest revenue generating product
- **Top Supplier** - Highest revenue generating supplier
- **Revenue Trend Chart** - Monthly revenue over time with line chart
- **Top 10 Products Chart** - Horizontal bar chart
- **Top 10 Suppliers Chart** - Horizontal bar chart
- **CSV Export** - Export all datasets

#### 2. Product Tab
- **Product Search** - Filter products by name
- **Product Trends Chart** - Top 5 products revenue over time (multi-line chart)
- **Product Performance Table** - All products with rank, revenue, transactions, avg per transaction
- **CSV Export** - Export product performance data

#### 3. Supplier Tab
- **Supplier Search** - Filter suppliers by name
- **Top 10 Suppliers Chart** - Bar chart comparison
- **Expandable Supplier Details** - Click to see product breakdown per supplier
- **Product Breakdown Table** - Shows each product's revenue and % contribution to supplier
- **CSV Export** - Export supplier and product-level data

#### 4. Location Tab
- **Location Search** - Filter by city/province
- **Province Revenue Chart** - Bar chart by province
- **City Revenue Heatmap** - Top 15 cities with color-coded intensity
- **Interactive Location Selection** - Click any city to see top products
- **Top Products per Location** - Shows top 5 products for selected city
- **All Locations Table** - Full list with revenue, transactions, avg per transaction
- **CSV Export** - Export location performance data

## Filters

### Global Filters (Applied to All Tabs)
- **Date Range** - From/To date pickers
- **Suppliers** - Multi-select dropdown with checkboxes
- **Products** - Multi-select dropdown with checkboxes
- **Cities** - Multi-select dropdown with checkboxes
- **Provinces** - Multi-select dropdown with checkboxes
- **Active Filters Display** - Badge display with quick remove buttons
- **Clear Filters** - Individual filter clear buttons

## Technical Implementation

### API Integration
- **Endpoint**: `${SPRING_API_BASE_URL}/api/view-sales-product-performance/all`
- **Environment Variable**: Uses `NEXT_PUBLIC_SPRING_API_BASE_URL` or `SPRING_API_BASE_URL` from `.env.local`
- **Default URL**: `http://100.81.225.79:8083`

### Data Structure
```typescript
type ProductSaleRecord = {
  city: string;
  province: string;
  supplier: string;
  productName: string;
  productDescription?: string;
  amount: number;
  date: string; // ISO date string
}
```

### Architecture
- **Provider**: `fetchProvider.ts` - API data fetching
- **Hook**: `useProductSalesPerformance.ts` - State management, filtering, aggregations
- **Components**: Modular components for each tab and shared components (Filters, KPICards)
- **Types**: TypeScript definitions for all data structures
- **Utils**: CSV export and formatting utilities

### Key Calculations
- **Revenue Aggregation** - Sum of `amount` field
- **Time-based Trends** - Group by month/year from `date` field
- **Top N Analysis** - Sort by revenue and slice top items
- **Geographic Analysis** - Group by city/province
- **Supplier Performance** - Group by supplier with product breakdown
- **Product Trends** - Time-series data for top 5 products

## UI Components Used (shadcn/ui)
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Tabs, TabsList, TabsTrigger, TabsContent
- Button, Input, Label, Badge
- Table, TableHeader, TableBody, TableRow, TableCell, TableHead
- Popover, PopoverTrigger, PopoverContent
- Checkbox, ScrollArea
- Collapsible, CollapsibleTrigger, CollapsibleContent
- Chart components (ChartContainer, ChartTooltip, etc.)
- Recharts (LineChart, BarChart, XAxis, YAxis, CartesianGrid, etc.)
- Spinner (for loading states)

## Features Implemented
✅ Graph-first interactive visualizations
✅ Hover tooltips with detailed information
✅ Click interactions (expand suppliers, select locations)
✅ Comprehensive filters (date, supplier, product, city, province)
✅ CSV export for every dataset
✅ Responsive design
✅ Real-time filter application
✅ KPI cards with icons
✅ Search functionality (products, suppliers, locations)
✅ Color-coded heatmaps
✅ Multi-line trend charts
✅ Expandable/collapsible sections
✅ Empty states and loading states
✅ Auto-load on mount

## Usage

1. **Initial Load**: Dashboard auto-loads data on page load
2. **Apply Filters**: Use date range and multi-select filters to focus analysis
3. **Navigate Tabs**: Switch between Overview, Product, Supplier, Location tabs
4. **Interact with Charts**: 
   - Hover for tooltips
   - Click locations to see products
   - Expand suppliers to see breakdown
5. **Export Data**: Click CSV export buttons on any chart/table
6. **Search**: Use search bars to filter products, suppliers, or locations

## Performance Considerations
- **Client-side filtering**: All filtering done in-memory after initial data load
- **Memoization**: Heavy calculations use React.useMemo
- **Efficient re-renders**: Only affected components re-render on filter changes
- **Single API call**: Data loaded once, filtered client-side

## Future Enhancements (Optional)
- Return rate tracking (if API includes returns)
- Product segmentation by type/brand (from productDescription)
- Anomaly detection (sudden spikes/drops)
- Year-over-year comparison
- Export to PDF
- Advanced date range presets (Last 7 days, Last month, Last quarter, etc.)
- Drill-down from charts to detailed views
