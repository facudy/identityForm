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

// src/utils/api.ts
export class ApiService {
    private static readonly BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

    static async submitForm(formData: MerchantFormData, files: FileUploads): Promise<boolean> {
        try {
            const submitData = new FormData();

            // 添加基本信息
            Object.keys(formData).forEach(key => {
                const value = formData[key as keyof MerchantFormData];
                if (key === 'regionValues') {
                    submitData.append(key, JSON.stringify(value));
                } else {
                    submitData.append(key, String(value));
                }
            });

            // 添加文件
            Object.keys(files).forEach(fieldName => {
                const file = files[fieldName as keyof FileUploads];
                if (file) {
                    if (Array.isArray(file)) {
                        // 多文件字段
                        file.forEach((f) => {
                            submitData.append(`${fieldName}`, f);
                        });
                    } else {
                        // 单文件字段
                        submitData.append(fieldName, file);
                    }
                }
            });

            // 正确的地址：/api/merchants/submit
            console.log('准备发送请求到:', `${this.BASE_URL}/api/merchants/submit`);

            const response = await fetch(`${this.BASE_URL}/api/merchants/submit`, {
                method: 'POST',
                body: submitData,
            });

            console.log('响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('请求失败:', errorText);
                return false;
            }

            const result = await response.json();
            console.log('响应结果:', result);

            return result.success || true;
        } catch (error) {
            console.error('API 调用失败:', error);
            return false;
        }
    }

    // 添加健康检查方法
    static async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.BASE_URL}/api/health`);
            const result = await response.json();
            console.log('健康检查结果:', result);
            return response.ok;
        } catch (error) {
            console.error('健康检查失败:', error);
            return false;
        }
    }
}