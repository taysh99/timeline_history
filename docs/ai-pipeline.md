# AI Content Pipeline (Safe-by-Design)

This repo treats *history content as a governed dataset*, not free-form text.

## Goals
- AI helps **draft** and **normalize** content.
- Humans approve before content ships.
- Every item has **sources** and **grade/topic tags**.

## Roles
- **Content Editor**: owns correctness and citations.
- **Reviewer**: checks neutrality, grade-appropriateness, and timeline alignment.
- **Engineer**: maintains schema + validation scripts.

## Workflow (recommended)
1) **Plan** (human): define an item frame
   - country, type, name, startYear, endYear, target grades, topics, required sources

2) **Draft** (AI): generate `summary` + `content.events/figures/achievements`
   - Must be neutral, short, and consistent with sources
   - Output must be JSON only (no extra text)

3) **Review** (human):
   - Check dates, names, neutrality
   - Attach `sourceIds` from `data/sources/sources.json`
   - If overlap is intentional, set `overlapAllowed=true` and add `notes`

4) **Validate** (script):
   - `node scripts/validate-data.js`
   - Fix issues until pass

5) **Merge**:
   - Commit dataset changes, PR review, then release

## Prompt template (copy/paste)
You are helping draft a history dataset item.
Constraints:
- Output JSON only, matching this shape: {summary, content:{events[], figures[], achievements[]}}
- Max summary 120 words, neutral tone, for grade tags: <GRADES>
- Do not invent facts. If uncertain, write "TODO: verify" in detail.
- Respect the year range: <START>-<END>.
Input frame:
- Country: <COUNTRY>
- Type: <TYPE>
- Name: <NAME>
- Topics: <TOPICS>
- Sources (human will cite): <SOURCE_IDS>

## Red flags checklist (reviewer)
- Uncited claims or precise numbers without source
- Political framing or modern value judgments
- Mixing different eras into one period
- Dates not matching the period range
