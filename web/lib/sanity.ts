import {createClient} from '@sanity/client'

export const projectId = process.env.SANITY_PROJECT_ID ?? ''
export const dataset = process.env.SANITY_DATASET ?? 'production'

// Published content only, read with no token: nothing unfinished can reach this site.
export const sanity = projectId ? createClient({projectId, dataset, apiVersion: '2026-02-01', useCdn: true, perspective: 'published'}) : null

// One clinic's website, by its address. Only a Live site is returned, testimonials
// need recorded permission, and articles need approval.
export const SITE_QUERY = `*[_type == "websiteSettings" && slug.current == $slug && status == "live"][0]{
  ...,
  clinic->,
  "doctors": *[_type == "doctor" && clinic._ref == ^.clinic._ref] | order(fullName asc),
  "services": *[_type == "service" && clinic._ref == ^.clinic._ref] | order(name asc),
  "locations": *[_type == "location" && clinic._ref == ^.clinic._ref] | order(name asc),
  "faqs": *[_type == "faq" && clinic._ref == ^.clinic._ref] | order(_createdAt asc),
  "testimonials": *[_type == "testimonial" && clinic._ref == ^.clinic._ref && status == "approved" && consent.confirmed == true] | order(_createdAt desc),
  "articles": *[_type == "article" && clinic._ref == ^.clinic._ref && approved == true] | order(publishedAt desc){..., "authorName": author->fullName}
}`
