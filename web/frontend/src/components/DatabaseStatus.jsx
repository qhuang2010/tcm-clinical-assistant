import React, { useState, useEffect } from 'react';

const DatabaseStatus = () => {
    const [status, setStatus] = useState('checking'); // 'connected', 'pending', 'syncing', 'error'
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    const checkSyncStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/sync/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setPendingCount(data.pending_count);
                if (data.pending_count > 0) {
                    setStatus('pending');
                } else {
                    setStatus('connected');
                }
            } else {
                setStatus('error'); // Cloud API reachable but returned error
            }
        } catch (error) {
            console.error("Sync check failed", error);
            // Don't set error globally effectively, because we are "Offline First"
            // But maybe visual indication is needed?
            setStatus('connected'); // Fallback: Assume Local is mostly fine, but maybe show a disconnected icon?
            // Actually, if /api/sync/status fails, it means the LOCAL backend is down, effectively.
            // Because /api/sync/status is a local endpoint.
            setStatus('error');
        }
    };

    const handleSync = async () => {
        setStatus('syncing');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/sync/trigger', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.status === 'completed') {
                    // Check again to confirm
                    await checkSyncStatus();
                    setLastSyncTime(new Date());
                    alert(`同步完成: 成功 ${result.data.synced} 条, 失败 ${result.data.failed} 条`);
                } else {
                    alert(`同步遇到问题: ${result.message}`);
                    await checkSyncStatus();
                }
            } else {
                alert('同步请求失败');
                await checkSyncStatus();
            }
        } catch (e) {
            alert('同步出错: ' + e.message);
            await checkSyncStatus();
        }
    };

    useEffect(() => {
        checkSyncStatus();
        const interval = setInterval(checkSyncStatus, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    const getStatusConfig = () => {
        switch (status) {
            case 'connected':
                return { color: '#34c759', text: '已同步云端', icon: '☁️' };
            case 'pending':
                return { color: '#ff9500', text: `${pendingCount} 条待同步`, icon: '⬆️' };
            case 'syncing':
                return { color: '#0071e3', text: '正在同步...', icon: '🔄' };
            case 'error':
                return { color: '#ff3b30', text: '服务未连接', icon: '❌' };
            default:
                return { color: '#8e8e93', text: '检测中...', icon: '...' };
        }
    };

    const config = getStatusConfig();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            color: '#1d1d1f',
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>{config.icon}</span>
                <span style={{ color: config.color, fontWeight: '600' }}>{config.text}</span>
            </div>

            {/* Manual Sync Button - Always Visible or only when needed? Let's make it always visible if not syncing/error */}
            {status !== 'syncing' && status !== 'error' && (
                <button
                    onClick={handleSync}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        borderRadius: '12px',
                        border: '1px solid #0071e3',
                        backgroundColor: status === 'pending' ? '#0071e3' : 'white',
                        color: status === 'pending' ? 'white' : '#0071e3',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontWeight: '500'
                    }}
                >
                    {status === 'pending' ? '立即上传' : '手动同步'}
                </button>
            )}

            {lastSyncTime && (
                <span style={{ fontSize: '11px', color: '#86868b' }}>
                    {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            )}
        </div>
    );
};

export default DatabaseStatus;
