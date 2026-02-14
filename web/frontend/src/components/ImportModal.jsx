import React, { useState } from 'react';
import { authFetch } from '../utils/api';

const ImportModal = ({ isOpen, onClose, token, onSuccess }) => {
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    if (!isOpen) return null;

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('file', importFile);

            const res = await authFetch('/api/import/excel', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setImportResult({ success: true, imported: data.imported });
                if (onSuccess) onSuccess();
            } else {
                const text = await res.text();
                let errorMsg = '导入失败';
                try {
                    const errData = JSON.parse(text);
                    errorMsg = errData.detail || errorMsg;
                } catch {
                    errorMsg = text.substring(0, 200) || `服务器错误 (${res.status})`;
                }
                setImportResult({ success: false, error: errorMsg });
            }
        } catch (err) {
            setImportResult({ success: false, error: err.message });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content import-modal">
                <h3 className="modal-title">导入门诊日志</h3>

                <div className="import-dropzone">
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => {
                            setImportFile(e.target.files[0]);
                            setImportResult(null);
                        }}
                        style={{ display: 'none' }}
                        id="import-excel"
                    />
                    <label htmlFor="import-excel" className="import-file-btn">
                        📁 选择Excel文件
                    </label>

                    {importFile && (
                        <div className="import-file-name">
                            已选择：{importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                        </div>
                    )}
                </div>

                {importResult && (
                    <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
                        {importResult.success
                            ? `✓ 成功导入 ${importResult.imported} 条记录`
                            : `✗ ${importResult.error}`
                        }
                    </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleImport}
                        disabled={!importFile || importing}
                        className="btn-primary"
                        style={{ flex: 1 }}
                    >
                        {importing ? (
                            <>
                                <span className="loading-spinner" style={{ width: 16, height: 16 }} />
                                <span>导入中...</span>
                            </>
                        ) : (
                            <span>开始导入</span>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            onClose();
                            setImportFile(null);
                            setImportResult(null);
                        }}
                        className="btn-secondary"
                        style={{ padding: '12px 24px' }}
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
