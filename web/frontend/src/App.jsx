import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import PatientInfo from './components/PatientInfo';
import MedicalRecord from './components/MedicalRecord';
import PulseGrid from './components/PulseGrid';
import AIAnalysis from './components/AIAnalysis';
import ConfirmModal from './components/ConfirmModal';

function App() {
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
  const [practiceMode, setPracticeMode] = useState('personal'); // 'personal' or 'shadowing'
  const [teacher, setTeacher] = useState('');
  const [teachers, setTeachers] = useState([]);

  // Fetch practitioners on load
  React.useEffect(() => {
    const fetchPractitioners = async () => {
      try {
        const res = await fetch('/api/practitioners');
        if (res.ok) {
          const data = await res.json();
          // Filter for teachers
          const tList = data.filter(p => p.role === 'teacher').map(p => p.name);
          setTeachers(tList);
        }
      } catch (e) {
        console.error("Failed to fetch practitioners", e);
      }
    };
    fetchPractitioners();
  }, []);

  const handleLoadPatient = async (patientId) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/latest_record`);
      if (response.ok) {
        const data = await response.json();

        // Update state with loaded data
        setPatientInfo(data.patient_info || {
          name: '',
          age: '',
          gender: '',
          phone: ''
        });

        const loadedRecord = data.medical_record || {};
        setMedicalRecord({
          complaint: loadedRecord.complaint || '',
          prescription: loadedRecord.prescription || '',
          totalDosage: loadedRecord.totalDosage || '6付',
          note: loadedRecord.note || ''
        });

        setPulseGrid(data.pulse_grid || {});

        // Restore mode if available (optional, but good UX)
        if (data.record_data?.client_info) {
          setPracticeMode(data.record_data.client_info.mode || 'personal');
          setTeacher(data.record_data.client_info.teacher || '');
        }

        if (data.record_id) {
          setCurrentRecordId(data.record_id);
        } else {
          setCurrentRecordId(null);
        }

        setAnalysisResult(null); // Reset analysis when loading new patient
      } else {
        alert('加载患者信息失败');
      }
    } catch (err) {
      console.error('Error loading patient:', err);
      alert('加载患者信息出错');
    }
  };

  const handleLoadRecord = async (recordId) => {
    try {
      const response = await fetch(`/api/records/${recordId}`);
      if (response.ok) {
        const data = await response.json();

        // Set current record ID for deletion logic
        setCurrentRecordId(recordId);

        const loadedRecord = data.medical_record || {};
        setMedicalRecord({
          complaint: loadedRecord.complaint || '',
          prescription: loadedRecord.prescription || '',
          totalDosage: loadedRecord.totalDosage || '6付',
          note: loadedRecord.note || ''
        });

        setPulseGrid(data.pulse_grid || {});

        // Restore mode if available
        if (data.medical_record?.client_info) { // Note: structure varies slightly in API response
          // Actually API returns { medical_record:..., pulse_grid:... }. client_info is inside 'data' column but app.py flatten logic might need check.
          // Checking app.py get_record:
          // if "medical_record" in record_data... 
          // It doesn't explicitly return client_info in the flattened response currently.
          // For now, let's skip auto-restore of mode to avoid complexity unless requested.
        }

        setAnalysisResult(null); // Reset analysis when loading new record
      } else {
        alert('加载病历失败');
      }
    } catch (err) {
      console.error('Error loading record:', err);
      alert('加载病历出错');
    }
  };

  // Update trigger for sidebar to refresh
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        alert('保存成功！Record ID: ' + result.record_id);

        if (result.record_id) {
          setCurrentRecordId(result.record_id);
        }

        // Auto-clear form
        handleNewPatient();

        // Trigger sidebar refresh
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
    // Clear all form data for a fresh start
    setPatientInfo({
      name: '',
      age: '',
      gender: '男',
      phone: ''
    });
    setMedicalRecord({
      complaint: '',
      prescription: '',
      totalDosage: '6付',
      note: ''
    });
    setPulseGrid({});
    setAnalysisResult(null);
    setCurrentRecordId(null);
    // Optionally reset teacher/mode if desired, but user didn't ask. 
    // Usually mode persists.
  };

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const handleDelete = () => {
    const recordIdToDelete = currentRecordId;
    console.log('Delete clicked, currentRecordId:', recordIdToDelete);

    if (!recordIdToDelete) {
      alert("当前没有选中的病历，无法删除。");
      return;
    }

    // Show confirmation modal
    setRecordToDelete(recordIdToDelete);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      console.log('Sending DELETE request for record:', recordToDelete);
      const response = await fetch(`/api/records/${recordToDelete}`, {
        method: 'DELETE'
      });

      console.log('DELETE response status:', response.status);

      if (response.ok) {
        alert("删除成功！");
        handleNewPatient();
        setLastUpdateTime(Date.now());
      } else {
        const errorData = await response.text();
        console.error('Delete failed:', errorData);
        alert("删除失败: " + errorData);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("删除出错: " + err.message);
    } finally {
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  const handleAnalyze = async () => {
    const payload = {
      medical_record: medicalRecord,
      pulse_grid: pulseGrid
    };

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      setAnalysisResult(result);
    } else {
      throw new Error('Analysis failed');
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1>中医脉象九宫格病历录入系统</h1>
          <span style={{ fontSize: '0.9em', opacity: 0.8 }}>DeepSeek-OCR Powered</span>
        </div>

        <div className="header-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={practiceMode}
            onChange={(e) => setPracticeMode(e.target.value)}
            style={{ padding: '5px', borderRadius: '4px' }}
          >
            <option value="personal">个人病历记录</option>
            <option value="shadowing">跟诊模式</option>
          </select>

          {practiceMode === 'shadowing' && (
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px' }}
            >
              <option value="">请选择老师...</option>
              {teachers.map(t => (
                <option key={t} value={t}>{t}老师</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="main-layout">
        <Sidebar
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
              onChange={setPulseGrid}
              onAnalyze={handleAnalyze}
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
    </div>
  );
}

export default App;
