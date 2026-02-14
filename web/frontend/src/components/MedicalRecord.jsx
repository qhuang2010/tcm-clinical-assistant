import React from 'react';

const MedicalRecord = ({ data, onChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="medical-record-section">
      <div className="section-title">诊疗记录</div>
      
      <div className="form-group mb-4">
        <label>主诉</label>
        <textarea
          name="complaint"
          className="form-control"
          placeholder="请输入患者主诉..."
          value={data.complaint}
          onChange={handleChange}
        />
      </div>

      <div className="form-group mb-4" style={{ position: 'relative' }}>
        <label>用药</label>
        <textarea
          name="prescription"
          className="form-control"
          placeholder="请输入用药方案..."
          value={data.prescription}
          onChange={handleChange}
          style={{ paddingBottom: '56px' }}
        />
        <div className="dosage-input-wrapper">
          <span className="dosage-label">总计量:</span>
          <input
            type="text"
            name="totalDosage"
            value={data.totalDosage || '6付'}
            onChange={handleChange}
            className="dosage-field"
          />
        </div>
      </div>

      <div className="form-group">
        <label>体会/备注</label>
        <textarea
          name="note"
          className="form-control"
          placeholder="请输入诊疗体会或备注..."
          value={data.note}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default MedicalRecord;
