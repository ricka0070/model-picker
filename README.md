# Model Picker for Claude Code

Pick the right Claude model without leaving the prompt. Model Picker adds a colour-coded band above
the prompt box that shows the active model, a **Suggest** button that ranks the top 3 models for the
prompt you have typed, and an **Auto** mode that routes every prompt you send to the best-suited model.

<!-- Add a screenshot: docs/band.png -->

## Features

- **Active model badge.** The model in use, as a coloured badge: ✦ Fable 5.1 (purple),
  ◆ Opus 5.5 (orange), ● Sonnet 5.5 (blue), ▲ Haiku 5.5 (green).
- **Suggest** (`s`). Reads the prompt you have typed but not sent and ranks the top 3 models with a
  suitability score, a reason and a **Use** button (`1`–`3`). An instant offline estimate appears first;
  a quick Haiku 5.5 analysis then refines it.
- **Auto** (`a`). When on, each prompt you send (Enter or the Send button) is ranked first and answered
  by the top model. The band shows the choice; a toast says which model and its score.
- **Models panel** (`m`, or `/pick-model`). One card per model: what it is best for, example tasks,
  ratings for smarts and speed, cost tier, price per million tokens and context window.
- **Commands.** `/pick-model`, `/suggest-model <prompt>`, `/auto-model [on|off]`.

## Install

In a Claude Code terminal session:

```
/plugin install model-picker --marketplace RZZZR01/model-picker
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
- **The status bar keeps showing the session's model.** Claude Code's own model label does not follow
  Auto; the band's badge does.
- **Switching models between prompts** means the new model cannot reuse the previous one's prompt cache,
  so a mixed conversation can cost a little more than staying on one model.
- **Auto is off by default** and remembers your choice across sessions.

## Privacy and cost

Suggest and Auto send the text of your prompt (up to its first 8,000 characters) to Claude Haiku 5.5
through your own Claude Code account, to rank it. Nothing goes anywhere else. Each analysis is a few
hundred to a few thousand tokens on Haiku 5.5, a fraction of a cent at API rates; on a subscription plan
it counts toward your usage. With Auto off and Suggest unused, the mod makes no model calls.

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

## Development

```
claude plugin validate .
claude plugin test .
```

Run it from a working copy without installing: `claude --plugin-dir /path/to/model-picker`.

## License

MIT. See [LICENSE](LICENSE).
