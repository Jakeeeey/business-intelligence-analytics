export interface DashboardCardItem {
    id: number;
    key: string;
    description?: string | null;
    order_index?: number;
    is_web_socket?: boolean;
    has_ringtone?: boolean;
    has_popup?: boolean;
    cached?: boolean;
    cached_time?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    created_by?: number | null;
    updated_by?: number | null;
}

export interface CardsApiResponse {
    cards?: DashboardCardItem[];
    hasWildcardAccess?: boolean;
    error?: string;
}

export interface MyDashboardProps {
    className?: string;
}
