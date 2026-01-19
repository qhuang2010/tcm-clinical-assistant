import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import PatientInfo from './components/PatientInfo';
import MedicalRecord from './components/MedicalRecord';
import PulseGrid from './components/PulseGrid';
import AIAnalysis from './components/AIAnalysis';
import ConfirmModal from './components/ConfirmModal';
import Login from './components/Login';
import Register from './components/Register';
import Admin from './components/Admin';

const LOCAL_STORAGE_KEY = 'zhongyimedic_draft';

function App() {
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [view, setView] = useState('workbench'); // 'workbench' or 'admin'
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [registerMessage, setRegisterMessage] = useState('');

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Centralized State Management
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    gender: '男',
    phone: ''
  });

  const [medicalRecord, setMedicalRecord] = useState({
    complaint: '',
    prescription: '',
    totalDosage: '6付',
    note: ''
  });

  const [pulseGrid, setPulseGrid] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);

  // Practice Mode State
  const [practiceMode, setPracticeMode] = useState('personal');
  const [teacher, setTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);

  // --- Auto-save logic start ---

  // 1. Initial Load: Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.patientInfo) setPatientInfo(draft.patientInfo);
        if (draft.medicalRecord) setMedicalRecord(draft.medicalRecord);
        if (draft.pulseGrid) setPulseGrid(draft.pulseGrid);
        if (draft.practiceMode) setPracticeMode(draft.practiceMode);
        if (draft.teacher) setTeacher(draft.teacher);
        console.log('Draft restored from local storage');
      } catch (e) {
        console.error('Failed to parse saved draft', e);
      }
    }
  }, []);

  // 2. Auto-save: Update localStorage whenever state changes
  useEffect(() => {
    const draft = {
      patientInfo,
      medicalRecord,
      pulseGrid,
      practiceMode,
      teacher
    };
    // Only save if there's actual content (e.g., patient name or complaint)
    const hasContent = patientInfo.name || medicalRecord.complaint || Object.keys(pulseGrid).length > 0;
    if (hasContent) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draft));
    }
  }, [patientInfo, medicalRecord, pulseGrid, practiceMode, teacher]);

  // 3. Clear draft: Helper to remove draft after successful save or new patient
  const clearDraft = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // --- Auto-save logic end ---

  const fetchPractitioners = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/practitioners', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const tList = data.filter(p => p.role === 'teacher').map(p => p.name);
        setTeachers(tList);
      }
    } catch (e) {
      console.error("Failed to fetch practitioners", e);
    }
  };

  // Fetch practitioners on load
  useEffect(() => {
    fetchPractitioners();
  }, [token]);

  const handleLogin = (data) => {
    const { access_token, role, username, real_name } = data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify({ role, username, real_name }));
    setToken(access_token);
    setUser({ role, username, real_name });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('workbench');
  };

  const handleLoadPatient = async (patientId) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/latest_record`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPatientInfo(data.patient_info || { name: '', age: '', gender: '', phone: '' });
        const loadedRecord = data.medical_record || {};
        setMedicalRecord({
          complaint: loadedRecord.complaint || '',
          prescription: loadedRecord.prescription || '',
          totalDosage: loadedRecord.totalDosage || '6付',
          note: loadedRecord.note || ''
        });
        setPulseGrid(data.pulse_grid || {});
        if (data.record_data?.client_info) {
          setPracticeMode(data.record_data.client_info.mode || 'personal');
          setTeacher(data.record_data.client_info.teacher || '');
        }
        setCurrentRecordId(data.record_id || null);
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error('Error loading patient:', err);
    }
  };

  const handleLoadRecord = async (recordId) => {
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentRecordId(recordId);
        const loadedRecord = data.medical_record || {};
        setMedicalRecord({
          complaint: loadedRecord.complaint || '',
          prescription: loadedRecord.prescription || '',
          totalDosage: loadedRecord.totalDosage || '6付',
          note: loadedRecord.note || ''
        });
        setPulseGrid(data.pulse_grid || {});
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error('Error loading record:', err);
    }
  };

  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [currentRecordId, setCurrentRecordId] = useState(null);

  const handleSave = async () => {
    if (practiceMode === 'shadowing' && !teacher) {
      alert('请选择跟诊老师');
      return;
    }

    const payload = {
      patient_info: patientInfo,
      medical_record: medicalRecord,
      pulse_grid: pulseGrid,
      mode: practiceMode,
      teacher: teacher
    };

    try {
      const response = await fetch('/api/records/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        alert('保存成功！');
        clearDraft(); // Success! Clear local draft
        handleNewPatient();
        setLastUpdateTime(Date.now());
      } else {
        const error = await response.json();
        alert('保存失败: ' + error.detail);
      }
    } catch (err) {
      alert('保存出错: ' + err.message);
    }
  };

  const handleNewPatient = () => {
    setPatientInfo({ name: '', age: '', gender: '男', phone: '' });
    setMedicalRecord({ complaint: '', prescription: '', totalDosage: '6付', note: '' });
    setPulseGrid({});
    setAnalysisResult(null);
    setCurrentRecordId(null);
    clearDraft(); // Also clear draft when starting a fresh record
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const handleDelete = () => {
    if (!currentRecordId) {
      alert("当前没有选中的病历，无法删除。");
      return;
    }
    setRecordToDelete(currentRecordId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/records/${recordToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("删除成功！");
        handleNewPatient();
        setLastUpdateTime(Date.now());
      }
    } catch (err) {
      alert("删除出错: " + err.message);
    } finally {
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  const handleAnalyze = async () => {
    const payload = { medical_record: medicalRecord, pulse_grid: pulseGrid };
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      setAnalysisResult(result);
    }
  };

  if (!token) {
    if (authView === 'register') {
      return <Register
        onBack={() => setAuthView('login')}
        onRegisterSuccess={(msg) => {
          setRegisterMessage(msg);
          setAuthView('login');
        }}
      />;
    }
    return <Login
      onLogin={handleLogin}
      onRegister={() => setAuthView('register')}
      message={registerMessage}
    />;
  }

  if (view === 'admin' && user?.role === 'admin') {
    return <Admin
      token={token}
      onBack={() => {
        setView('workbench');
        fetchPractitioners();
      }}
    />;
  }

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1>中医脉象九宫格病历录入系统</h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0,113,227,0.08)',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid rgba(0,113,227,0.1)'
          }}>
            <span style={{ fontSize: '13px', color: '#86868b' }}>当前操作员:</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1d1d1f' }}>{user?.real_name || user?.username}</span>
            <span style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: user?.role === 'admin' ? '#5856d6' : '#34c759',
              color: 'white',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {user?.role === 'admin' ? '管理员' : '医生'}
            </span>
          </div>
        </div>

        <div className="header-controls" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <select
            value={practiceMode}
            onChange={(e) => setPracticeMode(e.target.value)}
            style={selectStyle}
          >
            <option value="personal">个人病历记录</option>
            <option value="shadowing">跟诊模式</option>
          </select>

          {practiceMode === 'shadowing' && (
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              style={selectStyle}
            >
              <option value="">请选择老师...</option>
              {teachers.map(t => (
                <option key={t} value={t}>{t}老师</option>
              ))}
            </select>
          )}

          <div style={{ height: '24px', width: '1px', backgroundColor: '#d2d2d7' }}></div>

          <button onClick={() => setShowImportModal(true)} style={headerBtnStyle}>数据导入</button>

          {user?.role === 'admin' && (
            <button onClick={() => setView('admin')} style={headerBtnStyle}>系统管理</button>
          )}
          <button onClick={handleLogout} style={{ ...headerBtnStyle, color: '#ff3b30' }}>退出</button>
        </div>
      </div>

      <div className="main-layout">
        <Sidebar
          token={token}
          onPatientSelect={handleLoadPatient}
          onRecordSelect={handleLoadRecord}
          lastUpdateTime={lastUpdateTime}
        />

        <div className="content-area">
          <div className="left-panel">
            <PatientInfo
              data={patientInfo}
              onChange={setPatientInfo}
              onNewPatient={handleNewPatient}
              onDelete={handleDelete}
            />

            <MedicalRecord
              data={medicalRecord}
              onChange={setMedicalRecord}
            />

            <div className="action-buttons">
              <button className="btn-primary" onClick={handleSave}>
                保存病历
              </button>
            </div>

            <AIAnalysis data={analysisResult} onAnalyze={handleAnalyze} />
          </div>

          <div className="right-panel">
            <PulseGrid
              data={pulseGrid}
              token={token}
              onChange={setPulseGrid}
              onSave={handleSave}
              onLoadRecord={handleLoadRecord}
            />
          </div>
        </div>
      </div>

      <div className="footer">
        <p>黄谦所有，联系方式：qhuang2010@gmail.com</p>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="确认删除"
        message="确定要删除这条病历记录吗？此操作无法撤销。"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setRecordToDelete(null);
        }}
      />

      {/* Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            width: '500px',
            maxWidth: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#1d1d1f' }}>导入门诊日志</h3>

            <div style={{
              border: '2px dashed #d2d2d7',
              borderRadius: '16px',
              padding: '30px',
              textAlign: 'center',
              backgroundColor: '#fafafa',
              marginBottom: '20px'
            }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setImportFile(e.target.files[0]);
                  setImportResult(null);
                }}
                style={{ display: 'none' }}
                id="import-excel"
              />
              <label htmlFor="import-excel" style={{
                display: 'inline-block',
                padding: '10px 24px',
                backgroundColor: '#0071e3',
                color: 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                📁 选择Excel文件
              </label>

              {importFile && (
                <div style={{ marginTop: '12px', color: '#1d1d1f' }}>
                  已选择：{importFile.name}
                </div>
              )}
            </div>

            {importResult && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: importResult.success ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                color: importResult.success ? '#34c759' : '#ff3b30'
              }}>
                {importResult.success
                  ? `✓ 成功导入 ${importResult.imported} 条记录`
                  : `✗ ${importResult.error}`
                }
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={async () => {
                  if (!importFile) return;
                  setImporting(true);
                  setImportResult(null);

                  try {
                    const formData = new FormData();
                    formData.append('file', importFile);

                    const res = await fetch('/api/import/excel', {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` },
                      body: formData
                    });

                    if (res.ok) {
                      const data = await res.json();
                      setImportResult({ success: true, imported: data.imported });
                      setLastUpdateTime(Date.now());
                    } else {
                      const text = await res.text();
                      let errorMsg = '导入失败';
                      try {
                        const errData = JSON.parse(text);
                        errorMsg = errData.detail || errorMsg;
                      } catch {
                        errorMsg = text.substring(0, 200) || `服务器错误 (${res.status})`;
                      }
                      setImportResult({ success: false, error: errorMsg });
                    }
                  } catch (err) {
                    setImportResult({ success: false, error: err.message });
                  } finally {
                    setImporting(false);
                  }
                }}
                disabled={!importFile || importing}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: importFile ? '#34c759' : '#e0e0e0',
                  color: importFile ? 'white' : '#999',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: importFile ? 'pointer' : 'not-allowed'
                }}
              >
                {importing ? '导入中...' : '开始导入'}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportResult(null);
                }}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: '1px solid #d2d2d7',
                  backgroundColor: 'white',
                  color: '#666',
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: '6px 10px',
  borderRadius: '8px',
  border: '1px solid #d2d2d7',
  fontSize: '13px',
  fontFamily: 'inherit',
  backgroundColor: 'white'
};

const headerBtnStyle = {
  padding: '6px 12px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: 'transparent',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  color: '#0071e3',
  transition: 'background 0.2s'
};

export default App;
