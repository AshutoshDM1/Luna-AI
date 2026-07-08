import axios from 'axios'
import { IRouter, Router } from 'express'

const router: IRouter = Router()

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, '')).trim()
}

interface SearchResult {
  title: string
  snippet: string
  url: string
}

async function searchDuckDuckGo(query: string): Promise<SearchResult[]> {
  const response = await axios.get('https://html.duckduckgo.com/html/', {
    params: { q: query },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    timeout: 8000
  })

  const html = response.data as string
  const results: SearchResult[] = []

  const resultBlocks = html.split(/class="result\s/)
  for (let i = 1; i < resultBlocks.length && results.length < 6; i++) {
    const block = resultBlocks[i]

    const titleMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/)
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|span|div)/)
    const urlMatch = block.match(/class="result__url"[^>]*>([\s\S]*?)<\/(?:a|span)/)

    if (titleMatch) {
      const title = stripTags(titleMatch[1])
      const snippet = snippetMatch ? stripTags(snippetMatch[1]) : ''
      const rawUrl = urlMatch ? stripTags(urlMatch[1]) : ''
      const url = rawUrl.startsWith('http') ? rawUrl : rawUrl ? `https://${rawUrl}` : ''

      if (title) {
        results.push({ title, snippet, url })
      }
    }
  }

  return results
}

async function searchWikipedia(query: string): Promise<SearchResult[]> {
  const response = await axios.get('https://en.wikipedia.org/w/api.php', {
    params: {
      action: 'query',
      list: 'search',
      srsearch: query,
      format: 'json',
      utf8: '1'
    },
    headers: { 'User-Agent': 'LunaAssistant/1.0' },
    timeout: 5000
  })

  const results: SearchResult[] = []
  const searchItems = response.data?.query?.search || []

  for (const item of searchItems.slice(0, 4)) {
    const snippet = stripTags(item.snippet)
    results.push({
      title: item.title,
      snippet,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
    })
  }

  return results
}

export async function webSearch(query: string): Promise<string> {
  try {
    console.log(`[WebSearch] Searching: "${query}"`)
    let results: SearchResult[] = []

    // 1. Try DuckDuckGo HTML search (actual web results)
    try {
      results = await searchDuckDuckGo(query)
      console.log(`[WebSearch] DDG returned ${results.length} results`)
    } catch (ddgErr: any) {
      console.warn(`[WebSearch] DDG search failed: ${ddgErr.message}`)
    }

    // 2. Fallback to Wikipedia if DDG returned nothing
    if (results.length === 0) {
      try {
        console.log(`[WebSearch] Trying Wikipedia fallback for "${query}"`)
        results = await searchWikipedia(query)
        console.log(`[WebSearch] Wikipedia returned ${results.length} results`)
      } catch (wikiErr: any) {
        console.warn(`[WebSearch] Wikipedia failed: ${wikiErr.message}`)
      }
    }

    if (results.length === 0) {
      return `No results found for "${query}".`
    }

    const parts = results.map((r) => {
      const urlPart = r.url ? `\n  ${r.url}` : ''
      return `- **${r.title}**: ${r.snippet}${urlPart}`
    })

    const output = `Search results for "${query}":\n\n${parts.join('\n\n')}`
    console.log(`[WebSearch] Result (${output.length} chars)`)
    return output
  } catch (err: any) {
    console.error(`[WebSearch] General search failure: ${err.message}`)
    return `Search failed: ${err.message}`
  }
}

// Express route for direct API access
router.post('/search', async (req, res) => {
  const { query } = req.body
  if (!query?.trim()) {
    return res.status(400).json({ success: false, output: 'Query is required' })
  }
  const output = await webSearch(query.trim())
  return res.json({ success: true, output })
})

export default router
