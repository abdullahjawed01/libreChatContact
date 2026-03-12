import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, Globe, X, DatabaseZap } from 'lucide-react';
import { importContacts, getImportProgress } from '../services/contactApi';

const SAMPLE_DATASETS = [
    { label: '1K Sample Dataset', url: 'https://storage.googleapis.com/assignment-input-files-serri/chat_states_1k.csv' },
    { label: '10K Sample Dataset', url: 'https://storage.googleapis.com/assignment-input-files-serri/chat_states_10k.csv' },
    { label: '1M Sample Dataset', url: 'https://storage.googleapis.com/assignment-input-files-serri/chat_states_1M.csv' },
];

export interface ImportJob {
    jobId: string;
    status: 'running' | 'done' | 'error';
    percent: number;
    processed: number;
    total: number;
    success: number;
    failed: number;
    label: string;
    error?: string;
}

interface Props {
    onComplete: () => void;
    onClose: () => void;
    onJobStarted?: (job: ImportJob) => void;
}

const ImportContacts: React.FC<Props> = ({ onClose, onJobStarted }) => {
    const [filePath, setFilePath] = useState('');
    const [starting, setStarting] = useState(false);
    const [started, setStarted] = useState(false);
    const [error, setError] = useState('');
    const [activeDataset, setActiveDataset] = useState('');

    const handleImport = async (url?: string) => {
        const target = url || filePath;
        if (!target) return;
        setStarting(true);
        setError('');
        setActiveDataset(url || filePath);

        try {
            const { jobId } = await importContacts(target);
            const label = url
                ? (SAMPLE_DATASETS.find(d => d.url === url)?.label ?? 'Dataset')
                : 'Custom CSV';

            const initialJob: ImportJob = {
                jobId, status: 'running', percent: 0,
                processed: 0, total: 0, success: 0, failed: 0, label,
            };
            onJobStarted?.(initialJob);
            setStarted(true);
            // Close modal immediately – progress shows in floating widget
            setTimeout(() => { onClose(); }, 600);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to start import.');
        } finally {
            setStarting(false);
            setActiveDataset('');
        }
    };

    return (
        <div className="dialog-overlay" onClick={onClose}>
            <div
                className="dialog animate-slideIn"
                style={{ maxWidth: 520 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(79,70,229,0.4)'
                        }}>
                            <DatabaseZap size={18} color="#fff" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Import Dataset</h2>
                            <p style={{ fontSize: 13, color: '#64748b' }}>Runs in the background — UI stays responsive</p>
                        </div>
                    </div>
                </div>

                {started ? (
                    <div style={{ padding: '36px 24px', textAlign: 'center' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 16,
                            background: 'linear-gradient(135deg, #052e16, #0d2018)',
                            border: '1px solid #065f46',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px'
                        }}>
                            <CheckCircle2 size={32} color="#34d399" />
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#34d399', marginBottom: 4 }}>Import Started!</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>Watch the progress indicator in the bottom-right corner.</div>
                    </div>
                ) : (
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
                                    disabled={starting}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleImport()}
                                    disabled={!filePath || starting}
                                >
                                    {starting && activeDataset === filePath
                                        ? <Loader2 size={15} className="animate-spin" />
                                        : <Upload size={15} />}
                                    Import
                                </button>
                            </div>
                        </div>

                        {/* Quick Datasets */}
                        <div>
                            <label className="label">Quick Load Sample Datasets</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {SAMPLE_DATASETS.map(ds => {
                                    const isThis = starting && activeDataset === ds.url;
                                    return (
                                        <button
                                            key={ds.url}
                                            className="btn btn-secondary"
                                            style={{ justifyContent: 'flex-start', gap: 10 }}
                                            onClick={() => handleImport(ds.url)}
                                            disabled={starting}
                                        >
                                            {isThis
                                                ? <Loader2 size={14} className="animate-spin" style={{ color: '#818cf8' }} />
                                                : <Globe size={14} style={{ color: '#4f46e5', flexShrink: 0 }} />}
                                            <span style={{ flex: 1, textAlign: 'left' }}>{ds.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '12px 16px', borderRadius: 10,
                                background: '#1f0a0a', border: '1px solid #7f1d1d', color: '#f87171'
                            }}>
                                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: 14 }}>{error}</span>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={onClose} disabled={starting}>
                        <X size={14} /> Close
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─── Floating Progress Widget ─────────────────────────────────────────────── */
export const ImportProgressWidget: React.FC<{
    jobs: ImportJob[];
    onJobUpdate: (job: ImportJob) => void;
    onJobComplete: () => void;
    onDismiss: (jobId: string) => void;
}> = ({ jobs, onJobUpdate, onJobComplete, onDismiss }) => {
    const pollerRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

    useEffect(() => {
        jobs.forEach(job => {
            if (job.status === 'running' && !pollerRefs.current[job.jobId]) {
                pollerRefs.current[job.jobId] = setInterval(async () => {
                    try {
                        const progress = await getImportProgress(job.jobId);
                        onJobUpdate({ ...job, ...progress });
                        if (progress.status === 'done' || progress.status === 'error') {
                            clearInterval(pollerRefs.current[job.jobId]);
                            delete pollerRefs.current[job.jobId];
                            if (progress.status === 'done') onJobComplete();
                        }
                    } catch {
                        // ignore transient errors
                    }
                }, 700);
            }
            if (job.status !== 'running' && pollerRefs.current[job.jobId]) {
                clearInterval(pollerRefs.current[job.jobId]);
                delete pollerRefs.current[job.jobId];
            }
        });
        return () => {
            Object.values(pollerRefs.current).forEach(clearInterval);
        };
    }, [jobs]);

    if (jobs.length === 0) return null;

    return (
        <div style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
            display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none'
        }}>
            {jobs.map(job => {
                const pct = job.percent >= 0 ? job.percent : null;
                const isDone = job.status === 'done';
                const isError = job.status === 'error';

                return (
                    <div
                        key={job.jobId}
                        style={{
                            pointerEvents: 'all',
                            width: 320,
                            background: 'rgba(13, 20, 33, 0.95)',
                            backdropFilter: 'blur(16px)',
                            border: `1px solid ${isDone ? '#065f46' : isError ? '#7f1d1d' : '#1e2a45'}`,
                            borderRadius: 14,
                            padding: '14px 16px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
                        }}
                    >
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                background: isDone ? '#052e16' : isError ? '#1c0505' : '#1e2a45',
                                border: `1px solid ${isDone ? '#065f46' : isError ? '#4b1c1c' : '#2d3d5a'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {isDone
                                    ? <CheckCircle2 size={16} color="#34d399" />
                                    : isError
                                        ? <AlertCircle size={16} color="#f87171" />
                                        : <Loader2 size={16} color="#818cf8" className="animate-spin" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {job.label}
                                </div>
                                <div style={{ fontSize: 11, color: isDone ? '#34d399' : isError ? '#f87171' : '#64748b' }}>
                                    {isDone
                                        ? `Done · ${job.success.toLocaleString()} imported`
                                        : isError
                                            ? `Error: ${job.error ?? 'unknown'}`
                                            : pct !== null
                                                ? `${job.processed.toLocaleString()} / ${job.total.toLocaleString()} rows`
                                                : `${job.processed.toLocaleString()} rows processed…`}
                                </div>
                            </div>
                            {(isDone || isError) && (
                                <button
                                    onClick={() => onDismiss(job.jobId)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Progress bar */}
                        <div style={{
                            height: 6, borderRadius: 99,
                            background: '#0f172a', overflow: 'hidden', border: '1px solid #1e293b'
                        }}>
                            <div style={{
                                height: '100%',
                                width: isDone ? '100%' : pct !== null ? `${pct}%` : '100%',
                                borderRadius: 99,
                                background: isDone
                                    ? 'linear-gradient(90deg, #34d399, #059669)'
                                    : isError
                                        ? '#f87171'
                                        : 'linear-gradient(90deg, #4f46e5, #818cf8)',
                                transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                                animation: (!isDone && !isError && pct === null) ? 'shimmer 1.5s infinite' : undefined,
                            }} />
                        </div>

                        {/* Percentage label */}
                        {!isDone && !isError && (
                            <div style={{ marginTop: 6, textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#818cf8' }}>
                                {pct !== null ? `${pct}%` : 'Processing…'}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ImportContacts;
