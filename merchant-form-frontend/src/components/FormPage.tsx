import React, { useState } from 'react';
import { Upload, X, Camera, MapPin, User, Phone, CreditCard, Building2, FileImage } from 'lucide-react';
import { Cascader, message } from 'antd';
import { MerchantFormData, FileUploads, FilePreviews, FileUploadField } from '../types/index';
import { ApiService } from '../utils/api';
import { transformedRegionData, getRegionNameByCode } from '../data/regions';

const FormPage: React.FC = () => {
    const [formData, setFormData] = useState<MerchantFormData>({
        name: '',
        regionValues: [],
        detailAddress: '',
        contactName: '',
        phoneNumber: '',
        bankCardHolder: '',
        bankCity: '',
        bankBranch: '',
    });

    const [files, setFiles] = useState<FileUploads>({
        idCardFront: null,
        idCardBack: null,
        bankCard: null,
        qrCode: null,
        storeFront: [],
        storeInside: [],
        cashier: [],
        businessLicense: null,
    });

    const [previews, setPreviews] = useState<FilePreviews>({
        idCardFront: null,
        idCardBack: null,
        bankCard: null,
        qrCode: null,
        storeFront: [],
        storeInside: [],
        cashier: [],
        businessLicense: null,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: keyof MerchantFormData, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (field: FileUploadField, file: File, isMultiple = false) => {
        if (!file) return;

        // 检查文件大小 (5MB限制)
        if (file.size > 5 * 1024 * 1024) {
            message.error('文件大小不能超过 5MB');
            return;
        }

        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            message.error('只能上传图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;

            if (isMultiple) {
                setFiles(prev => ({
                    ...prev,
                    [field]: [...(prev[field] as File[]), file]
                }));
                setPreviews(prev => ({
                    ...prev,
                    [field]: [...(prev[field] as string[]), result]
                }));
            } else {
                setFiles(prev => ({ ...prev, [field]: file }));
                setPreviews(prev => ({ ...prev, [field]: result }));
            }
        };
        reader.readAsDataURL(file);
    };

    const removeFile = (field: FileUploadField, index?: number) => {
        if (index !== undefined) {
            setFiles(prev => ({
                ...prev,
                [field]: (prev[field] as File[]).filter((_, i) => i !== index)
            }));
            setPreviews(prev => ({
                ...prev,
                [field]: (prev[field] as string[]).filter((_, i) => i !== index)
            }));
        } else {
            setFiles(prev => ({ ...prev, [field]: Array.isArray(prev[field]) ? [] : null }));
            setPreviews(prev => ({ ...prev, [field]: Array.isArray(prev[field]) ? [] : null }));
        }
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) {
            message.error('请输入名称');
            return false;
        }
        if (formData.regionValues.length === 0) {
            message.error('请选择地区');
            return false;
        }
        if (!formData.detailAddress.trim()) {
            message.error('请输入详细地址');
            return false;
        }
        if (!formData.contactName.trim()) {
            message.error('请输入联系人姓名');
            return false;
        }
        if (!formData.phoneNumber.trim()) {
            message.error('请输入手机号码');
            return false;
        }
        if (!/^1[3-9]\d{9}$/.test(formData.phoneNumber)) {
            message.error('请输入正确的手机号码');
            return false;
        }
        if (!files.idCardFront) {
            message.error('请上传身份证人像面');
            return false;
        }
        if (!files.idCardBack) {
            message.error('请上传身份证国徽面');
            return false;
        }
        if (!files.businessLicense) {
            message.error('请上传营业执照');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // 在提交前显示选择的地区信息
            const regionName = getRegionNameByCode(formData.regionValues);
            console.log('选择的地区:', regionName);

            const success = await ApiService.submitForm(formData, files);

            if (success) {
                message.success('提交成功！');
                // 重置表单
                setFormData({
                    name: '',
                    regionValues: [],
                    detailAddress: '',
                    contactName: '',
                    phoneNumber: '',
                    bankCardHolder: '',
                    bankCity: '',
                    bankBranch: '',
                });
                setFiles({
                    idCardFront: null,
                    idCardBack: null,
                    bankCard: null,
                    qrCode: null,
                    storeFront: [],
                    storeInside: [],
                    cashier: [],
                    businessLicense: null,
                });
                setPreviews({
                    idCardFront: null,
                    idCardBack: null,
                    bankCard: null,
                    qrCode: null,
                    storeFront: [],
                    storeInside: [],
                    cashier: [],
                    businessLicense: null,
                });
            } else {
                message.error('提交失败，请重试');
            }
        } catch (error) {
            message.error('网络错误，请重试');
        } finally {
            setIsSubmitting(false);
        }
    };

    interface FileUploadComponentProps {
        field: FileUploadField;
        label: string;
        multiple?: boolean;
        icon: React.ComponentType<{ size?: number }>;
        required?: boolean;
    }

    const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
        field,
        label,
        multiple = false,
        icon: Icon,
        required = false
    }) => {
        const fieldId = String(field);

        return (
            <div className="form-group">
                <label className="form-label">
                    <Icon size={16} />
                    {label}
                    {required && <span className="required">*</span>}
                </label>

                <div className="file-upload-area">
                    <input
                        type="file"
                        accept="image/*"
                        multiple={multiple}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(field, file, multiple);
                        }}
                        className="file-upload-input"
                        id={fieldId}
                    />

                    {multiple ? (
                        <div>
                            <label htmlFor={fieldId} className="file-upload-button">
                                <Upload size={20} />
                                <span>点击上传图片</span>
                            </label>

                            {(previews[field] as string[]).length > 0 && (
                                <div className="preview-grid">
                                    {(previews[field] as string[]).map((preview, index) => (
                                        <div key={index} className="preview-item">
                                            <img
                                                src={preview}
                                                alt={`预览 ${index + 1}`}
                                                className="preview-image"
                                            />
                                            <button
                                                onClick={() => removeFile(field, index)}
                                                className="remove-button"
                                                type="button"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {previews[field] ? (
                                <div className="preview-item">
                                    <img
                                        src={previews[field] as string}
                                        alt="预览"
                                        className="preview-single"
                                    />
                                    <button
                                        onClick={() => removeFile(field)}
                                        className="remove-button"
                                        type="button"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <label htmlFor={fieldId} className="file-upload-button">
                                    <Upload size={20} />
                                    <span>点击上传图片</span>
                                </label>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="app-container">
            <div className="form-container">
                <h1 className="form-title">商户信息登记</h1>

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    {/* 身份证上传 */}
                    <FileUploadComponent
                        field="idCardFront"
                        label="身份证人像面"
                        icon={User}
                        required
                    />

                    <FileUploadComponent
                        field="idCardBack"
                        label="身份证国徽面"
                        icon={User}
                        required
                    />

                    {/* 基本信息 */}
                    <div className="form-group">
                        <label className="form-label">
                            <Building2 size={16} />
                            名称
                            <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="form-input"
                            placeholder="请输入名称"
                        />
                    </div>

                    {/* 地区选择 */}
                    <div className="form-group">
                        <label className="form-label">
                            <MapPin size={16} />
                            地区选择
                            <span className="required">*</span>
                        </label>
                        <Cascader
                            options={transformedRegionData}
                            value={formData.regionValues}
                            onChange={(value) => handleInputChange('regionValues', value || [])}
                            placeholder="请选择省/市/区"
                            showSearch={{
                                filter: (inputValue, path) =>
                                    path.some(option => option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
                            }}
                            style={{ width: '100%' }}
                        />
                        {/* 显示选择的地区名称 */}
                        {formData.regionValues.length > 0 && (
                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
                                已选择: {getRegionNameByCode(formData.regionValues)}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            详细地址
                            <span className="required">*</span>
                        </label>
                        <textarea
                            value={formData.detailAddress}
                            onChange={(e) => handleInputChange('detailAddress', e.target.value)}
                            className="form-textarea"
                            placeholder="请输入详细地址"
                        />
                    </div>

                    {/* 联系人信息 */}
                    <div className="form-group">
                        <label className="form-label">
                            <User size={16} />
                            联系人姓名
                            <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.contactName}
                            onChange={(e) => handleInputChange('contactName', e.target.value)}
                            className="form-input"
                            placeholder="请输入联系人姓名"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Phone size={16} />
                            手机号码
                            <span className="required">*</span>
                        </label>
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                            className="form-input"
                            placeholder="请输入手机号码"
                        />
                    </div>

                    {/* 银行卡信息 */}
                    <FileUploadComponent
                        field="bankCard"
                        label="银行卡数字面"
                        icon={CreditCard}
                    />

                    <div className="grid-two">
                        <div className="form-group">
                            <label className="form-label">
                                <User size={16} />
                                开户人姓名
                            </label>
                            <input
                                type="text"
                                value={formData.bankCardHolder}
                                onChange={(e) => handleInputChange('bankCardHolder', e.target.value)}
                                className="form-input"
                                placeholder="请输入开户人姓名"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                <MapPin size={16} />
                                开户城市
                            </label>
                            <input
                                type="text"
                                value={formData.bankCity}
                                onChange={(e) => handleInputChange('bankCity', e.target.value)}
                                className="form-input"
                                placeholder="请输入开户城市"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <Building2 size={16} />
                            开户行支行
                        </label>
                        <input
                            type="text"
                            value={formData.bankBranch}
                            onChange={(e) => handleInputChange('bankBranch', e.target.value)}
                            className="form-input"
                            placeholder="请输入开户行支行"
                        />
                    </div>

                    {/* 拉卡拉二维码 */}
                    <FileUploadComponent
                        field="qrCode"
                        label="拉卡拉二维码正面照"
                        icon={FileImage}
                    />

                    {/* 门店照片 */}
                    <FileUploadComponent
                        field="storeFront"
                        label="门头照"
                        multiple={true}
                        icon={Camera}
                    />

                    <FileUploadComponent
                        field="storeInside"
                        label="内设照"
                        multiple={true}
                        icon={Camera}
                    />

                    <FileUploadComponent
                        field="cashier"
                        label="收银台照"
                        multiple={true}
                        icon={Camera}
                    />

                    {/* 营业执照 */}
                    <FileUploadComponent
                        field="businessLicense"
                        label="营业执照"
                        icon={FileImage}
                        required
                    />

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="submit-button"
                    >
                        {isSubmitting ? '提交中...' : '提交信息'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FormPage;