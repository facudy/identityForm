import axios from 'axios';
import { MerchantFormData, FileUploads } from '../types/index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export class ApiService {
    static async submitForm(formData: MerchantFormData, files: FileUploads): Promise<boolean> {
        // 使用浏览器内置的FormData
        const formDataToSend = new FormData();

        // 添加表单数据
        Object.keys(formData).forEach(key => {
            const value = formData[key as keyof MerchantFormData];
            if (Array.isArray(value)) {
                formDataToSend.append(key, JSON.stringify(value));
            } else {
                formDataToSend.append(key, value);
            }
        });

        // 添加文件
        Object.keys(files).forEach(key => {
            const fileData = files[key as keyof FileUploads];
            if (Array.isArray(fileData)) {
                fileData.forEach((file) => {
                    formDataToSend.append(key, file);
                });
            } else if (fileData) {
                formDataToSend.append(key, fileData);
            }
        });

        try {
            const response = await apiClient.post('/submit', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.status === 200;
        } catch (error) {
            console.error('Submit error:', error);
            return false;
        }
    }
}