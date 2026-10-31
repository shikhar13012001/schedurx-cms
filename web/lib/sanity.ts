import {createClient} from '@sanity/client'
import {siteQuery} from './site-query'

export const projectId = process.env.SANITY_PROJECT_ID ?? ''
export const dataset = process.env.SANITY_DATASET ?? 'production'

// Published content only, so nothing unfinished can reach this site. The dataset is
// private, so even that needs the read-only token, which stays on the server.
export const sanity = projectId ? createClient({projectId, dataset, apiVersion: '2026-02-01', useCdn: true, perspective: 'published', token: process.env.SANITY_READ_TOKEN}) : null

// Only a Live site can be opened by the public.
export const SITE_QUERY = siteQuery('slug.current == $slug && status == "live"')
