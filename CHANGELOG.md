# Changelog

All notable changes to Model Picker. Versions follow `.claude-plugin/plugin.json`.

## 1.1.2 — 2026-10-14

A tidier band and a Models panel you can read in full.

### Band above the prompt

- **Smaller Active badge.** The active model is a compact coloured label framed by thin bars, with a
  little padding inside each edge (`▐  ◆ Opus 5.5  ▌`), so the model name no longer touches the frame.
  It stays visually separate from the buttons beside it and takes a single row.
- **Ranked rows stay on one line.** Each of the top 3 suggestions shows its rank, model, score bar,
  percentage and **Use** button on a single row. The reason is shortened with `…` when it doesn't fit;
  the full reason is in the Models panel.

### Models panel (`m`)

- **New "Model picking reasoning" heading** above the ranked suggestions.
- **Reasons are readable in full.** Each suggestion shows its rank, model, bar and score on one line and
  the complete reason wrapped underneath, instead of cutting it off.
- **New "Models guide" heading** with a divider line, separating the ranking from the model cards.

## 1.1.1 — 2026-10-14

- **Removed the "last auto pick" line and the suggestion summary from the band.** They were nearly always
  cut off and pushed the Active badge out of view. The Active badge already shows what Auto picked, and
  the × button still clears a suggestion.

## 1.1.0 — 2026-10-10 to 2026-10-13

- **Models Team Plan** (`p`, or `/models-team-plan`). Choose Haiku, Sonnet or Opus to split your drafted
  prompt into 2–6 steps, each with a model, a reason and an estimated cost, plus a team estimate beside
  "all on Opus" and "all on Sonnet". It is a preview only: nothing runs. **Add plan to my prompt** appends
  the plan to your draft. (First released as "Project Team Planner" and renamed on 2026-10-13.)
- **README:** how to check from the session transcript that Auto really changes the model, why Claude
  Code's own model label is left alone, and rough costs per Suggest press, per Auto prompt and per plan.
- Author set to Ricard Falendys in the manifest and marketplace.

## 1.0.0 — 2026-10-08

First release.

- Colour-coded band above the prompt with the **Active** model badge: ✦ Fable 5.1, ◆ Opus 5.5,
  ● Sonnet 5.5, ▲ Haiku 5.5.
- **Suggest** (`s`) ranks the top 3 models for the prompt you have typed: an instant offline estimate,
  then a Haiku 5.5 analysis, each pick with a score, a reason and a **Use** button (`1`–`3`).
- **Auto** (`a`) routes each prompt you send to the top-ranked model for that turn, without changing the
  session's model setting. Off by default; remembered across sessions.
- **Models panel** (`m`, or `/pick-model`) with one card per model: best uses, example tasks, smarts and
  speed ratings, cost tier, price per million tokens and context window.
- Commands: `/pick-model`, `/suggest-model <prompt>`, `/auto-model [on|off]`.
