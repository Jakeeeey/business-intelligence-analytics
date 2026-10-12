export interface CustomerRawRecord {
    id: number;
    customer_group_id?: number | null;
    customer_code: string;
    customer_name: string;
    type?: "Regular" | "Employee" | string;
    user_id?: number | null;
    customer_image?: string | null;
    store_name: string;
    store_signage?: string;
    brgy?: string | null;
    city?: string | null;
    province?: string | null;
    contact_number?: string;
    customer_email?: string | null;
    tel_number?: string | null;
    bank_details?: string | null;
    customer_tin?: string | null;
    payment_term?: number | null;
    store_type?: number | string | null;
    price_type?: string | null;
    price_type_id?: number | null;
    encoder_id?: number | null;
    credit_type?: number | null;
    company_code?: number | null;
    date_entered?: string | null;
    isActive?: number | boolean;
    isVAT?: number | boolean;
    isEWT?: number | boolean;
    discount_type?: number | null;
    otherDetails?: string | null;
    classification?: number | null;
    prospect_status?: "pending" | "visited" | string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    qr_code?: string | null;
}

export interface StoreTypeRecord {
    id: number;
    store_type: string;
}

export interface UserRecord {
    user_id?: number;
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
}

export interface NewCustomerItem {
    id: number;
    customerCode: string;
    customerName: string;
    storeName: string;
    storeSignage: string;
    storeType: string;
    storeTypeId?: number | null;
    type: string;
    location: string;
    brgy: string;
    city: string;
    province: string;
    contactNumber: string;
    customerEmail: string;
    dateEntered: string;
    rawDate: string;
    recencyLabel: string;
    isRecent: boolean;
    isActive: boolean;
    isVAT: boolean;
    isEWT: boolean;
    prospectStatus: string;
    priceType: string;
    salesmanName: string;
    customerTin: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
}

export type DatePreset = "this-month" | "last-30-days" | "this-quarter" | "this-year" | "all-time" | "custom";

export interface NewCustomerFilters {
    preset: DatePreset;
    startDate: string;
    endDate: string;
    search: string;
    province: string;
    city: string;
    storeType: string;
    status: "ALL" | "ACTIVE" | "INACTIVE";
    type: string;
}

export interface NewCustomerKpis {
    totalNewCustomers: number;
    activeCount: number;
    activePercentage: number;
    topProvince: string;
    topProvinceCount: number;
    topStoreType: string;
    topStoreTypeCount: number;
    totalCities: number;
    recentCount: number;
}

export interface ProvinceSummary {
    province: string;
    totalAccounts: number;
    activeAccounts: number;
    citiesCount: number;
    topStoreType: string;
}

export interface RegistrationTrendItem {
    date: string;
    label: string;
    count: number;
    activeCount: number;
}

export interface SalesmanOnboardingItem {
    salesmanName: string;
    totalOnboarded: number;
    activeCount: number;
    percentage: number;
}
