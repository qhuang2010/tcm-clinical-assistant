import React, { useState, useEffect } from 'react';

const Admin = ({ token, onBack }) => {
    // User Management State
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('practitioner');

    // Practitioner/Teacher Management State
    const [practitioners, setPractitioners] = useState([]);
    const [loadingPractitioners, setLoadingPractitioners] = useState(true);
    const [newPName, setNewPName] = useState('');
    const [newPRole, setNewPRole] = useState('teacher');

    const [activeTab, setActiveTab] = useState('users'); // 'users', 'teachers', or 'import'

    // Import State
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchPractitioners();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchPractitioners = async () => {
        try {
            const res = await fetch('/api/practitioners', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPractitioners(data);
            }
        } catch (err) {
            console.error("Failed to fetch practitioners", err);
        } finally {
            setLoadingPractitioners(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    role: newRole
                })
            });
            if (res.ok) {
                alert("用户创建成功");
                setNewUsername('');
                setNewPassword('');
                fetchUsers();
            } else {
                const err = await res.json();
                alert("创建失败: " + err.detail);
            }
        } catch (err) {
            alert("请求出错");
        }
    };

    const handleUpdateUserRole = async (userId, role) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role })
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            alert("更新失败");
        }
    };

    const handleToggleActive = async (userId, isActive) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/activate`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: isActive })
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (err) {
            alert("操作失败");
        }
    };

    const handleCreatePractitioner = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/practitioners', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newPName,
                    role: newPRole
                })
            });
            if (res.ok) {
                alert("添加老师成功");
                setNewPName('');
                fetchPractitioners();
            } else {
                const err = await res.json();
                alert("添加失败: " + err.detail);
            }
        } catch (err) {
            alert("请求出错");
        }
    };

    const handleDeletePractitioner = async (id) => {
        if (!window.confirm("确定要删除这位老师吗？")) return;
        try {
            const res = await fetch(`/api/admin/practitioners/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchPractitioners();
            }
        } catch (err) {
            alert("删除失败");
        }
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={onBack} style={backBtnStyle}>← 返回工作台</button>
                    <h2 style={titleStyle}>系统后台管理</h2>
                </div>

                <div style={tabContainerStyle}>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{ ...tabStyle, ...(activeTab === 'users' ? activeTabStyle : {}) }}
                    >
                        账户权限管理
                    </button>
                    <button
                        onClick={() => setActiveTab('teachers')}
                        style={{ ...tabStyle, ...(activeTab === 'teachers' ? activeTabStyle : {}) }}
                    >
                        跟诊老师管理
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        style={{ ...tabStyle, ...(activeTab === 'import' ? activeTabStyle : {}) }}
                    >
                        数据导入
                    </button>
                </div>
            </div>

            {/* Content for Users */}
            {activeTab === 'users' && (
                <div style={contentStyle}>
                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>新增登录账户</h3>
                        <form onSubmit={handleCreateUser} style={formStyle}>
                            <input
                                type="text"
                                placeholder="用户名"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                style={inputStyle}
                                required
                            />
                            <input
                                type="password"
                                placeholder="密码"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={inputStyle}
                                required
                            />
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="practitioner">普通医生 (Practitioner)</option>
                                <option value="admin">管理员 (Admin)</option>
                            </select>
                            <button type="submit" style={addBtnStyle}>同步创建</button>
                        </form>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>账户审核与授权</h3>
                        <p style={{ fontSize: '12px', color: '#86868b', marginBottom: '15px' }}>
                            新注册用户需要管理员审核激活后才能登录使用
                        </p>
                        {loadingUsers ? (
                            <p>加载中...</p>
                        ) : (
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>用户名</th>
                                        <th style={thStyle}>姓名</th>
                                        <th style={thStyle}>机构</th>
                                        <th style={thStyle}>状态</th>
                                        <th style={thStyle}>角色</th>
                                        <th style={thStyle}>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} style={trStyle}>
                                            <td style={tdStyle}>
                                                <div>{user.username}</div>
                                                {user.email && <div style={{ fontSize: '11px', color: '#86868b' }}>{user.email}</div>}
                                            </td>
                                            <td style={tdStyle}>{user.real_name || '-'}</td>
                                            <td style={tdStyle}>{user.organization || '-'}</td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    ...statusBadgeStyle,
                                                    backgroundColor: user.is_active ? '#34c759' : '#ff9500'
                                                }}>
                                                    {user.is_active ? '已激活' : '待审核'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    ...roleBadgeStyle,
                                                    backgroundColor: user.role === 'admin' ? '#5856d6' : '#007aff'
                                                }}>
                                                    {user.role === 'admin' ? '管理员' : '医生'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {!user.is_active ? (
                                                        <button
                                                            onClick={() => handleToggleActive(user.id, true)}
                                                            style={activateBtnStyle}
                                                        >
                                                            ✓ 激活
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleActive(user.id, false)}
                                                            style={deactivateBtnStyle}
                                                            disabled={user.username === 'admin'}
                                                        >
                                                            禁用
                                                        </button>
                                                    )}
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                                        style={selectStyle}
                                                        disabled={user.username === 'admin'}
                                                    >
                                                        <option value="practitioner">医生</option>
                                                        <option value="admin">管理员</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Content for Teachers */}
            {activeTab === 'teachers' && (
                <div style={contentStyle}>
                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>添加指导老师</h3>
                        <p style={{ fontSize: '12px', color: '#86868b', marginBottom: '15px' }}>
                            在此添加的老师将出现在前台“跟诊模式”的下拉列表中
                        </p>
                        <form onSubmit={handleCreatePractitioner} style={formStyle}>
                            <input
                                type="text"
                                placeholder="老师姓名 (如：张仲景)"
                                value={newPName}
                                onChange={(e) => setNewPName(e.target.value)}
                                style={inputStyle}
                                required
                            />
                            <select
                                value={newPRole}
                                onChange={(e) => setNewPRole(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="teacher">指导老师 (Teacher)</option>
                                <option value="doctor">主治医生 (Doctor)</option>
                            </select>
                            <button type="submit" style={addBtnStyle}>确认添加</button>
                        </form>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>老师信息维护</h3>
                        {loadingPractitioners ? (
                            <p>加载中...</p>
                        ) : (
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>姓名</th>
                                        <th style={thStyle}>身份</th>
                                        <th style={thStyle}>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {practitioners.map(p => (
                                        <tr key={p.id} style={trStyle}>
                                            <td style={tdStyle}>{p.name}</td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    ...roleBadgeStyle,
                                                    backgroundColor: p.role === 'teacher' ? '#ff9500' : '#007aff'
                                                }}>
                                                    {p.role === 'teacher' ? '指导老师' : '医生'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <button
                                                    onClick={() => handleDeletePractitioner(p.id)}
                                                    style={deleteBtnStyle}
                                                >
                                                    移除
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Content for Data Import */}
            {activeTab === 'import' && (
                <div style={contentStyle}>
                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>导入门诊日志</h3>
                        <p style={{ fontSize: '13px', color: '#86868b', marginBottom: '20px' }}>
                            支持导入Excel格式的门诊日志文件（.xlsx, .xls），系统将自动识别患者信息和就诊记录
                        </p>

                        <div style={{
                            border: '2px dashed #d2d2d7',
                            borderRadius: '16px',
                            padding: '40px',
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
                                id="excel-upload"
                            />
                            <label htmlFor="excel-upload" style={{
                                display: 'inline-block',
                                padding: '12px 32px',
                                backgroundColor: '#0071e3',
                                color: 'white',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '500'
                            }}>
                                📁 选择Excel文件
                            </label>

                            {importFile && (
                                <div style={{ marginTop: '16px', color: '#1d1d1f' }}>
                                    <strong>已选择：</strong>{importFile.name}
                                    <span style={{ marginLeft: '10px', color: '#86868b' }}>
                                        ({(importFile.size / 1024).toFixed(1)} KB)
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={async () => {
                                if (!importFile) {
                                    alert('请先选择文件');
                                    return;
                                }
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

                                    const data = await res.json();
                                    if (res.ok) {
                                        setImportResult({
                                            success: true,
                                            imported: data.imported,
                                            skipped: data.skipped,
                                            errors: data.errors
                                        });
                                    } else {
                                        setImportResult({
                                            success: false,
                                            error: data.detail || '导入失败'
                                        });
                                    }
                                } catch (err) {
                                    setImportResult({
                                        success: false,
                                        error: err.message
                                    });
                                } finally {
                                    setImporting(false);
                                }
                            }}
                            disabled={!importFile || importing}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: importFile ? '#34c759' : '#e0e0e0',
                                color: importFile ? 'white' : '#999',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: importFile ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s'
                            }}
                        >
                            {importing ? '导入中...' : '开始导入'}
                        </button>

                        {importResult && (
                            <div style={{
                                marginTop: '20px',
                                padding: '16px',
                                borderRadius: '12px',
                                backgroundColor: importResult.success ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                                border: `1px solid ${importResult.success ? '#34c759' : '#ff3b30'}`
                            }}>
                                {importResult.success ? (
                                    <div>
                                        <div style={{ color: '#34c759', fontWeight: '600', marginBottom: '8px' }}>
                                            ✓ 导入成功
                                        </div>
                                        <div style={{ fontSize: '14px', color: '#1d1d1f' }}>
                                            成功导入 <strong>{importResult.imported}</strong> 条记录，
                                            跳过 <strong>{importResult.skipped}</strong> 条
                                        </div>
                                        {importResult.errors && importResult.errors.length > 0 && (
                                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#ff9500' }}>
                                                部分错误：{importResult.errors.slice(0, 3).join('; ')}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ color: '#ff3b30' }}>
                                        ✗ 导入失败：{importResult.error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>导入说明</h3>
                        <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                            <li>支持标准门诊日志Excel格式</li>
                            <li>系统会自动识别以下字段：患者姓名、性别、年龄、联系电话、主诉、诊断、处方、医嘱等</li>
                            <li>如果Excel中包含"医生"列，系统会自动创建对应的跟诊老师记录</li>
                            <li>同名患者会自动合并，不会重复创建</li>
                            <li>所有导入的记录将关联到当前登录账户</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

// Styles
const containerStyle = {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    borderBottom: '1px solid #d2d2d7',
    paddingBottom: '20px'
};

const titleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1d1d1f',
};

const tabContainerStyle = {
    display: 'flex',
    gap: '10px',
    background: '#e3e3e7',
    padding: '4px',
    borderRadius: '10px'
};

const tabStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    fontWeight: '500',
    color: '#86868b',
    cursor: 'pointer',
    transition: 'all 0.2s'
};

const activeTabStyle = {
    background: '#fff',
    color: '#1d1d1f',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const backBtnStyle = {
    padding: '8px 16px',
    borderRadius: '10px',
    border: '1px solid #d2d2d7',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
};

const contentStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '32px',
};

const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    border: '1px solid rgba(255,255,255,0.5)',
};

const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1d1d1f',
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const inputStyle = {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #d2d2d7',
    fontSize: '14px',
    outline: 'none',
};

const addBtnStyle = {
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#0071e3',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
};

const thStyle = {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #f2f2f7',
    color: '#86868b',
    fontSize: '13px',
    fontWeight: '600',
    textTransform: 'uppercase',
};

const tdStyle = {
    padding: '12px',
    borderBottom: '1px solid #f2f2f7',
    fontSize: '14px',
    color: '#1d1d1f',
};

const trStyle = {
    transition: 'background-color 0.2s',
};

const roleBadgeStyle = {
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
};

const selectStyle = {
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #d2d2d7',
    fontSize: '12px',
};

const deleteBtnStyle = {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #ff3b30',
    background: 'transparent',
    color: '#ff3b30',
    fontSize: '12px',
    cursor: 'pointer'
};

const statusBadgeStyle = {
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
};

const activateBtnStyle = {
    padding: '4px 12px',
    borderRadius: '6px',
    border: 'none',
    background: '#34c759',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer'
};

const deactivateBtnStyle = {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #86868b',
    background: 'transparent',
    color: '#86868b',
    fontSize: '12px',
    cursor: 'pointer'
};

export default Admin;
