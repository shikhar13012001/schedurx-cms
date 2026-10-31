import {defineField, defineType} from 'sanity'

// These match the doctor profile page in the ScheduRx dashboard, field for field,
// so syncing is a straight copy (scripts/profile-map.mjs).

const year = (name: string, title?: string) =>
  defineField({name, title, type: 'number', validation: (rule) => rule.integer().min(1900).max(2100)})

export const doctorPhoto = defineType({
  name: 'doctorPhoto',
  type: 'object',
  fields: [
    defineField({name: 'url', type: 'url', validation: (rule) => rule.required()}),
    defineField({name: 'isPrimary', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'url', subtitle: 'isPrimary'}, prepare: ({title, subtitle}) => ({title, subtitle: subtitle ? 'Main photo' : undefined})},
})

export const qualification = defineType({
  name: 'qualification',
  type: 'object',
  fields: [
    defineField({name: 'degree', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'institution', type: 'string'}),
    defineField({name: 'place', type: 'string'}),
    year('year'),
  ],
  preview: {select: {title: 'degree', subtitle: 'institution'}},
})

export const registration = defineType({
  name: 'registration',
  type: 'object',
  fields: [
    defineField({name: 'number', type: 'string', title: 'Registration number', validation: (rule) => rule.required()}),
    defineField({name: 'council', type: 'string', title: 'Medical council'}),
    year('year'),
  ],
  preview: {select: {title: 'number', subtitle: 'council'}},
})

export const affiliation = defineType({
  name: 'affiliation',
  type: 'object',
  fields: [
    defineField({name: 'organization', type: 'string', title: 'Hospital / organization', validation: (rule) => rule.required()}),
    defineField({name: 'role', type: 'string'}),
  ],
  preview: {select: {title: 'organization', subtitle: 'role'}},
})

export const award = defineType({
  name: 'award',
  type: 'object',
  fields: [defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}), year('year')],
  preview: {select: {title: 'name', subtitle: 'year'}},
})

export const membership = defineType({
  name: 'membership',
  type: 'object',
  fields: [
    defineField({name: 'name', type: 'string', title: 'Association / society', validation: (rule) => rule.required()}),
    year('sinceYear', 'Since year'),
  ],
  preview: {select: {title: 'name', subtitle: 'sinceYear'}},
})
