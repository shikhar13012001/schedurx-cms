import {renderSite} from '../../lib/campaign/render'
import {practiceFromSanity} from '../../lib/practice-from-sanity'
import {dataset, projectId, sanity, SITE_QUERY} from '../../lib/sanity'

const notFound = () => new Response('Not found', {status: 404, headers: {'Content-Type': 'text/plain; charset=utf-8'}})

export async function GET(request: Request, context: {params: Promise<{slug: string}>}) {
  if (!sanity) return notFound()
  const {slug} = await context.params
  const site = await sanity.fetch(SITE_QUERY, {slug})
  if (!site?.clinic) return notFound()

  const practice = practiceFromSanity(site, {projectId, dataset, whatsappNumber: process.env.SCHEDURX_WHATSAPP_NUMBER})
  const html = renderSite(practice, new URL(request.url).origin, {indexable: site.seo?.noIndex !== true})
  // A published edit shows up within about a minute, without redeploying.
  return new Response(html, {headers: {'Content-Type': 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'}})
}
