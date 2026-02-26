import React, { useState, useEffect, useRef } from 'react';
import { authFetch } from '../utils/api';

const PulseGrid = ({ data, token, onChange, onSave, onLoadRecord }) => {
  const [similarRecords, setSimilarRecords] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const userEditedRef = useRef(false);

  const leftPositions = [
    { label: '寸浮', id: 'left-cun-fu', hideLabel: true },
    { label: '关浮', id: 'left-guan-fu', hideLabel: true },
    { label: '尺浮', id: 'left-chi-fu', hideLabel: true },
    { label: '寸中', id: 'left-cun-zhong', hideLabel: true },
    { label: '关中', id: 'left-guan-zhong', hideLabel: true },
    { label: '尺中', id: 'left-chi-zhong', hideLabel: true },
    { label: '寸沉', id: 'left-cun-chen', hideLabel: true },
    { label: '关沉', id: 'left-guan-chen', hideLabel: true },
    { label: '尺沉', id: 'left-chi-chen', hideLabel: true },
  ];

  const rightPositions = [
    { label: '寸浮', id: 'right-cun-fu', hideLabel: true },
    { label: '关浮', id: 'right-guan-fu', hideLabel: true },
    { label: '尺浮', id: 'right-chi-fu', hideLabel: true },
    { label: '寸中', id: 'right-cun-zhong', hideLabel: true },
    { label: '关中', id: 'right-guan-zhong', hideLabel: true },
    { label: '尺中', id: 'right-chi-zhong', hideLabel: true },
    { label: '寸沉', id: 'right-cun-chen', hideLabel: true },
    { label: '关沉', id: 'right-guan-chen', hideLabel: true },
    { label: '尺沉', id: 'right-chi-chen', hideLabel: true },
  ];

  const handleCellChange = (id, value) => {
    userEditedRef.current = true;
    onChange({ ...data, [id]: value });
  };

  // Debounced search for similar records - ONLY when user manually edits
  useEffect(() => {
    if (!userEditedRef.current) {
      return; // Skip search when data is loaded from backend
    }
    const timer = setTimeout(() => {
      const hasData = Object.keys(data).length > 0;
      if (hasData) {
        searchSimilar();
      } else {
        setSimilarRecords([]);
      }
      userEditedRef.current = false;
    }, 1500);

    return () => clearTimeout(timer);
  }, [data]);

  const searchSimilar = async () => {
    setLoadingSimilar(true);
    try {
      const response = await authFetch('/api/records/search_similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pulse_grid: data })
      });
      if (response.ok) {
        const results = await response.json();
        setSimilarRecords(results);
      }
    } catch (err) {
      console.error("Search similar failed", err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  return (
    <div className="grid-wrapper">
      <div className="grid-title">脉象九宫格录入</div>

      {/* 整体脉象描述 */}
      <div className="overall-pulse-section">
        <label>整体脉象</label>
        <textarea
          className="overall-pulse-input"
          placeholder="例如：脉整体偏窄，显寒夹气血虚弱，空2分"
          value={data.overall_description || ''}
          onChange={(e) => { userEditedRef.current = true; onChange({ ...data, overall_description: e.target.value }); }}
        />
      </div>

      {/* 脉象网格容器 */}
      <div className="pulse-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
        {/* 左手 */}
        <div className="hand-section">
          <div className="hand-label left">左手 (Left)</div>
          <div className="pulse-grid">
            {leftPositions.map((pos) => (
              <div key={pos.id} className="grid-input-cell">
                <textarea
                  className="cell-textarea"
                  placeholder={pos.label}
                  value={data[pos.id] || ''}
                  onChange={(e) => handleCellChange(pos.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 右手 */}
        <div className="hand-section">
          <div className="hand-label right">右手 (Right)</div>
          <div className="pulse-grid">
            {rightPositions.map((pos) => (
              <div key={pos.id} className="grid-input-cell">
                <textarea
                  className="cell-textarea"
                  placeholder={pos.label}
                  value={data[pos.id] || ''}
                  onChange={(e) => handleCellChange(pos.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <button className="btn-primary" onClick={onSave}>
        <span>💾</span>
        <span>保存病历</span>
      </button>

      {/* 相似病历推荐 */}
      <div className="similar-records-section">
        <div className="similar-section-title">
          <span>相似病历推荐</span>
          {loadingSimilar && <span className="similar-loading">搜索中...</span>}
        </div>

        {similarRecords.length === 0 ? (
          <div className="empty-state">
            暂无相似病历
          </div>
        ) : (
          <div className="similar-list">
            {similarRecords.map(record => (
              <div
                key={record.record_id}
                className="similar-card"
                onClick={() => onLoadRecord && onLoadRecord(record.record_id)}
              >
                <div className="similar-card-header">
                  <span className="similar-card-name">{record.patient_name}</span>
                  <span className="similar-card-score">相似度: {record.score}%</span>
                  <span className="similar-card-date">{record.visit_date}</span>
                </div>

                {/* 迷你脉象网格可视化 */}
                <div className="mini-pulse-grid">
                  {/* 左手迷你 */}
                  <div className="mini-grid-row">
                    {leftPositions.map(pos => {
                      const isMatch = record.matches && record.matches.includes(pos.id);
                      const val = record.pulse_grid[pos.id] || '';
                      return (
                        <div key={pos.id} className={`mini-grid-cell ${isMatch ? 'match' : ''}`}>
                          {val || '-'}
                        </div>
                      );
                    })}
                  </div>
                  {/* 右手迷你 */}
                  <div className="mini-grid-row">
                    {rightPositions.map(pos => {
                      const isMatch = record.matches && record.matches.includes(pos.id);
                      const val = record.pulse_grid[pos.id] || '';
                      return (
                        <div key={pos.id} className={`mini-grid-cell ${isMatch ? 'match' : ''}`}>
                          {val || '-'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="similar-card-complaint">
                  主诉: {record.complaint || '无'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PulseGrid;
