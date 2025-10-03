import React from 'react';
import { Modal } from 'antd';

interface ImageModalProps {
    visible: boolean;
    imageUrl: string;
    onClose: () => void;
    title?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
    visible,
    imageUrl,
    onClose,
    title = '查看图片'
}) => {
    return (
        <Modal
            title={title}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            centered
        >
            <div style={{ textAlign: 'center' }}>
                <img
                    src={imageUrl}
                    alt={title}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '70vh',
                        objectFit: 'contain'
                    }}
                />
            </div>
        </Modal>
    );
};

export default ImageModal;