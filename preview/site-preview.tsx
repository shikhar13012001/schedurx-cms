import {useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {launchIssues, portraitPrompt} from '../web/lib/campaign/model'
import {renderSite} from '../web/lib/campaign/render'
import {practiceFromSanity} from '../web/lib/practice-from-sanity'
import {siteQuery} from '../web/lib/site-query'

const WIDTHS = [
  {label: 'Desktop', width: '100%'},
  {label: 'Tablet', width: '820px'},
  {label: 'Phone 430', width: '430px'},
  {label: 'Phone 412', width: '412px'},
  {label: 'Phone 390', width: '390px'},
  {label: 'Phone 360', width: '360px'},
]
const QUERY = siteQuery('_id in [$id, "drafts." + $id]')

const button = {padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6, background: 'transparent', color: 'inherit', cursor: 'pointer', font: 'inherit'}

// The site as it stands, drafts included, read with the editor's own login. It renders
// with the same code as the public site, so what's here is what patients would get.
export function SitePreview({documentId}: {documentId: string}) {
  const client = useClient({apiVersion: '2026-02-01'})
  const [site, setSite] = useState<any>(null)
  const [problem, setProblem] = useState('')
  const [width, setWidth] = useState('100%')
  const [copied, setCopied] = useState(false)
  const id = documentId.replace(/^drafts\./, '')
  const {projectId, dataset} = client.config()

  useEffect(() => {
    const drafts = client.withConfig({perspective: 'drafts'})
    const load = () =>
      drafts
        .fetch(QUERY, {id})
        .then((result) => {
          setSite(result)
          setProblem('')
        })
        .catch(() => setProblem('Couldn’t load the preview. Check your connection and try again.'))
    load()
    // Any change in this dataset can affect the page, such as a doctor or FAQ edit.
    const subscription = drafts.listen('*[_type in ["websiteSettings", "clinic", "doctor", "service", "location", "faq", "testimonial", "article"]]', {}, {events: ['mutation'], includeResult: false, visibility: 'query'}).subscribe(() => load())
    return () => subscription.unsubscribe()
  }, [client, id])

  const practice = useMemo(() => {
    if (!site?.clinic) return null
    return practiceFromSanity(site, {projectId: projectId ?? '', dataset: dataset ?? '', bookingBaseUrl: process.env.SANITY_STUDIO_BOOKING_BASE_URL, whatsappNumber: process.env.SANITY_STUDIO_WHATSAPP_NUMBER})
  }, [site, projectId, dataset])
  const html = useMemo(() => (practice ? renderSite(practice, window.location.origin, {preview: true}) : ''), [practice])

  if (problem) return <p style={{padding: 24}}>{problem}</p>
  if (!site) return <p style={{padding: 24}}>Loading the preview…</p>
  if (!practice) return <p style={{padding: 24}}>Choose a clinic to see the preview.</p>

  const issues = launchIssues(practice)

  function download() {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([html], {type: 'text/html'}))
    link.download = `${practice?.identity.slug || 'clinic'}.html`
    link.click()
    URL.revokeObjectURL(link.href)
  }
  async function copyPrompt() {
    await navigator.clipboard.writeText(portraitPrompt(practice!))
    setCopied(true)
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, padding: 10}}>
        {WIDTHS.map((option) => (
          <button key={option.label} type="button" aria-pressed={width === option.width} onClick={() => setWidth(option.width)} style={{...button, fontWeight: width === option.width ? 600 : 400}}>
            {option.label}
          </button>
        ))}
        <button type="button" onClick={download} style={button}>Download HTML</button>
        <button type="button" onClick={copyPrompt} style={button}>{copied ? 'Portrait prompt copied' : 'Copy portrait prompt'}</button>
      </div>
      {issues.length > 0 && (
        <details style={{padding: '0 12px 10px'}}>
          <summary style={{cursor: 'pointer'}}>{issues.length} to finish before launch</summary>
          <ul>
            {issues.map(([where, what]) => (
              <li key={what}>{where}: {what}</li>
            ))}
          </ul>
        </details>
      )}
      <div style={{flex: 1, minHeight: 500, display: 'flex', justifyContent: 'center', background: '#8881'}}>
        <iframe title="Website preview" srcDoc={html} sandbox="allow-scripts" style={{width, height: '100%', border: 0, background: '#fff'}} />
      </div>
    </div>
  )
}
