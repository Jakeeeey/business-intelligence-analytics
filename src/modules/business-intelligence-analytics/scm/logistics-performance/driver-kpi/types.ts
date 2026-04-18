export interface VisitRecord {
  dispatchPlanId: number;
  dispatchDocumentNo: string;
  dispatchPlanStatus: string;
  estimatedTimeOfDispatch?: string | null;
  timeOfDispatch?: string | null;
  dispatchVarianceHours?: number;
  estimatedTimeOfArrival?: string | null;
  returnTimeOfArrival?: string | null;
  arrivalVarianceHours?: number;
  actualTripDurationHours?: number;
  truckId?: number;
  truckName?: string | null;
  truckPlateNo?: string;
  truckType?: string;
  visitSequence?: number;
  fulfillmentStatus?: string;
  distanceToCustomer?: number;
  customerCode?: string;
  customerName?: string;
  storeName?: string;
  contactNumber?: string;
  brgy?: string;
  city?: string;
  province?: string;
  invoiceNo?: string;
  totalAmount?: number;
  invoiceDate?: string;
  driverNames?: string;
  helperNames?: string | null;
}

export interface Driver {
  id: string | number;
  user_fname?: string;
  user_mname?: string | null;
  user_lname?: string;
  user_position?: string;
  user_department?: number;
}

export interface DriverOption {
  label: string; // UI display (cleaned, uppercased)
  value: string; // Raw value to send to API (preserve spacing)
  id?: string | number;
}

export type Filters = {
  startDate?: string;
  endDate?: string;
  driverNames?: string[]; // raw values for API
  searchCustomer?: string;
  fulfillmentStatus?: string | null;
};

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}
