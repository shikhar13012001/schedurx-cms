import {defineArrayMember, defineField, defineType} from 'sanity'
import {BlockContentIcon} from '@sanity/icons/BlockContent'
import {ComposeIcon} from '@sanity/icons/Compose'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {ImagesIcon} from '@sanity/icons/Images'
import {LaunchIcon} from '@sanity/icons/Launch'
import {PinIcon} from '@sanity/icons/Pin'
import {RocketIcon} from '@sanity/icons/Rocket'
import {StarIcon} from '@sanity/icons/Star'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {UsersIcon} from '@sanity/icons/Users'
import {callToActions} from '../objects/common'
import {sameClinic} from '../shared/clinic-scope'

const heading = defineField({name: 'heading', type: 'string'})
const intro = defineField({name: 'intro', type: 'text', rows: 3})

function preview(label: string, icon: any, title = 'heading') {
  return {
    select: {title},
    prepare: ({title: value}: {title?: string}) => ({title: value || label, subtitle: label, media: icon}),
  }
}

// Picks content from this clinic. Left empty, the section shows all of it.
function picks(name: string, type: string, description: string) {
  return defineField({
    name,
    type: 'array',
    description,
    of: [defineArrayMember({type: 'reference', to: [{type}], options: sameClinic})],
    validation: (rule) => rule.unique(),
  })
}

export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero',
  type: 'object',
  icon: RocketIcon,
  fields: [
    defineField({name: 'heading', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'subheading', type: 'text', rows: 2}),
    defineField({name: 'image', type: 'altImage'}),
    callToActions,
  ],
  preview: preview('Hero', RocketIcon),
})

export const introSection = defineType({
  name: 'introSection',
  title: 'Introduction',
  type: 'object',
  icon: ComposeIcon,
  fields: [heading, defineField({name: 'body', type: 'richText'}), defineField({name: 'image', type: 'altImage'})],
  preview: preview('Introduction', ComposeIcon),
})

export const servicesSection = defineType({
  name: 'servicesSection',
  title: 'Services',
  type: 'object',
  icon: ThLargeIcon,
  fields: [heading, intro, picks('services', 'service', 'Choose which to feature. Empty shows all of this clinic\'s services.')],
  preview: preview('Services', ThLargeIcon),
})

export const doctorsSection = defineType({
  name: 'doctorsSection',
  title: 'Doctors',
  type: 'object',
  icon: UsersIcon,
  fields: [heading, intro, picks('doctors', 'doctor', 'Choose which to show. Empty shows all of this clinic\'s doctors.')],
  preview: preview('Doctors', UsersIcon),
})

export const testimonialsSection = defineType({
  name: 'testimonialsSection',
  title: 'Testimonials',
  type: 'object',
  icon: StarIcon,
  fields: [heading, picks('testimonials', 'testimonial', 'Empty shows all approved testimonials for this clinic.')],
  preview: preview('Testimonials', StarIcon),
})

export const faqSection = defineType({
  name: 'faqSection',
  title: 'FAQs',
  type: 'object',
  icon: HelpCircleIcon,
  fields: [heading, picks('faqs', 'faq', 'Empty shows all of this clinic\'s FAQs.')],
  preview: preview('FAQs', HelpCircleIcon),
})

export const gallerySection = defineType({
  name: 'gallerySection',
  title: 'Image gallery',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    heading,
    defineField({name: 'images', type: 'array', of: [defineArrayMember({type: 'altImage'})], options: {layout: 'grid'}, validation: (rule) => rule.required().min(1)}),
  ],
  preview: preview('Image gallery', ImagesIcon),
})

export const featuresSection = defineType({
  name: 'featuresSection',
  title: 'Feature grid',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    heading,
    intro,
    defineField({
      name: 'features',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'feature',
          fields: [
            defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
            defineField({name: 'description', type: 'text', rows: 2}),
            defineField({name: 'image', type: 'altImage'}),
          ],
          preview: {select: {title: 'title', subtitle: 'description', media: 'image'}},
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: preview('Feature grid', BlockContentIcon),
})

export const ctaSection = defineType({
  name: 'ctaSection',
  title: 'Call to action banner',
  type: 'object',
  icon: LaunchIcon,
  fields: [defineField({name: 'heading', type: 'string', validation: (rule) => rule.required()}), intro, callToActions],
  preview: preview('Call to action banner', LaunchIcon),
})

export const contactSection = defineType({
  name: 'contactSection',
  title: 'Contact and location',
  type: 'object',
  icon: PinIcon,
  description: 'Shows the address, hours, phone and map from the clinic profile.',
  fields: [
    heading,
    intro,
    defineField({name: 'showMap', type: 'boolean', initialValue: true}),
    defineField({name: 'showHours', type: 'boolean', initialValue: true}),
  ],
  preview: preview('Contact and location', PinIcon),
})

export const richTextSection = defineType({
  name: 'richTextSection',
  title: 'Text',
  type: 'object',
  icon: ComposeIcon,
  fields: [heading, defineField({name: 'body', type: 'richText', validation: (rule) => rule.required()})],
  preview: preview('Text', ComposeIcon),
})

export const pageBuilder = defineType({
  name: 'pageBuilder',
  type: 'array',
  of: [
    defineArrayMember({type: 'heroSection'}),
    defineArrayMember({type: 'introSection'}),
    defineArrayMember({type: 'servicesSection'}),
    defineArrayMember({type: 'doctorsSection'}),
    defineArrayMember({type: 'testimonialsSection'}),
    defineArrayMember({type: 'faqSection'}),
    defineArrayMember({type: 'gallerySection'}),
    defineArrayMember({type: 'featuresSection'}),
    defineArrayMember({type: 'ctaSection'}),
    defineArrayMember({type: 'contactSection'}),
    defineArrayMember({type: 'richTextSection'}),
  ],
})

export const blockTypes = [
  heroSection,
  introSection,
  servicesSection,
  doctorsSection,
  testimonialsSection,
  faqSection,
  gallerySection,
  featuresSection,
  ctaSection,
  contactSection,
  richTextSection,
  pageBuilder,
]
