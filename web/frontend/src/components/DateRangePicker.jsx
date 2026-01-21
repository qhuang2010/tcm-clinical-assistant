import React, { useState, useRef, useEffect } from 'react';

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);
    const containerRef = useRef(null);

    // Handle click outside to close - only when dropdown is open
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        // Use setTimeout to avoid immediate trigger
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Sync temp dates when props change
    useEffect(() => {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
    }, [startDate, endDate]);

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.replace(/-/g, '/');
    };

    const handleConfirm = () => {
        // Ensure start <= end
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
            {/* Display Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d2d2d7',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'inherit',
                    color: '#1d1d1f',
                    fontSize: '14px',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: isOpen ? '0 0 0 3px rgba(0, 122, 255, 0.15)' : 'none',
                    borderColor: isOpen ? '#007aff' : '#d2d2d7'
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

            {/* Dropdown Panel */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    padding: '16px',
                    zIndex: 1000,
                    minWidth: '280px'
                }}>
                    {/* Quick Select Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => handleQuickSelect(0)}
                            style={quickBtnStyle}
                        >
                            今天
                        </button>
                        <button
                            onClick={() => handleQuickSelect(7)}
                            style={quickBtnStyle}
                        >
                            近7天
                        </button>
                        <button
                            onClick={() => handleQuickSelect(30)}
                            style={quickBtnStyle}
                        >
                            近30天
                        </button>
                        <button
                            onClick={() => handleQuickSelect(90)}
                            style={quickBtnStyle}
                        >
                            近3个月
                        </button>
                    </div>

                    {/* Date Inputs */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>开始日期</label>
                        <input
                            type="date"
                            value={tempStartDate}
                            onChange={(e) => setTempStartDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>结束日期</label>
                        <input
                            type="date"
                            value={tempEndDate}
                            onChange={(e) => setTempEndDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: '#007aff',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        确认选择
                    </button>
                </div>
            )}
        </div>
    );
};

const quickBtnStyle = {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    backgroundColor: '#f5f5f7',
    color: '#1d1d1f',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
};

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    marginBottom: '6px'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d2d2d7',
    fontFamily: 'inherit',
    color: '#1d1d1f',
    fontSize: '14px',
    boxSizing: 'border-box'
};

export default DateRangePicker;
