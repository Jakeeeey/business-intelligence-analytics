export type TacticalSkuFilters = {
	month: string;
	sku: string;
	salesman: string;
	search: string;
};

export type TacticalSkuQueryParams = {
	month?: string;
	startDate?: string;
	endDate?: string;
	productName?: string;
	salesmanName?: string;
};

export type TacticalSkuSalesmanApiRow = {
	salesmanId: number | null;
	salesmanCode: string;
	salesmanName: string;
	productCode: string;
	productName: string;
	brand: string;
	category: string;
	achieve: number;
	target: number;
	percent: number;
	startDate: string;
	endDate: string;
};

export type TacticalSkuInventoryApiRow = {
	productCode: string;
	productName: string;
	totalInventoryBox: number;
	totalPieces: number;
	boxUnCount: number;
};

export type TacticalSkuReportRawResponse = {
	month: string;
	startDate: string;
	endDate: string;
	rows: TacticalSkuSalesmanApiRow[];
	inventory: TacticalSkuInventoryApiRow[];
	warnings: string[];
};

export type TacticalSkuSalesmanRow = {
	salesmanName: string;
	code: string;
	reach: number;
	target: number;
	percent: number;
};

export type TacticalSkuProductRow = {
	key: string;
	rank: number;
	brand: string;
	category: string;
	productCode: string;
	productName: string;
	inventory: number;
	totalReach: number;
	target: number;
	targetPercent: number;
	salesmen: TacticalSkuSalesmanRow[];
};

export type TacticalSkuKpis = {
	totalProducts: number;
	totalInventory: number;
	totalReach: number;
	totalTarget: number;
	overallPercent: number;
};

export type TacticalSkuChartPoint = {
	productName: string;
	reach: number;
	target: number;
	inventory: number;
};
