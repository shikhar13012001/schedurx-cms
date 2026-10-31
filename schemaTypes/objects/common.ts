import {defineArrayMember, defineField, defineType} from 'sanity'
import {LinkIcon} from '@sanity/icons/Link'
import {SearchIcon} from '@sanity/icons/Search'

export const altImage = defineType({
  name: 'altImage',
  title: 'Image',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      type: 'string',
      title: 'Alternative Text',
      validation: (rule) => rule.required().warning('Alt text helps patients using screen readers, and search engines.'),
    }),
  ],
})

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({name: 'title', type: 'string', description: 'Overrides the page title in search results.', validation: (rule) => rule.max(70).warning('Search engines cut off long titles.')}),
    defineField({name: 'description', type: 'text', rows: 3, validation: (rule) => rule.max(160).warning('Search engines cut off long descriptions.')}),
    defineField({name: 'image', type: 'image', title: 'Social sharing image', description: '1200 x 630 works best.', options: {hotspot: true}}),
    defineField({name: 'noIndex', type: 'boolean', title: 'Hide from search engines', initialValue: false}),
  ],
})

export const link = defineType({
  name: 'link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({name: 'label', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'linkType',
      type: 'string',
      initialValue: 'page',
      options: {
        layout: 'radio',
        direction: 'horizontal',
        list: [
          {title: 'Page', value: 'page'},
          {title: 'Web address', value: 'url'},
          {title: 'Book an appointment', value: 'booking'},
          {title: 'WhatsApp the clinic', value: 'whatsapp'},
          {title: 'Call the clinic', value: 'phone'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'page',
      type: 'reference',
      to: [{type: 'page'}],
      hidden: ({parent}) => parent?.linkType !== 'page',
      options: {
        filter: ({document}) => {
          const clinic = (document?.clinic as {_ref?: string} | undefined)?._ref
          return clinic ? {filter: 'clinic._ref == $clinic', params: {clinic}} : {filter: 'false'}
        },
      },
    }),
    defineField({
      name: 'url',
      type: 'url',
      hidden: ({parent}) => parent?.linkType !== 'url',
      validation: (rule) => rule.uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'linkType'}},
})

export const callToAction = defineType({
  name: 'callToAction',
  title: 'Call to action',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({name: 'link', type: 'link', validation: (rule) => rule.required()}),
    defineField({
      name: 'priority',
      type: 'string',
      initialValue: 'primary',
      options: {layout: 'radio', direction: 'horizontal', list: ['primary', 'secondary']},
    }),
  ],
  preview: {select: {title: 'link.label', subtitle: 'priority'}},
})

export const callToActions = defineField({
  name: 'callToActions',
  type: 'array',
  of: [defineArrayMember({type: 'callToAction'})],
  validation: (rule) => rule.max(2),
})

export const richText = defineType({
  name: 'richText',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading', value: 'h2'},
        {title: 'Subheading', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
    }),
    defineArrayMember({type: 'altImage'}),
  ],
})
