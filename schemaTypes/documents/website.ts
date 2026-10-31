import {defineArrayMember, defineField, defineType} from 'sanity'
import {CogIcon} from '@sanity/icons/Cog'
import {DocumentIcon} from '@sanity/icons/Document'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
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

export const websiteSettings = defineType({
  name: 'websiteSettings',
  type: 'document',
  icon: CogIcon,
  groups: [
    {name: 'address', title: 'Address', default: true},
    {name: 'look', title: 'Branding'},
    {name: 'navigation', title: 'Navigation'},
    {name: 'search', title: 'SEO'},
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
    defineField({name: 'status', type: 'string', group: 'address', initialValue: 'draft', options: {layout: 'radio', direction: 'horizontal', list: [{title: 'Being built', value: 'draft'}, {title: 'Live', value: 'live'}, {title: 'Paused', value: 'paused'}]}, validation: (rule) => rule.required()}),
    defineField({name: 'siteName', type: 'string', group: 'look', validation: (rule) => rule.required()}),
    defineField({name: 'logo', type: 'altImage', group: 'look'}),
    defineField({
      name: 'theme',
      type: 'object',
      group: 'look',
      fields: [
        defineField({name: 'preset', type: 'string', initialValue: 'calm', options: {list: [{title: 'Calm', value: 'calm'}, {title: 'Warm', value: 'warm'}, {title: 'Clinical', value: 'clinical'}]}}),
        defineField({name: 'brandColour', type: 'string', description: 'A hex colour, such as #EC6B25.', validation: (rule) => rule.regex(/^#[0-9a-fA-F]{6}$/).warning('Use a hex colour like #EC6B25.')}),
      ],
    }),
    defineField({name: 'navigation', type: 'array', group: 'navigation', of: [defineArrayMember({type: 'link'})], validation: (rule) => rule.max(8)}),
    defineField({name: 'footerLinks', type: 'array', group: 'navigation', of: [defineArrayMember({type: 'link'})]}),
    defineField({name: 'footerNote', type: 'text', rows: 2, group: 'navigation'}),
    defineField({name: 'seo', title: 'SEO defaults', type: 'seo', group: 'search'}),
  ],
  preview: {select: {title: 'siteName', subtitle: 'slug.current'}},
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
    defineField({name: 'image', type: 'altImage'}),
    defineField({name: 'doctors', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'doctor'}], options: sameClinic})]}),
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
    defineField({name: 'seo', type: 'seo'}),
  ],
  preview: {select: {title: 'title', subtitle: 'author.fullName', media: 'mainImage'}},
})
