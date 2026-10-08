import type { ModelPick } from '../types'

export type ModelInfo = {
  id: string
  name: string
  icon: string
  color: string
  tagline: string
  bestFor: string
  examples: string[]
  /** USD per million tokens, input / output. */
  price: [number, number]
  /** 1 (low) .. 5 (high). */
  intelligence: number
  speed: number
  context: string
  note?: string
  /** Where it sits on the 0..1 task-complexity scale the scorer uses. */
  capability: number
}

// Prices are Anthropic first-party API rates (cached 2026-10-06).
export const MODELS: ModelInfo[] = [
  {
    id: 'claude-fable-5-1',
    name: 'Fable 5.1',
    icon: '✦',
    color: '#b18cff',
    tagline: 'Most capable: deepest reasoning, longest-horizon agentic work',
    bestFor: 'Hard, ambiguous problems where getting it right matters more than time or cost',
    examples: [
      'Design a system architecture and its migration plan',
      'Hunt down a subtle concurrency or security bug',
      'Multi-hour autonomous refactors across a large codebase',
    ],
    price: [10, 50],
    intelligence: 5,
    speed: 1,
    context: '1M',
    note: 'Thinking always on; single turns can run many minutes',
    capability: 0.95,
  },
  {
    id: 'claude-opus-5-5',
    name: 'Opus 5.5',
    icon: '◆',
    color: '#e8875f',
    tagline: 'Flagship all-rounder: strong reasoning at a sensible price',
    bestFor: 'Serious coding and agentic tasks, complex analysis, careful writing',
    examples: [
      'Implement a feature end-to-end with tests',
      'Review a pull request for correctness',
      'Analyse a long document and draft a recommendation',
    ],
    price: [4, 20],
    intelligence: 4,
    speed: 3,
    context: '1M',
    note: 'Fast mode (/fast): up to 2.5x faster output at 2x price',
    capability: 0.75,
  },
  {
    id: 'claude-sonnet-5-5',
    name: 'Sonnet 5.5',
    icon: '●',
    color: '#5aa9ff',
    tagline: 'Speed + capability for everyday coding and agent work',
    bestFor: 'Day-to-day development, routine features, chat, docs, data wrangling',
    examples: [
      'Write a function and its unit tests',
      'Explain or tidy up a module',
      'Draft docs, emails or a README',
    ],
    price: [2, 10],
    intelligence: 3,
    speed: 4,
    context: '1M',
    capability: 0.5,
  },
  {
    id: 'claude-haiku-5-5',
    name: 'Haiku 5.5',
    icon: '▲',
    color: '#3fd08f',
    tagline: 'Fastest and cheapest: instant answers, high volume',
    bestFor: 'Simple, well-defined, latency-sensitive or bulk tasks',
    examples: [
      'Fix a typo, rename, reformat',
      'Classify or extract fields from many items',
      'Quick factual question or one-line summary',
    ],
    price: [0.1, 0.5],
    intelligence: 2,
    speed: 5,
    context: '1M',
    note: 'Prices for prompts up to 100K tokens ($0.50 / $2.50 beyond)',
    capability: 0.2,
  },
]

export const byId = (id: string) => MODELS.find(m => m.id === id)

/** Matches whatever the session reports (`claude-opus-5-5[1m]`, `opus`, ...). */
export function matchModel(reported: string): ModelInfo | undefined {
  const s = reported.toLowerCase()
  return (
    MODELS.find(m => s.includes(m.id)) ??
    MODELS.find(m => s.includes(m.id.split('-')[1] ?? '\u0000'))
  )
}

export function costTier(m: ModelInfo): string {
  const out = m.price[1]
  return out >= 40 ? '$$$$' : out >= 15 ? '$$$' : out >= 5 ? '$$' : '$'
}

export const dots = (n: number) => '●'.repeat(n) + '○'.repeat(5 - n)

export const bar = (score: number, width = 10) => {
  const full = Math.round((score / 100) * width)
  return '█'.repeat(full) + '░'.repeat(width - full)
}

type Signal = { re: RegExp; label: string; c?: number; speed?: number }

const SIGNALS: Signal[] = [
  {
    re: /\b(architect\w*|system design|design (a|an|the) \w+ system|prove|proof|theorem|research\w*|novel|in[- ]depth|deep(ly)? analy\w*|trade-?offs?|strateg\w*|security (audit|review)|vulnerabilit\w*|concurren\w*|race condition|deadlock|distributed|formal(ly)?|complex\w*|hard problem)\b/i,
    label: 'deep reasoning',
    c: 0.25,
  },
  {
    re: /\b(refactor\w*|migrat\w*|entire (codebase|repo\w*|project)|across (the )?(codebase|repo\w*|files)|multi-?step|end[- ]to[- ]end|implement\w*|from scratch|full[- ]stack|build (a|an|the|me)|feature)\b/i,
    label: 'multi-step build',
    c: 0.15,
  },
  {
    re: /\b(code|function|class|bug|debug\w*|fix|tests?|api|typescript|python|javascript|rust|java|go|sql|regex|script|compile\w*|error|stack ?trace)\b/i,
    label: 'coding',
    c: 0.06,
  },
  {
    re: /\b(quick(ly)?|simple|short|brief(ly)?|one[- ]liner|typo|rename|re-?format|format|translate|summari[sz]e|tl;?dr|convert|spell(ing)?|grammar|what is|define|definition)\b/i,
    label: 'simple task',
    c: -0.17,
  },
  {
    re: /\b(classify|categori[sz]e|extract|tag|label|bulk|batch|thousands|hundreds|every (file|row|item)|each (file|row|item))\b/i,
    label: 'bulk / extraction',
    c: -0.1,
    speed: 0.3,
  },
  {
    re: /\b(fast|asap|urgent|cheap(ly)?|low[- ]cost|budget|latency)\b/i,
    label: 'speed / cost priority',
    speed: 0.4,
  },
  {
    re: /\b(best possible|highest quality|thorough(ly)?|careful(ly)?|rigorous(ly)?|critical|production|exhaustive(ly)?|must not fail|don'?t miss)\b/i,
    label: 'quality priority',
    c: 0.12,
    speed: -0.25,
  },
  {
    re: /\b(story|poem|essay|creative|blog|newsletter|cover letter|email|marketing copy)\b/i,
    label: 'writing',
    c: 0.04,
  },
]

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export type Analysis = { picks: ModelPick[]; signals: string[]; complexity: number; task: string }

/** Instant, offline ranking from the prompt's wording and shape. */
export function scorePrompt(text: string): Analysis {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const signals: string[] = []
  let c = 0.3 + Math.min(0.25, words / 900)
  let speed = 0

  for (const s of SIGNALS) {
    if (s.re.test(text)) {
      signals.push(s.label)
      c += s.c ?? 0
      speed += s.speed ?? 0
    }
  }

  const steps = text.split('\n').filter(l => /^\s*([-*•]|\d+[.)])\s+/.test(l)).length
  if (steps >= 4) {
    signals.push(`${steps} listed steps`)
    c += 0.1
  }
  if (/```/.test(text)) {
    signals.push('includes code')
    c += 0.04
  }
  if (words < 12 && !signals.includes('deep reasoning')) {
    c -= 0.08
  }

  c = clamp(c, 0.05, 1)
  speed = clamp(speed, -0.5, 1)

  const picks = MODELS.map(m => {
    const gap = m.capability - c
    // Too weak for the task hurts a lot; overkill costs time and money, so a little.
    let score = 100 - (gap < 0 ? -gap * 190 : gap * 70)
    score += speed * (m.speed - 3) * 6
    score = Math.round(clamp(score, 3, 99))
    return { id: m.id, score, why: reason(m, gap, speed) }
  }).sort((a, b) => b.score - a.score)

  const task =
    c >= 0.8 ? 'Hard / high-stakes task'
    : c >= 0.6 ? 'Substantial task'
    : c >= 0.35 ? 'Everyday task'
    : 'Simple task'

  return { picks: picks.slice(0, 3), signals, complexity: c, task }
}

function reason(m: ModelInfo, gap: number, speed: number): string {
  if (gap < -0.2) return `May struggle: task looks harder than ${m.name}'s sweet spot`
  if (gap < -0.05) return `Capable, but slightly stretched by this task`
  if (gap <= 0.15) return speed > 0.2 && m.speed >= 4 ? 'Right level, and fast/cheap as asked' : 'Right capability for this task'
  if (gap <= 0.35) return 'More power than needed; slower and pricier'
  return 'Overkill: you would pay for capability you will not use'
}

export function catalogForPrompt(): string {
  return MODELS.map(
    m =>
      `- ${m.id} (${m.name}): ${m.tagline}. Best for: ${m.bestFor}. ` +
      `Price $${m.price[0]}/$${m.price[1]} per MTok in/out. Intelligence ${m.intelligence}/5, speed ${m.speed}/5.`,
  ).join('\n')
}

/** Reads the JSON the analyser model returns; undefined when it does not fit. */
export function parseAiRanking(text: string): { task: string; picks: ModelPick[] } | undefined {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return undefined
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as {
      task?: unknown
      ranking?: Array<{ id?: unknown; score?: unknown; why?: unknown }>
    }
    if (!Array.isArray(raw.ranking)) return undefined
    const picks: ModelPick[] = []
    for (const r of raw.ranking) {
      if (typeof r.id !== 'string' || !byId(r.id) || picks.some(p => p.id === r.id)) continue
      const score = Math.round(clamp(Number(r.score) || 0, 0, 100))
      picks.push({ id: r.id, score, why: typeof r.why === 'string' ? r.why.slice(0, 140) : '' })
    }
    if (picks.length === 0) return undefined
    picks.sort((a, b) => b.score - a.score)
    return {
      task: typeof raw.task === 'string' ? raw.task.slice(0, 60) : 'Task',
      picks: picks.slice(0, 3),
    }
  } catch {
    return undefined
  }
}
