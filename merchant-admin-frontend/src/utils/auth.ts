export const isAuthenticated = (): boolean => {
    const token = localStorage.getItem('admin_token');
    return !!(token && token !== 'null' && token !== 'undefined' && token !== 'authenticated');
};

export const logout = (): void => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
};

export const getUsername = (): string | null => {
    return localStorage.getItem('admin_username');
};

// 移除了硬编码的 login 函数，现在使用 api.ts 中的 authAPI.login