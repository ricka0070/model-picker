# Model Picker for Claude Code

Pick the right Claude model without leaving the prompt. Model Picker adds a colour-coded band above
the prompt box that shows the active model, a **Suggest** button that ranks the top 3 models for the
prompt you have typed, an **Auto** mode that routes every prompt you send to the best-suited model, and a
**Models Team Plan** that previews how a team of models would split a bigger task.

<!-- Add a screenshot: docs/band.png -->

## Features

- **Active model badge.** The model in use, as a coloured badge: ✦ Fable 5.1 (purple),
  ◆ Opus 5.5 (orange), ● Sonnet 5.5 (blue), ▲ Haiku 5.5 (green).
- **Suggest** (`s`). Reads the prompt you have typed but not sent and ranks the top 3 models with a
  suitability score, a reason and a **Use** button (`1`–`3`). An instant offline estimate appears first;
  a quick Haiku 5.5 analysis then refines it.
- **Auto** (`a`). When on, each prompt you send (Enter or the Send button) is ranked first and answered
  by the top model. The band shows the choice; a toast says which model and its score.
- **Models Team Plan** (`p`, or `/models-team-plan`). Splits the prompt you have typed into steps and
  assigns each step a model, with an estimated cost per step. You choose which model writes the plan.
  It only plans: nothing runs.
- **Models panel** (`m`, or `/pick-model`). One card per model: what it is best for, example tasks,
  ratings for smarts and speed, cost tier, price per million tokens and context window.
- **Commands.** `/pick-model`, `/suggest-model <prompt>`, `/auto-model [on|off]`, `/models-team-plan`.

## Install

In a Claude Code terminal session:

```
/plugin install model-picker --marketplace ricka0070/model-picker
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).
The band appears above the prompt straight away. A plugin installed from a terminal at the user scope
also loads in the Claude desktop app's Code tab.

Requires a Claude Code build with function-hook plugins (built and tested on 2.1.293). That plugin API
is in early access and may change between releases.

## How Auto works

1. You send a prompt with Auto on.
2. The prompt is ranked: an offline keyword-and-length estimate, then a Haiku 5.5 analysis (low effort,
   8-second limit). If the analysis fails, the estimate is used.
3. The top model answers that prompt. Auto names it on the turn's own requests, so your session's model
   setting is unchanged; the band's **Active** badge shows what Auto picked.

Things worth knowing:

- **A model you pick yourself wins once.** After `/model` or a **Use** button, the next prompt goes to your
  pick; Auto resumes after that.
- **Only prompts you send are routed.** Notifications, scheduled tasks, other sessions and other plugins
  are left alone.
- **Auto is off by default** and remembers your choice across sessions.

## Does Auto really change the model?

Yes. Claude Code records which model wrote every reply in the session's transcript, the `.jsonl` file
under `~/.claude/projects/`, as the `model` field of each assistant row. In testing, the reply to
"What is 17 × 24?" was recorded as `claude-haiku-5-5`, while the replies just before and after it were
`claude-sonnet-5-5`: Auto sent that one prompt to Haiku and the next went back to the session's model.

To check it yourself, print the model of each reply in a transcript with Node:

```
node -e "for (const l of require('fs').readFileSync(process.argv[1],'utf8').split('\n')) { try { const d = JSON.parse(l); if (d.type === 'assistant') console.log(d.message.model) } catch {} }" path/to/session.jsonl
```

## Why Claude Code's own model label doesn't change

The model name in Claude Code's status bar shows the session's model setting, and Auto leaves that
setting alone on purpose:

- **Claude Code refuses `/model` from inside the hook a prompt waits on.** That is how Auto would have to
  change the setting before the prompt is answered; the first version tried it and failed.
- **Changing it after each answer would lag.** The label would always show the previous prompt's model.
- **It would throw away the cached conversation.** Each change of the session's model discards the prompt
  cache, which costs more on every switch.
- **It would fight with your own picks.** A model you choose with `/model` would keep being overwritten.

So the band's **Active** badge is the place to look. The transcript (above) confirms what actually ran.

## Models Team Plan

Press **Models Team Plan** (`p`) or run `/models-team-plan`, choose the planner model, then press
**Plan my prompt**. The planner reads the prompt you have typed and returns:

- 2–6 steps, each with the model it would use, why, and an estimated cost from the planner's own token
  guess at list prices;
- a team estimate beside "all on Opus" and "all on Sonnet", so you can see whether splitting saves money;
- one line of advice on whether splitting is worth it for this task;
- what the plan itself cost, from the planner call's reported token usage.

**Add plan to my prompt** appends the plan to your draft so you can send it as instructions. The planner
never runs the steps. For small and medium prompts one model is usually cheaper and just as good;
splitting pays off on big jobs with clearly separate parts.

## Privacy and cost

Suggest, Auto and the Planner send the text of your prompt (up to its first 8,000 characters) to a Claude
model through your own Claude Code account. Nothing goes anywhere else. On a subscription plan these calls
count toward your usage. With Auto off and Suggest and the Planner unused, the mod makes no model calls.

Rough costs at Anthropic's list prices (the author's estimates from typical token counts):

| What | Model | Rough cost |
| --- | --- | --- |
| One **Suggest** press | Haiku 5.5 | about $0.0003 |
| **Auto**, per prompt you send | Haiku 5.5 | about $0.0003 (the same analysis as Suggest) |
| One team plan | Haiku 5.5 | about $0.001 |
| One team plan | Sonnet 5.5 | about $0.02 |
| One team plan | Opus 5.5 | about $0.04 |

The plan costs cover writing the plan only; running its steps would cost more. Separately, a conversation
that switches models between prompts cannot reuse the previous model's prompt cache, so it can cost a
little more than staying on one model.

## The models

| Model | Best for | Price in / out per MTok | Smarts | Speed |
| --- | --- | --- | --- | --- |
| ✦ Fable 5.1 | Hard, ambiguous, high-stakes problems; long autonomous work | $10 / $50 | 5/5 | 1/5 |
| ◆ Opus 5.5 | Serious coding and agentic tasks, complex analysis | $4 / $20 | 4/5 | 3/5 |
| ● Sonnet 5.5 | Everyday development, docs, chat, data wrangling | $2 / $10 | 3/5 | 4/5 |
| ▲ Haiku 5.5 | Simple, well-defined, fast or bulk tasks | $0.10 / $0.50 | 2/5 | 5/5 |

Prices are Anthropic's first-party API rates as of October 2026. The smarts and speed ratings are the
author's rough guide, not official benchmarks. Edit `hooks/models.ts` to change the catalogue, colours or
scoring.

## Known limitations

- Buttons use Claude Code's own primary/secondary styles; a mod cannot colour a button, so Suggest is
  black or white depending on your theme.
- Auto adds a short wait before each prompt while the analysis runs (usually a second or two, at most 8).
- The Planner's step costs are the planner model's guesses, not measurements.
- Auto has been tested in the Claude desktop app's Code tab; terminal sessions use the same hooks.

## Development

```
claude plugin validate .
claude plugin test .
```

Run it from a working copy without installing: `claude --plugin-dir /path/to/model-picker`.

## License

MIT. See [LICENSE](LICENSE).
