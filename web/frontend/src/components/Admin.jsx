import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/api';

const Admin = ({ token, onBack }) => {
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('practitioner');

    const [practitioners, setPractitioners] = useState([]);
    const [loadingPractitioners, setLoadingPractitioners] = useState(true);
    const [newPName, setNewPName] = useState('');
    const [newPRole, setNewPRole] = useState('teacher');

    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        fetchUsers();
        fetchPractitioners();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await authFetch('/api/admin/users');
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
            const res = await authFetch('/api/practitioners');
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
            const res = await authFetch('/api/admin/users', {
                method: 'POST',
                headers: {
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
            const res = await authFetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
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
            const res = await authFetch(`/api/admin/users/${userId}/activate`, {
                method: 'PUT',
                headers: {
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
            const res = await authFetch('/api/admin/practitioners', {
                method: 'POST',
                headers: {
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
            const res = await authFetch(`/api/admin/practitioners/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchPractitioners();
            }
        } catch (err) {
            alert("删除失败");
        }
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
        fontWeight: '700',
        marginBottom: '20px',
        color: '#1d1d1f',
    };

    const inputStyle = {
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1.5px solid #d2d2d7',
        fontSize: '14px',
        outline: 'none',
        transition: 'all 0.2s',
        background: 'rgba(255,255,255,0.8)'
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

    const badgeStyle = (color) => ({
        padding: '4px 10px',
        borderRadius: '12px',
        color: 'white',
        fontSize: '11px',
        fontWeight: '600',
        background: color
    });

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(0,0,0,0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={onBack} className="btn-secondary" style={{ padding: '10px 20px' }}>
                        ← 返回工作台
                    </button>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>系统后台管理</h2>
                </div>

                <div style={{ 
                    display: 'flex', 
                    gap: '4px', 
                    background: '#e3e3e7', 
                    padding: '4px', 
                    borderRadius: '12px' 
                }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: activeTab === 'users' ? 'white' : 'transparent',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: activeTab === 'users' ? '#1d1d1f' : '#86868b',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'users' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        账户权限管理
                    </button>
                    <button
                        onClick={() => setActiveTab('teachers')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: activeTab === 'teachers' ? 'white' : 'transparent',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: activeTab === 'teachers' ? '#1d1d1f' : '#86868b',
                            cursor: 'pointer',
                            boxShadow: activeTab === 'teachers' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        跟诊老师管理
                    </button>
                </div>
            </div>

            {activeTab === 'users' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>新增登录账户</h3>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                                同步创建
                            </button>
                        </form>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>账户审核与授权</h3>
                        <p style={{ fontSize: '13px', color: '#86868b', marginBottom: '16px' }}>
                            新注册用户需要管理员审核激活后才能登录使用
                        </p>
                        {loadingUsers ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#86868b' }}>
                                <div className="loading-spinner" style={{ margin: '0 auto 12px', borderColor: '#e0e0e0', borderTopColor: '#0071e3' }} />
                                加载中...
                            </div>
                        ) : (
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={thStyle}>用户名</th>
                                        <th style={thStyle}>姓名</th>
                                        <th style={thStyle}>状态</th>
                                        <th style={thStyle}>角色</th>
                                        <th style={thStyle}>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td style={tdStyle}>
                                                <div style={{ fontWeight: 600 }}>{user.username}</div>
                                                {user.email && <div style={{ fontSize: '11px', color: '#86868b' }}>{user.email}</div>}
                                            </td>
                                            <td style={tdStyle}>{user.real_name || '-'}</td>
                                            <td style={tdStyle}>
                                                <span style={badgeStyle(user.is_active ? '#34c759' : '#ff9500')}>
                                                    {user.is_active ? '已激活' : '待审核'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={badgeStyle(user.role === 'admin' ? '#5856d6' : '#007aff')}>
                                                    {user.role === 'admin' ? '管理员' : '医生'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {!user.is_active ? (
                                                        <button
                                                            onClick={() => handleToggleActive(user.id, true)}
                                                            className="btn-small success"
                                                        >
                                                            ✓ 激活
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleActive(user.id, false)}
                                                            disabled={user.username === 'admin'}
                                                            style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                border: '1px solid #86868b',
                                                                background: 'transparent',
                                                                color: '#86868b',
                                                                fontSize: '12px',
                                                                cursor: user.username === 'admin' ? 'not-allowed' : 'pointer',
                                                                opacity: user.username === 'admin' ? 0.5 : 1
                                                            }}
                                                        >
                                                            禁用
                                                        </button>
                                                    )}
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                                        disabled={user.username === 'admin'}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #d2d2d7',
                                                            fontSize: '12px',
                                                            cursor: user.username === 'admin' ? 'not-allowed' : 'pointer',
                                                            opacity: user.username === 'admin' ? 0.5 : 1
                                                        }}
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

            {activeTab === 'teachers' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>添加指导老师</h3>
                        <p style={{ fontSize: '13px', color: '#86868b', marginBottom: '16px' }}>
                            在此添加的老师将出现在前台"跟诊模式"的下拉列表中
                        </p>
                        <form onSubmit={handleCreatePractitioner} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                                确认添加
                            </button>
                        </form>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={sectionTitleStyle}>老师信息维护</h3>
                        {loadingPractitioners ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#86868b' }}>
                                <div className="loading-spinner" style={{ margin: '0 auto 12px', borderColor: '#e0e0e0', borderTopColor: '#0071e3' }} />
                                加载中...
                            </div>
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
                                        <tr key={p.id}>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: 600 }}>{p.name}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={badgeStyle(p.role === 'teacher' ? '#ff9500' : '#007aff')}>
                                                    {p.role === 'teacher' ? '指导老师' : '医生'}
                                                </span>
                                            </td>
                                            <td style={tdStyle}>
                                                <button
                                                    onClick={() => handleDeletePractitioner(p.id)}
                                                    className="btn-small danger"
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
        </div>
    );
};

export default Admin;
