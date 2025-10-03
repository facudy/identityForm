// 商户相关类型
export interface MerchantFile {
    id: string;
    filename: string;
    original_name: string;
    file_path: string;
    file_size: number;
    field_name: string;
    merchant_id: string;
    created_at: string;
    signed_url?: string;  // 新增签名URL字段
}

export interface Merchant {
    id: string;
    name: string;
    region_values: string[];
    detail_address: string;
    contact_name: string;
    phone_number: string;
    bank_card_holder?: string;
    bank_city?: string;
    bank_branch?: string;
    created_at: string;
    updated_at: string;
    files: MerchantFile[];
}

// API相关类型
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface MerchantListResponse {
    success: boolean;
    data: Merchant[];
    total: number;
    page: number;
    pageSize: number;
}

export interface PaginationParams {
    page: number;
    pageSize: number;
    search?: string;
}

// 认证相关类型
export interface LoginCredentials {
    username: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message?: string;
    data?: {
        username: string;
        token: string;
    };
}