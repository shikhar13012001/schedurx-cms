// Everything one clinic's site needs. The public site and the Studio preview both use
// it. Testimonials need recorded permission, and articles need approval.
export const siteQuery = (filter: string) => `*[_type == "websiteSettings" && ${filter}][0]{
  ...,
  clinic->,
  "doctors": *[_type == "doctor" && clinic._ref == ^.clinic._ref] | order(fullName asc),
  "services": *[_type == "service" && clinic._ref == ^.clinic._ref] | order(name asc),
  "locations": *[_type == "location" && clinic._ref == ^.clinic._ref] | order(name asc),
  "faqs": *[_type == "faq" && clinic._ref == ^.clinic._ref] | order(_createdAt asc),
  "testimonials": *[_type == "testimonial" && clinic._ref == ^.clinic._ref && status == "approved" && consent.confirmed == true] | order(_createdAt desc),
  "articles": *[_type == "article" && clinic._ref == ^.clinic._ref && approved == true] | order(publishedAt desc){..., "authorName": author->fullName}
}`
