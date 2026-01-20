import React, { useState, useEffect } from 'react';

const DatabaseStatus = () => {
    const [status, setStatus] = useState('checking');
    const [latency, setLatency] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            const start = Date.now();
            try {
                const response = await fetch('/api/health');
                const end = Date.now();
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'connected') {
                        setStatus('connected');
                        setLatency(end - start);
                    } else {
                        setStatus('error');
                    }
                } else {
                    setStatus('error');
                }
            } catch (error) {
                setStatus('error');
            }
        };

        // Initial check
        checkStatus();

        // Check every 30 seconds
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case 'connected': return '#34c759'; // Green
            case 'error': return '#ff3b30';     // Red
            default: return '#8e8e93';          // Grey
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'connected': return '数据库已连接';
            case 'error': return '数据库连接失败';
            default: return '检测中...';
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#86868b',
            padding: '4px 8px',
            borderRadius: '12px',
            backgroundColor: 'rgba(0,0,0,0.03)'
        }}>
            <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getStatusColor(),
                boxShadow: `0 0 4px ${getStatusColor()}`
            }}></div>
            <span>{getStatusText()}</span>
            {status === 'connected' && latency && (
                <span style={{ fontSize: '10px', opacity: 0.7 }}>
                    ({latency}ms)
                </span>
            )}
        </div>
    );
};

export default DatabaseStatus;
