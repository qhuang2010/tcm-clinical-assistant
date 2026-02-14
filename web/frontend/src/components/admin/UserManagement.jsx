import React, { useState } from 'react';
import { authFetch } from '../../utils/api';

const UserManagement = ({ token, users, fetchUsers, loading }) => {
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('practitioner');

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

    return (
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
                {loading ? (
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
    );
};

// Styles (Reused)
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

export default UserManagement;
