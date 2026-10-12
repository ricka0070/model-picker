export type ModelPick = { id: string; score: number; why: string }

export type Suggestion = {
  picks: ModelPick[]
  task: string
  source: 'ai' | 'heuristic'
  signals: string[]
}

/** The model Auto picked for the last prompt the person sent. */
export type RoutedModel = { id: string; score: number; task: string }

/** One step of a team plan: what it does, the model it is assigned, and the planner's token guess. */
export type PlanStep = { title: string; model: string; why: string; inputTokens: number; outputTokens: number }

/** A Models Team Plan result. A preview only: nothing is run. */
export type TeamPlan = {
  planner: string
  summary: string
  advice: string
  steps: PlanStep[]
  /** What the plan call itself cost, from its reported token usage at list prices. */
  planCostUsd: number
}

declare module 'claude-code' {
  interface PluginState {
    'model-picker': {
      suggestion: Suggestion | null
      busy: boolean
      tick: number
      /** Auto: route each prompt the person sends. Kept across sessions in the store. */
      auto: boolean
      /** A model the person picked is set; the next prompt is sent as chosen. */
      skipNext: boolean
      routed: RoutedModel | null
      /** The model Auto chose for the turn now running; `turn.step` applies it to that turn's requests. */
      override: string | null
      /** The model chosen to write team plans. */
      planner: string
      teamPlan: TeamPlan | null
      planBusy: boolean
      planError: string | null
    }
  }
}
