import React, { useState, useEffect } from 'react';
import DateRangePicker from './DateRangePicker';
import { authFetch } from '../utils/api';

const Sidebar = ({ token, onPatientSelect, onRecordSelect, lastUpdateTime }) => {
  const [query, setQuery] = useState('');
  const [historyUsers, setHistoryUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);

  // Date range filter state
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setMonth(today.getMonth() - 3); // Default to last 3 months
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Fetch patients by date range
  const fetchByDate = React.useCallback(async () => {
    if (!startDate || !endDate || !token) return;
    setLoading(true);
    try {
      const response = await authFetch(`/api/patients/by_date?start_date=${startDate}&end_date=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        setHistoryUsers(data);
      }
    } catch (error) {
      console.error('Fetch by date failed:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, token]);

  // Initial load & Date change effect
  useEffect(() => {
    if (!query.trim()) {
      fetchByDate();
    }
  }, [fetchByDate, lastUpdateTime]);

  // Search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        fetchByDate();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, fetchByDate]);

  const handleSearch = async () => {
    if (!query.trim() || !token) return;

    setLoading(true);
    try {
      const response = await authFetch(`/api/patients/search?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setHistoryUsers(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = async (patientId) => {
    setSelectedPatientId(patientId);
    onPatientSelect(patientId);

    // Fetch visit history
    try {
      const response = await authFetch(`/api/patients/${patientId}/history`);
      if (response.ok) {
        const data = await response.json();
        setPatientHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  return (
    <div className="sidebar">
      <h3 className="sidebar-title">历史患者</h3>

      <div className="date-filter">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <div className="sidebar-search-box">
        <input
          type="text"
          placeholder="搜索姓名或电话"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="sidebar-search-input"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="sidebar-search-btn"
        >
          {loading ? '...' : '搜'}
        </button>
      </div>

      <ul className="history-list">
        {historyUsers.length > 0 ? (
          historyUsers.map((user) => (
            <React.Fragment key={user.id}>
              <li
                className={`history-item ${selectedPatientId === user.id ? 'active' : ''}`}
                onClick={() => handlePatientClick(user.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="user-name">{user.name}</span>
                  <span className="user-phone">{user.phone}</span>
                </div>
                <span className="user-date">{user.last_visit}</span>
              </li>

              {selectedPatientId === user.id && patientHistory.length > 0 && (
                <ul className="visit-history">
                  {patientHistory.map(record => (
                    <li
                      key={record.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecordId(record.id);
                        onRecordSelect(record.id);
                      }}
                      className={`visit-item ${selectedRecordId === record.id ? 'selected' : ''}`}
                    >
                      <div className="visit-date">{record.visit_date}</div>
                      <div className="visit-complaint">
                        {record.complaint || '无主诉'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </React.Fragment>
          ))
        ) : (
          <li className="empty-state">
            {query ? '无匹配结果' : '该日期无就诊记录'}
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
