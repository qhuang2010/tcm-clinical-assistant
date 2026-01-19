import React, { useState } from 'react';

const Register = ({ onBack, onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        real_name: '',
        email: '',
        phone: '',
        organization: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        if (formData.password.length < 6) {
            setError('密码长度至少6位');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    real_name: formData.real_name,
                    email: formData.email,
                    phone: formData.phone,
                    organization: formData.organization
                })
            });

            const data = await response.json();

            if (response.ok) {
                onRegisterSuccess(data.message);
            } else {
                setError(data.detail || '注册失败，请稍后再试');
            }
        } catch (err) {
            setError('网络错误，请稍后再试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={headerStyle}>
                    <h2 style={titleStyle}>医师注册</h2>
                    <p style={subtitleStyle}>填写信息注册成为平台医师用户</p>
                </div>

                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={rowStyle}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>用户名 *</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="用于登录的账号"
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>真实姓名</label>
                            <input
                                type="text"
                                name="real_name"
                                value={formData.real_name}
                                onChange={handleChange}
                                placeholder="您的真实姓名"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={rowStyle}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>密码 *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="至少6位"
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>确认密码 *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="再次输入密码"
                                style={inputStyle}
                                required
                            />
                        </div>
                    </div>

                    <div style={rowStyle}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>邮箱</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="example@email.com"
                                style={inputStyle}
                            />
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>手机号码</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="联系电话"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>所属机构/医院</label>
                        <input
                            type="text"
                            name="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            placeholder="您所在的医疗机构名称"
                            style={inputStyle}
                        />
                    </div>

                    {error && <div style={errorStyle}>{error}</div>}

                    <div style={noticeStyle}>
                        <span style={{ marginRight: '6px' }}>📋</span>
                        注册后需等待管理员审核激活，审核通过后即可登录使用
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...buttonStyle,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? '提交中...' : '提交注册'}
                    </button>

                    <button
                        type="button"
                        onClick={onBack}
                        style={backBtnStyle}
                    >
                        ← 返回登录
                    </button>
                </form>
            </div>
        </div>
    );
};

// Styles
const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(145deg, #e8f5e9 0%, #c8e6c9 30%, #a5d6a7 60%, #81c784 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif',
    zIndex: 9999,
    overflow: 'auto',
    padding: '20px'
};

const cardStyle = {
    width: '520px',
    maxWidth: '100%',
    padding: '36px 40px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 8px 25px rgba(0,0,0,0.05)',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '28px',
};

const titleStyle = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: '6px',
};

const subtitleStyle = {
    fontSize: '14px',
    color: '#86868b',
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
};

const rowStyle = {
    display: 'flex',
    gap: '16px',
};

const inputGroupStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
};

const labelStyle = {
    fontSize: '12px',
    fontWeight: '500',
    color: '#666',
    marginLeft: '4px',
};

const inputStyle = {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e0e0e0',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#fafafa',
};

const buttonStyle = {
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #34c759 0%, #30d158 100%)',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 14px rgba(52, 199, 89, 0.35)',
};

const backBtnStyle = {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    background: 'transparent',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const errorStyle = {
    color: '#ff3b30',
    fontSize: '14px',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: '8px',
};

const noticeStyle = {
    fontSize: '13px',
    color: '#ff9500',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
};

export default Register;
