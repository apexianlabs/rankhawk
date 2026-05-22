import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { url, keyword, competitorUrl, location, contentType, userId } = body

    if (!url || !keyword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (userId) {
      const usageRes = await fetch(
        `${process.env.DB_API_URL}/usage/check?user_id=${userId}&product=rankhawk`,
        { headers: { 'Authorization': `Bearer ${process.env.DB_API_KEY_RANKHAWK}` } }
      )
      const usage = await usageRes.json()
      if (!usage.allowed) return NextResponse.json({ error: 'limit_reached' }, { status: 403 })
    }

    const prompt = `You are an expert SEO consultant with 15 years of experience ranking websites on Google and appearing in AI search results. Analyse this page's SEO and respond ONLY with valid JSON.

URL to analyse: ${url}
Target keyword: "${keyword}"
Content type: ${contentType}
Target location: ${location}
${competitorUrl ? `Competitor URL to compare against: ${competitorUrl}` : ''}

Based on the URL structure, domain, and keyword, provide a comprehensive SEO analysis.

Respond ONLY with this JSON:
{
  "overallScore": <number 0-100>,
  "verdict": "Strong|Good|Needs Work|Poor",
  "scores": {
    "onPage": <0-100>,
    "content": <0-100>,
    "technical": <0-100>,
    "authority": <0-100>,
    "aiVisibility": <0-100>
  },
  "quickWins": [
    {"fix": "specific actionable fix", "reason": "why this will improve rankings", "impact": "High|Medium|Low"},
    {"fix": "fix 2", "reason": "reason 2", "impact": "High|Medium|Low"},
    {"fix": "fix 3", "reason": "reason 3", "impact": "Medium|Low"},
    {"fix": "fix 4", "reason": "reason 4", "impact": "Medium|Low"},
    {"fix": "fix 5", "reason": "reason 5", "impact": "Low"}
  ],
  "keywords": {
    "primary": ["related keyword 1", "related keyword 2", "related keyword 3", "related keyword 4", "related keyword 5"],
    "longTail": ["long tail keyword 1", "long tail keyword 2", "long tail keyword 3", "long tail keyword 4", "long tail keyword 5"]
  },
  "aiVisibility": {
    "summary": "2-3 sentences on how likely this content is to appear in ChatGPT/Perplexity answers and why",
    "tips": [
      "specific tip to improve AI search visibility",
      "tip 2",
      "tip 3"
    ]
  }
  ${competitorUrl ? `,
  "competitorAnalysis": {
    "summary": "2-3 sentences comparing the two URLs for this keyword",
    "gaps": ["content gap 1 competitor covers that you don't", "gap 2", "gap 3"]
  }` : ''}
}

Guidelines:
- Be specific and actionable — generic advice like "improve content quality" is not acceptable
- Title tag should include the exact keyword if possible
- For AI visibility: structured data, FAQs, clear definitions, and E-E-A-T signals all help
- Quick wins should be ordered High impact first
- Long-tail keywords should have 4+ words and clear search intent`

    const aiRes = await fetch(`${process.env.AI_API_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ task: 'analyse_seo', inputs: { prompt } })
    })

    if (!aiRes.ok) throw new Error('AI analysis failed')

    const aiData = await aiRes.json()
    let result = aiData.data || aiData.result || {}

    try {
      if (typeof result === 'string') {
        const clean = result.replace(/```json|```/g, '').trim()
        result = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean)
      } else if (result.raw_response) {
        const clean = result.raw_response.replace(/```json|```/g, '').trim()
        result = JSON.parse(clean.match(/\{[\s\S]*\}/)?.[0] || clean)
      }
    } catch(e) {}

    if (userId) {
      await fetch(`${process.env.DB_API_URL}/db/rankhawk/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_RANKHAWK}` },
        body: JSON.stringify({
          user_id: userId,
          title: `${url} — "${keyword}" — ${result.overallScore}/100`,
          result_data: { ...result, url, keyword, competitorUrl, location, contentType },
          status: 'active'
        })
      })
      await fetch(`${process.env.DB_API_URL}/usage/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.DB_API_KEY_RANKHAWK}` },
        body: JSON.stringify({ user_id: userId, product: 'rankhawk', action: 'analyse_seo' })
      })
    }

    return NextResponse.json({ ...result, url, keyword })
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
