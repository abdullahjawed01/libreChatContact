import React from 'react';
import { ChevronRight } from 'lucide-react';

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
    contacts: Contact[];
    onSelect: (contact: Contact) => void;
}

const ContactTable: React.FC<Props> = ({ contacts, onSelect }) => {
    if (contacts.length === 0) {
        return (
            <div className="empty-state">
                <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                    No contacts yet
                </div>
                <div style={{ fontSize: 14, color: '#475569', maxWidth: 320, lineHeight: 1.6 }}>
                    Import a CSV file or create a contact manually to get started.
                </div>
            </div>
        );
    }

    return (
        <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        <th style={{ paddingLeft: 24 }}>Name</th>
                        <th>Company</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map((contact, idx) => (
                        <tr key={contact._id || idx} onClick={() => onSelect(contact)}>
                            <td style={{ paddingLeft: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: `hsl(${(contact.name?.charCodeAt(0) || 0) * 15}, 40%, 25%)`,
                                        border: `1px solid hsl(${(contact.name?.charCodeAt(0) || 0) * 15}, 40%, 35%)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 700,
                                        color: `hsl(${(contact.name?.charCodeAt(0) || 0) * 15}, 60%, 70%)`,
                                        flexShrink: 0
                                    }}>
                                        {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{contact.name || '—'}</span>
                                </div>
                            </td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8' }}>
                                    {contact.company || <span style={{ color: '#334155' }}>—</span>}
                                </div>
                            </td>
                            <td>
                                {contact.role ? (
                                    <span className="badge badge-slate">{contact.role}</span>
                                ) : (
                                    <span style={{ color: '#334155' }}>—</span>
                                )}
                            </td>
                            <td style={{ color: '#64748b', fontSize: 13, fontFamily: 'monospace' }}>
                                {contact.email || <span style={{ color: '#334155' }}>—</span>}
                            </td>
                            <td style={{ paddingRight: 16, textAlign: 'right' }}>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={(e) => { e.stopPropagation(); onSelect(contact); }}
                                    style={{ padding: '4px 8px' }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ContactTable;
