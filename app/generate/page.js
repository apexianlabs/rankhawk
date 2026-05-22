'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

function GeneratePageInner() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('score')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    url: '',
    keyword: '',
    competitorUrl: '',
    location: 'US',
    contentType: 'blog'
  })

  const COLOR = '#f59e0b'

  useEffect(() => {
    const match = document.cookie.match(/ran_user=([^;]+)/)
    if (match) {
      try { setUser(JSON.parse(decodeURIComponent(match[1]))) } catch(e) {}
    }
  }, [])

  const handleAnalyse = async () => {
    if (!form.url || !form.keyword) {
      setError('Please enter your URL and target keyword')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const token = document.cookie.match(/ran_token=([^;]+)/)?.[1] || ''
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, userId: user?.id })
      })
      const data = await res.json()
      if (data.error === 'limit_reached') { setError('limit_reached'); setLoading(false); return }
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
      setActiveTab('score')
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const inputStyle = { width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #e2e8f0', fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' }
  const labelStyle = { fontSize:12, fontWeight:600, color:'#475569', marginBottom:4, display:'block' }

  const scoreColor = (score) => {
    if (score >= 80) return '#16a34a'
    if (score >= 60) return '#f59e0b'
    return '#dc2626'
  }

  const ScoreBar = ({ label, score, description }) => (
    <div style={{marginBottom:12}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontSize:12,fontWeight:600,color:'#475569'}}>{label}</span>
        <span style={{fontSize:13,fontWeight:800,color:scoreColor(score)}}>{score}/100</span>
      </div>
      <div style={{background:'#f1f5f9',borderRadius:6,height:6,marginBottom:4}}>
        <div style={{background:scoreColor(score),borderRadius:6,height:6,width:`${score}%`,transition:'width 0.5s'}}/>
      </div>
      {description && <div style={{fontSize:11,color:'#94a3b8'}}>{description}</div>}
    </div>
  )

  if (error === 'limit_reached') return (
    <div style={{minHeight:'100vh',background:'#f8fafc',display:'flex',alignItems:'center',justifyContent:'center',padding:20,fontFamily:'Inter,Arial,sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,padding:32,maxWidth:400,textAlign:'center',border:'1px solid #e2e8f0'}}>
        <div style={{fontSize:40,marginBottom:16}}>🦅</div>
        <h2 style={{fontSize:18,fontWeight:800,color:'#0f172a',marginBottom:8}}>Free limit reached</h2>
        <p style={{fontSize:14,color:'#64748b',marginBottom:24}}>Upgrade to keep analysing your SEO.</p>
        <Link href="/billing" style={{display:'block',background:COLOR,color:'#fff',padding:'12px 24px',borderRadius:9,textDecoration:'none',fontWeight:700,fontSize:14,marginBottom:12}}>Upgrade now →</Link>
        <button onClick={() => setError('')} style={{background:'none',border:'none',color:'#94a3b8',fontSize:13,cursor:'pointer'}}>Maybe later</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'Inter,Arial,sans-serif'}}>
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <Link href="/dashboard" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:28,height:28,borderRadius:7,background:COLOR,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'#fff'}}>R</div>
          <span style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>RankHawk</span>
        </Link>
        <Link href="/dashboard" style={{fontSize:13,color:'#64748b',textDecoration:'none'}}>← Dashboard</Link>
      </div>

      <div style={{maxWidth:980,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{marginBottom:24}}>
          <h1 style={{fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:6}}>Analyse your SEO</h1>
          <p style={{fontSize:14,color:'#64748b'}}>Enter your URL and target keyword for an AI-powered audit with quick wins and ranking recommendations.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns: result ? 'clamp(300px,40%,420px) 1fr' : '1fr',gap:24}}>
          {/* Form */}
          <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
            <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:20}}>Your Details</h2>

            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Your URL *</label>
              <input style={inputStyle} placeholder="https://yoursite.com/page" value={form.url}
                onChange={e => setForm({...form, url: e.target.value})} />
            </div>

            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Target Keyword *</label>
              <input style={inputStyle} placeholder="e.g. best project management software" value={form.keyword}
                onChange={e => setForm({...form, keyword: e.target.value})} />
            </div>

            <div style={{marginBottom:14}}>
              <label style={labelStyle}>Competitor URL (optional)</label>
              <input style={inputStyle} placeholder="https://competitor.com/page" value={form.competitorUrl}
                onChange={e => setForm({...form, competitorUrl: e.target.value})} />
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:20}}>
              <div>
                <label style={labelStyle}>Target Location</label>
                <select style={inputStyle} value={form.location} onChange={e => setForm({...form, location: e.target.value})}>
                  <option value="US">🇺🇸 United States</option>
                  <option value="UK">🇬🇧 United Kingdom</option>
                  <option value="AU">🇦🇺 Australia</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="Global">🌍 Global</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Content Type</label>
                <select style={inputStyle} value={form.contentType} onChange={e => setForm({...form, contentType: e.target.value})}>
                  <option value="blog">Blog Post</option>
                  <option value="product">Product Page</option>
                  <option value="homepage">Homepage</option>
                  <option value="landing">Landing Page</option>
                  <option value="service">Service Page</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
              </div>
            </div>

            {error && error !== 'limit_reached' && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:12,marginBottom:16,fontSize:13,color:'#dc2626'}}>{error}</div>
            )}

            <button onClick={handleAnalyse} disabled={loading}
              style={{width:'100%',background:loading ? '#fcd34d' : COLOR,color:'#fff',border:'none',borderRadius:9,padding:'13px 24px',fontSize:14,fontWeight:700,cursor:loading?'not-allowed':'pointer'}}>
              {loading ? '🔍 Analysing SEO...' : '🦅 Analyse SEO'}
            </button>

            <p style={{fontSize:11,color:'#94a3b8',marginTop:10,textAlign:'center'}}>Also checks AI search visibility on ChatGPT + Perplexity</p>
          </div>

          {/* Results */}
          {result && (
            <div style={{background:'#fff',borderRadius:14,border:'1px solid #e2e8f0',padding:24}}>
              <h2 style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4}}>SEO Analysis</h2>
              <p style={{fontSize:12,color:'#94a3b8',marginBottom:16,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{result.url} · {result.keyword}</p>

              {/* Overall score */}
              {result.overallScore && (
                <div style={{background: result.overallScore >= 70 ? '#f0fdf4' : result.overallScore >= 50 ? '#fffbeb' : '#fef2f2',
                  border:`1px solid ${result.overallScore >= 70 ? '#bbf7d0' : result.overallScore >= 50 ? '#fde68a' : '#fecaca'}`,
                  borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:28,fontWeight:800,color:scoreColor(result.overallScore)}}>{result.overallScore}/100</div>
                    <div style={{fontSize:12,color:'#64748b'}}>Overall SEO Score</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:14,fontWeight:700,color:'#0f172a'}}>{result.verdict}</div>
                    <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>Current status</div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div style={{display:'flex',gap:6,marginBottom:16,borderBottom:'1px solid #f1f5f9',paddingBottom:8,flexWrap:'wrap'}}>
                {[
                  {key:'score', label:'📊 Scores'},
                  {key:'quickwins', label:'⚡ Quick Wins'},
                  {key:'keywords', label:'🔑 Keywords'},
                  {key:'ai', label:'🤖 AI Search'},
                  {key:'competitor', label:'🆚 vs Competitor'},
                ].filter(t => t.key !== 'competitor' || result.competitorAnalysis).map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{padding:'6px 10px',borderRadius:6,border:'none',fontSize:11,fontWeight:600,cursor:'pointer',
                      background:activeTab===tab.key ? COLOR : '#f1f5f9',
                      color:activeTab===tab.key ? '#fff' : '#64748b'}}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'score' && result.scores && (
                <div>
                  <ScoreBar label="On-Page SEO" score={result.scores.onPage} description="Title, meta, headings, content quality" />
                  <ScoreBar label="Content Relevance" score={result.scores.content} description="How well content matches the keyword" />
                  <ScoreBar label="Technical SEO" score={result.scores.technical} description="Page speed, mobile, structured data" />
                  <ScoreBar label="Authority Signals" score={result.scores.authority} description="Backlink profile and domain strength" />
                  <ScoreBar label="AI Search Visibility" score={result.scores.aiVisibility} description="Likelihood of appearing in ChatGPT/Perplexity" />
                </div>
              )}

              {activeTab === 'quickwins' && result.quickWins && (
                <div>
                  <p style={{fontSize:12,color:'#64748b',marginBottom:12}}>Ranked by impact — fix these first:</p>
                  {result.quickWins.map((win, i) => (
                    <div key={i} style={{marginBottom:10,padding:'10px 12px',background: i === 0 ? '#fffbeb' : '#f8fafc',borderRadius:8,border:`1px solid ${i === 0 ? '#fde68a' : '#e2e8f0'}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{win.fix}</span>
                        <span style={{fontSize:10,fontWeight:600,padding:'2px 6px',borderRadius:4,
                          background: win.impact === 'High' ? '#fef2f2' : win.impact === 'Medium' ? '#fffbeb' : '#f0fdf4',
                          color: win.impact === 'High' ? '#dc2626' : win.impact === 'Medium' ? '#d97706' : '#16a34a'}}>
                          {win.impact} Impact
                        </span>
                      </div>
                      <div style={{fontSize:12,color:'#64748b'}}>{win.reason}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'keywords' && result.keywords && (
                <div>
                  <p style={{fontSize:12,color:'#64748b',marginBottom:12}}>Related keywords to target:</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
                    {result.keywords.primary?.map((kw, i) => (
                      <span key={i} style={{padding:'4px 10px',background:'#fffbeb',border:'1px solid #fde68a',borderRadius:20,fontSize:12,color:'#92400e',fontWeight:500}}>{kw}</span>
                    ))}
                  </div>
                  <p style={{fontSize:11,fontWeight:600,color:'#94a3b8',marginBottom:8}}>LONG-TAIL OPPORTUNITIES</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                    {result.keywords.longTail?.map((kw, i) => (
                      <span key={i} style={{padding:'4px 10px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:20,fontSize:12,color:'#475569'}}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'ai' && result.aiVisibility && (
                <div>
                  <div style={{background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:8,padding:14,marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#0284c7',marginBottom:6}}>🤖 AI SEARCH VISIBILITY</div>
                    <div style={{fontSize:13,color:'#334155',lineHeight:1.7}}>{result.aiVisibility.summary}</div>
                  </div>
                  {result.aiVisibility.tips && (
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:8}}>HOW TO APPEAR IN AI ANSWERS</div>
                      {result.aiVisibility.tips.map((tip, i) => (
                        <div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
                          <span style={{color:COLOR,flexShrink:0}}>→</span>
                          <span style={{fontSize:13,color:'#334155',lineHeight:1.5}}>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'competitor' && result.competitorAnalysis && (
                <div>
                  <div style={{background:'#f8fafc',borderRadius:8,padding:14,marginBottom:12,fontSize:13,color:'#334155',lineHeight:1.7}}>{result.competitorAnalysis.summary}</div>
                  {result.competitorAnalysis.gaps && (
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',marginBottom:8}}>CONTENT GAPS TO FILL</div>
                      {result.competitorAnalysis.gaps.map((gap, i) => (
                        <div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
                          <span style={{color:'#dc2626',flexShrink:0}}>✗</span>
                          <span style={{fontSize:13,color:'#334155'}}>{gap}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => {
                const txt = `RankHawk SEO Analysis\nURL: ${result.url}\nKeyword: ${result.keyword}\nScore: ${result.overallScore}/100\nVerdict: ${result.verdict}\n\nQuick Wins:\n${result.quickWins?.map((w,i) => `${i+1}. ${w.fix}`).join('\n')}`
                navigator.clipboard.writeText(txt)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }} style={{width:'100%',marginTop:16,background:'#f1f5f9',border:'none',borderRadius:8,padding:'10px',fontSize:13,fontWeight:600,color:'#475569',cursor:'pointer'}}>
                {copied ? '✓ Copied!' : '📋 Copy Report'}
              </button>

              <Link href="/dashboard" style={{display:'block',marginTop:10,textAlign:'center',fontSize:13,color:'#94a3b8',textDecoration:'none'}}>View all analyses →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function GeneratePage() {
  return <Suspense><GeneratePageInner /></Suspense>
}
