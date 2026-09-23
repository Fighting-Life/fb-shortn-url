import type { NavigationMenuItem } from "@nuxt/ui";

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
    details?: unknown;
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

  interface AppNavigationMenuItem extends NavigationMenuItem {
    requireAdmin: boolean;
  }

  type ColorVariant =
    | "indigo"
    | "emerald"
    | "amber"
    | "red"
    | "blue"
    | "purple"
    | "neutral";

  type DeviceType =
    | "desktop"
    | "android"
    | "ios"
    | "mobile"
    | "lite"
    | "web"
    | "messenger";


  interface BuildFacebookUrlParams {
    device: DeviceType;
    url: string;
    fbclid: string;
    hToken?: string;
    fbtoken?: string;
    extraParams?: Record<string, string>;
  }

  interface GeneratedUrl {
    device: DeviceType;
    host: string;
    finalUrl: string;
    encodedTarget: string;
  }

  interface BatchUrlInput {
    url: string;
    fbclid: string;
    hToken?: string;
    device?: DeviceType;
  }

  interface UploadResult {
    url: string;
    public_id: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  }

  type AllowedMimeType =
    // Image
    | "image/jpeg"
    | "image/png"
    | "image/gif"
    | "image/webp"
    | "image/svg+xml"
    // Video
    | "video/mp4"
    | "video/webm"
    | "video/quicktime"
    // Audio
    | "audio/mpeg"
    | "audio/wav"
    | "audio/ogg"
    // Document
    | "application/pdf"
    | "application/msword"
    | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    | "text/plain"
    | "text/markdown"
    // Code
    | "text/html"
    | "text/css"
    | "text/javascript"
    | "application/json"
    | "application/yaml"
    | "text/x-python"
    | "text/x-typescript";

  type MediaType =
    | "IMAGE"
    | "VIDEO"
    | "AUDIO"
    | "DOCUMENT"
    | "CODE"
    | "ARCHIVE"
    | "OTHER";

  interface SettingResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    fieldErrors?: Record<string, string[]>;
  }
  type SettingRow = Pick<SettingConfig, "key" | "value"> & {
    updated_at?: Date;
  };
  interface SettingConfig {
    site_name: string;
    site_description: string;
    site_keywords: string;
    site_icon: string;
    site_logo: string;
    site_favicon: string;
    site_theme: string;
    enable_register: boolean;
    enable_github_provider: boolean;
    enable_google_provider: boolean;
    max_upload_size_mb: number;
    max_upload_image_mb: number;
    max_upload_video_mb: number;
    max_upload_audio_mb: number;
    max_upload_document_mb: number;
    max_upload_code_mb: number;
    max_upload_archive_mb: number;
    default_redirect_status: string;
    allowed_target_schemes: string;
    analytics_retention_days: string;
    rate_limit_per_minute: string;
    geoip_provider: string;
    tracking_consent_required: boolean;
    maintenance_mode: boolean;
    abuse_contact_email: string;
  }

  type PublicSettings = {
    site_name: string;
    site_description: string;
    site_keywords: string;
    site_icon: string;
    site_logo: string;
    site_favicon: string;
    site_theme: string;
    enable_register: boolean;
    enable_github_provider: boolean;
    enable_google_provider: boolean;
    max_upload_size_mb: number;
    max_upload_image_mb: number;
    max_upload_video_mb: number;
    max_upload_audio_mb: number;
    max_upload_document_mb: number;
    max_upload_code_mb: number;
    max_upload_archive_mb: number;
    default_redirect_status: string;
    allowed_target_schemes: string;
    analytics_retention_days: string;
    rate_limit_per_minute: string;
    geoip_provider: string;
    tracking_consent_required: boolean;
    maintenance_mode: boolean;
    abuse_contact_email: string;
  };

  type SettingsGroupMap = Record<string, Record<string, string>>;

}
export { };
