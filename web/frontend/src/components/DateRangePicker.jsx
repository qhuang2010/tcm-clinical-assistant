import React, { useState, useRef, useEffect } from 'react';

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    useEffect(() => {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
    }, [startDate, endDate]);

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.replace(/-/g, '/');
    };

    const handleConfirm = () => {
        let finalStart = tempStartDate;
        let finalEnd = tempEndDate;
        if (tempStartDate > tempEndDate) {
            finalStart = tempEndDate;
            finalEnd = tempStartDate;
        }
        onStartDateChange(finalStart);
        onEndDateChange(finalEnd);
        setIsOpen(false);
    };

    const handleQuickSelect = (days) => {
        const calculateDate = (offsetDays) => {
            const date = new Date();
            date.setDate(date.getDate() - offsetDays);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const endFormatted = calculateDate(0);
        const startFormatted = calculateDate(days);

        setTempStartDate(startFormatted);
        setTempEndDate(endFormatted);
    };

    const displayText = startDate === endDate
        ? formatDisplayDate(startDate)
        : `${formatDisplayDate(startDate)} ~ ${formatDisplayDate(endDate)}`;

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="date-picker-trigger"
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: `1.5px solid ${isOpen ? '#0071e3' : '#d2d2d7'}`,
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'inherit',
                    color: '#1d1d1f',
                    fontSize: '15px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease',
                    boxShadow: isOpen ? '0 0 0 4px rgba(0, 113, 227, 0.12)' : 'inset 0 1px 2px rgba(0,0,0,0.04)'
                }}
            >
                <span>{displayText}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                    padding: '20px',
                    zIndex: 1000,
                    minWidth: '280px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    animation: 'fadeIn 200ms ease, slideInUp 200ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '20px',
                        flexWrap: 'wrap'
                    }}>
                        <button onClick={() => handleQuickSelect(0)} style={quickBtnStyle}>
                            今天
                        </button>
                        <button onClick={() => handleQuickSelect(7)} style={quickBtnStyle}>
                            近7天
                        </button>
                        <button onClick={() => handleQuickSelect(30)} style={quickBtnStyle}>
                            近30天
                        </button>
                        <button onClick={() => handleQuickSelect(90)} style={quickBtnStyle}>
                            近3个月
                        </button>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>开始日期</label>
                        <input
                            type="date"
                            value={tempStartDate}
                            onChange={(e) => setTempStartDate(e.target.value)}
                            style={{
                                ...inputStyle,
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                backgroundColor: '#ffffff',
                                colorScheme: 'light'
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>结束日期</label>
                        <input
                            type="date"
                            value={tempEndDate}
                            onChange={(e) => setTempEndDate(e.target.value)}
                            style={{
                                ...inputStyle,
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                backgroundColor: '#ffffff',
                                colorScheme: 'light'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleConfirm}
                        className="btn-primary"
                        style={{ width: '100%', padding: '10px' }}
                    >
                        确认选择
                    </button>
                </div>
            )}
        </div>
    );
};

const quickBtnStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1.5px solid #e0e0e0',
    backgroundColor: '#ffffff',
    color: '#1d1d1f',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: 500,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
};

const labelStyle = {
    display: 'block',
    fontSize: '13px',
    color: '#86868b',
    marginBottom: '8px',
    fontWeight: 600
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #d2d2d7',
    fontFamily: 'inherit',
    color: '#1d1d1f',
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#fafafa',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
};

export default DateRangePicker;
