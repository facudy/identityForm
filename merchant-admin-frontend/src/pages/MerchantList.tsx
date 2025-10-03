import React, { useState, useEffect } from 'react';
import {
    Table,
    Input,
    Button,
    Space,
    message,
    Modal,
    Tag,
    Tooltip,
    Card,
    Typography
} from 'antd';
import {
    SearchOutlined,
    DownloadOutlined,
    DeleteOutlined,
    EyeOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ImageModal from '../components/ImageModal';
import { merchantAPI } from '../services/api';
import { downloadMerchantData } from '../services/download';
import { formatDate, formatAddress, formatFileSize } from '../utils/format';
import { FIELD_NAMES, PAGE_SIZE } from '../utils/constants';
import type { Merchant, MerchantFile } from '../types';
import '../styles/MerchantList.css';

const { Search } = Input;
const { Title } = Typography;
const { confirm } = Modal;

const MerchantList: React.FC = () => {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchText, setSearchText] = useState('');
    const [imageModal, setImageModal] = useState({
        visible: false,
        imageUrl: '',
        title: ''
    });

    // 获取商户列表
    const fetchMerchants = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await merchantAPI.getMerchants({
                page,
                pageSize: PAGE_SIZE,
                search
            });

            if (response.success) {
                setMerchants(response.data);
                setTotal(response.total);
                setCurrentPage(page);
            } else {
                message.error('获取商户列表失败');
            }
        } catch (error) {
            console.error('获取商户列表失败:', error);
            message.error('获取商户列表失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    // 初始加载
    useEffect(() => {
        fetchMerchants();
    }, []);

    // 搜索处理
    const handleSearch = (value: string) => {
        setSearchText(value);
        setCurrentPage(1);
        fetchMerchants(1, value);
    };

    // 分页处理
    const handlePageChange = (page: number) => {
        fetchMerchants(page, searchText);
    };

    // 刷新数据
    const handleRefresh = () => {
        fetchMerchants(currentPage, searchText);
    };

    // 查看图片
    const handleViewImage = (file: MerchantFile) => {
        // 优先使用签名URL，如果没有则尝试其他字段
        const imageUrl = file.signed_url || file.file_path;

        console.log('查看图片:', {
            file,
            使用的URL: imageUrl
        });

        if (!imageUrl) {
            message.error('图片URL不存在');
            return;
        }

        setImageModal({
            visible: true,
            imageUrl: imageUrl,
            title: `${FIELD_NAMES[file.field_name] || file.field_name} - ${file.original_name}`
        });
    };

    // 下载商户数据
    const handleDownload = async (merchant: Merchant) => {
        try {
            message.loading({ content: '正在打包下载...', key: 'download' });
            await downloadMerchantData(merchant);
            message.success({ content: '下载成功', key: 'download' });
        } catch (error) {
            console.error('下载失败:', error);
            message.error({ content: '下载失败，请重试', key: 'download' });
        }
    };

    // 删除商户
    const handleDelete = (merchant: Merchant) => {
        confirm({
            title: '确认删除',
            icon: <ExclamationCircleOutlined />,
            content: `确定要删除商户 "${merchant.contact_name}" 的所有信息吗？此操作不可恢复。`,
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const response = await merchantAPI.deleteMerchant(merchant.id);
                    if (response.success) {
                        message.success('删除成功');
                        // 如果当前页没有数据了，返回上一页
                        if (merchants.length === 1 && currentPage > 1) {
                            fetchMerchants(currentPage - 1, searchText);
                        } else {
                            fetchMerchants(currentPage, searchText);
                        }
                    } else {
                        message.error(response.message || '删除失败');
                    }
                } catch (error) {
                    console.error('删除失败:', error);
                    message.error('删除失败，请重试');
                }
            }
        });
    };

    // 渲染文件列表
    const renderFiles = (files: MerchantFile[]) => {
        if (!files || files.length === 0) {
            return <Tag color="default">无文件</Tag>;
        }

        return (
            <div className="file-list">
                {files.map((file) => (
                    <div key={file.id} className="file-item">
                        <Tooltip title={`点击查看 ${file.original_name}`}>
                            <Button
                                type="link"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => handleViewImage(file)}
                                className="file-preview-btn"
                            >
                                {FIELD_NAMES[file.field_name] || file.field_name}
                            </Button>
                        </Tooltip>
                        <span className="file-size">({formatFileSize(file.file_size)})</span>
                    </div>
                ))}
            </div>
        );
    };

    // 表格列定义
    const columns: ColumnsType<Merchant> = [
        {
            title: '联系人',
            dataIndex: 'contact_name',
            key: 'contact_name',
            width: 100,
            fixed: 'left',
        },
        {
            title: '商户名称',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <Tooltip placement="topLeft" title={text}>
                    {text}
                </Tooltip>
            ),
        },
        {
            title: '联系电话',
            dataIndex: 'phone_number',
            key: 'phone_number',
            width: 120,
        },
        {
            title: '详细地址',
            key: 'address',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (_, record) => {
                const address = formatAddress(record.region_values, record.detail_address);
                return (
                    <Tooltip placement="topLeft" title={address}>
                        {address}
                    </Tooltip>
                );
            },
        },
        {
            title: '银行信息',
            key: 'bank_info',
            width: 180,
            render: (_, record) => (
                <div className="bank-info">
                    {record.bank_card_holder && (
                        <div>持卡人: {record.bank_card_holder}</div>
                    )}
                    {record.bank_city && (
                        <div>开户城市: {record.bank_city}</div>
                    )}
                    {record.bank_branch && (
                        <div className="bank-branch">开户支行: {record.bank_branch}</div>
                    )}
                </div>
            ),
        },
        {
            title: '上传文件',
            key: 'files',
            width: 180,
            render: (_, record) => renderFiles(record.files),
        },
        {
            title: '提交时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 160,
            render: (text) => formatDate(text),
            sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        },
        {
            title: '操作',
            key: 'actions',
            width: 120,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="下载所有文件">
                        <Button
                            type="primary"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(record)}
                        />
                    </Tooltip>
                    <Tooltip title="删除商户">
                        <Button
                            type="primary"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className="merchant-list">
            <Card>
                <div className="list-header">
                    <Title level={4}>商户信息列表</Title>
                    <Space size="middle">
                        <Search
                            placeholder="搜索商户名称、联系人或电话"
                            allowClear
                            enterButton={<SearchOutlined />}
                            size="middle"
                            style={{ width: 300 }}
                            onSearch={handleSearch}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleRefresh}
                            loading={loading}
                        >
                            刷新
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={merchants}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: currentPage,
                        pageSize: PAGE_SIZE,
                        total: total,
                        showSizeChanger: false,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                        onChange: handlePageChange,
                    }}
                    size="middle"
                />
            </Card>

            <ImageModal
                visible={imageModal.visible}
                imageUrl={imageModal.imageUrl}
                title={imageModal.title}
                onClose={() => setImageModal({ visible: false, imageUrl: '', title: '' })}
            />
        </div>
    );
};

export default MerchantList;