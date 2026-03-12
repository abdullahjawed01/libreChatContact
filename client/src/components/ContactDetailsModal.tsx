import React, { useState } from 'react';
import { X, Edit2, Trash2, Save, XCircle, Bot, ChevronDown, ChevronRight } from 'lucide-react';
import { updateContact, deleteContact } from '../services/contactApi';

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

interface Props {
    contact: Contact | null;
    onClose: () => void;
    onUpdate: () => void;
    onAskAI: (contactName: string) => void;
}

const ContactDetailsModal: React.FC<Props> = ({ contact, onClose, onUpdate, onAskAI }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Contact>>({});
    const [loading, setLoading] = useState(false);
    const [showAttributes, setShowAttributes] = useState(false);

    if (!contact) return null;

    const handleEditToggle = () => {
        if (!isEditing) setEditForm({ ...contact });
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateContact(contact._id, editForm);
            onUpdate();
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update contact', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete ${contact.name}? This cannot be undone.`)) return;
        setLoading(true);
        try {
            await deleteContact(contact._id);
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Failed to delete contact', err);
        } finally {
            setLoading(false);
        }
    };

    const attrEntries = contact.attributes ? Object.entries(contact.attributes) : [];

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog animate-slideIn" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: `hsl(${(contact.name?.charCodeAt(0) || 0) * 15}, 40%, 22%)`,
                            border: `1px solid hsl(${(contact.name?.charCodeAt(0) || 0) * 15}, 40%, 35%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 700,
                            color: `hsl(${(contact.name?.charCodeAt(0) || 0) * 15}, 60%, 70%)`,
                            flexShrink: 0
                        }}>
                            {contact.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{contact.name}</div>
                            {contact.role && (
                                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                                    {contact.role}{contact.company ? ` at ${contact.company}` : ''}
                                </div>
                            )}
                        </div>
                    </div>
                    <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px', marginTop: -4 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: 24 }}>
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {(['name', 'company', 'role', 'email'] as const).map(field => (
                                <div key={field}>
                                    <label className="label">{field}</label>
                                    <input
                                        className="input"
                                        value={(editForm as any)[field] || ''}
                                        onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
                                        placeholder={`Enter ${field}…`}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="label">Notes</label>
                                <textarea
                                    className="input"
                                    rows={4}
                                    style={{ resize: 'vertical' }}
                                    value={editForm.notes || ''}
                                    onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                    placeholder="Add any notes…"
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {[
                                { label: 'Email', value: contact.email },
                                { label: 'Company', value: contact.company },
                                { label: 'Role', value: contact.role },
                            ].map(({ label, value }) => value ? (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
                                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</span>
                                    <span style={{ fontSize: 13, color: '#e2e8f0', fontFamily: label === 'Email' ? 'monospace' : 'inherit' }}>{value}</span>
                                </div>
                            ) : null)}

                            {contact.notes && (
                                <div style={{ padding: '16px 0', borderBottom: '1px solid #1e293b' }}>
                                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Notes</div>
                                    <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{contact.notes}</div>
                                </div>
                            )}

                            {attrEntries.length > 0 && (
                                <div style={{ paddingTop: 12 }}>
                                    <button
                                        className="btn btn-ghost"
                                        onClick={() => setShowAttributes(!showAttributes)}
                                        style={{ padding: '6px 0', fontSize: 13, color: '#64748b', gap: 6 }}
                                    >
                                        {showAttributes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        {attrEntries.length} Additional Attributes
                                    </button>

                                    {showAttributes && (
                                        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            {attrEntries.map(([k, v]) => (
                                                <div key={k} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px' }}>
                                                    <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{k}</div>
                                                    <div style={{ fontSize: 13, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>{v || '—'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Bar */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: '#0d131f', borderRadius: '0 0 16px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {isEditing ? (
                            <>
                                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
                                    <Save size={14} />
                                    {loading ? 'Saving…' : 'Save Changes'}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={handleEditToggle} disabled={loading}>
                                    <XCircle size={14} />
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="btn btn-secondary btn-sm" onClick={handleEditToggle}>
                                    <Edit2 size={14} />
                                    Edit
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={loading}>
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </>
                        )}
                    </div>

                    {!isEditing && (
                        <button
                            className="btn btn-primary btn-sm"
                            style={{ background: '#4338ca', borderColor: '#4338ca' }}
                            onClick={() => { onAskAI(contact.name); onClose(); }}
                        >
                            <Bot size={14} />
                            Ask AI about this contact
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactDetailsModal;
