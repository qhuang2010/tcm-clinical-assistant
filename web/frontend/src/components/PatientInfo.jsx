import React from 'react';

const PatientInfo = ({ data, onChange, onNewPatient, onDelete, canEdit = true }) => {
  const handleChange = (e) => {
    if (!canEdit) return;
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="patient-info-section">
      <div className="section-title">
        <span>患者基本信息</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNewPatient();
            }}
            className="btn-small success"
          >
            + 新增患者
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="btn-small danger"
            >
              删除
            </button>
          )}
        </div>
      </div>
      <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
        <div className="form-group" style={{ flex: 1.5 }}>
          <label>姓名</label>
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="请输入姓名"
            value={data.name}
            onChange={handleChange}
            readOnly={!canEdit}
          />
        </div>
        <div className="form-group" style={{ flex: 0.8 }}>
          <label>年龄</label>
          <input
            type="number"
            name="age"
            className="form-control"
            placeholder="岁"
            value={data.age}
            onChange={handleChange}
            readOnly={!canEdit}
          />
        </div>
        <div className="form-group" style={{ flex: 0.8 }}>
          <label>性别</label>
          <select
            name="gender"
            className="form-control"
            value={data.gender || '男'}
            onChange={handleChange}
            disabled={!canEdit}
          >
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1.5 }}>
          <label>电话号码</label>
          <input
            type="tel"
            name="phone"
            className="form-control"
            placeholder="请输入电话号码"
            value={data.phone || ''}
            onChange={handleChange}
            readOnly={!canEdit}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientInfo;
