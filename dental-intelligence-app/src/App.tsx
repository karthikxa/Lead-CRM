import { useState, useEffect, useMemo, useCallback } from 'react'
import './App.css'

interface Clinic {
  name: string
  area?: string
  locality?: string
  has_website: boolean
  website?: string
  phone?: string
  address?: string
  rating?: string | number
  doctor_name?: string
  source?: string
}

interface Stats {
  total_clinics: number
  with_website: number
  without_website: number
  website_missing_ratio: number
  with_phone: number
  phone_coverage_ratio: number
  average_rating: number
  top_localities: { locality: string; count: number }[]
}

const API_BASE = 'http://127.0.0.1:8000'

function computeLocalStats(
  data: Clinic[],
  setStats: (s: Stats) => void,
  setLocalities: (l: string[]) => void
) {
  const total = data.length
  const withWeb = data.filter(d => d.has_website).length
  const withPhone = data.filter(d => d.phone).length
  const ratings = data.map(d => parseFloat(String(d.rating || '0'))).filter(r => r > 0)
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.7
  const localityMap: Record<string, number> = {}
  data.forEach(d => {
    const loc = d.locality || d.area || 'Chennai'
    localityMap[loc] = (localityMap[loc] || 0) + 1
  })
  const topLocalities = Object.entries(localityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([locality, count]) => ({ locality, count }))
  setStats({
    total_clinics: total,
    with_website: withWeb,
    without_website: total - withWeb,
    website_missing_ratio: total ? Math.round((total - withWeb) / total * 1000) / 10 : 0,
    with_phone: withPhone,
    phone_coverage_ratio: total ? Math.round(withPhone / total * 1000) / 10 : 0,
    average_rating: Math.round(avgRating * 100) / 100,
    top_localities: topLocalities,
  })
  const allLocs = [...new Set(data.map(d => d.locality || d.area || '').filter(l => l.length > 1))]
  setLocalities(allLocs.sort())
}

function useApiOrFallback() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [localities, setLocalities] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, leadsRes, locsRes] = await Promise.all([
        fetch(`${API_BASE}/api/stats`),
        fetch(`${API_BASE}/api/leads?limit=200`),
        fetch(`${API_BASE}/api/localities`),
      ])
      if (!statsRes.ok) throw new Error('API offline')
      const statsData = await statsRes.json()
      const leadsData = await leadsRes.json()
      const locsData = await locsRes.json()
      setStats(statsData)
      setClinics(leadsData.leads || [])
      setLocalities(locsData)
      setApiOnline(true)
    } catch {
      try {
        const res = await fetch('/data/chennai_all_dentists_complete.json')
        if (res.ok) {
          const data: Clinic[] = await res.json()
          setClinics(data)
          computeLocalStats(data, setStats, setLocalities)
        }
      } catch { /* empty state */ }
      setApiOnline(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])
  return { clinics, stats, localities, loading, apiOnline, refetch: fetchAll }
}

type Tab = 'dashboard' | 'leads' | 'analytics'

export default function App() {
  const { clinics, stats, localities, loading, apiOnline, refetch } = useApiOrFallback()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [searchQ, setSearchQ] = useState('')
  const [filterLocality, setFilterLocality] = useState('all')
  const [filterWebsite, setFilterWebsite] = useState<'all' | 'yes' | 'no'>('all')
  const [filterPhone, setFilterPhone] = useState<'all' | 'yes'>('all')
  const [minRating, setMinRating] = useState(0)
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const PER_PAGE = 24

  const filtered = useMemo(() => {
    let list = clinics
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase()
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.area || '').toLowerCase().includes(q) ||
        (c.locality || '').toLowerCase().includes(q) ||
        (c.doctor_name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
      )
    }
    if (filterLocality !== 'all') list = list.filter(c => (c.locality || c.area || '').toLowerCase().includes(filterLocality.toLowerCase()))
    if (filterWebsite === 'yes') list = list.filter(c => c.has_website)
    if (filterWebsite === 'no') list = list.filter(c => !c.has_website)
    if (filterPhone === 'yes') list = list.filter(c => !!c.phone)
    if (minRating > 0) list = list.filter(c => parseFloat(String(c.rating || '0')) >= minRating)
    return list
  }, [clinics, searchQ, filterLocality, filterWebsite, filterPhone, minRating])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  useEffect(() => { setPage(1) }, [searchQ, filterLocality, filterWebsite, filterPhone, minRating])

  const handleRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false) }

  const downloadCSV = () => {
    const cols = ['name', 'area', 'locality', 'has_website', 'website', 'phone', 'address', 'rating', 'doctor_name']
    const rows = [cols.join(',')]
    filtered.forEach(c => {
      rows.push(cols.map(col => {
        const v = (c as Record<string, unknown>)[col] ?? ''
        return `"${String(v).replace(/"/g, '""')}"`
      }).join(','))
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'chennai_dental_leads.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const noWebOpportunity = stats ? stats.without_website : clinics.filter(c => !c.has_website).length
  const maxLocalityCount = stats?.top_localities?.length ? Math.max(...stats.top_localities.map(l => l.count)) : 1

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🦷</span>
            <div>
              <div className="logo-title">Zed Intelligence</div>
              <div className="logo-sub">Chennai Dental CRM</div>
            </div>
          </div>
        </div>
        <nav className="nav">
          {(['dashboard', 'leads', 'analytics'] as Tab[]).map(t => (
            <button key={t} id={`nav-${t}`} className={`nav-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'dashboard' ? '📊' : t === 'leads' ? '📋' : '📈'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <div className={`api-badge ${apiOnline ? 'online' : 'offline'}`}>
            <span className="api-dot" />{apiOnline ? 'API Live' : 'Local Mode'}
          </div>
          <button id="btn-refresh" className="icon-btn" onClick={handleRefresh} disabled={refreshing}>
            <span className={refreshing ? 'spin' : ''}>↻</span>
          </button>
        </div>
      </header>

      <main className="main">
        {loading ? (
          <div className="loading-screen">
            <div className="loader" />
            <p>Loading Chennai dental intelligence data...</p>
          </div>
        ) : (
          <>
            {tab === 'dashboard' && (
              <div className="tab-content fade-in">
                <div className="section-header">
                  <div>
                    <h1 className="section-title">Market Intelligence Dashboard</h1>
                    <p className="section-desc">Real-time insights across Chennai's dental ecosystem</p>
                  </div>
                </div>
                <div className="stats-grid">
                  <div className="stat-card" style={{'--accent':'#6366f1'} as React.CSSProperties}>
                    <div className="stat-icon">🏥</div>
                    <div className="stat-body"><div className="stat-value">{stats?.total_clinics ?? clinics.length}</div><div className="stat-label">Total Clinics</div><div className="stat-sub">Mapped across Chennai</div></div>
                  </div>
                  <div className="stat-card" style={{'--accent':'#f59e0b'} as React.CSSProperties}>
                    <div className="stat-icon">🎯</div>
                    <div className="stat-body"><div className="stat-value">{noWebOpportunity}</div><div className="stat-label">Opportunity Leads</div><div className="stat-sub">Clinics without websites</div></div>
                  </div>
                  <div className="stat-card" style={{'--accent':'#10b981'} as React.CSSProperties}>
                    <div className="stat-icon">🌐</div>
                    <div className="stat-body"><div className="stat-value">{stats?.with_website ?? clinics.filter(c => c.has_website).length}</div><div className="stat-label">Digital Presence</div><div className="stat-sub">{(100 - (stats?.website_missing_ratio ?? 0)).toFixed(1)}% coverage</div></div>
                  </div>
                  <div className="stat-card" style={{'--accent':'#3b82f6'} as React.CSSProperties}>
                    <div className="stat-icon">📞</div>
                    <div className="stat-body"><div className="stat-value">{stats?.with_phone ?? clinics.filter(c => c.phone).length}</div><div className="stat-label">With Phone</div><div className="stat-sub">{stats?.phone_coverage_ratio ?? 0}% coverage</div></div>
                  </div>
                </div>

                <div className="opportunity-banner">
                  <div className="oppo-left">
                    <div className="oppo-number">{noWebOpportunity}</div>
                    <div className="oppo-text">
                      <strong>High-Value Opportunities</strong>
                      <span>Dental clinics with <em>no website</em> — perfect targets for your agency's web services</span>
                    </div>
                  </div>
                  <button id="btn-view-leads" className="primary-btn" onClick={() => { setTab('leads'); setFilterWebsite('no') }}>
                    View Opportunities →
                  </button>
                </div>

                <div className="two-col">
                  <div className="panel">
                    <div className="panel-header">📍 Top Localities by Clinic Count</div>
                    <div className="locality-list">
                      {(stats?.top_localities ?? []).map(l => (
                        <div key={l.locality} className="locality-bar">
                          <div className="loc-label">{l.locality}</div>
                          <div className="loc-track"><div className="loc-fill" style={{ width: `${maxLocalityCount > 0 ? (l.count / maxLocalityCount) * 100 : 0}%` }} /></div>
                          <div className="loc-count">{l.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-header">📊 Market Breakdown</div>
                    <div className="breakdown-list">
                      {[
                        { label: 'Have Website', pct: 100 - (stats?.website_missing_ratio ?? 0), color: 'green' },
                        { label: 'No Website (Opportunity)', pct: stats?.website_missing_ratio ?? 0, color: 'amber' },
                        { label: 'Have Phone', pct: stats?.phone_coverage_ratio ?? 0, color: 'blue' },
                      ].map(item => (
                        <div key={item.label} className="breakdown-item">
                          <div className="bkd-label"><span className={`dot ${item.color}`} />{item.label}</div>
                          <div className="bkd-bar-wrap"><div className={`bkd-bar ${item.color}`} style={{ width: `${item.pct}%` }} /></div>
                          <div className="bkd-val">{item.pct.toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                    <div className="avg-rating-display">⭐ Avg Rating: <strong>{stats?.average_rating ?? '4.7'}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'leads' && (
              <div className="tab-content fade-in">
                <div className="section-header">
                  <div>
                    <h1 className="section-title">Lead Database</h1>
                    <p className="section-desc">{filtered.length} clinics match your filters</p>
                  </div>
                  <button id="btn-export-csv" className="primary-btn" onClick={downloadCSV}>⬇ Export CSV</button>
                </div>
                <div className="filters-bar">
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input id="search-input" className="search-input" placeholder="Search clinic, doctor, area, phone..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                    {searchQ && <button className="clear-btn" onClick={() => setSearchQ('')}>✕</button>}
                  </div>
                  <div className="filter-row">
                    <select id="filter-locality" className="filter-select" value={filterLocality} onChange={e => setFilterLocality(e.target.value)}>
                      <option value="all">All Localities</option>
                      {localities.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select id="filter-website" className="filter-select" value={filterWebsite} onChange={e => setFilterWebsite(e.target.value as 'all'|'yes'|'no')}>
                      <option value="all">Any Website Status</option>
                      <option value="yes">✅ Has Website</option>
                      <option value="no">⚠️ No Website</option>
                    </select>
                    <select id="filter-phone" className="filter-select" value={filterPhone} onChange={e => setFilterPhone(e.target.value as 'all'|'yes')}>
                      <option value="all">Any Phone Status</option>
                      <option value="yes">📞 Has Phone</option>
                    </select>
                    <select id="filter-rating" className="filter-select" value={minRating} onChange={e => setMinRating(Number(e.target.value))}>
                      <option value={0}>Any Rating</option>
                      <option value={4}>⭐ 4.0+</option>
                      <option value={4.5}>⭐ 4.5+</option>
                    </select>
                  </div>
                </div>
                <div className="cards-grid">
                  {paginated.map((c, i) => {
                    const area = c.locality || c.area || 'Chennai'
                    const rating = parseFloat(String(c.rating || '0'))
                    return (
                      <div key={`${c.name}-${i}`} className={`clinic-card ${c.has_website ? '' : 'no-web'}`} style={{ animationDelay: `${i * 0.035}s` }}>
                        <div className="clinic-header">
                          <span className={`clinic-badge ${c.has_website ? 'web' : 'nweb'}`}>{c.has_website ? '🌐 Has Website' : '⚠️ No Website'}</span>
                          {rating > 0 && <span className="clinic-stars">⭐ {rating.toFixed(1)}</span>}
                        </div>
                        <div className="clinic-name">{c.name}</div>
                        {c.doctor_name && <div className="clinic-doctor">👨‍⚕️ {c.doctor_name}</div>}
                        <div className="clinic-meta">
                          {area && <span className="meta-tag">📍 {area}</span>}
                          {c.phone && <a className="meta-tag clickable" href={`tel:${c.phone}`}>📞 {c.phone}</a>}
                        </div>
                        {c.address && <div className="clinic-address">{c.address}</div>}
                        {c.website && <a className="clinic-website-link" href={c.website} target="_blank" rel="noreferrer">🔗 {c.website.replace(/^https?:\/\//, '')}</a>}
                      </div>
                    )
                  })}
                </div>
                {filtered.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <p>No clinics match your filters</p>
                    <button className="secondary-btn" onClick={() => { setSearchQ(''); setFilterLocality('all'); setFilterWebsite('all'); setFilterPhone('all'); setMinRating(0) }}>Reset Filters</button>
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button id="btn-prev" className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <button id="btn-next" className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </div>
            )}

            {tab === 'analytics' && (
              <div className="tab-content fade-in">
                <div className="section-header">
                  <div><h1 className="section-title">Market Analytics</h1><p className="section-desc">Deep dive into Chennai dental market landscape</p></div>
                </div>
                <div className="analytics-grid">
                  <div className="panel wide">
                    <div className="panel-header">🎯 Website Gap by Locality (Top 15)</div>
                    <div className="locality-analysis">
                      {(() => {
                        const byLoc: Record<string, { total: number; noWeb: number }> = {}
                        clinics.forEach(c => {
                          const loc = c.locality || c.area || 'Unknown'
                          if (!byLoc[loc]) byLoc[loc] = { total: 0, noWeb: 0 }
                          byLoc[loc].total++
                          if (!c.has_website) byLoc[loc].noWeb++
                        })
                        return Object.entries(byLoc).sort((a, b) => b[1].noWeb - a[1].noWeb).slice(0, 15).map(([loc, { total, noWeb }]) => (
                          <div key={loc} className="loc-analysis-row">
                            <div className="loc-an-name">{loc}</div>
                            <div className="loc-an-bars">
                              <div className="loc-an-bar green" style={{ flex: total - noWeb }} />
                              <div className="loc-an-bar amber" style={{ flex: noWeb }} />
                            </div>
                            <div className="loc-an-stats">
                              <span className="badge green-b">{total - noWeb} ✓</span>
                              <span className="badge amber-b">{noWeb} ✗</span>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                    <div className="chart-legend">
                      <span><span className="dot green" /> Has Website</span>
                      <span><span className="dot amber" /> No Website (Opportunity)</span>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-header">📞 Phone Coverage</div>
                    <div className="donut-wrap">
                      <svg viewBox="0 0 100 100" className="donut-svg">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20"
                          strokeDasharray={`${(stats?.phone_coverage_ratio ?? 0) * 2.51} 251`}
                          strokeDashoffset="62.75" strokeLinecap="round" />
                      </svg>
                      <div className="donut-center"><div className="donut-val">{stats?.phone_coverage_ratio ?? 0}%</div><div className="donut-lbl">With Phone</div></div>
                    </div>
                  </div>
                  <div className="panel">
                    <div className="panel-header">💡 Key Insights</div>
                    <div className="insights-list">
                      {[
                        { num: noWebOpportunity, color: 'amber', desc: 'Clinics without websites — immediate outreach' },
                        { num: clinics.filter(c => c.has_website && c.phone).length, color: 'green', desc: 'Fully digital — website & phone' },
                        { num: clinics.filter(c => !c.has_website && c.phone).length, color: 'purple', desc: 'Have phone, no website — easiest outreach' },
                        { num: localities.length, color: 'blue', desc: 'Localities with dental presence' },
                      ].map((ins, i) => (
                        <div key={i} className="insight-item">
                          <div className={`insight-num ${ins.color}`}>{ins.num}</div>
                          <div className="insight-desc">{ins.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="footer">
        <span>Zed Intelligence Platform • Chennai Dental Market • {new Date().getFullYear()}</span>
        <span>{clinics.length.toLocaleString()} records indexed</span>
      </footer>
    </div>
  )
}
