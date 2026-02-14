
import React, { useState, useEffect } from 'react';
import './App.css';
import { authFetch } from './utils/api';
import Sidebar from './components/Sidebar';
import PatientInfo from './components/PatientInfo';
import MedicalRecord from './components/MedicalRecord';
import PulseGrid from './components/PulseGrid';
import AIAnalysis from './components/AIAnalysis';
import ConfirmModal from './components/ConfirmModal';
import Login from './components/Login';
import Register from './components/Register';
import PersonalDashboard from './components/PersonalDashboard';
import ImportModal from './components/ImportModal';
import DatabaseStatus from './components/DatabaseStatus';
import Admin from './components/Admin';
import PrescriptionRecognition from './components/PrescriptionRecognition';

function App() {
  // --- Auth State ---
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u && u !== "undefined" ? JSON.parse(u) : null;
    } catch (e) {
      console.warn("User parse error", e);
      return null;
    }
  });
  const [showRegister, setShowRegister] = useState(false);

  // --- UI State ---
  const [view, setView] = useState('workbench');
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // --- Data State ---
  const [patientInfo, setPatientInfo] = useState({ name: '', gender: '男', age: '', phone: '' });
  const [medicalRecord, setMedicalRecord] = useState({ complaint: '', prescription: '', note: '' });
  const [pulseGrid, setPulseGrid] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);

  // --- Mode State ---
  const [practiceMode, setPracticeMode] = useState('personal');
  const [shadowingTab, setShadowingTab] = useState('record');
  const [teacher, setTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);

  // --- Effects ---
  useEffect(() => {
    if (token) {
      fetchPractitioners();
    }
  }, [token]);

  const fetchPractitioners = async () => {
    try {
      const res = await authFetch('/api/practitioners');
      if (res.ok) {
        const data = await res.json();
        const teacherList = data.filter(p => p.role === 'teacher').map(p => p.name);
        setTeachers(teacherList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- Handlers ---
  const handleLogin = (data) => {
    const { access_token, role, username, real_name, account_type } = data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify({ role, username, real_name, account_type }));
    setToken(access_token);
    setUser({ role, username, real_name, account_type });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('workbench');
  };

  const handleNewPatient = () => {
    setPatientInfo({ name: '', gender: '男', age: '', phone: '' });
    setMedicalRecord({ complaint: '', prescription: '', note: '' });
    setPulseGrid({});
    setAnalysisResult(null);
  };

  const handleLoadPatient = async (patientId) => {
    try {
      const res = await authFetch(`/api/patients/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatientInfo({
          id: data.id,
          name: data.name,
          gender: data.gender || '男',
          age: data.age || '',
          phone: data.phone || ''
        });
        setMedicalRecord({ complaint: '', prescription: '', note: '' });
        setPulseGrid({});
        setAnalysisResult(null);
      }
    } catch (e) {
      console.error("Load patient failed", e);
    }
  };

  const handleLoadRecord = async (recordId) => {
    try {
      const res = await authFetch(`/api/records/${recordId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.medical_record) setMedicalRecord(data.medical_record);
        if (data.pulse_grid) setPulseGrid(data.pulse_grid);
        if (data.raw_input && data.raw_input.ai_analysis) {
          setAnalysisResult(data.raw_input.ai_analysis);
        } else {
          setAnalysisResult(null);
        }
      }
    } catch (e) {
      console.error("Load record failed", e);
    }
  };

  const handleSave = async () => {
    if (!patientInfo.name) {
      alert("请输入患者姓名");
      return;
    }

    try {
      const payload = {
        patient_info: patientInfo,
        medical_record: medicalRecord,
        pulse_grid: pulseGrid,
        mode: practiceMode,
        teacher: teacher
      };

      const res = await authFetch('/api/records/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("保存成功");
        setLastUpdateTime(Date.now());
      } else {
        alert("保存失败");
      }
    } catch (e) {
      alert("错误: " + e.message);
    }
  };

  const handleDelete = (recordId) => {
    setRecordToDelete(recordId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      const res = await authFetch(`/api/records/${recordToDelete}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLastUpdateTime(Date.now());
        handleNewPatient();
      }
    } catch (e) {
      alert("删除失败");
    } finally {
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  const handleAnalyze = async () => {
    try {
      const payload = {
        pulse_grid: pulseGrid,
        medical_record: medicalRecord,
        patient_info: patientInfo
      };
      const res = await authFetch('/api/analyze/llm/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const result = await res.json();
        setAnalysisResult(result);
      }
    } catch (e) {
      console.error("Analysis failed", e);
    }
  };

  // --- Render ---

  const handleFillPrescription = (text) => {
    setMedicalRecord(prev => ({ ...prev, prescription: text }));
    setShadowingTab('record');
  };

  const handleFillInfo = (infoMap, { switchTab = true } = {}) => {
    if (infoMap.name || infoMap.gender || infoMap.age) {
      setPatientInfo(prev => ({
        ...prev,
        ...(infoMap.name && { name: infoMap.name }),
        ...(infoMap.gender && { gender: infoMap.gender }),
        ...(infoMap.age && { age: infoMap.age }),
      }));
    }
    if (infoMap.diagnosis || infoMap.experience) {
      setMedicalRecord(prev => ({
        ...prev,
        ...(infoMap.diagnosis && { complaint: infoMap.diagnosis }),
        ...(infoMap.experience && { note: infoMap.experience }),
      }));
    }
    if (switchTab) setShadowingTab('record');
  };

  if (!token) {
    if (showRegister) {
      return <Register onRegisterSuccess={() => setShowRegister(false)} onBack={() => setShowRegister(false)} />;
    }
    return <Login onLogin={handleLogin} onRegister={() => setShowRegister(true)} />;
  }

  // Render Admin View
  if (view === 'admin' && user?.role === 'admin') {
    return <Admin
      token={token}
      onBack={() => {
        setView('workbench');
        fetchPractitioners();
      }}
    />;
  }

  // Render Personal Dashboard
  if (user?.account_type === 'personal') {
    return <PersonalDashboard token={token} user={user} onLogout={handleLogout} />;
  }

  // Render Workbench (Doctor/Practitioner)
  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1>中医脉象九宫格病历录入系统</h1>
          <div className="operator-badge">
            <span className="operator-label">当前操作员:</span>
            <span className="operator-name">{user?.real_name || user?.username}</span>
            <span className={`operator-role ${user?.role === 'admin' ? 'admin' : 'doctor'}`}>
              {user?.role === 'admin' ? '管理员' : '医生'}
            </span>
          </div>
        </div>

        <div className="header-controls">
          <select
            value={practiceMode}
            onChange={(e) => {
              setPracticeMode(e.target.value);
              setShadowingTab('record');
            }}
            className="header-select"
          >
            <option value="personal">个人病历记录</option>
            <option value="shadowing">跟诊模式</option>
          </select>

          {practiceMode === 'shadowing' && (
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="header-select"
            >
              <option value="">请选择老师...</option>
              {teachers.map(t => (
                <option key={t} value={t}>{t}老师</option>
              ))}
            </select>
          )}

          {practiceMode === 'shadowing' && (
            <div className="shadowing-tabs">
              <button
                className={`shadowing-tab ${shadowingTab === 'record' ? 'active' : ''}`}
                onClick={() => setShadowingTab('record')}
              >
                病历录入
              </button>
              <button
                className={`shadowing-tab ${shadowingTab === 'prescription' ? 'active' : ''}`}
                onClick={() => setShadowingTab('prescription')}
              >
                处方识别
              </button>
            </div>
          )}

          <div className="header-divider"></div>

          <button onClick={() => setShowImportModal(true)} className="header-btn">
            📁 数据导入
          </button>

          {user?.role === 'admin' && (
            <button onClick={() => setView('admin')} className="header-btn">
              ⚙️ 系统管理
            </button>
          )}
          <button onClick={handleLogout} className="header-btn danger">
            🚪 退出
          </button>
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
            {practiceMode === 'shadowing' && shadowingTab === 'prescription' ? (
              <PrescriptionRecognition
                onFillPrescription={handleFillPrescription}
                onFillInfo={handleFillInfo}
              />
            ) : (
              <>
                <PatientInfo
                  data={patientInfo}
                  onChange={setPatientInfo}
                  onNewPatient={handleNewPatient}
                  onDelete={() => medicalRecord.id && handleDelete(medicalRecord.id)}
                />

                <MedicalRecord
                  data={medicalRecord}
                  onChange={setMedicalRecord}
                />

                <div className="action-buttons">
                  <button className="btn-primary" onClick={handleSave}>
                    <span>💾</span>
                    <span>保存病历</span>
                  </button>
                </div>

                <AIAnalysis data={analysisResult} onAnalyze={handleAnalyze} />
              </>
            )}
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
        <p>© 黄谦所有，联系方式：qhuang2010@gmail.com</p>
        <DatabaseStatus />
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

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        token={token}
        onSuccess={() => setLastUpdateTime(Date.now())}
      />
    </div>
  );
}

export default App;
