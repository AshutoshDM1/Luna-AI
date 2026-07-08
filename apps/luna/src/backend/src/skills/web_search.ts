import axios from 'axios'
import { IRouter, Router } from 'express'

const router: IRouter = Router()

export async function webSearch(query: string): Promise<string> {
  try {
    console.log(`[WebSearch] Searching: "${query}"`)
    const parts: string[] = []

    // 1. DuckDuckGo Instant Answer
    try {
      const ddgResponse = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: '1',
          skip_disambig: '1',
          no_redirect: '1'
        },
        timeout: 5000
      })
      const data = ddgResponse.data
      if (data.Answer) parts.push(data.Answer)
      if (data.AbstractText) {
        parts.push(data.AbstractText)
        if (data.AbstractSource) parts.push(`Source: ${data.AbstractSource}`)
      }
      if (data.Definition) {
        parts.push(data.Definition)
        if (data.DefinitionSource) parts.push(`Source: ${data.DefinitionSource}`)
      }
    } catch (ddgErr: any) {
      console.warn(`[WebSearch] DDG Instant Answer failed: ${ddgErr.message}`)
    }

    // 2. Wikipedia Search Fallback
    if (parts.length === 0) {
      try {
        console.log(`[WebSearch] Trying Wikipedia fallback for "${query}"`)
        const wikiResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
          params: {
            action: 'query',
            list: 'search',
            srsearch: query,
            format: 'json',
            utf8: '1'
          },
          headers: {
            'User-Agent': 'LunaAssistant/1.0 (contact@luna.ai)'
          },
          timeout: 5000
        })
        const wikiData = wikiResponse.data
        const wikiResults: any[] = wikiData.query?.search || []
        if (wikiResults.length > 0) {
          parts.push(`Wikipedia search results for "${query}":`)
          wikiResults.slice(0, 4).forEach((item) => {
            const cleanSnippet = item.snippet
              .replace(/<[^>]*>/g, '')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .trim()
            parts.push(`- **${item.title}**: ${cleanSnippet}`)
          })
        }
      } catch (wikiErr: any) {
        console.warn(`[WebSearch] Wikipedia API failed: ${wikiErr.message}`)
      }
    }

    if (parts.length === 0) {
      return `No direct answers found for "${query}" on DuckDuckGo or Wikipedia.`
    }

    const result = parts.join('\n\n')
    console.log(`[WebSearch] Result (${result.length} chars): ${result.slice(0, 100)}...`)
    return result
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
