export interface DashboardCardItem {
    id: number;
    key: string;
    description?: string | null;
    order_index?: number;
}

export interface CardsApiResponse {
    cards?: DashboardCardItem[];
    hasWildcardAccess?: boolean;
    error?: string;
}

export interface MyDashboardProps {
    className?: string;
}
