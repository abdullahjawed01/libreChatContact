import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    BarChart2, Users, Globe, Tags, Building2,
    TrendingUp, Loader2, AlertCircle, Database, RefreshCw,
    CheckCircle2, AlertTriangle, Layers, Zap
} from 'lucide-react';
import axios from 'axios';

/* ─── Types ────────────────────────────────────────────────── */
interface Insight { name: string; count: number; }
interface DatasetHealth {
    total: number;
    withCompany: number; companyPct: number;
    withRole: number; rolePct: number;
    withEmail: number; emailPct: number;
    withNotes: number; notesPct: number;
    avgAttributesPerContact: number;
    uniqueCompanies: number;
    uniqueRoles: number;
}
interface InsightsData {
    topCompanies: Insight[];
    roles: Insight[];
    industries: Insight[];
    locations: Insight[];
    interests: Insight[];
    datasetHealth?: DatasetHealth;
}

const PALETTE = [
    '#818cf8', '#34d399', '#f472b6', '#facc15', '#60a5fa',
    '#a78bfa', '#2dd4bf', '#fb923c', '#e879f9', '#4ade80',
    '#38bdf8', '#f87171', '#c084fc', '#86efac', '#fcd34d',
    '#67e8f9', '#fda4af', '#a3e635', '#d8b4fe', '#93c5fd',
];

/* ─── Custom Tooltips ───────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
            padding: '10px 16px', fontSize: 13, color: '#f1f5f9',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{label || payload[0]?.name}</div>
            <div style={{ color: '#94a3b8' }}>{payload[0]?.value?.toLocaleString()} contacts</div>
        </div>
    );
};

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '10px 16px', fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{payload[0]?.name}</div>
            <div style={{ color: '#94a3b8' }}>{payload[0]?.value?.toLocaleString()} contacts</div>
        </div>
    );
};

/* ─── Health Progress Bar ──────────────────────────────────── */
const HealthBar: React.FC<{ label: string; pct: number; count: number; total: number; color: string }> = ({ label, pct, count, total, color }) => {
    const quality = pct >= 80 ? 'good' : pct >= 50 ? 'moderate' : 'low';
    const qualityColor = quality === 'good' ? '#34d399' : quality === 'moderate' ? '#facc15' : '#f87171';
    const qualityIcon = quality === 'good'
        ? <CheckCircle2 size={13} color="#34d399" />
        : quality === 'moderate'
            ? <AlertTriangle size={13} color="#facc15" />
            : <AlertCircle size={13} color="#f87171" />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {qualityIcon}
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{count.toLocaleString()} / {total.toLocaleString()}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: qualityColor, minWidth: 38, textAlign: 'right' }}>{pct}%</span>
                </div>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: '#0f172a', overflow: 'hidden', border: '1px solid #1e293b' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 99,
                    background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }} />
            </div>
        </div>
    );
};

/* ─── Dataset Health Panel ──────────────────────────────────── */
const DatasetHealthPanel: React.FC<{ health: DatasetHealth }> = ({ health }) => {
    const overallScore = Math.round((health.companyPct + health.rolePct + health.emailPct) / 3);
    const scoreColor = overallScore >= 80 ? '#34d399' : overallScore >= 50 ? '#facc15' : '#f87171';
    const scoreLabel = overallScore >= 80 ? 'Excellent' : overallScore >= 50 ? 'Good' : 'Needs Work';

    const statItems = [
        { label: 'Total Records', value: health.total.toLocaleString(), icon: <Database size={18} />, color: '#818cf8' },
        { label: 'Unique Companies', value: health.uniqueCompanies.toLocaleString(), icon: <Building2 size={18} />, color: '#34d399' },
        { label: 'Unique Roles', value: health.uniqueRoles.toLocaleString(), icon: <Users size={18} />, color: '#f472b6' },
        { label: 'Avg Attributes', value: String(health.avgAttributesPerContact), icon: <Layers size={18} />, color: '#facc15' },
    ];

    return (
        <div style={{ marginBottom: 36 }}>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Zap size={16} color="#818cf8" />
                </div>
                <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Dataset Analysis</h2>
                    <p style={{ fontSize: 12, color: '#475569' }}>Deep health & completeness metrics from your entire contact database</p>
                </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
                {statItems.map(item => (
                    <div key={item.label} style={{
                        background: '#0d131f', border: '1px solid #1e293b', borderRadius: 12,
                        padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ color: item.color }}>{item.icon}</div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>{item.value}</div>
                    </div>
                ))}

                {/* Overall quality score card */}
                <div style={{
                    background: '#0d131f', border: `1px solid ${scoreColor}33`, borderRadius: 12,
                    padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8,
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 12,
                        background: `radial-gradient(ellipse at top right, ${scoreColor}09, transparent 60%)`
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                        <div style={{ color: scoreColor }}><TrendingUp size={18} /></div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data Quality</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, letterSpacing: '-0.03em' }}>{overallScore}%</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: scoreColor, opacity: 0.7 }}>{scoreLabel}</div>
                    </div>
                </div>
            </div>

            {/* Field completeness */}
            <div style={{
                background: '#0d131f', border: '1px solid #1e293b', borderRadius: 14,
                padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1' }}>Field Completeness</span>
                    <div style={{
                        fontSize: 11, color: '#475569', background: '#111827',
                        border: '1px solid #1e293b', borderRadius: 99, padding: '3px 10px', fontWeight: 500
                    }}>
                        Key fields for segmentation targeting
                    </div>
                </div>
                <HealthBar label="Company" pct={health.companyPct} count={health.withCompany} total={health.total} color="#818cf8" />
                <HealthBar label="Role / Title" pct={health.rolePct} count={health.withRole} total={health.total} color="#34d399" />
                <HealthBar label="Email Address" pct={health.emailPct} count={health.withEmail} total={health.total} color="#f472b6" />
                <HealthBar label="Notes" pct={health.notesPct} count={health.withNotes} total={health.total} color="#facc15" />

                {health.avgAttributesPerContact > 0 && (
                    <div style={{
                        marginTop: 4, padding: '12px 16px', borderRadius: 10,
                        background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)',
                        display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#94a3b8'
                    }}>
                        <Layers size={15} color="#818cf8" />
                        Each contact carries on average <strong style={{ color: '#818cf8' }}>{health.avgAttributesPerContact} additional attributes</strong>, giving you rich extra dimensions for targeting.
                    </div>
                )}
            </div>
        </div>
    );
};

/* ─── Small Metric Cards ────────────────────────────────────── */
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
    <div style={{
        background: '#111827', border: '1px solid #1e293b', borderRadius: 12,
        padding: '18px 22px', flex: 1, minWidth: 140,
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ color }}>{icon}</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
            {value.toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>unique segments</div>
    </div>
);

/* ─── Bar Chart Section ─────────────────────────────────────── */
const BarSection: React.FC<{
    title: string; icon: React.ReactNode; data: Insight[];
    color: string; campaignTip: string
}> = ({ title, icon, data, color, campaignTip }) => (
    <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ color }}>{icon}</div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{title}</h3>
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginLeft: 26 }}>Top {data.length} segments</div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', maxWidth: 240, flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>💡 Campaign tip</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{campaignTip}</div>
            </div>
        </div>
        {data.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#334155', fontSize: 13 }}>
                No data available — import a dataset first
            </div>
        ) : (
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={145} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        )}
    </div>
);

/* ─── Pie Chart Section ─────────────────────────────────────── */
const PieSection: React.FC<{ title: string; icon: React.ReactNode; data: Insight[]; campaignTip: string }> = ({ title, icon, data, campaignTip }) => {
    const top8 = data.slice(0, 8);
    const otherCount = data.slice(8).reduce((acc, d) => acc + d.count, 0);
    const pieData = otherCount > 0 ? [...top8, { name: 'Other', count: otherCount }] : top8;
    return (
        <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 14, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {icon}
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{title}</h3>
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginLeft: 26 }}>Distribution breakdown</div>
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 12px', maxWidth: 240, flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>💡 Campaign tip</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{campaignTip}</div>
                </div>
            </div>
            {pieData.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#334155', fontSize: 13 }}>
                    No data available — import a dataset first
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie data={pieData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={45} paddingAngle={2}>
                            {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                        </Pie>
                        <RechartTooltip content={<PieTooltip />} />
                        <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const CampaignInsightsPage: React.FC = () => {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchInsights = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('http://localhost:5001/api/analysis/campaign-insights');
            setData(res.data);
            setLastUpdated(new Date());
        } catch (err: any) {
            setError(err.message || 'Failed to load insights');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInsights(); }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e2e8f0' }}>

            {/* Page Header */}
            <div style={{
                padding: '24px 40px', borderBottom: '1px solid #1e293b',
                background: 'rgba(7,11,20,0.85)', backdropFilter: 'blur(14px)',
                position: 'sticky', top: 0, zIndex: 50
            }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 10,
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(79,70,229,0.4)'
                            }}>
                                <TrendingUp size={18} color="#fff" />
                            </div>
                            <div>
                                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>Campaign Insights</h1>
                                <p style={{ fontSize: 13, color: '#475569' }}>
                                    Deep demographic analysis for targeted marketing
                                    {lastUpdated && <span style={{ marginLeft: 10, color: '#334155' }}>· Refreshed {lastUpdated.toLocaleTimeString()}</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={fetchInsights}
                        disabled={loading}
                        style={{ gap: 8 }}
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 40px' }}>

                {/* Loading */}
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 16, background: '#141d2f',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 40px rgba(79,70,229,0.2)'
                        }}>
                            <Loader2 size={30} color="#818cf8" className="animate-spin" />
                        </div>
                        <div style={{ fontSize: 15, color: '#64748b' }}>Running aggregation pipelines on your database…</div>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '18px 22px', background: '#1c0a0a', border: '1px solid #4b1c1c',
                        borderRadius: 12, color: '#f87171', marginBottom: 32
                    }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Content */}
                {data && !loading && (
                    <>
                        {/* ── Deep Dataset Analysis ── */}
                        {data.datasetHealth && data.datasetHealth.total > 0 && (
                            <DatasetHealthPanel health={data.datasetHealth} />
                        )}

                        {/* ── Segment Summary Cards ── */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                            <StatCard icon={<Building2 size={18} />} label="Top Companies" value={data.topCompanies.length} color="#818cf8" />
                            <StatCard icon={<Users size={18} />} label="Unique Roles" value={data.roles.length} color="#34d399" />
                            <StatCard icon={<Database size={18} />} label="Industries" value={data.industries.length} color="#f472b6" />
                            <StatCard icon={<Globe size={18} />} label="Locations" value={data.locations.length} color="#facc15" />
                            <StatCard icon={<Tags size={18} />} label="Interests" value={data.interests.length} color="#60a5fa" />
                        </div>

                        {/* ── Charts ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            <BarSection
                                title="Top Companies"
                                icon={<Building2 size={16} color="#818cf8" />}
                                data={data.topCompanies}
                                color="#818cf8"
                                campaignTip="Target organizations with the most contacts for enterprise deals and partnership outreach."
                            />
                            <PieSection
                                title="Role Distribution"
                                icon={<Users size={16} color="#34d399" />}
                                data={data.roles}
                                campaignTip="Identify CTOs, Founders & VPs to target decision-maker campaigns for high-conversion leads."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            <BarSection
                                title="Industry Segmentation"
                                icon={<BarChart2 size={16} color="#f472b6" />}
                                data={data.industries}
                                color="#f472b6"
                                campaignTip="Create industry-specific content — fintech whitepaper for Finance, case studies for SaaS."
                            />
                            <BarSection
                                title="Location Clusters"
                                icon={<Globe size={16} color="#facc15" />}
                                data={data.locations}
                                color="#facc15"
                                campaignTip="Run geo-targeted ads and promote region-specific events, meetups, or local offers."
                            />
                        </div>

                        <BarSection
                            title="Interest & Tag Segments"
                            icon={<Tags size={16} color="#60a5fa" />}
                            data={data.interests}
                            color="#60a5fa"
                            campaignTip="Send hyper-personalized content based on explicit interests. Highest engagement potential of all targeting dimensions."
                        />
                    </>
                )}

                {/* Empty state when no dataset imported yet */}
                {data && !loading && data.datasetHealth?.total === 0 && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', padding: '64px 0', gap: 16
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 16, background: '#111827',
                            border: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Database size={28} color="#334155" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 17, fontWeight: 700, color: '#475569', marginBottom: 8 }}>No dataset imported yet</div>
                            <div style={{ fontSize: 14, color: '#334155', maxWidth: 360, lineHeight: 1.6 }}>
                                Import a CSV dataset from the Contacts page to generate deep demographic analysis and campaign insights here.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignInsightsPage;
