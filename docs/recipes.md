# Recipes

Example prompts once the server is connected to your agent. The agent picks the
right tool; you just ask in natural language.

## Traffic at a glance

> How many visitors did example.com get in the last 30 days, and how does that
> compare to the previous 30?

Uses `get_summary` with `period: 30d` and `compareToPrevious: true`.

## Top content

> What are the 10 most visited pages on example.com this month?

Uses `get_breakdown` with `dimension: pages`, `period: month`, `limit: 10`.

## Where traffic comes from

> Break down example.com traffic by source for the last 7 days.

Uses `get_breakdown` with `dimension: sources`.

## Audience geography

> Which countries drive the most visits to example.com this year? And within
> France, which regions?

Two `get_breakdown` calls: `dimension: countries`, then `dimension: regions`
with `country: FR`.

## Trend over time

> Plot daily visitors for example.com over the last 6 months.

Uses `get_timeseries` with `period: 6mo`, `interval: day`.

## Conversions and funnels

> How are my goals converting this month? And where do users drop off in the
> signup funnel?

Uses `get_goals` and `get_funnels`.

## Revenue

> What's the revenue from Purchase events on example.com this quarter, by
> currency?

Uses `get_revenue` with `event: Purchase` and a `from`/`to` range.

## Custom event properties

> For the Signup event on example.com, which property keys are recorded, and
> what's the breakdown by plan?

Uses `list_event_properties` then `get_property_breakdown` with `key: plan`.

## Live view

> How many people are on example.com right now?

Uses `get_realtime`.

## Tips

- Set `TAKT_ORG` so the agent can read the `takt://sites` resource and discover
  your site without a tool call.
- Custom date ranges use `from`/`to` (`YYYY-MM-DD`); pass `tz` to bucket in your
  local timezone.
