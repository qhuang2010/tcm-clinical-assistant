import React, { useState, useRef, useEffect } from 'react';
import { authFetch } from '../utils/api';

const HealthChat = ({ patientId, token }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: '你好！我是您的健康助手。关于您的病历有什么想问的吗？' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || !patientId) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await authFetch('/api/analyze/llm/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patient_id: patientId,
                    query: userMsg
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', text: '抱歉，服务暂时不可用。' }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', text: '发生错误: ' + e.message }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    if (!patientId) return null;

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} className="chat-fab">
                    💬
                </button>
            )}

            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <span className="chat-header-title">AI 健康助手</span>
                        <button onClick={() => setIsOpen(false)} className="chat-close-btn">
                            ✕
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-message ${msg.role}`}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-typing">AI 正在思考...</div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="询问您的健康状况..."
                            className="chat-input"
                        />
                        <button onClick={handleSend} disabled={loading} className="chat-send-btn">
                            发送
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthChat;
