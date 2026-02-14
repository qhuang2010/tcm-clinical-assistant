import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">{title || '确认操作'}</h3>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button type="button" onClick={onCancel} className="modal-btn secondary">
                        取消
                    </button>
                    <button type="button" onClick={onConfirm} className="modal-btn danger">
                        确定删除
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
