import {blankPractice, type Practice} from './campaign/model'

// Turns Sanity documents into the Practice object the campaign renderer reads. The
// renderer stays unchanged: every field it needs is listed here, and this is the only
// place that knows how the two line up.

type Doc = Record<string, any>
export type SiteDocs = Doc & {clinic: Doc; doctors: Doc[]; services: Doc[]; locations: Doc[]; faqs: Doc[]; testimonials: Doc[]; articles: Doc[]}
export type SiteEnv = {projectId: string; dataset: string; whatsappNumber?: string}

const DAYS: Record<string, string> = {Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'}
const text = (value: unknown) => (value === null || value === undefined ? '' : String(value))
const joined = (values: unknown[] | undefined) => (values ?? []).filter(Boolean).join(', ')
const ids = (refs: Doc[] | undefined) => (refs ?? []).map((ref) => ref._ref).join(',')

export function plainText(blocks: unknown): string {
  if (typeof blocks === 'string') return blocks
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter((block) => block?._type === 'block')
    .map((block) => (block.children ?? []).map((child: Doc) => child.text ?? '').join(''))
    .join('\n\n')
}

export function imageUrl(image: Doc | undefined, env: SiteEnv, width = 1400): string {
  const ref: string | undefined = image?.asset?._ref
  const match = ref?.match(/^image-([a-zA-Z0-9]+-\d+x\d+)-(\w+)$/)
  if (!match) return ''
  return `https://cdn.sanity.io/images/${env.projectId}/${env.dataset}/${match[1]}.${match[2]}?w=${width}&auto=format`
}

// Dashboard data keeps opening hours on the clinic: a location is built from that
// when nobody has written one in Sanity yet.
function locationFromClinic(clinic: Doc) {
  const open = clinic.workingDays as string[] | undefined
  const pad = (hour: unknown) => `${String(hour).padStart(2, '0')}:00`
  const hasHours = Array.isArray(open) && open.length > 0 && clinic.openingHour != null && clinic.closingHour != null
  return {
    id: 'clinic-profile',
    name: clinic.name,
    status: 'Primary clinic',
    address: [clinic.addressLine1, clinic.addressLine2].filter(Boolean).join(', '),
    locality: text(clinic.locality),
    city: text(clinic.city),
    state: text(clinic.state),
    postcode: text(clinic.pincode),
    country: 'India',
    landmark: text(clinic.landmark),
    mapsUrl: text(clinic.mapsUrl),
    phone: text(clinic.phone),
    payments: joined(clinic.paymentMethods),
    parking: joined((clinic.facilities ?? []).filter((f: string) => /parking/i.test(f))),
    wheelchair: joined((clinic.facilities ?? []).filter((f: string) => /wheelchair/i.test(f))),
    doctorIds: '',
    timezone: 'Asia/Kolkata',
    hours: hasHours
      ? Object.entries(DAYS).map(([short, day]) => {
          const isOpen = open!.includes(short)
          return {day, closed: !isOpen, slots: isOpen ? [{start: pad(clinic.openingHour), end: pad(clinic.closingHour)}] : []}
        })
      : [],
  }
}

function mapLocation(doc: Doc) {
  const {_id, _type, _rev, _createdAt, _updatedAt, clinic, doctors, ...fields} = doc
  return {
    ...fields,
    id: _id,
    doctorIds: ids(doctors),
    hours: (doc.hours ?? []).map((h: Doc) => ({day: h.day, closed: Boolean(h.closed), slots: (h.slots ?? []).map((t: Doc) => ({start: t.start, end: t.end}))})),
  }
}

function mapDoctor(doc: Doc, clinic: Doc) {
  const registration = doc.registrations?.[0] ?? {}
  const degrees = (doc.qualifications ?? []).map((q: Doc) => q.degree).filter(Boolean)
  return {
    id: doc._id,
    title: doc.title ?? '',
    name: String(doc.fullName ?? '').replace(doc.title ? /^dr\.?\s+/i : /$^/, ''),
    shortName: text(doc.shortName),
    pronouns: text(doc.pronouns),
    specialty: text(doc.specialty ?? clinic.specialty),
    qualifications: degrees.join(', '),
    council: text(registration.council),
    registration: text(registration.number),
    experience: doc.yearsExperience != null ? `${doc.yearsExperience} years of experience` : '',
    languages: joined(doc.languages),
    ageGroups: text(doc.ageGroups),
    shortBio: text(doc.shortBio),
    bio: text(doc.bio),
    philosophy: text(doc.philosophy),
    memberships: joined((doc.memberships ?? []).map((m: Doc) => m.name)),
    affiliations: joined((doc.affiliations ?? []).map((a: Doc) => [a.role, a.organization].filter(Boolean).join(', '))),
    awards: joined((doc.awards ?? []).map((a: Doc) => a.name)),
    publications: text(doc.publications),
    profileUrl: text(doc.profileUrl),
    qualificationsList: (doc.qualifications ?? []).map((q: Doc, i: number) => ({id: q._key ?? String(i), degree: q.degree, institution: text(q.institution), place: text(q.place), year: text(q.year)})),
  }
}

function portraitOf(doctor: Doc | undefined, env: SiteEnv) {
  if (!doctor) return null
  const name = doctor.fullName ?? 'the doctor'
  const uploaded = imageUrl(doctor.portrait, env)
  if (uploaded) return {url: uploaded, alt: doctor.portrait.alt || `Portrait of ${name}`, hotspot: doctor.portrait.hotspot}
  const synced = (doctor.photos ?? []).find((p: Doc) => p.isPrimary) ?? doctor.photos?.[0]
  return synced?.url ? {url: synced.url, alt: `Portrait of ${name}`, hotspot: undefined} : null
}

export function practiceFromSanity(site: SiteDocs, env: SiteEnv): Practice {
  const practice = blankPractice()
  const clinic = site.clinic ?? {}
  const design = site.design ?? {}
  const booking = site.booking ?? {}
  const trust = site.trust ?? {}
  const search = site.search ?? {}
  const seo = site.seo ?? {}

  // The site leads with the primary doctor.
  const lead = site.primaryDoctor?._ref
  const doctorDocs = [...(site.doctors ?? [])].sort((a, b) => Number(b._id === lead) - Number(a._id === lead))
  const portrait = portraitOf(doctorDocs[0], env)

  practice.id = site._id
  practice.isDemo = false
  practice.identity = {
    name: text(clinic.name),
    legalName: text(clinic.legalName),
    shortName: text(clinic.shortName),
    slug: text(site.slug?.current),
    siteTitle: text(site.siteName),
    tagline: text(clinic.tagline),
    specialty: text(clinic.specialty ?? doctorDocs[0]?.specialty),
    additionalSpecialties: text(clinic.additionalSpecialties),
    careSystem: text(clinic.careSystem),
    locality: text(clinic.locality),
    city: text(clinic.city),
    language: text(clinic.language) || 'English',
    intro: text(clinic.intro ?? clinic.description),
  }
  practice.doctors = doctorDocs.map((doc) => mapDoctor(doc, clinic))
  practice.services = (site.services ?? []).map((doc) => ({
    id: doc._id,
    name: doc.name,
    summary: text(doc.summary),
    description: plainText(doc.description),
    category: text(doc.category),
    slug: text(doc.slug?.current),
    suitability: text(doc.suitability),
    expectations: text(doc.expectations),
    preparation: text(doc.preparation),
    duration: text(doc.duration),
    delivery: text(doc.delivery),
    fee: text(doc.fee),
    currency: text(doc.currency),
    doctorIds: ids(doc.doctors),
    locationIds: ids(doc.locations),
    relatedServices: ids(doc.relatedServices),
    image: imageUrl(doc.image, env),
  }))
  practice.locations = site.locations?.length ? site.locations.map(mapLocation) : [locationFromClinic(clinic)]

  // Empty uses the shared WhatsApp number with the clinic's code, the same way its
  // QR code does, so the conversation opens at the right clinic.
  const codeMessage = clinic.scheduRxClinicId ? `CLINIC ${clinic.scheduRxClinicId} - Hi` : ''
  practice.booking = {
    label: booking.label || 'Book a consultation',
    mode: booking.mode || 'whatsapp',
    url: text(booking.url),
    phone: text(booking.phone ?? clinic.phone),
    secondaryPhone: text(booking.secondaryPhone),
    whatsapp: text(booking.whatsapp ?? env.whatsappNumber),
    message: text(booking.message) || codeMessage,
    clinicId: text(clinic.scheduRxClinicId),
    consultationModes: text(booking.consultationModes),
    fee: text(booking.fee),
    currency: text(booking.currency),
    followUp: text(booking.followUp),
    cancellation: text(booking.cancellation),
    payments: text(booking.payments ?? joined(clinic.paymentMethods)),
    privacy: text(booking.privacy),
    contactPolicy: text(booking.contactPolicy),
  }
  const gallery = (clinic.photos ?? []).map((photo: Doc, i: number) => ({
    id: photo._key ?? `photo-${i}`,
    url: imageUrl(photo, env),
    name: photo.alt ?? '',
    role: i === 0 ? 'clinic' : 'gallery',
    alt: text(photo.alt),
    approved: true,
  }))
  practice.media = [...(portrait ? [{id: 'portrait', url: portrait.url, name: portrait.alt, role: 'portrait', alt: portrait.alt, approved: true}] : []), ...gallery.filter((m: Doc) => m.url)]
  practice.trust = {
    rating: text(trust.rating),
    count: text(trust.count),
    source: text(trust.source),
    retrieved: text(trust.retrieved),
    rights: Boolean(trust.rights),
    reviews: (site.testimonials ?? []).map((doc) => ({id: doc._id, name: doc.displayName, text: doc.quote, source: text(doc.source), permission: true, translation: text(doc.translation)})),
    statistics: (trust.statistics ?? []).map((row: Doc) => ({id: row._key, label: row.label, value: row.value, source: text(row.source), date: text(row.date)})),
  }
  practice.faqs = (site.faqs ?? []).map((doc) => ({id: doc._id, question: doc.question, answer: plainText(doc.answer)}))
  practice.articles = (site.articles ?? []).map((doc) => ({id: doc._id, title: doc.title, summary: text(doc.excerpt), body: plainText(doc.body), author: text(doc.authorName), reviewer: text(doc.reviewer), references: text(doc.references), reviewedDate: text(doc.reviewedDate), approved: true}))
  practice.design = {
    ...practice.design,
    layout: design.layout || 'editorial',
    theme: design.theme || 'forest',
    font: design.font || 'theme',
    density: design.density || 'comfortable',
    corners: design.corners || 'soft',
    portraitSide: design.portraitSide || 'right',
    customAccent: text(design.customAccent),
    sections: design.sections?.length ? design.sections : practice.design.sections,
    hidden: design.hidden ?? [],
    showBrand: design.showBrand !== false,
    motion: design.motion !== false,
    // The crop the editor chose on the photo sets where the portrait is framed.
    focalX: portrait?.hotspot ? Math.round(portrait.hotspot.x * 100) : practice.design.focalX,
    focalY: portrait?.hotspot ? Math.round(portrait.hotspot.y * 100) : practice.design.focalY,
  }
  practice.search = {
    domain: text(site.customDomain),
    canonical: text(search.canonical),
    verificationEmail: text(search.verificationEmail),
    businessProfile: text(search.businessProfile),
    businessVerified: Boolean(search.businessVerified),
    serviceAreas: text(search.serviceAreas),
    title: text(seo.title) || text(site.siteName),
    description: text(seo.description),
    socialTitle: text(search.socialTitle),
    socialDescription: text(search.socialDescription),
    oldUrls: text(search.oldUrls),
    otherLanguages: text(search.otherLanguages),
    analytics: Boolean(search.analytics),
  }
  practice.consent = {images: Boolean(site.consent?.images), facts: Boolean(site.consent?.facts)}
  return practice
}
