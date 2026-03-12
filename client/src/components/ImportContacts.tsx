import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, Globe } from 'lucide-react';
import { importContacts } from '../services/contactApi';

const SAMPLE_DATASETS = [
    { label: '1K Sample Dataset', url: 'https://storage.googleapis.com/assignment-input-files-serri/chat_states_1k.csv' },
    { label: '10K Sample Dataset', url: 'https://storage.googleapis.com/assignment-input-files-serri/chat_states_10k.csv' },
    { label: '1M Sample Dataset', url: 'https://storage.googleapis.com/assignment-input-files-serri/chat_states_1M.csv' },
];

const ImportContacts: React.FC<{ onComplete: () => void; onClose: () => void }> = ({ onComplete, onClose }) => {
    const [filePath, setFilePath] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleImport = async (url?: string) => {
        const target = url || filePath;
        if (!target) return;
        setLoading(true);
        setStatus(null);
        try {
            const result = await importContacts(target);
            setStatus({ type: 'success', message: `Successfully imported ${result.success} contacts. ${result.failed} skipped.` });
            setTimeout(() => { onComplete(); onClose(); }, 1500);
        } catch (error: any) {
            setStatus({ type: 'error', message: error?.response?.data?.message || 'Import failed. Please check the URL or file path.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div className="dialog animate-slideIn" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <div className="badge badge-blue" style={{ padding: '6px 10px' }}>
                            <Upload size={14} />
                        </div>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Import Contacts</h2>
                    </div>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                        Import contacts from a CSV file by URL or local path, or use one of the sample datasets below.
                    </p>
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Custom URL/Path */}
                    <div>
                        <label className="label">CSV URL or File Path</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input
                                className="input"
                                style={{ flex: 1 }}
                                value={filePath}
                                onChange={e => setFilePath(e.target.value)}
                                placeholder="https://... or /path/to/contacts.csv"
                                disabled={loading}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => handleImport()}
                                disabled={!filePath || loading}
                            >
                                {loading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                Import
                            </button>
                        </div>
                    </div>

                    {/* Quick Datasets */}
                    <div>
                        <label className="label">Quick Load Sample Datasets</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {SAMPLE_DATASETS.map(ds => (
                                <button
                                    key={ds.url}
                                    className="btn btn-secondary"
                                    style={{ justifyContent: 'flex-start', gap: 10 }}
                                    onClick={() => handleImport(ds.url)}
                                    disabled={loading}
                                >
                                    <Globe size={14} style={{ color: '#4f46e5', flexShrink: 0 }} />
                                    <span style={{ flex: 1, textAlign: 'left' }}>{ds.label}</span>
                                    {loading && <Loader2 size={14} className="animate-spin" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    {status && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                            borderRadius: 10,
                            background: status.type === 'success' ? '#0d2018' : '#1f0a0a',
                            border: `1px solid ${status.type === 'success' ? '#065f46' : '#7f1d1d'}`,
                            color: status.type === 'success' ? '#34d399' : '#f87171'
                        }}>
                            {status.type === 'success'
                                ? <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                : <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />}
                            <span style={{ fontSize: 14 }}>{status.message}</span>
                        </div>
                    )}
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default ImportContacts;
