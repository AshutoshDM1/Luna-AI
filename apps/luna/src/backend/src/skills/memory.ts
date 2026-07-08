import { prisma } from '../db/db'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string
  content: string
  tags: string
  importance: number
  source: string
  createdAt: Date
  updatedAt: Date
}

export interface WriteMemoryOptions {
  tags?: string // comma-separated e.g. "preference,ui"
  importance?: number // 1 (trivial) – 5 (critical), default 3
  source?: string // "user" | "agent", default "user"
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Persist a new memory. If identical content already exists, update its
 * importance/tags instead of creating a duplicate.
 */
export async function writeMemory(
  content: string,
  options: WriteMemoryOptions = {}
): Promise<{ success: boolean; output: string; id?: string }> {
  if (!content?.trim()) {
    return { success: false, output: 'Memory content cannot be empty.' }
  }

  const { tags = '', importance = 3, source = 'user' } = options
  const clampedImportance = Math.min(5, Math.max(1, Math.round(importance)))
  const trimmedContent = content.trim()

  try {
    const existing = await prisma.memory.findFirst({
      where: { content: trimmedContent }
    })

    if (existing) {
      await prisma.memory.update({
        where: { id: existing.id },
        data: {
          tags: tags || existing.tags,
          importance: Math.max(existing.importance, clampedImportance),
          updatedAt: new Date()
        }
      })
      return {
        success: true,
        output: `Memory reinforced: "${trimmedContent}"`,
        id: existing.id
      }
    }

    const memory = await prisma.memory.create({
      data: { content: trimmedContent, tags, importance: clampedImportance, source }
    })

    return { success: true, output: `Memory saved: "${trimmedContent}"`, id: memory.id }
  } catch (err: any) {
    return { success: false, output: `Failed to save memory: ${err.message}` }
  }
}

// ─── Read All ─────────────────────────────────────────────────────────────────

/**
 * Retrieve all memories sorted by importance (desc) then recency (desc).
 */
export async function readMemories(
  limit = 50
): Promise<{ success: boolean; output: string; memories?: MemoryEntry[] }> {
  try {
    const memories = await prisma.memory.findMany({
      orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
      take: limit
    })

    if (memories.length === 0) {
      return { success: true, output: 'No memories stored yet.', memories: [] }
    }

    const formatted = memories
      .map(
        (m, i) =>
          `[${i + 1}] (importance: ${m.importance}/5${m.tags ? `, tags: ${m.tags}` : ''})\n${m.content}`
      )
      .join('\n\n')

    return {
      success: true,
      output: `Found ${memories.length} memories:\n\n${formatted}`,
      memories: memories as MemoryEntry[]
    }
  } catch (err: any) {
    return { success: false, output: `Failed to read memories: ${err.message}` }
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Search memories by keyword — matches against content and tags.
 * Fast SQLite LIKE search, no embeddings needed.
 */
export async function searchMemories(
  query: string,
  limit = 10
): Promise<{ success: boolean; output: string; memories?: MemoryEntry[] }> {
  if (!query?.trim()) {
    return { success: false, output: 'Search query cannot be empty.' }
  }

  try {
    const memories = await prisma.memory.findMany({
      where: {
        OR: [{ content: { contains: query.trim() } }, { tags: { contains: query.trim() } }]
      },
      orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
      take: limit
    })

    if (memories.length === 0) {
      return {
        success: true,
        output: `No memories found matching "${query}".`,
        memories: []
      }
    }

    const formatted = memories
      .map(
        (m, i) =>
          `[${i + 1}] (importance: ${m.importance}/5${m.tags ? `, tags: ${m.tags}` : ''})\n${m.content}`
      )
      .join('\n\n')

    return {
      success: true,
      output: `Found ${memories.length} memories matching "${query}":\n\n${formatted}`,
      memories: memories as MemoryEntry[]
    }
  } catch (err: any) {
    return { success: false, output: `Failed to search memories: ${err.message}` }
  }
}

// ─── System Prompt Injection ──────────────────────────────────────────────────

/**
 * Returns a compact summary of top N memories for injection into the system
 * prompt. Gives the AI passive awareness without requiring a tool call.
 */
export async function getTopMemoriesSummary(limit = 5): Promise<string> {
  try {
    const memories = await prisma.memory.findMany({
      orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
      take: limit
    })

    if (memories.length === 0) return ''

    const lines = memories.map((m) => `• ${m.content}${m.tags ? ` [${m.tags}]` : ''}`)
    return `\nREMEMBERED CONTEXT (from your memory):\n${lines.join('\n')}`
  } catch {
    return ''
  }
}
