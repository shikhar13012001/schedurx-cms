import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'
import {DocumentIcon} from '@sanity/icons/Document'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {PinIcon} from '@sanity/icons/Pin'
import {StarIcon} from '@sanity/icons/Star'
import {TagIcon} from '@sanity/icons/Tag'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {clinicField, onePerClinic, sameClinic} from '../shared/clinic-scope'

const clinicOnce = (type: string) => ({
  ...clinicField,
  validation: (rule: any) => rule.required().custom(onePerClinic(type)),
})

// A slug only has to be unique inside its own clinic's site.
function isUniqueInClinic(slug: string, context: any) {
  const clinic = context.document?.clinic?._ref
  if (!clinic) return Promise.resolve(true)
  const id = String(context.document?._id ?? '').replace(/^drafts\./, '')
  return context
    .getClient({apiVersion: '2026-02-01'})
    .fetch(
      'count(*[_type == $type && clinic._ref == $clinic && slug.current == $slug && !(_id in [$id, "drafts." + $id])]) == 0',
      {type: context.document._type, clinic, slug, id},
    )
}
const clinicSlug = (source: string) =>
  defineField({name: 'slug', type: 'slug', options: {source, isUnique: isUniqueInClinic}, validation: (rule) => rule.required()})

const CAMPAIGN_SECTIONS = [
  {title: 'Care', value: 'care'},
  {title: 'About the doctor', value: 'about'},
  {title: 'Visit', value: 'visit'},
  {title: 'Gallery', value: 'gallery'},
  {title: 'Reviews', value: 'reviews'},
  {title: 'FAQ', value: 'faq'},
]
const radio = (list: {title: string; value: string}[]) => ({layout: 'radio' as const, direction: 'horizontal' as const, list})

export const websiteSettings = defineType({
  name: 'websiteSettings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'address', title: 'Address', default: true},
    {name: 'look', title: 'Design'},
    {name: 'booking', title: 'Booking'},
    {name: 'trust', title: 'Trust'},
    {name: 'navigation', title: 'Navigation'},
    {name: 'search', title: 'SEO'},
    {name: 'release', title: 'Permissions'},
  ],
  fields: [
    {...clinicOnce('websiteSettings'), group: 'address'},
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'address',
      description: 'The site lives at schedurx.com/<this>.',
      options: {source: 'siteName'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'customDomain', type: 'string', group: 'address', description: 'Optional, such as drsharmaclinic.in.', validation: (rule) => rule.regex(/^[a-z0-9.-]+\.[a-z]{2,}$/).warning('Enter just the domain, with no https://.')}),
    defineField({
      name: 'status',
      type: 'string',
      group: 'address',
      initialValue: 'draft',
      description: 'Only a Live site can be opened by the public.',
      options: radio([{title: 'Being built', value: 'draft'}, {title: 'Live', value: 'live'}, {title: 'Paused', value: 'paused'}]),
      validation: (rule) =>
        rule.required().custom((status, context: any) => {
          if (status !== 'live') return true
          const consent = context.document?.consent
          return consent?.images && consent?.facts ? true : 'Confirm photo permission and the published facts, under Permissions, before going live.'
        }),
    }),
    defineField({name: 'siteName', type: 'string', group: 'look', validation: (rule) => rule.required()}),
    defineField({name: 'logo', type: 'altImage', group: 'look'}),
    defineField({
      name: 'primaryDoctor',
      type: 'reference',
      to: [{type: 'doctor'}],
      group: 'look',
      options: sameClinic,
      description: 'The doctor the site leads with.',
    }),
    defineField({
      name: 'design',
      type: 'object',
      group: 'look',
      options: {columns: 2},
      fields: [
        defineField({name: 'layout', type: 'string', initialValue: 'editorial', options: {list: [{title: 'The editorial', value: 'editorial'}, {title: 'The contemporary', value: 'contemporary'}, {title: 'The personal', value: 'personal'}]}, validation: (rule) => rule.required()}),
        defineField({name: 'theme', type: 'string', initialValue: 'forest', options: {list: [{title: 'Ivory & forest', value: 'forest'}, {title: 'Porcelain & navy', value: 'navy'}, {title: 'Linen & clay', value: 'clay'}, {title: 'Chalk & plum', value: 'plum'}, {title: 'White & petrol', value: 'petrol'}, {title: 'Stone & graphite', value: 'stone'}]}, validation: (rule) => rule.required()}),
        defineField({name: 'font', type: 'string', initialValue: 'theme', options: {list: [{title: 'Match the theme', value: 'theme'}, {title: 'Serif', value: 'serif'}, {title: 'Sans', value: 'sans'}]}}),
        defineField({name: 'density', type: 'string', initialValue: 'comfortable', options: {list: ['comfortable', 'compact']}}),
        defineField({name: 'corners', type: 'string', initialValue: 'soft', options: {list: ['soft', 'square']}}),
        defineField({name: 'portraitSide', type: 'string', initialValue: 'right', options: {list: ['right', 'left']}}),
        defineField({name: 'customAccent', type: 'string', description: 'Optional hex colour, such as #285B49.', validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/).warning('Use a hex colour like #285B49.')}),
        defineField({name: 'showBrand', type: 'boolean', title: 'Show the ScheduRx credit', initialValue: true}),
        defineField({name: 'motion', type: 'boolean', title: 'Gentle animation', initialValue: true}),
        defineField({
          name: 'sections',
          type: 'array',
          description: 'Drag to change the order.',
          of: [defineArrayMember({type: 'string'})],
          options: {list: CAMPAIGN_SECTIONS, sortable: true},
          initialValue: CAMPAIGN_SECTIONS.map((section) => section.value),
        }),
        defineField({
          name: 'hidden',
          title: 'Hidden sections',
          type: 'array',
          description: 'Care and Visit always show.',
          of: [defineArrayMember({type: 'string'})],
          options: {list: CAMPAIGN_SECTIONS.filter((section) => !['care', 'visit'].includes(section.value))},
        }),
      ],
    }),
    defineField({
      name: 'booking',
      type: 'object',
      group: 'booking',
      fields: [
        defineField({name: 'label', type: 'string', initialValue: 'Book a consultation'}),
        defineField({name: 'mode', type: 'string', initialValue: 'schedurx', description: 'ScheduRx booking opens the booking page with this clinic and doctor already chosen.', options: radio([{title: 'ScheduRx booking', value: 'schedurx'}, {title: 'WhatsApp', value: 'whatsapp'}, {title: 'Another web link', value: 'external'}])}),
        defineField({name: 'url', type: 'url', hidden: ({parent}) => parent?.mode !== 'external'}),
        defineField({name: 'phone', type: 'string', description: 'Empty uses the clinic phone.'}),
        defineField({name: 'secondaryPhone', type: 'string'}),
        defineField({name: 'whatsapp', type: 'string', description: 'Empty uses the ScheduRx WhatsApp number, which opens this clinic automatically.'}),
        defineField({name: 'message', type: 'string', title: 'Starting WhatsApp message'}),
        defineField({name: 'consultationModes', type: 'string'}),
        defineField({name: 'fee', type: 'string'}),
        defineField({name: 'currency', type: 'string', initialValue: 'INR'}),
        defineField({name: 'followUp', type: 'text', rows: 2, title: 'Follow-up policy'}),
        defineField({name: 'cancellation', type: 'text', rows: 2, title: 'Cancellation policy'}),
        defineField({name: 'payments', type: 'string', title: 'Payment methods'}),
        defineField({name: 'privacy', type: 'text', rows: 2, title: 'Privacy note'}),
        defineField({name: 'contactPolicy', type: 'text', rows: 2}),
      ],
    }),
    defineField({
      name: 'trust',
      type: 'object',
      group: 'trust',
      description: 'Reviews themselves are Testimonials. This is the overall rating and any published figures.',
      fields: [
        defineField({name: 'rating', type: 'string'}),
        defineField({name: 'count', type: 'string', title: 'Number of reviews'}),
        defineField({name: 'source', type: 'url', title: 'Where the rating comes from'}),
        defineField({name: 'retrieved', type: 'date', title: 'Date checked'}),
        defineField({name: 'rights', type: 'boolean', title: 'We have the right to show this', initialValue: false}),
        defineField({
          name: 'statistics',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'statistic',
              fields: [
                defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
                defineField({name: 'value', type: 'string', validation: (rule) => rule.required()}),
                defineField({name: 'source', type: 'string'}),
                defineField({name: 'date', type: 'date'}),
              ],
              preview: {select: {title: 'label', subtitle: 'value'}},
            }),
          ],
        }),
      ],
    }),
    defineField({name: 'navigation', type: 'array', group: 'navigation', of: [defineArrayMember({type: 'link'})], validation: (rule) => rule.max(8)}),
    defineField({name: 'footerLinks', type: 'array', group: 'navigation', of: [defineArrayMember({type: 'link'})]}),
    defineField({name: 'footerNote', type: 'text', rows: 2, group: 'navigation'}),
    defineField({name: 'seo', title: 'SEO defaults', type: 'seo', group: 'search'}),
    defineField({
      name: 'search',
      title: 'Search presence',
      type: 'object',
      group: 'search',
      fields: [
        defineField({name: 'canonical', type: 'url', title: 'Main web address'}),
        defineField({name: 'verificationEmail', type: 'string', validation: (rule) => rule.email()}),
        defineField({name: 'businessProfile', type: 'url', title: 'Google Business Profile'}),
        defineField({name: 'businessVerified', type: 'boolean', initialValue: false}),
        defineField({name: 'serviceAreas', type: 'string'}),
        defineField({name: 'socialTitle', type: 'string'}),
        defineField({name: 'socialDescription', type: 'text', rows: 2}),
        defineField({name: 'oldUrls', type: 'text', rows: 2, title: 'Old web addresses'}),
        defineField({name: 'otherLanguages', type: 'string'}),
        defineField({name: 'analytics', type: 'boolean', initialValue: false}),
      ],
    }),
    defineField({
      name: 'consent',
      type: 'object',
      group: 'release',
      fields: [
        defineField({name: 'images', type: 'boolean', title: 'We have permission to use these photos', initialValue: false}),
        defineField({name: 'facts', type: 'boolean', title: 'The clinic approved the published facts', initialValue: false}),
      ],
    }),
  ],
  preview: {select: {title: 'siteName', subtitle: 'status'}},
})

const HOURS_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const location = defineType({
  name: 'location',
  type: 'document',
  icon: PinIcon,
  description: 'A place patients visit. Without one, the site uses the address and hours on the clinic profile.',
  fields: [
    clinicField,
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'status', type: 'string', initialValue: 'Primary clinic'}),
    defineField({name: 'address', type: 'string'}),
    defineField({name: 'locality', type: 'string'}),
    defineField({name: 'city', type: 'string'}),
    defineField({name: 'state', type: 'string'}),
    defineField({name: 'postcode', type: 'string'}),
    defineField({name: 'country', type: 'string', initialValue: 'India'}),
    defineField({name: 'landmark', type: 'string'}),
    defineField({name: 'entrance', type: 'string'}),
    defineField({name: 'mapsUrl', type: 'url', title: 'Google Maps link'}),
    defineField({name: 'placeId', type: 'string'}),
    defineField({name: 'latitude', type: 'string'}),
    defineField({name: 'longitude', type: 'string'}),
    defineField({name: 'pinConfirmed', type: 'boolean', title: 'Map pin checked', initialValue: false}),
    defineField({name: 'phone', type: 'string'}),
    defineField({name: 'whatsapp', type: 'string'}),
    defineField({name: 'parking', type: 'string'}),
    defineField({name: 'lift', type: 'string'}),
    defineField({name: 'wheelchair', type: 'string'}),
    defineField({name: 'accessibleToilet', type: 'string'}),
    defineField({name: 'transport', type: 'string'}),
    defineField({name: 'payments', type: 'string'}),
    defineField({name: 'policy', type: 'text', rows: 2, title: 'Visit policy'}),
    defineField({name: 'holidayExceptions', type: 'text', rows: 2}),
    defineField({name: 'phoneHours', type: 'string'}),
    defineField({name: 'timezone', type: 'string', initialValue: 'Asia/Kolkata'}),
    defineField({name: 'doctors', type: 'array', description: 'Empty means every doctor sees patients here.', of: [defineArrayMember({type: 'reference', to: [{type: 'doctor'}], options: sameClinic})]}),
    defineField({
      name: 'hours',
      type: 'array',
      description: 'Add two time ranges for split consulting hours.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'dayHours',
          fields: [
            defineField({name: 'day', type: 'string', options: {list: HOURS_DAYS}, validation: (rule) => rule.required()}),
            defineField({name: 'closed', type: 'boolean', initialValue: false}),
            defineField({
              name: 'slots',
              type: 'array',
              hidden: ({parent}) => Boolean(parent?.closed),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'timeRange',
                  fields: [
                    defineField({name: 'start', type: 'string', description: '24-hour, such as 09:00.', validation: (rule) => rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/)}),
                    defineField({name: 'end', type: 'string', description: '24-hour, such as 13:00.', validation: (rule) => rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/)}),
                  ],
                  preview: {select: {title: 'start', subtitle: 'end'}},
                }),
              ],
            }),
          ],
          preview: {
            select: {title: 'day', closed: 'closed', slots: 'slots'},
            prepare: ({title, closed, slots}: any) => ({title, subtitle: closed ? 'Closed' : (slots ?? []).map((t: any) => `${t.start}-${t.end}`).join(', ')}),
          },
        }),
      ],
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'locality'}},
})

export const page = defineType({
  name: 'page',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    clinicField,
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'pageType',
      type: 'string',
      initialValue: 'custom',
      options: {list: [{title: 'Homepage', value: 'home'}, {title: 'About', value: 'about'}, {title: 'Contact', value: 'contact'}, {title: 'Other', value: 'custom'}]},
      validation: (rule) =>
        rule.required().custom(async (pageType, context: any) => {
          if (!pageType || pageType === 'custom' || !context.document?.clinic?._ref) return true
          const id = String(context.document._id).replace(/^drafts\./, '')
          const others = await context.getClient({apiVersion: '2026-02-01'}).fetch(
            'count(*[_type == "page" && clinic._ref == $clinic && pageType == $pageType && !(_id in [$id, "drafts." + $id])])',
            {clinic: context.document.clinic._ref, pageType, id},
          )
          return others === 0 || 'This clinic already has this page.'
        }),
    }),
    clinicSlug('title'),
    defineField({name: 'sections', type: 'pageBuilder', validation: (rule) => rule.required().min(1)}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title', subtitle: 'pageType'}},
})

export const service = defineType({
  name: 'service',
  type: 'document',
  icon: ThLargeIcon,
  fields: [
    clinicField,
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    clinicSlug('name'),
    defineField({name: 'category', type: 'string'}),
    defineField({name: 'summary', type: 'text', rows: 2, validation: (rule) => rule.max(240)}),
    defineField({name: 'description', type: 'richText'}),
    defineField({name: 'suitability', type: 'text', rows: 2, title: 'Who it\'s for'}),
    defineField({name: 'expectations', type: 'text', rows: 2, title: 'What to expect'}),
    defineField({name: 'preparation', type: 'text', rows: 2, title: 'How to prepare'}),
    defineField({name: 'duration', type: 'string'}),
    defineField({name: 'delivery', type: 'string', description: 'Such as In clinic or Online.'}),
    defineField({name: 'fee', type: 'string'}),
    defineField({name: 'currency', type: 'string', initialValue: 'INR'}),
    defineField({name: 'image', type: 'altImage'}),
    defineField({name: 'doctors', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'doctor'}], options: sameClinic})]}),
    defineField({name: 'locations', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'location'}], options: sameClinic})]}),
    defineField({name: 'relatedServices', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'service'}], options: sameClinic})]}),
    defineField({name: 'faqs', type: 'array', title: 'FAQs', of: [defineArrayMember({type: 'reference', to: [{type: 'faq'}], options: sameClinic})]}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'name', subtitle: 'category', media: 'image'}},
})

export const testimonial = defineType({
  name: 'testimonial',
  type: 'document',
  icon: StarIcon,
  description: 'Never include diagnoses, treatment details, phone numbers or anything else that could identify a patient beyond the name they agreed to.',
  fields: [
    clinicField,
    defineField({name: 'displayName', type: 'string', description: 'As the patient agreed, such as "Asha R.".', validation: (rule) => rule.required()}),
    defineField({name: 'quote', type: 'text', rows: 4, validation: (rule) => rule.required().max(600)}),
    defineField({name: 'rating', type: 'number', options: {list: [5, 4, 3, 2, 1]}}),
    defineField({name: 'source', type: 'string', description: 'Where it came from, such as Google.'}),
    defineField({name: 'translation', type: 'text', rows: 3, description: 'If the original isn\'t in the site\'s language.'}),
    defineField({name: 'doctor', type: 'reference', to: [{type: 'doctor'}], options: sameClinic}),
    defineField({
      name: 'consent',
      type: 'object',
      description: 'A testimonial can only be shown with the patient\'s permission.',
      fields: [
        defineField({name: 'confirmed', type: 'boolean', title: 'The patient agreed to this being published', initialValue: false}),
        defineField({name: 'date', type: 'date', title: 'Date they agreed'}),
        defineField({name: 'method', type: 'string', options: {list: ['Written', 'WhatsApp', 'Email', 'Google review']}}),
      ],
      validation: (rule) =>
        rule.custom((consent: any, context: any) => {
          if (context.document?.status !== 'approved') return true
          return consent?.confirmed && consent?.date && consent?.method ? true : 'Record the patient\'s permission before approving this.'
        }),
    }),
    defineField({name: 'status', type: 'string', initialValue: 'pending', options: {layout: 'radio', direction: 'horizontal', list: [{title: 'Waiting for review', value: 'pending'}, {title: 'Approved', value: 'approved'}, {title: 'Hidden', value: 'hidden'}]}, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'displayName', subtitle: 'status'}},
})

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  icon: HelpCircleIcon,
  fields: [
    clinicField,
    defineField({name: 'question', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'answer', type: 'richText', validation: (rule) => rule.required()}),
    defineField({name: 'category', type: 'string'}),
  ],
  preview: {select: {title: 'question', subtitle: 'category'}},
})

export const articleCategory = defineType({
  name: 'articleCategory',
  title: 'Article category',
  type: 'document',
  icon: TagIcon,
  fields: [clinicField, defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}), clinicSlug('title')],
  preview: {select: {title: 'title'}},
})

export const article = defineType({
  name: 'article',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    clinicField,
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    clinicSlug('title'),
    defineField({name: 'author', type: 'reference', to: [{type: 'doctor'}], options: sameClinic, validation: (rule) => rule.required()}),
    defineField({name: 'categories', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'articleCategory'}], options: sameClinic})]}),
    defineField({name: 'publishedAt', type: 'datetime', validation: (rule) => rule.required()}),
    defineField({name: 'excerpt', type: 'text', rows: 3, validation: (rule) => rule.max(240)}),
    defineField({name: 'mainImage', type: 'altImage'}),
    defineField({name: 'body', type: 'richText', validation: (rule) => rule.required()}),
    defineField({name: 'reviewer', type: 'string', description: 'The clinician who reviewed this.'}),
    defineField({name: 'reviewedDate', type: 'date'}),
    defineField({name: 'references', type: 'text', rows: 3}),
    defineField({name: 'approved', type: 'boolean', title: 'Approved to publish', initialValue: false}),
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title', subtitle: 'author.fullName', media: 'mainImage'}},
})
