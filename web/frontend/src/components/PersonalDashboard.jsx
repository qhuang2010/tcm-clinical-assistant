import React, { useState, useEffect } from 'react';
import MedicalRecord from './MedicalRecord';
import PulseGrid from './PulseGrid';
import AIAnalysis from './AIAnalysis';
import HealthChat from './HealthChat';
import { authFetch } from '../utils/api';

const PersonalDashboard = ({ token, user, onLogout }) => {
    const [records, setRecords] = useState([]);
    const [view, setView] = useState('list');

    const [myPatientId, setMyPatientId] = useState(null);
    const [trendReport, setTrendReport] = useState(null);

    const [medicalRecord, setMedicalRecord] = useState({
        complaint: '',
        prescription: '',
        totalDosage: '6付',
        note: ''
    });
    const [pulseGrid, setPulseGrid] = useState({});
    const [analysisResult, setAnalysisResult] = useState(null);

    useEffect(() => {
        fetchMyRecords();
    }, [token]);

    const fetchMyRecords = async () => {
        try {
            const res = await authFetch(`/api/patients/search?query=${user.real_name || user.username}`);
            if (res.ok) {
                const patients = await res.json();
                if (patients.length > 0) {
                    const pid = patients[0].id;
                    setMyPatientId(pid);
                    fetchPatientRecords(pid);
                }
            }
        } catch (e) {
            console.error("Failed to fetch records", e);
        }
    };

    const fetchPatientRecords = async (patientId) => {
        const res = await authFetch(`/api/patients/${patientId}/history`);
        if (res.ok) {
            const data = await res.json();
            setRecords(data);
        }
    };

    const handleSave = async () => {
        const payload = {
            patient_info: {
                name: user.real_name || user.username,
                gender: '未知',
                age: 0,
                phone: user.username
            },
            medical_record: medicalRecord,
            pulse_grid: pulseGrid,
            mode: 'personal'
        };

        try {
            const response = await authFetch('/api/records/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('记录保存成功！');
                setView('list');
                fetchMyRecords();
            } else {
                alert('保存失败');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    const handleAnalyze = async () => {
        const payload = {
            medical_record: medicalRecord,
            pulse_grid: pulseGrid,
            patient_info: {
                name: user.real_name || user.username,
                gender: '未知',
                age: 0,
            }
        };
        const response = await authFetch('/api/analyze/llm/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            setAnalysisResult({ analysis: result.report });
        }
    };

    const handleTrendAnalysis = async () => {
        if (!myPatientId) return;

        try {
            const response = await authFetch(`/api/analyze/llm/trend?patient_id=${myPatientId}`, {
                method: 'POST',
            });

            if (response.ok) {
                const result = await response.json();
                setTrendReport(result.report);
                alert("趋势分析完成！请在列表上方查看报告。");
            } else {
                alert("分析失败");
            }
        } catch (e) {
            alert("Analysis Error: " + e.message);
        }
    };

    return (
        <div style={{ padding: '24px', background: '#f5f5f7', minHeight: '100vh' }}>
            <header style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '32px',
                background: 'white',
                padding: '20px 24px',
                borderRadius: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>我的健康档案</h1>
                    <p style={{ margin: '6px 0 0 0', color: '#86868b' }}>欢迎回来, {user.real_name || user.username}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setView('new')} className="btn-primary">
                        + 新增记录
                    </button>
                    <button onClick={onLogout} className="btn-secondary">
                        退出
                    </button>
                </div>
            </header>

            {view === 'list' && (
                <div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '20px' 
                    }}>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>历史记录</h3>
                        {records.length > 1 && (
                            <button onClick={handleTrendAnalysis} className="btn-secondary">
                                🤖 生成健康趋势报告
                            </button>
                        )}
                    </div>

                    {trendReport && (
                        <div style={{ 
                            background: 'white', 
                            padding: '24px', 
                            borderRadius: '16px', 
                            marginBottom: '24px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                            position: 'relative'
                        }}>
                            <h4 style={{ marginTop: 0, marginBottom: '16px' }}>AI 健康趋势分析</h4>
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#333' }}>
                                {trendReport}
                            </div>
                            <button 
                                onClick={() => setTrendReport(null)} 
                                className="btn-small"
                                style={{ 
                                    position: 'absolute', 
                                    top: '16px', 
                                    right: '16px',
                                    background: '#f2f2f7',
                                    color: '#666'
                                }}
                            >
                                关闭
                            </button>
                        </div>
                    )}

                    {records.length === 0 ? (
                        <div style={{ 
                            padding: '60px', 
                            textAlign: 'center', 
                            color: '#86868b', 
                            background: 'white', 
                            borderRadius: '16px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📝</div>
                            <p style={{ fontSize: '16px', margin: 0 }}>暂无记录，点击右上角"新增记录"开始跟踪您的健康。</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {records.map(r => (
                                <div key={r.id} style={{
                                    padding: '20px 24px',
                                    background: 'white',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }} className="record-card">
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                                            {r.visit_date}
                                        </div>
                                        <div style={{ color: '#666', fontSize: '14px' }}>{r.complaint || '无'}</div>
                                    </div>
                                    <button className="btn-small primary">查看详情</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {view === 'new' && (
                <div>
                    <button onClick={() => setView('list')} className="btn-secondary" style={{ marginBottom: '24px' }}>
                        ← 返回列表
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <MedicalRecord data={medicalRecord} onChange={setMedicalRecord} />
                            <button onClick={handleSave} className="btn-primary">保存记录</button>
                            <AIAnalysis data={analysisResult} onAnalyze={handleAnalyze} />
                        </div>
                        <div>
                            <PulseGrid data={pulseGrid} onChange={setPulseGrid} token={token} />
                        </div>
                    </div>
                </div>
            )}

            <HealthChat patientId={myPatientId} token={token} />
        </div>
    );
};

export default PersonalDashboard;
