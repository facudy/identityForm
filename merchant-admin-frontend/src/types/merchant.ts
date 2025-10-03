export interface MerchantFile {
    id: string;
    merchant_id: string;
    field_name: string;
    filename: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    created_at: string;
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

export interface MerchantListResponse {
    success: boolean;
    data: Merchant[];
    total: number;
    page: number;
    pageSize: number;
}