/// <reference types="node" />

declare global {
  interface ApiResponse<T = any, M extends Record<string, any> = ApiMeta> {
    status: number;
    success: boolean;
    message: string;
    data?: T | null;
    error?: ApiError;
    meta?: M;
    headers?: Headers;
  }
  interface ApiMeta {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_prev: boolean;
    has_next: boolean;
    has_more?: boolean;
  }

  interface ApiError {
    code: string;
    message?: string;
    redirect_url?: string;
    details?: any;
    retryable?: boolean;
    timestamp?: string;
  }
  interface ErrorResponse extends ApiResponse<undefined, undefined> {
    error: {
      code: string;
      details?: Record<string, unknown>;
      redirect_url?: Record<string, unknown>;
    };
  }
  type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

  interface QueryParams {
    page: number;
    limit: number;
    search?: string;
    sort_by?: string;
    order_by?: "asc" | "desc";
    status?: string;
    include_deleted?: boolean;
    is_active?: boolean;
    is_verified?: boolean;
    user_id?: string;
    extra?: Record<string, any>;
  }
  interface QueryState {
    params: QueryParams;
    meta: ApiMeta | null;
    isLoading: boolean;
    page: number;
    limit: number;
    search: string;
    type: string;
    sort_by: string;
    order_by: "asc" | "desc";
    params: QueryParams;
    date_from: Date | string;
    date_to: Date | string;
  }
  interface QueryParamsConfig<T = any> {
    defaults: T;
    validators?: Partial<Record<keyof T, (value: any) => any>>;
  }
  interface SearchFieldConfig {
    field: string;
    type: "string" | "number" | "date" | "boolean";
    searchable?: boolean; // Default: true
  }
  interface PostgresRangeDate {
    start: string;
    end: string;
  }

  interface TimezoneOption {
    zone: string;
    gmt: string;
    name: string;
  }
  interface DateRangeChartLabel {
    dates: Date[];
    labels: string[];
  }
  interface TimeComponents {
    hours: number;
    minutes: number;
    seconds: number;
  }
}
export {};
