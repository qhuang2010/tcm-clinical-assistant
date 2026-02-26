
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { authFetch } from './utils/api';
import { medicinesToText, textToMedicines } from './components/MedicineInput';
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
  const prescriptionRef = useRef(null);

  // --- Data State ---
  const [patientInfo, setPatientInfo] = useState({ name: '', gender: '男', age: '', phone: '' });
  const [medicalRecord, setMedicalRecord] = useState({ complaint: '', medicines: [], note: '' });
  const [pulseGrid, setPulseGrid] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [recordPermission, setRecordPermission] = useState({ can_edit: true, can_delete: true, is_owner: true });

  // --- Mode State (persisted) ---
  const [practiceMode, setPracticeMode] = useState(() => localStorage.getItem('practiceMode') || 'personal');
  const [shadowingTab, setShadowingTab] = useState(() => localStorage.getItem('shadowingTab') || 'record');
  const [teacher, setTeacher] = useState(() => localStorage.getItem('teacher') || '');
  const [teachers, setTeachers] = useState([]);

  // --- Effects ---
  useEffect(() => {
    if (token) {
      fetchPractitioners();
    }
  }, [token]);

  useEffect(() => { localStorage.setItem('practiceMode', practiceMode); }, [practiceMode]);
  useEffect(() => { localStorage.setItem('shadowingTab', shadowingTab); }, [shadowingTab]);
  useEffect(() => { localStorage.setItem('teacher', teacher); }, [teacher]);

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
    setMedicalRecord({ complaint: '', medicines: [], note: '' });
    setPulseGrid({});
    setAnalysisResult(null);
    setCurrentRecordId(null);
    setRecordPermission({ can_edit: true, can_delete: true, is_owner: true });
  };

  const loadAbortRef = useRef(null);

  const handleLoadPatient = async (patientId) => {
    // Abort any in-flight patient/record load request
    if (loadAbortRef.current) loadAbortRef.current.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    // Immediately clear old data
    setMedicalRecord({ complaint: '', medicines: [], note: '' });
    setPulseGrid({});
    setAnalysisResult(null);
    setCurrentRecordId(null);

    try {
      const res = await authFetch(`/api/patients/${patientId}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json();
        setPatientInfo({
          id: data.id,
          name: data.name,
          gender: data.gender || '男',
          age: data.age || '',
          phone: data.phone || ''
        });
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error("Load patient failed", e);
    }
  };

  const handleLoadRecord = async (recordId) => {
    // Abort any in-flight load request
    if (loadAbortRef.current) loadAbortRef.current.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    try {
      const res = await authFetch(`/api/records/${recordId}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (res.ok) {
        const data = await res.json();
        // Set patient info from record response
        if (data.patient_info) {
          setPatientInfo({
            id: data.patient_info.id,
            name: data.patient_info.name || '',
            gender: data.patient_info.gender || '男',
            age: data.patient_info.age || '',
            phone: data.patient_info.phone || ''
          });
        }

        // Ensure we always explicitly set medicalRecord and pulseGrid to prevent data bleeding
        if (data.medical_record) {
          const mr = { ...data.medical_record };
          // Backward compat: convert old string prescription to medicines array
          if ((!mr.medicines || mr.medicines.length === 0) && mr.prescription && typeof mr.prescription === 'string') {
            mr.medicines = textToMedicines(mr.prescription);
          }
          if (!mr.medicines) mr.medicines = [];
          // Preserve record id for delete operations
          mr.id = recordId;
          setMedicalRecord(mr);
        } else {
          setMedicalRecord({ complaint: '', medicines: [], note: '' });
        }

        if (data.pulse_grid) {
          setPulseGrid(data.pulse_grid);
        } else {
          setPulseGrid({});
        }

        // Load saved AI analysis
        if (data.ai_analysis) {
          setAnalysisResult(data.ai_analysis);
        } else {
          setAnalysisResult(null);
        }
        setCurrentRecordId(recordId);
        // Set permission state
        if (data.permissions) {
          setRecordPermission(data.permissions);
        } else {
          setRecordPermission({ can_edit: true, can_delete: true, is_owner: true });
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.error("Load record failed", e);
    }
  };

  const handleSave = async () => {
    // Merge prescription recognition data — prescription component is source of truth
    let mergedPatientInfo = { ...patientInfo };
    let mergedMedicalRecord = { ...medicalRecord };

    if (prescriptionRef.current?.hasData?.()) {
      const info = prescriptionRef.current.getPatientInfo();
      if (info) {
        // Prescription component's corrected data overrides main form
        if (info.name) mergedPatientInfo.name = info.name;
        if (info.gender) mergedPatientInfo.gender = info.gender;
        if (info.age) mergedPatientInfo.age = info.age;
        if (info.diagnosis) mergedMedicalRecord.complaint = info.diagnosis;
        if (info.experience) mergedMedicalRecord.note = info.experience;
      }
      const medicines = prescriptionRef.current.getMedicines();
      if (medicines && medicines.length > 0) {
        // Merge: keep existing medicines, append new ones from prescription
        const existing = mergedMedicalRecord.medicines || [];
        const existingNames = new Set(existing.map(m => m.name));
        const newMeds = medicines.filter(m => !existingNames.has(m.name));
        mergedMedicalRecord.medicines = [...existing, ...newMeds];
      }
    }

    if (!mergedPatientInfo.name) {
      alert("请输入患者姓名");
      return;
    }

    // Convert medicines array to text for backward compatibility
    mergedMedicalRecord.prescription = medicinesToText(mergedMedicalRecord.medicines || []);

    // Update state so UI reflects merged data
    setPatientInfo(mergedPatientInfo);
    setMedicalRecord(mergedMedicalRecord);

    try {
      const payload = {
        patient_info: mergedPatientInfo,
        medical_record: mergedMedicalRecord,
        pulse_grid: pulseGrid,
        ai_analysis: analysisResult,
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
        // Auto-save annotation data if on prescription tab
        if (prescriptionRef.current) {
          prescriptionRef.current.saveAnnotation();
        }
        setLastUpdateTime(Date.now());
        // Clear form for next entry
        setPatientInfo({ name: '', gender: '男', age: '', phone: '' });
        setMedicalRecord({ complaint: '', medicines: [], note: '' });
        setPulseGrid({});
        setAnalysisResult(null);
        setCurrentRecordId(null);
        setRecordPermission({ can_edit: true, can_delete: true, is_owner: true });
        if (practiceMode === 'shadowing') setShadowingTab('prescription');
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
    } catch {
      alert("删除失败");
    } finally {
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  const handleAnalyze = async () => {
    try {
      // Include prescription text for AI analysis
      const mrForAnalysis = {
        ...medicalRecord,
        prescription: medicinesToText(medicalRecord.medicines || []),
      };
      const payload = {
        pulse_grid: pulseGrid,
        medical_record: mrForAnalysis,
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
        // Auto-save analysis to record if record exists
        if (currentRecordId) {
          authFetch(`/api/records/${currentRecordId}/analysis`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ai_analysis: result })
          }).catch(e => console.error("Save analysis failed", e));
        }
      }
    } catch (e) {
      console.error("Analysis failed", e);
    }
  };

  // --- Render ---

  const handleFillPrescription = (medicines) => {
    setMedicalRecord(prev => ({ ...prev, medicines }));
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
              <>
                <PrescriptionRecognition
                  key={lastUpdateTime}
                  ref={prescriptionRef}
                  onFillPrescription={handleFillPrescription}
                  onFillInfo={handleFillInfo}
                />
                <div className="action-buttons">
                  <button className="btn-primary" onClick={handleSave}>
                    <span>💾</span>
                    <span>保存病历</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <PatientInfo
                  data={patientInfo}
                  onChange={setPatientInfo}
                  onNewPatient={handleNewPatient}
                  onDelete={() => medicalRecord.id && handleDelete(medicalRecord.id)}
                  canEdit={recordPermission.can_edit}
                />

                <MedicalRecord
                  data={medicalRecord}
                  onChange={setMedicalRecord}
                  canEdit={recordPermission.can_edit}
                />

                <div className="action-buttons">
                  {recordPermission.can_edit && (
                    <button className="btn-primary" onClick={handleSave}>
                      <span>💾</span>
                      <span>保存病历</span>
                    </button>
                  )}
                  {!recordPermission.can_edit && recordPermission.owner_name && (
                    <span style={{ color: '#999', fontSize: '14px' }}>
                      只读模式（创建者：{recordPermission.owner_name}）
                    </span>
                  )}
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
