import React, { useState, useEffect, useCallback } from 'react';
import {
    Users, Search, Plus, Upload, X, RefreshCw, Database, Sparkles
} from 'lucide-react';
import ContactTable from '../components/ContactTable';
import ChatBox from '../components/ChatBox';
import ImportContacts, { ImportProgressWidget } from '../components/ImportContacts';
import type { ImportJob } from '../components/ImportContacts';
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

/* ────────────────────────────────────────────────────────────
   ADD CONTACT MODAL
   ──────────────────────────────────────────────────────────── */
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

/* ────────────────────────────────────────────────────────────
   MAIN PAGE
   ──────────────────────────────────────────────────────────── */
const ContactsPage: React.FC = () => {
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

    // ── Background import job tracking
    const [importJobs, setImportJobs] = useState<ImportJob[]>([]);

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

    useEffect(() => { fetchContacts(); }, [fetchContacts]);
    useEffect(() => { setPage(1); }, [search]);

    const handleAskAI = (contactName: string) => {
        setAiQueryInject(`What do we know about ${contactName}?`);
        setTimeout(() => setAiQueryInject(''), 100);
    };

    const handleJobStarted = (job: ImportJob) => {
        setImportJobs(prev => [...prev, job]);
    };

    const handleJobUpdate = (updated: ImportJob) => {
        setImportJobs(prev => prev.map(j => j.jobId === updated.jobId ? updated : j));
    };

    const handleJobComplete = () => {
        // Refresh contacts when any job finishes
        setTimeout(fetchContacts, 800);
    };

    const handleDismiss = (jobId: string) => {
        setImportJobs(prev => prev.filter(j => j.jobId !== jobId));
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>

            {/* ── STICKY HEADER ── */}
            <header style={{
                padding: '14px 32px',
                borderBottom: '1px solid #1e293b',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(7, 11, 20, 0.85)', backdropFilter: 'blur(14px)',
                position: 'sticky', top: 0, zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Database size={18} color="#818cf8" />
                        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Workspace</h1>
                    </div>
                    <div style={{
                        background: '#0f172a', border: '1px solid #1e293b',
                        borderRadius: 99, padding: '3px 10px',
                        fontSize: 12, color: '#64748b', fontWeight: 500
                    }}>
                        {total.toLocaleString()} contacts
                    </div>
                    {importJobs.some(j => j.status === 'running') && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.3)',
                            borderRadius: 99, padding: '3px 10px', fontSize: 12, color: '#818cf8', fontWeight: 600
                        }}>
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: '#818cf8', animation: 'pulse 1.2s infinite'
                            }} />
                            Importing…
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
                        <Upload size={14} /> Import Data
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddContact(true)}>
                        <Plus size={14} /> Add Contact
                    </button>
                </div>
            </header>

            {/* ── AI CHAT SECTION ── */}
            <div style={{ padding: '28px 32px 16px', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Sparkles size={15} color="#818cf8" />
                    </div>
                    <div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>Nexus AI Assistant</span>
                        <span style={{ fontSize: 12, color: '#475569', marginLeft: 10 }}>Ask anything about your contacts</span>
                    </div>
                </div>
                <div style={{ height: 500, borderRadius: 14, overflow: 'hidden' }}>
                    <ChatBox injectedQuery={aiQueryInject} />
                </div>
            </div>

            {/* ── CONTACTS TABLE SECTION ── */}
            <div style={{ padding: '8px 32px 40px', maxWidth: 1280, margin: '0 auto', width: '100%', flex: 1 }}>
                <div style={{
                    background: '#0d131f', border: '1px solid #1e293b',
                    borderRadius: 14, overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
                }}>
                    {/* Table toolbar */}
                    <div style={{
                        padding: '14px 20px', borderBottom: '1px solid #1e293b',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 12, flexWrap: 'wrap'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Users size={15} color="#475569" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Contact Database</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
                            <div style={{ position: 'relative', width: 300 }}>
                                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                                <input
                                    className="input"
                                    style={{ paddingLeft: 38, paddingTop: 8, paddingBottom: 8, fontSize: 13, background: '#111827' }}
                                    placeholder="Search by name, company, role…"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}>
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={fetchContacts} title="Refresh">
                                <RefreshCw size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ minHeight: 200 }}>
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, color: '#475569' }}>
                                <RefreshCw size={17} className="animate-spin" />
                                <span style={{ fontSize: 14 }}>Loading records…</span>
                            </div>
                        ) : contacts.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 0', gap: 14 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14,
                                    background: '#111827', border: '1px solid #1e293b',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Database size={24} color="#334155" />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 4 }}>No contacts yet</div>
                                    <div style={{ fontSize: 13, color: '#334155' }}>Import a dataset or add your first contact to get started</div>
                                </div>
                                <button className="btn btn-secondary" onClick={() => setShowImport(true)} style={{ marginTop: 4 }}>
                                    <Upload size={14} /> Import Dataset
                                </button>
                            </div>
                        ) : (
                            <ContactTable contacts={contacts} onSelect={setSelectedContact} />
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{
                            padding: '12px 20px', borderTop: '1px solid #1e293b',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: '#0a0f1a'
                        }}>
                            <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
                                Page {page} of {totalPages} · {total.toLocaleString()} contacts
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next →</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODALS ── */}
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
                    onJobStarted={handleJobStarted}
                />
            )}
            {showAddContact && (
                <AddContactModal
                    onClose={() => setShowAddContact(false)}
                    onCreated={fetchContacts}
                />
            )}

            {/* ── FLOATING PROGRESS WIDGET ── */}
            <ImportProgressWidget
                jobs={importJobs}
                onJobUpdate={handleJobUpdate}
                onJobComplete={handleJobComplete}
                onDismiss={handleDismiss}
            />
        </div>
    );
};

export default ContactsPage;
