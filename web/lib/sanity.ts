import {createClient} from '@sanity/client'
import {siteQuery} from './site-query'

export const projectId = process.env.SANITY_PROJECT_ID ?? ''
export const dataset = process.env.SANITY_DATASET ?? 'production'

// Published content only, read with no token: nothing unfinished can reach this site.
export const sanity = projectId ? createClient({projectId, dataset, apiVersion: '2026-02-01', useCdn: true, perspective: 'published'}) : null

// Only a Live site can be opened by the public.
export const SITE_QUERY = siteQuery('slug.current == $slug && status == "live"')
