import React from 'react';
import MedicineInput from './MedicineInput';

const MedicalRecord = ({ data, onChange, canEdit = true }) => {
  const handleChange = (e) => {
    if (!canEdit) return;
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const handleMedicinesChange = (medicines) => {
    if (!canEdit) return;
    onChange({ ...data, medicines });
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
          readOnly={!canEdit}
        />
      </div>

      <div className="form-group mb-4" style={{ position: 'relative' }}>
        <label>用药</label>
        <MedicineInput
          medicines={data.medicines || []}
          onChange={handleMedicinesChange}
          readOnly={!canEdit}
        />
        <div className="dosage-input-wrapper" style={{ position: 'static', marginTop: '8px', display: 'inline-flex' }}>
          <span className="dosage-label">总计量:</span>
          <input
            type="text"
            name="totalDosage"
            value={data.totalDosage || '6付'}
            onChange={handleChange}
            className="dosage-field"
            readOnly={!canEdit}
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
          readOnly={!canEdit}
        />
      </div>
    </div>
  );
};

export default MedicalRecord;
