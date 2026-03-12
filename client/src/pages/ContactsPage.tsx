import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Search, Plus, Upload, Bot, Settings, BarChart2,
    X, RefreshCw, Database, Sparkles
} from 'lucide-react';
import ContactTable from '../components/ContactTable';
import ChatBox from '../components/ChatBox';
import ImportContacts from '../components/ImportContacts';
import ContactDetailsModal from '../components/ContactDetailsModal';
import { getContacts, createContact } from '../services/contactApi';

interface Contact {
    _id: string;
    id?: string;
    name: string;
    company?: string;
    role?: string;
    email?: string;
    notes?: string;
    attributes?: Record<string, string>;
    created_at?: string;
}

/* ============================================================
   ADD CONTACT MODAL
   ============================================================ */
const AddContactModal: React.FC<{ onClose: () => void; onCreated: () => void }> = ({ onClose, onCreated }) => {
    const [form, setForm] = useState({ name: '', company: '', role: '', email: '', notes: '' });
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!form.name.trim()) return;
        setLoading(true);
        try {
            await createContact(form);
            onCreated();
            onClose();
        } catch (err) {
            console.error('Failed to create contact', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog animate-slideIn" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #1e293b' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Add Contact</h2>
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(['name', 'company', 'role', 'email'] as const).map(field => (
                        <div key={field}>
                            <label className="label">{field}{field === 'name' ? ' *' : ''}</label>
                            <input
                                className="input"
                                value={form[field]}
                                onChange={e => setForm({ ...form, [field]: e.target.value })}
                                placeholder={`Enter ${field}…`}
                            />
                        </div>
                    ))}
                    <div>
                        <label className="label">Notes</label>
                        <textarea
                            className="input"
                            rows={3}
                            style={{ resize: 'vertical' }}
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            placeholder="Add any notes…"
                        />
                    </div>
                </div>
                <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name.trim() || loading}>
                        {loading ? 'Creating…' : 'Create Contact'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ============================================================
   MAIN PAGE
   ============================================================ */
const ContactsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'contacts'>('contacts');
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 50;

    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [showImport, setShowImport] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [aiQueryInject, setAiQueryInject] = useState('');

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getContacts({ search, page, limit: LIMIT });
            setContacts(data.contacts || []);
            setTotal(data.total || 0);
            setTotalPages(data.pages || 1);
        } catch (err) {
            console.error('Failed to fetch contacts', err);
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    // Click-to-ask injects into the ChatBox seamlessly
    const handleAskAI = (contactName: string) => {
        setAiQueryInject(`What do we know about ${contactName}?`);
        setTimeout(() => setAiQueryInject(''), 100);
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll back up to the hero chat if needed
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
            {/* ── SIDEBAR ── */}
            <aside className="sidebar" style={{ padding: '0 12px' }}>
                {/* Logo */}
                <div style={{ padding: '24px 4px 20px', borderBottom: '1px solid #1e293b', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 9, background: '#1e2a45',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Database size={18} color="#818cf8" />
                        </div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>LibreContacts</div>
                            <div style={{ fontSize: 11, color: '#475569' }}>AI Workspace</div>
                        </div>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div className={`sidebar-item ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>
                        <Users size={16} /> Contacts Overview
                    </div>

                </nav>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>

                {/* Top Navbar */}
                <header style={{
                    padding: '16px 32px', borderBottom: '1px solid #1e293b',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(7, 11, 20, 0.8)', backdropFilter: 'blur(12px)',
                    position: 'sticky', top: 0, zIndex: 50
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', textTransform: 'capitalize' }}>
                            {activeTab === 'contacts' ? 'Workspace' : activeTab}
                        </h1>
                        {activeTab === 'contacts' && (
                            <div className="badge badge-slate" style={{ fontSize: 12, padding: '4px 10px' }}>
                                {total.toLocaleString()} total contacts
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {activeTab === 'contacts' && (
                            <>
                                <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
                                    <Upload size={15} /> Import Data
                                </button>
                                <button className="btn btn-primary" onClick={() => setShowAddContact(true)}>
                                    <Plus size={15} /> Add Contact
                                </button>
                            </>
                        )}
                    </div>
                </header>

                {activeTab === 'contacts' ? (
                    <>
                        {/* ── HERO SECTION: AI ASISTANT ── */}
                        <div style={{ padding: '32px 32px 16px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <Sparkles size={18} color="#818cf8" />
                                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc' }}>Ask AI</h2>
                                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>Instantly retrieve specific data from your contacts</span>
                            </div>
                            <div style={{ height: 540 }}>
                                {/* The ChatBox takes up the hero space */}
                                <ChatBox injectedQuery={aiQueryInject} />
                            </div>
                        </div>

                        {/* ── DATABASE SECTION ── */}
                        <div style={{ padding: '16px 32px 40px', maxWidth: 1200, margin: '0 auto', width: '100%', flex: 1 }}>
                            <div className="card-elevated" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                                {/* Search Bar inside Table Header */}
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d131f' }}>
                                    <div style={{ position: 'relative', width: 340 }}>
                                        <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                                        <input
                                            className="input"
                                            style={{ paddingLeft: 40, background: '#111827' }}
                                            placeholder="Search strictly by text…"
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                        />
                                        {search && (
                                            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <button className="btn btn-ghost btn-sm" onClick={fetchContacts} title="Refresh Database">
                                        <RefreshCw size={14} /> Refetch
                                    </button>
                                </div>

                                {/* Table Area */}
                                <div>
                                    {loading ? (
                                        <div className="empty-state">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b' }}>
                                                <RefreshCw size={18} className="animate-spin" />
                                                Loading database records…
                                            </div>
                                        </div>
                                    ) : (
                                        <ContactTable contacts={contacts} onSelect={setSelectedContact} />
                                    )}
                                </div>

                                {/* Pagination footer */}
                                {totalPages > 1 && (
                                    <div style={{ padding: '14px 20px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d131f' }}>
                                        <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                                            Showing page {page} of {totalPages}
                                        </span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
                        <div style={{ width: 80, height: 80, borderRadius: 20, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                            {activeTab === 'config' && <Bot size={40} color="#818cf8" />}
                            {activeTab === 'analytics' && <BarChart2 size={40} color="#34d399" />}
                            {activeTab === 'settings' && <Settings size={40} color="#94a3b8" />}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc', marginBottom: 12, textTransform: 'capitalize' }}>{activeTab} Module</h2>
                            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 400, lineHeight: 1.6 }}>
                                This specific module is currently disabled for this assignment preview. Please return to the Workspace to manage contacts.
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* ── MODALS (Highest Z-Index) ── */}
            {selectedContact && (
                <ContactDetailsModal
                    contact={selectedContact}
                    onClose={() => setSelectedContact(null)}
                    onUpdate={fetchContacts}
                    onAskAI={handleAskAI}
                />
            )}

            {showImport && (
                <ImportContacts
                    onComplete={fetchContacts}
                    onClose={() => setShowImport(false)}
                />
            )}

            {showAddContact && (
                <AddContactModal
                    onClose={() => setShowAddContact(false)}
                    onCreated={fetchContacts}
                />
            )}
        </div>
    );
};

export default ContactsPage;
