// merchant-form-frontend/src/types/index.ts
export interface MerchantFormData {
    name: string;
    regionValues: string[];
    detailAddress: string;
    contactName: string;
    phoneNumber: string;
    bankCardHolder: string;
    bankCity: string;
    bankBranch: string;
}

export type FileUploadField =
    | 'idCardFront'      // ID_CARD_FRONT
    | 'idCardBack'       // ID_CARD_BACK
    | 'bankCard'         // BANK_CARD
    | 'qrCode'           // QR_CODE
    | 'storeFront'       // STORE_FRONT
    | 'storeInside'      // STORE_INSIDE
    | 'cashier'          // CASHIER
    | 'businessLicense'; // BUSINESS_LICENSE

export interface FileUploads {
    idCardFront: File | null;
    idCardBack: File | null;
    bankCard: File | null;
    qrCode: File | null;
    storeFront: File[];
    storeInside: File[];
    cashier: File[];
    businessLicense: File | null;
}

export interface FilePreviews {
    idCardFront: string | null;
    idCardBack: string | null;
    bankCard: string | null;
    qrCode: string | null;
    storeFront: string[];
    storeInside: string[];
    cashier: string[];
    businessLicense: string | null;
}

export interface MerchantRecord {
    id: string;
    name: string;
    region_values: string[];
    detail_address: string;
    contact_name: string;
    phone_number: string;
    bank_card_holder?: string;
    bank_city?: string;
    bank_branch?: string;
    created_at: Date;
    updated_at: Date;
    files: FileRecord[];
}

export interface FileRecord {
    id: string;
    merchant_id: string;
    field_name: string;
    filename: string;
    original_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    created_at: Date;
}