import React, { useState } from 'react';

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
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('/api/auth/login', {
                method: 'POST',
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
                {/* Logo/Icon Area */}
                <div style={logoContainerStyle}>
                    <div style={logoStyle}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                            <defs>
                                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#34c759', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#30d158', stopOpacity: 1 }} />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" fill="url(#grad1)" />
                            {/* Nine-grid pattern */}
                            <g fill="rgba(255,255,255,0.4)">
                                <circle cx="30" cy="30" r="5" />
                                <circle cx="50" cy="30" r="5" />
                                <circle cx="70" cy="30" r="5" />
                                <circle cx="30" cy="50" r="5" />
                                <circle cx="50" cy="50" r="7" fill="rgba(255,255,255,0.9)" />
                                <circle cx="70" cy="50" r="5" />
                                <circle cx="30" cy="70" r="5" />
                                <circle cx="50" cy="70" r="5" />
                                <circle cx="70" cy="70" r="5" />
                            </g>
                            {/* Pulse wave */}
                            <path
                                d="M20 50 Q28 50 32 42 Q36 34 42 50 Q48 66 54 50 Q60 34 66 50 Q70 58 80 50"
                                stroke="rgba(255,255,255,0.8)"
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                </div>

                <div style={headerStyle}>
                    <h2 style={titleStyle}>中医脉象九宫格</h2>
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
                    <p>© 2026 中医脉象系统 · 专业医疗辅助工具</p>
                </div>
            </div>
        </div>
    );
};

// Styles
const cardStyle = {
    width: '380px',
    padding: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1), 0 8px 25px rgba(0,0,0,0.05)',
};

const logoContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
};

const logoStyle = {
    width: '72px',
    height: '72px',
    borderRadius: '18px',
    boxShadow: '0 8px 24px rgba(52, 199, 89, 0.3)',
    overflow: 'hidden',
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
    fontWeight: '500',
    color: '#666',
    marginLeft: '4px',
};

const inputStyle = {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1.5px solid #e0e0e0',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#fafafa',
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
