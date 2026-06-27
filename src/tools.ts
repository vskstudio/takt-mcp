import { z, type ZodRawShape } from 'zod'
import type { TaktClient, Query } from './client.js'
import type { Config } from './config.js'

// Shared time-filter inputs, mirrored from the Takt stats API parameters.
const period = z
  .enum(['day', '7d', '30d', 'month', '6mo', '12mo'])
  .optional()
  .describe('Preset period (default 7d). Ignored when both `from` and `to` are set.')
const from = z.string().optional().describe('Start date YYYY-MM-DD (use with `to` for a custom range).')
const to = z.string().optional().describe('End date YYYY-MM-DD (use with `from`).')
const tz = z.string().optional().describe('IANA timezone for bucketing, e.g. Europe/Paris.')

const timeShape = { period, from, to, tz }

function timeQuery(a: { period?: string; from?: string; to?: string; tz?: string }): Query {
  return { period: a.period, from: a.from, to: a.to, tz: a.tz }
}

export interface ToolDef {
  name: string
  description: string
  shape: ZodRawShape
  run(client: TaktClient, config: Config, args: Record<string, unknown>): Promise<unknown>
}

// Encode a value before splicing it into a URL path segment, so an org/domain
// can never inject extra path components.
const seg = (v: unknown) => encodeURIComponent(String(v))

function orgOf(config: Config, args: { org?: string }): string {
  const org = args.org ?? config.defaultOrg
  if (!org) throw new Error('no organization given: pass `org` or set TAKT_ORG')
  return org
}

export const tools: ToolDef[] = [
  {
    name: 'list_sites',
    description: 'List the sites (domains) in an organization. Requires a key with the sites:read permission.',
    shape: { org: z.string().optional().describe('Org slug. Defaults to TAKT_ORG if set.') },
    run: (client, config, a) => client.get(`/orgs/${seg(orgOf(config, a))}/sites`),
  },
  {
    name: 'get_summary',
    description:
      'Top-line metrics for a site over a period: unique visitors, sessions, pageviews, bounce rate, average visit duration. Set compareToPrevious to also get the previous period figures.',
    shape: {
      domain: z.string().describe('Site domain, e.g. example.com.'),
      ...timeShape,
      compareToPrevious: z.boolean().optional().describe('Also return the previous period of equal length.'),
    },
    run: (client, _config, a) =>
      client.get(`/sites/${seg(a.domain)}/stats/summary`, {
        ...timeQuery(a),
        compare: a.compareToPrevious ? 'previous' : undefined,
      }),
  },
  {
    name: 'get_timeseries',
    description: 'Time series of visitors and pageviews for a site, bucketed by hour or day.',
    shape: {
      domain: z.string().describe('Site domain.'),
      ...timeShape,
      interval: z.enum(['hour', 'day']).optional().describe('Bucket size (default day).'),
      compareToPrevious: z.boolean().optional().describe('Also return the previous period series.'),
    },
    run: (client, _config, a) =>
      client.get(`/sites/${seg(a.domain)}/stats/timeseries`, {
        ...timeQuery(a),
        interval: a.interval as string | undefined,
        compare: a.compareToPrevious ? 'previous' : undefined,
      }),
  },
  {
    name: 'get_breakdown',
    description: 'Top values of a dimension for a site (e.g. top pages, traffic sources, countries, devices, browsers).',
    shape: {
      domain: z.string().describe('Site domain.'),
      dimension: z
        .enum([
          'pages',
          'sources',
          'countries',
          'regions',
          'cities',
          'devices',
          'browsers',
          'os',
          'utm_source',
          'utm_medium',
          'utm_campaign',
          'entry_page',
          'exit_page',
        ])
        .describe('Dimension to rank.'),
      ...timeShape,
      country: z.string().regex(/^[A-Z]{2}$/).optional().describe('Restrict to one country (ISO-3166 alpha-2, e.g. FR).'),
      limit: z.number().int().positive().optional().describe('Max rows (default 10).'),
    },
    run: (client, _config, a) =>
      client.get(`/sites/${seg(a.domain)}/stats/breakdown`, {
        ...timeQuery(a),
        dimension: a.dimension as string,
        country: a.country as string | undefined,
        limit: a.limit as number | undefined,
      }),
  },
  {
    name: 'get_realtime',
    description: 'Number of visitors active on a site in the last 5 minutes.',
    shape: { domain: z.string().describe('Site domain.') },
    run: (client, _config, a) => client.get(`/sites/${seg(a.domain)}/stats/realtime`),
  },
  {
    name: 'get_goals',
    description: 'Conversions per goal for a site. Requires a key with the stats:read permission.',
    shape: { domain: z.string().describe('Site domain.'), ...timeShape },
    run: (client, _config, a) => client.get(`/sites/${seg(a.domain)}/stats/goals`, timeQuery(a)),
  },
  {
    name: 'get_funnels',
    description: 'Funnel reports (step-by-step conversion) for a site. Requires a key with the stats:read permission.',
    shape: { domain: z.string().describe('Site domain.'), ...timeShape },
    run: (client, _config, a) => client.get(`/sites/${seg(a.domain)}/stats/funnels`, timeQuery(a)),
  },
  {
    name: 'get_revenue',
    description: 'Revenue grouped by currency for a given revenue event on a site.',
    shape: {
      domain: z.string().describe('Site domain.'),
      event: z.string().describe('Revenue event name, e.g. Purchase.'),
      ...timeShape,
    },
    run: (client, _config, a) =>
      client.get(`/sites/${seg(a.domain)}/stats/revenue`, { ...timeQuery(a), event: a.event as string }),
  },
  {
    name: 'list_event_properties',
    description: 'List the custom property keys recorded for a given event on a site.',
    shape: {
      domain: z.string().describe('Site domain.'),
      event: z.string().describe('Event name, e.g. Signup.'),
      ...timeShape,
    },
    run: (client, _config, a) =>
      client.get(`/sites/${seg(a.domain)}/stats/properties`, { ...timeQuery(a), event: a.event as string }),
  },
  {
    name: 'get_property_breakdown',
    description: 'Break down a custom property of an event by value (e.g. counts per plan for a Signup event).',
    shape: {
      domain: z.string().describe('Site domain.'),
      event: z.string().describe('Event name.'),
      key: z.string().describe('Custom property key, e.g. plan.'),
      ...timeShape,
    },
    run: (client, _config, a) =>
      client.get(`/sites/${seg(a.domain)}/stats/property-breakdown`, {
        ...timeQuery(a),
        event: a.event as string,
        key: a.key as string,
      }),
  },
]
