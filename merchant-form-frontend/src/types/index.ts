// 重命名FormData接口以避免与浏览器内置FormData冲突
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

export interface FileUploads {
    [key: string]: File | File[] | null;
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
    [key: string]: string | string[] | null;
    idCardFront: string | null;
    idCardBack: string | null;
    bankCard: string | null;
    qrCode: string | null;
    storeFront: string[];
    storeInside: string[];
    cashier: string[];
    businessLicense: string | null;
}

export interface RegionOption {
    value: string;
    label: string;
    children?: RegionOption[];
}

export type FileUploadField = keyof FileUploads;