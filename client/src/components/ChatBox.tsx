import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User, RefreshCw, Zap } from 'lucide-react';
import { sendMessage } from '../services/chatApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
    injectedQuery?: string;
}

interface Message {
    role: 'ai' | 'user';
    text: string;
}

const ChatBox: React.FC<Props> = ({ injectedQuery }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: "Hello! I'm your AI Workspace Assistant. I can deeply analyze your stored contacts. What would you like to know?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (injectedQuery) {
            setInput(injectedQuery);
            inputRef.current?.focus();
        }
    }, [injectedQuery]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        const userMessage = trimmed;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

        // Local help command
        if (userMessage.toLowerCase() === 'help') {
            const helpText = `
### 🤖 How to use Nexus AI

I can help you navigate and analyze your contact database. Here are some ways you can interact with me:

*   **Look up specific people:** "Who is Kevin Gala?" or "Show me details for Jane Doe."
*   **Filter by Role:** "Who are all the Supervisors?" or "Find all Engineers."
*   **Filter by Company:** "List contacts at Stripe" or "Who works at Google?"
*   **Search by Status:** "List number of contacts with LEAD-NEW" or "Show me active leads."
*   **General Queries:** "How many contacts do I have?" or "Which contacts are in San Francisco?"

**Pro Tip:** You can also click the **"Ask AI about this contact"** button inside any contact's detail view to instantly learn more about them!
            `;
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'ai', text: helpText.trim() }]);
            }, 500);
            return;
        }

        setLoading(true);
        try {
            const data = await sendMessage(userMessage);
            setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error connecting to the AI service. Please check the server is running and try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setMessages([{ role: 'ai', text: "Hello! I'm your AI Workspace Assistant. I can deeply analyze your stored contacts. What would you like to know?" }]);
    };

    const suggestedQueries = [
        'Who are all the Supervisor?',
        'Who is "Kevin Gala"?',
        'List number of contacts with LEAD-NEW',
        'Help'

    ];

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'linear-gradient(180deg, #161d2e 0%, #0d1117 100%)',
            borderRadius: 16,
            border: '1px solid #1e293b',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Decorative Top Glow */}
            <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, #818cf8, transparent)', opacity: 0.5 }} />

            {/* Header */}
            <div style={{
                padding: '16px 24px', borderBottom: '1px solid #1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(22, 29, 46, 0.5)', backdropFilter: 'blur(8px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
                    }}>
                        <Zap size={20} color="#ffffff" />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>LibreChat</div>
                        <div style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500 }}>
                            <span className="dot dot-green" style={{ width: 6, height: 6 }}></span>
                            Gemini 2.5 Flash Connected
                        </div>
                    </div>
                </div>
                <button className="btn btn-ghost" onClick={handleClear} title="Reset AI Context" style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.05)' }}>
                    <RefreshCw size={15} />
                    <span style={{ fontSize: 12, marginLeft: 4 }}>Reset</span>
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        {msg.role === 'ai' && (
                            <div style={{
                                width: 32, height: 32, borderRadius: 10, background: '#1e2a45', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155'
                            }}>
                                <Bot size={18} color="#818cf8" />
                            </div>
                        )}
                        <div className="chat-msg" style={{
                            maxWidth: '85%', padding: '14px 18px',
                            borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: msg.role === 'user' ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' : '#1e293b',
                            border: msg.role === 'user' ? '1px solid #4338ca' : '1px solid #334155',
                            boxShadow: msg.role === 'user' ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: 15, color: msg.role === 'user' ? '#ffffff' : '#f1f5f9',
                            lineHeight: 1.6, whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
                            wordBreak: 'break-word'
                        }}>
                            {msg.role === 'user' ? (
                                msg.text
                            ) : (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ node, ...props }) => <p style={{ margin: 0, paddingBottom: 10, lineHeight: 1.6 }} {...props} />,
                                        ul: ({ node, ...props }) => <ul style={{ margin: '0 0 12px 0', paddingLeft: 24, listStyleType: 'disc' }} {...props} />,
                                        ol: ({ node, ...props }) => <ol style={{ margin: '0 0 12px 0', paddingLeft: 24, listStyleType: 'decimal' }} {...props} />,
                                        li: ({ node, ...props }) => <li style={{ margin: 0, paddingBottom: 6 }} {...props} />,
                                        strong: ({ node, ...props }) => <strong style={{ color: '#a5b4fc', fontWeight: 700 }} {...props} />,
                                        em: ({ node, ...props }) => <em style={{ color: '#c7d2fe', fontStyle: 'italic' }} {...props} />,
                                        h1: ({ node, ...props }) => <h1 style={{ margin: '16px 0 10px', fontSize: 18, color: '#f8fafc', fontWeight: 700, borderBottom: '1px solid #334155', paddingBottom: 4 }} {...props} />,
                                        h2: ({ node, ...props }) => <h2 style={{ margin: '14px 0 8px', fontSize: 16, color: '#f1f5f9', fontWeight: 700 }} {...props} />,
                                        h3: ({ node, ...props }) => <h3 style={{ margin: '12px 0 6px', fontSize: 15, color: '#e2e8f0', fontWeight: 600 }} {...props} />,
                                        a: ({ node, ...props }) => <a style={{ color: '#818cf8', textDecoration: 'none', borderBottom: '1px solid #818cf8' }} {...props} />,
                                        code: ({ node, inline, ...props }: any) =>
                                            inline ?
                                                <code style={{ background: '#0f172a', padding: '2px 6px', borderRadius: 4, fontSize: '0.9em', color: '#e2e8f0', border: '1px solid #1e293b' }} {...props} /> :
                                                <pre style={{ background: '#0f172a', padding: '12px', borderRadius: 8, overflowX: 'auto', border: '1px solid #1e293b', margin: '8px 0 12px' }}>
                                                    <code style={{ fontSize: '0.9em', color: '#e2e8f0' }} {...props} />
                                                </pre>,
                                        blockquote: ({ node, ...props }) => <blockquote style={{ borderLeft: '3px solid #4f46e5', margin: '8px 0 12px', paddingLeft: 12, color: '#94a3b8', fontStyle: 'italic' }} {...props} />
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div style={{
                                width: 32, height: 32, borderRadius: 10, background: '#334155', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #475569'
                            }}>
                                <User size={16} color="#cbd5e1" />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div style={{ display: 'flex', gap: 14 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 10, background: '#1e2a45', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155'
                        }}>
                            <Bot size={18} color="#818cf8" />
                        </div>
                        <div style={{
                            padding: '12px 20px', borderRadius: '18px 18px 18px 4px',
                            background: '#1e293b', border: '1px solid #334155',
                            display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#94a3b8'
                        }}>
                            <Loader2 size={16} className="animate-spin" style={{ color: '#818cf8' }} />
                            Analyzing contacts database…
                        </div>
                    </div>
                )}

                {/* Suggested Queries */}
                {messages.length <= 1 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, marginLeft: 46 }}>
                        {suggestedQueries.map(q => (
                            <button
                                key={q}
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                    setInput(q);
                                    inputRef.current?.focus();
                                }}
                                style={{ fontSize: 13, padding: '8px 14px', borderRadius: 99, background: '#1e293b', border: '1px solid #334155' }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div style={{ padding: '20px 32px', borderTop: '1px solid #1e293b', background: 'rgba(22, 29, 46, 0.8)', backdropFilter: 'blur(10px)' }}>
                <div style={{
                    display: 'flex', gap: 10, alignItems: 'center',
                    background: '#0f172a', border: '1px solid #334155',
                    borderRadius: 99, padding: '6px 6px 6px 20px',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <input
                        ref={inputRef}
                        className="input"
                        style={{
                            flex: 1, background: 'transparent', border: 'none',
                            padding: 0, boxShadow: 'none', fontSize: 15
                        }}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="Ask AI anything about your contacts…"
                        disabled={loading}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        style={{ borderRadius: 99, padding: '10px 20px', flexShrink: 0 }}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 12 }}>
                    AI answers are generated based on your securely stored workspace contacts.
                </div>
            </div>
        </div>
    );
};

export default ChatBox;
