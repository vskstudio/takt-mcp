# Tools reference

Every tool returns the raw JSON payload from the Takt public API, pretty-printed
as text. On error, the tool returns an MCP error result whose text is
`Takt API error (<status> <code>): <message>`.

## Shared time filter

Most tools accept these optional parameters:

| Parameter | Type   | Description                                                            |
| --------- | ------ | --------------------------------------------------------------------- |
| `period`  | enum   | `day`, `7d`, `30d`, `month`, `6mo`, `12mo` (default `7d`). Ignored when both `from` and `to` are set. |
| `from`    | string | Start date `YYYY-MM-DD` (use with `to`).                              |
| `to`      | string | End date `YYYY-MM-DD` (use with `from`).                              |
| `tz`      | string | IANA timezone for bucketing, e.g. `Europe/Paris`.                    |

---

## `list_sites`

List the sites (domains) in an organization. **Permission:** `sites:read`.

| Parameter | Type   | Required | Description                                  |
| --------- | ------ | -------- | -------------------------------------------- |
| `org`     | string | no       | Org slug. Defaults to `TAKT_ORG` when unset. |

## `get_summary`

Top-line metrics: unique visitors, sessions, pageviews, bounce rate, average
visit duration. **Permission:** `stats:read`.

| Parameter           | Type    | Required | Description                                    |
| ------------------- | ------- | -------- | ---------------------------------------------- |
| `domain`            | string  | yes      | Site domain, e.g. `example.com`.               |
| `compareToPrevious` | boolean | no       | Also return the previous period of equal length. |
| _time filter_       |         | no       | See above.                                     |

## `get_timeseries`

Time series of visitors and pageviews, bucketed by hour or day.
**Permission:** `stats:read`.

| Parameter           | Type    | Required | Description                       |
| ------------------- | ------- | -------- | --------------------------------- |
| `domain`            | string  | yes      | Site domain.                      |
| `interval`          | enum    | no       | `hour` or `day` (default `day`).  |
| `compareToPrevious` | boolean | no       | Also return the previous series.  |
| _time filter_       |         | no       | See above.                        |

## `get_breakdown`

Top values of a dimension. **Permission:** `stats:read`.

| Parameter     | Type   | Required | Description                                                              |
| ------------- | ------ | -------- | ----------------------------------------------------------------------- |
| `domain`      | string | yes      | Site domain.                                                            |
| `dimension`   | enum   | yes      | `pages`, `sources`, `countries`, `regions`, `cities`, `devices`, `browsers`, `os`, `utm_source`, `utm_medium`, `utm_campaign`, `entry_page`, `exit_page`. |
| `country`     | string | no       | Restrict to one country (ISO-3166 alpha-2, e.g. `FR`).                  |
| `limit`       | number | no       | Max rows (default 10).                                                  |
| _time filter_ |        | no       | See above.                                                              |

## `get_realtime`

Visitors active in the last 5 minutes. **Permission:** `stats:read`.

| Parameter | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| `domain`  | string | yes      | Site domain. |

## `get_goals`

Conversions per goal. **Permission:** `stats:read`.

| Parameter     | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| `domain`      | string | yes      | Site domain. |
| _time filter_ |        | no       | See above.   |

## `get_funnels`

Step-by-step funnel reports. **Permission:** `stats:read`.

| Parameter     | Type   | Required | Description  |
| ------------- | ------ | -------- | ------------ |
| `domain`      | string | yes      | Site domain. |
| _time filter_ |        | no       | See above.   |

## `get_revenue`

Revenue grouped by currency for a revenue event. **Permission:** `stats:read`.

| Parameter     | Type   | Required | Description                       |
| ------------- | ------ | -------- | --------------------------------- |
| `domain`      | string | yes      | Site domain.                      |
| `event`       | string | yes      | Revenue event name, e.g. `Purchase`. |
| _time filter_ |        | no       | See above.                        |

## `list_event_properties`

List the custom property keys recorded for a given event.
**Permission:** `stats:read`.

| Parameter     | Type   | Required | Description                   |
| ------------- | ------ | -------- | ----------------------------- |
| `domain`      | string | yes      | Site domain.                  |
| `event`       | string | yes      | Event name, e.g. `Signup`.    |
| _time filter_ |        | no       | See above.                    |

## `get_property_breakdown`

Break down a custom property of an event by value (e.g. counts per plan for a
`Signup` event). **Permission:** `stats:read`.

| Parameter     | Type   | Required | Description                  |
| ------------- | ------ | -------- | ---------------------------- |
| `domain`      | string | yes      | Site domain.                 |
| `event`       | string | yes      | Event name.                  |
| `key`         | string | yes      | Custom property key, e.g. `plan`. |
| _time filter_ |        | no       | See above.                   |
