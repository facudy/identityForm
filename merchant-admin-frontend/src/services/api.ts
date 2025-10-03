import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/constants'
import type {
    LoginCredentials,
    LoginResponse,
    PaginationParams,
    MerchantListResponse,
    Merchant,
    ApiResponse
} from '../types';

const makeAuthenticatedRequest = async (method: string, url: string, data?: any, params?: any) => {
    const token = localStorage.getItem('admin_token');
    console.log('🔑 使用token发送请求:', token ? `${token.substring(0, 30)}...` : 'null');

    if (!token || token === 'null' || token === 'undefined') {
        console.error('❌ 无有效token，需要重新登录');
        throw new Error('No valid token, please login again');
    }

    const config = {
        method,
        url: `${API_BASE_URL}${url}`,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        ...(data && { data }),
        ...(params && { params })
    };

    console.log('📤 发送请求到:', config.url);
    console.log('📤 Authorization头:', config.headers.Authorization?.substring(0, 50) + '...');

    try {
        const response = await axios(config);
        console.log('✅ 请求成功:', response.status);
        return response;
    } catch (error) {
        console.error('❌ 请求失败:', error);

        if (error instanceof AxiosError) {
            console.error('📋 错误状态:', error.response?.status);
            console.error('📋 错误数据:', error.response?.data);

            if (error.response?.status === 401) {
                console.error('🚫 认证失败，清除token');
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_username');
            }
        }

        throw error;
    }
};

export const authAPI = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        try {
            console.log('🔐 开始登录:', credentials.username);

            // 清除旧数据
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_username');

            const response = await axios.post<LoginResponse>(`${API_BASE_URL}/admin/login`, credentials, {
                headers: { 'Content-Type': 'application/json' }
            });

            console.log('📨 登录响应:', response.data);

            const loginData = response.data;

            if (loginData.success && loginData.data?.token) {
                const token = loginData.data.token;
                console.log('💾 保存token:', token.substring(0, 50) + '...');
                console.log('💾 Token长度:', token.length);

                localStorage.setItem('admin_token', token);
                localStorage.setItem('admin_username', credentials.username);

                // 验证保存
                const saved = localStorage.getItem('admin_token');
                console.log('🔍 验证保存成功:', saved === token);
            } else {
                console.error('❌ 登录响应格式错误:', loginData);
            }

            return loginData;
        } catch (error) {
            console.error('❌ 登录失败:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        window.location.href = '/login';
    }
};

export const merchantAPI = {
    getMerchants: async (params: PaginationParams): Promise<MerchantListResponse> => {
        console.log('📊 获取商户列表');
        const response = await makeAuthenticatedRequest('GET', '/admin/merchants', null, params);
        return response.data;
    },

    getMerchantById: async (id: string): Promise<{ success: boolean; data: Merchant }> => {
        const response = await makeAuthenticatedRequest('GET', `/admin/merchants/${id}`);
        return response.data;
    },

    deleteMerchant: async (id: string): Promise<ApiResponse> => {
        const response = await makeAuthenticatedRequest('DELETE', `/admin/merchants/${id}`);
        return response.data;
    },

    batchDeleteMerchants: async (ids: string[]): Promise<ApiResponse> => {
        const response = await makeAuthenticatedRequest('POST', '/admin/merchants/batch-delete', { ids });
        return response.data;
    },

    getStatistics: async (): Promise<{ success: boolean; data: any }> => {
        const response = await makeAuthenticatedRequest('GET', '/admin/statistics');
        return response.data;
    }
};

export default axios;