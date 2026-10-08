import { expect, test } from 'claude-code/testing'

import { parseAiRanking, scorePrompt } from '../hooks/models'

const BAND = {
  plugin: 'model-picker',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 12,
    bodyColumns: 100,
    scroll: { offset: 0, bodyRows: 11 },
    view: {},
  },
} as const

const PANE = {
  plugin: 'model-picker',
  component: 'Pane',
  requestId: 'model-picker',
  props: {
    title: 'Claude models',
    isFocused: true,
    bodyColumns: 80,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

test('simple prompts rank Haiku first', async () => {
  const r = scorePrompt('fix the typo in the README title')
  expect(r.picks[0]?.id).toBe('claude-haiku-5-5')
  expect(r.picks).toHaveLength(3)
})

test('hard architecture prompts rank Fable or Opus first', async () => {
  const r = scorePrompt(
    'Design the architecture for a distributed job scheduler, analyse the trade-offs of leader election ' +
      'versus a consensus log, and find the race condition in our current implementation. Be thorough.',
  )
  expect(['claude-fable-5-1', 'claude-opus-5-5']).toContain(r.picks[0]?.id)
  expect(r.picks.map(p => p.id)).not.toContain('claude-haiku-5-5')
})

test('everyday coding prompts favour Sonnet or Opus', async () => {
  const r = scorePrompt('Write a python function that parses this CSV and add unit tests for it')
  expect(['claude-sonnet-5-5', 'claude-opus-5-5']).toContain(r.picks[0]?.id)
})

test('AI ranking parser keeps known ids, sorted, top 3', async () => {
  const r = parseAiRanking(
    'Sure: {"task":"Rename a variable","ranking":[{"id":"claude-opus-5-5","score":40,"why":"overkill"},' +
      '{"id":"claude-haiku-5-5","score":95,"why":"trivial"},{"id":"gpt","score":99},' +
      '{"id":"claude-sonnet-5-5","score":70,"why":"fine"},{"id":"claude-fable-5-1","score":10,"why":"x"}]}',
  )
  expect(r?.picks.map(p => p.id)).toEqual(['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5'])
  expect(parseAiRanking('no json here')).toBeUndefined()
})

test('Suggest ranks the drafted prompt in the band and the pane', async ($, on) => {
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('prompt.read', () => ({ value: { text: 'quickly rename variable foo to bar', cursor: 0 } }))
  on('model.complete', () => ({ value: {
    isAnswered: true,
    text: '{"task":"Trivial rename","ranking":[{"id":"claude-haiku-5-5","score":96,"why":"Trivial edit"},{"id":"claude-sonnet-5-5","score":72,"why":"Fine but slower"},{"id":"claude-opus-5-5","score":45,"why":"Overkill"}]}',
    usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
  } }))

  for (const surface of ['terminal', 'desktop'] as const) {
    const band = await $.ui.mount({ ...BAND, surface })
    expect(await band.find({ key: 'suggest' })).toBeDefined()
    await band.press({ key: 'suggest' })
    expect(await band.find({ key: 'pick-claude-haiku-5-5' })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /96%/ })).toBeDefined()
    expect(await band.find({ type: 'Text', text: /AI-ranked/ })).toBeDefined()
    // Opus is the session's model, so it reads "in use" rather than offering Use.
    expect(await band.find({ key: 'use-claude-opus-5-5' })).toBeUndefined()

    const pane = await $.ui.mount({ ...PANE, surface })
    expect(await pane.find({ key: 'card-claude-fable-5-1' })).toBeDefined()
    expect(await pane.find({ key: 'card-use-claude-sonnet-5-5' })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: /96% fit/ })).toBeDefined()

    await band.press({ key: 'clear' })
    expect(await band.find({ key: 'pick-claude-haiku-5-5' })).toBeUndefined()
    await pane.unmount()
    await band.unmount()
  }
})

test('Auto button turns automatic model choice on and off', async ($, on) => {
  on('session.model', () => ({ value: 'claude-sonnet-5-5' }))

  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await band.find({ key: 'auto', type: 'Button', text: /Auto: OFF/ })).toBeDefined()
  await band.press({ key: 'auto' })
  expect(await band.find({ key: 'auto', type: 'Button', text: /Auto: ON/ })).toBeDefined()
  await band.press({ key: 'auto' })
  expect(await band.find({ key: 'auto', type: 'Button', text: /Auto: OFF/ })).toBeDefined()
  await band.unmount()
})
