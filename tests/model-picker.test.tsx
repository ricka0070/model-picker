import { expect, test } from 'claude-code/testing'

import { MODELS, formatUsd, parseAiRanking, parsePlan, scorePrompt, usd } from '../hooks/models'

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

test('plan parser keeps valid steps and costs follow list prices', async () => {
  const plan = parsePlan(
    'Here: {"summary":"Build and check a sign-up endpoint","advice":"Worth splitting.","steps":[' +
      '{"title":"Design the endpoint","model":"claude-opus-5-5","why":"Needs judgment","inputTokens":2000,"outputTokens":1000},' +
      '{"title":"Bogus","model":"gpt-x","why":"skip me","inputTokens":1,"outputTokens":1},' +
      '{"title":"Write tests","model":"claude-haiku-5-5","why":"Routine","inputTokens":-5,"outputTokens":"300"}]}',
  )
  expect(plan?.steps.map(s => s.model)).toEqual(['claude-opus-5-5', 'claude-haiku-5-5'])
  expect(plan?.steps[1]?.inputTokens).toBe(0)
  expect(plan?.steps[1]?.outputTokens).toBe(300)
  expect(parsePlan('not json')).toBeUndefined()

  const opus = MODELS.find(m => m.id === 'claude-opus-5-5')
  if (!opus) throw new Error('no opus')
  expect(usd(1_000_000, 0, opus)).toBe(4)
  expect(formatUsd(0.014)).toBe('$0.014')
  expect(formatUsd(0.0002)).toBe('<$0.001')
})

const PLANNER_PANE = { ...PANE, requestId: 'models-team-plan', props: { ...PANE.props, title: 'Models Team Plan' } }

test('Models Team Plan plans the drafted prompt with the chosen model', async ($, on) => {
  const asked: string[] = []
  on('prompt.read', () => ({ value: { text: 'Build a sign-up endpoint with tests', cursor: 0 } }))
  on('model.complete', (_$, e) => {
    asked.push(e.model)
    return {
      value: {
        isAnswered: true,
        text:
          '{"summary":"Design, build and test sign-up","advice":"Splitting saves a little.","steps":[' +
          '{"title":"Design the API","model":"claude-opus-5-5","why":"Judgment calls","inputTokens":2000,"outputTokens":1000},' +
          '{"title":"Write unit tests","model":"claude-haiku-5-5","why":"Routine","inputTokens":1500,"outputTokens":800}]}',
        usage: { input_tokens: 1000, output_tokens: 500, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      },
    }
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    const pane = await $.ui.mount({ ...PLANNER_PANE, surface })
    expect(await pane.find({ key: 'planner-claude-haiku-5-5', type: 'Button', text: /about \$0\.001/ })).toBeDefined()
    expect(await pane.find({ key: 'planner-claude-sonnet-5-5', type: 'Button', text: /about \$0\.02/ })).toBeDefined()
    expect(await pane.find({ key: 'planner-claude-opus-5-5', type: 'Button', text: /about \$0\.04/ })).toBeDefined()

    await pane.press({ key: 'planner-claude-opus-5-5' })
    await pane.press({ key: 'make-plan' })
    expect(asked.at(-1)).toBe('claude-opus-5-5')
    expect(await pane.find({ key: 'step-0' })).toBeDefined()
    expect(await pane.find({ key: 'step-1' })).toBeDefined()
    expect(await pane.find({ type: 'Text', text: /Team estimate/ })).toBeDefined()
    // 1000 input + 500 output tokens on Opus 5.5 at $4 / $20 per million.
    expect(await pane.find({ type: 'Text', text: /This plan cost \$0\.014 on Opus 5\.5/ })).toBeDefined()
    expect(await pane.find({ key: 'copy-plan' })).toBeDefined()
    await pane.unmount()
  }
})
