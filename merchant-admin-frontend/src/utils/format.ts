import dayjs from 'dayjs';

export const formatDate = (date: string): string => {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatAddress = (regionValues: string[], detailAddress: string): string => {
    return [...regionValues, detailAddress].join(' ');
};