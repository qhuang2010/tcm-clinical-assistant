import React, { useState, useEffect } from 'react';

const PulseGrid = ({ data, token, onChange, onSave, onLoadRecord }) => {
  const [similarRecords, setSimilarRecords] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

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

  // Helper to migrate old keys if necessary (optional)
  // For now, we assume data comes in correct format or we map it on display

  const handleCellChange = (id, value) => {
    onChange({ ...data, [id]: value });
  };

  // Debounced search for similar records
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only search if there is some data
      const hasData = Object.keys(data).length > 0;
      if (hasData) {
        searchSimilar();
      } else {
        setSimilarRecords([]);
      }
    }, 1000); // 1s delay

    return () => clearTimeout(timer);
  }, [data]);

  const searchSimilar = async () => {
    setLoadingSimilar(true);
    try {
      const response = await fetch('/api/records/search_similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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

      <div className="overall-pulse-section" style={{ marginBottom: '15px' }}>
        <div style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--apple-text-secondary)', fontWeight: '500' }}>
          整体脉象
        </div>
        <textarea
          className="form-control"
          style={{
            minHeight: '60px',
            resize: 'none',
            fontSize: '0.95rem',
            padding: '10px'
          }}
          placeholder="例如：脉整体偏窄，显寒夹气血虚弱，空2分"
          value={data.overall_description || ''}
          onChange={(e) => onChange({ ...data, overall_description: e.target.value })}
        />
      </div>

      <div className="pulse-grid-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>

        {/* Left Hand */}
        <div className="hand-section">
          <div style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--apple-blue)', fontWeight: '600' }}>左手 (Left)</div>
          <div className="pulse-grid">
            {leftPositions.map((pos) => (
              <div key={pos.id} className="grid-input-cell">
                <textarea
                  className="cell-textarea"
                  placeholder={pos.label}
                  value={data[pos.id] || ''}
                  onChange={(e) => handleCellChange(pos.id, e.target.value)}
                ></textarea>
              </div>
            ))}
          </div>
        </div>

        {/* Right Hand */}
        <div className="hand-section">
          <div style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--apple-blue)', fontWeight: '600' }}>右手 (Right)</div>
          <div className="pulse-grid">
            {rightPositions.map((pos) => (
              <div key={pos.id} className="grid-input-cell">
                <textarea
                  className="cell-textarea"
                  placeholder={pos.label}
                  value={data[pos.id] || ''}
                  onChange={(e) => handleCellChange(pos.id, e.target.value)}
                ></textarea>
              </div>
            ))}
          </div>
        </div>

      </div>

      <button className="btn-primary" onClick={onSave}>
        保存病历
      </button>

      {/* Similar Records Section */}
      <div className="similar-records-section" style={{ marginTop: '30px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px' }}>
        <h4 style={{ fontSize: '0.95rem', color: 'var(--apple-text-secondary)', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
          <span>相似病历推荐</span>
          {loadingSimilar && <span style={{ fontSize: '0.8rem' }}>搜索中...</span>}
        </h4>

        {similarRecords.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
            暂无相似病历
          </div>
        ) : (
          <div className="similar-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {similarRecords.map(record => (
              <div
                key={record.record_id}
                className="similar-card"
                onClick={() => onLoadRecord && onLoadRecord(record.record_id)}
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  borderRadius: '12px',
                  padding: '12px',
                  cursor: 'pointer',
                  border: '1px solid rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{record.patient_name}</span>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>{record.visit_date}</span>
                </div>

                {/* Mini Grid for Visualization */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', opacity: 0.9 }}>
                  {/* Left Hand Mini */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    {leftPositions.map(pos => {
                      const isMatch = record.matches && record.matches.includes(pos.id);
                      const val = record.pulse_grid[pos.id] || '';
                      return (
                        <div key={pos.id} style={{
                          background: isMatch ? 'rgba(0, 113, 227, 0.15)' : '#fff',
                          border: isMatch ? '1px solid rgba(0, 113, 227, 0.3)' : '1px solid #eee',
                          borderRadius: '4px',
                          padding: '4px',
                          fontSize: '0.7rem',
                          textAlign: 'center',
                          minHeight: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isMatch ? 'var(--apple-blue)' : '#666'
                        }}>
                          {val || '-'}
                        </div>
                      );
                    })}
                  </div>
                  {/* Right Hand Mini */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    {rightPositions.map(pos => {
                      const isMatch = record.matches && record.matches.includes(pos.id);
                      const val = record.pulse_grid[pos.id] || '';
                      return (
                        <div key={pos.id} style={{
                          background: isMatch ? 'rgba(0, 113, 227, 0.15)' : '#fff',
                          border: isMatch ? '1px solid rgba(0, 113, 227, 0.3)' : '1px solid #eee',
                          borderRadius: '4px',
                          padding: '4px',
                          fontSize: '0.7rem',
                          textAlign: 'center',
                          minHeight: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isMatch ? 'var(--apple-blue)' : '#666'
                        }}>
                          {val || '-'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
