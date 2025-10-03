import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { formatDate, formatAddress } from '../utils/format';
import { FIELD_NAMES } from '../utils/constants';
import type { Merchant, MerchantFile } from '../types';

// 格式化日期为文件名格式 (YYYY_MM_DD)
const formatDateForFilename = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}_${month}_${day}`;
};

// 通过后端代理下载文件
const downloadFileViaBackend = async (file: MerchantFile, merchantId: string): Promise<Blob> => {
    console.log('通过后端代理下载:', file.original_name, file.id);

    const response = await fetch(`/api/admin/proxy-file/${merchantId}/${file.id}`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!response.ok) {
        let errorText = '';
        try {
            const errorJson = await response.json();
            errorText = errorJson.message || errorJson.error || response.statusText;
        } catch {
            errorText = response.statusText;
        }
        throw new Error(`后端代理下载失败: ${response.status} - ${errorText}`);
    }

    return await response.blob();
};

export const downloadMerchantData = async (merchant: Merchant) => {
    const zip = new JSZip();

    // 创建商户信息文本内容
    const merchantInfo = `商户信息
=================

商户名称: ${merchant.name || ''}
详细地址: ${formatAddress(merchant.region_values, merchant.detail_address)}
联系人姓名: ${merchant.contact_name || ''}
联系电话: ${merchant.phone_number || ''}
银行卡持有人: ${merchant.bank_card_holder || ''}
开户城市: ${merchant.bank_city || ''}
开户支行: ${merchant.bank_branch || ''}

提交时间: ${formatDate(merchant.created_at)}
`;

    // 添加商户信息文本文件
    zip.file('商户信息.txt', merchantInfo);

    // 如果有文件，下载并添加到zip中
    if (merchant.files && merchant.files.length > 0) {
        console.log('开始下载文件...', merchant.files.length, '个文件');

        // 串行下载文件
        for (const file of merchant.files) {
            try {
                console.log('下载文件:', file.original_name, 'ID:', file.id);

                // 通过后端代理下载
                const blob = await downloadFileViaBackend(file, merchant.id);

                // 生成文件名：字段名称_原始文件名
                const fieldName = FIELD_NAMES[file.field_name] || file.field_name;
                const fileName = `${fieldName}_${file.original_name}`;

                // 添加到zip中
                zip.file(fileName, blob);

                console.log('文件添加成功:', fileName, '大小:', blob.size);

            } catch (error: unknown) {
                console.error('下载文件失败:', file.original_name, error);

                // 处理错误信息
                let errorMessage = '未知错误';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                } else {
                    errorMessage = String(error);
                }

                // 创建错误说明文件
                const errorInfo = `文件下载失败: ${file.original_name}
错误信息: ${errorMessage}
文件ID: ${file.id}
商户ID: ${merchant.id}
时间: ${new Date().toLocaleString()}`;

                zip.file(`下载失败_${file.original_name}.txt`, errorInfo);
            }
        }
    }

    // 生成并下载zip文件
    try {
        console.log('生成ZIP文件...');
        const content = await zip.generateAsync({
            type: 'blob',
            compression: "DEFLATE",
            compressionOptions: {
                level: 6
            }
        });

        // 使用格式化的日期作为文件名
        const dateStr = formatDateForFilename(merchant.created_at);
        const fileName = `${merchant.contact_name || '商户'}_${dateStr}.zip`;
        saveAs(content, fileName);

        console.log('ZIP文件生成成功:', fileName);
    } catch (error: unknown) {
        console.error('生成ZIP文件失败:', error);

        let errorMessage = '未知错误';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else {
            errorMessage = String(error);
        }

        throw new Error(`生成压缩包失败: ${errorMessage}`);
    }
};