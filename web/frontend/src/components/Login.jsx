import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const Login = ({ onLogin, onRegister, message }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                onLogin(data);
            } else {
                const errData = await response.json();
                setError(errData.detail || '登录失败，请检查用户名和密码');
            }
        } catch (err) {
            setError('网络错误，请稍后再试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
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
        }}>
            <div style={cardStyle}>
                {/* Logo */}
                <div style={logoContainerStyle}>
                    <img src="/logo.png" alt="元气脉法" style={logoStyle} />
                </div>

                <div style={headerStyle}>
                    <h2 style={titleStyle}>元气脉法传承系统</h2>
                    <p style={subtitleStyle}>智能病历录入系统</p>
                </div>

                <form onSubmit={handleSubmit} style={formStyle}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>用户名</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="请输入用户名"
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>密码</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="请输入密码"
                            style={inputStyle}
                            required
                        />
                    </div>

                    {message && <div style={successStyle}>{message}</div>}
                    {error && <div style={errorStyle}>{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...buttonStyle,
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? '登录中...' : '立即登录'}
                    </button>
                </form>

                <div style={dividerStyle}>
                    <span style={dividerLineStyle}></span>
                    <span style={dividerTextStyle}>或</span>
                    <span style={dividerLineStyle}></span>
                </div>

                <button
                    onClick={onRegister}
                    style={registerBtnStyle}
                >
                    新用户注册
                </button>

                <div style={footerStyle}>
                    <p>© 2026 元气脉法传承系统 · 专业医疗辅助工具</p>
                </div>
            </div>
        </div>
    );
};

// Styles
const cardStyle = {
    width: '380px',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 8px 25px rgba(0,0,0,0.1)',
};

const logoContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
};

const logoStyle = {
    width: '88px',
    height: '88px',
    borderRadius: '20px',
    boxShadow: '0 8px 24px rgba(52, 199, 89, 0.3)',
    objectFit: 'cover',
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '32px',
};

const titleStyle = {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: '6px',
    letterSpacing: '-0.3px',
};

const subtitleStyle = {
    fontSize: '14px',
    color: '#86868b',
    fontWeight: '400',
};

const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
};

const inputGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
};

const labelStyle = {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1d1d1f',
    marginLeft: '4px',
};

const inputStyle = {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '2px solid #d2d2d7',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#f0f0f5',
    color: '#1d1d1f',
};

const buttonStyle = {
    padding: '15px',
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

const errorStyle = {
    color: '#ff3b30',
    fontSize: '14px',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: '8px',
};

const successStyle = {
    color: '#34c759',
    fontSize: '14px',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: '8px',
};

const footerStyle = {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#999',
};

const dividerStyle = {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
};

const dividerLineStyle = {
    flex: 1,
    height: '1px',
    backgroundColor: '#e0e0e0',
};

const dividerTextStyle = {
    padding: '0 12px',
    color: '#999',
    fontSize: '13px',
};

const registerBtnStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1.5px solid #34c759',
    background: 'transparent',
    color: '#34c759',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

export default Login;
