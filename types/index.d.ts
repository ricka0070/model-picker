export type ModelPick = { id: string; score: number; why: string }

export type Suggestion = {
  picks: ModelPick[]
  task: string
  source: 'ai' | 'heuristic'
  signals: string[]
}

/** The model Auto picked for the last prompt the person sent. */
export type RoutedModel = { id: string; score: number; task: string }

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
    }
  }
}
