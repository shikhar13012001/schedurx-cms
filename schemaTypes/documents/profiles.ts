import {defineArrayMember, defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'
import {UserIcon} from '@sanity/icons/User'
import {clinicField, syncedFrom} from '../shared/clinic-scope'

const stringList = (name: string, extra: Record<string, unknown> = {}) =>
  defineField({name, type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}, ...extra})

const groups = [
  {name: 'profile', title: 'From ScheduRx', default: true},
  {name: 'website', title: 'Website only'},
]

export const clinic = defineType({
  name: 'clinic',
  type: 'document',
  icon: HomeIcon,
  groups,
  fields: [
    defineField({
      name: 'scheduRxClinicId',
      title: 'ScheduRx clinic ID',
      type: 'string',
      group: 'profile',
      description: 'Links this to the clinic in ScheduRx. Once set, the "From ScheduRx" fields update from the dashboard and can\'t be edited here.',
    }),
    ...[
      defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'description', type: 'text', rows: 4}),
      defineField({name: 'phone', type: 'string'}),
      defineField({name: 'email', type: 'string', validation: (rule) => rule.email()}),
      defineField({name: 'logoUrl', type: 'url', title: 'Logo'}),
      defineField({name: 'addressLine1', type: 'string'}),
      defineField({name: 'addressLine2', type: 'string'}),
      defineField({name: 'locality', type: 'string'}),
      defineField({name: 'city', type: 'string'}),
      defineField({name: 'state', type: 'string'}),
      defineField({name: 'pincode', type: 'string', validation: (rule) => rule.regex(/^\d{6}$/).warning('Indian pincodes have 6 digits.')}),
      defineField({name: 'landmark', type: 'string'}),
      defineField({name: 'mapsUrl', type: 'url', title: 'Google Maps link'}),
      defineField({name: 'googleReviewUrl', type: 'url', title: 'Google review link'}),
      stringList('facilities'),
      stringList('paymentMethods'),
      stringList('workingDays', {description: 'Mon, Tue, Wed…'}),
      defineField({name: 'openingHour', type: 'number', validation: (rule) => rule.integer().min(0).max(24)}),
      defineField({name: 'closingHour', type: 'number', validation: (rule) => rule.integer().min(0).max(24)}),
    ].map((field) => ({...field, group: 'profile', ...syncedFrom('scheduRxClinicId')})),
    defineField({name: 'legalName', type: 'string', group: 'website'}),
    defineField({name: 'shortName', type: 'string', group: 'website'}),
    defineField({name: 'tagline', type: 'string', group: 'website'}),
    defineField({name: 'specialty', type: 'string', group: 'website', description: 'What the practice is known for, such as Dermatology.'}),
    defineField({name: 'additionalSpecialties', type: 'string', group: 'website'}),
    defineField({name: 'careSystem', type: 'string', group: 'website', initialValue: 'Allopathy'}),
    defineField({name: 'intro', type: 'text', rows: 4, group: 'website'}),
    defineField({name: 'language', type: 'string', group: 'website', initialValue: 'English'}),
    defineField({name: 'photos', title: 'Clinic photos', type: 'array', group: 'website', of: [defineArrayMember({type: 'altImage'})], options: {layout: 'grid'}}),
  ],
  preview: {select: {title: 'name', subtitle: 'city'}},
})

export const doctor = defineType({
  name: 'doctor',
  type: 'document',
  icon: UserIcon,
  groups,
  fields: [
    {...clinicField, group: 'profile'},
    defineField({
      name: 'scheduRxDoctorId',
      title: 'ScheduRx doctor ID',
      type: 'string',
      group: 'profile',
      description: 'Links this to the doctor in ScheduRx. Once set, the "From ScheduRx" fields update from the dashboard and can\'t be edited here.',
    }),
    ...[
      defineField({name: 'fullName', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'specialty', type: 'string', title: 'Specialization'}),
      defineField({name: 'yearsExperience', type: 'number', validation: (rule) => rule.integer().min(0).max(80)}),
      defineField({name: 'headline', type: 'string', title: 'Profile headline', validation: (rule) => rule.max(200)}),
      defineField({name: 'bio', type: 'text', title: 'About', rows: 6, validation: (rule) => rule.max(3000)}),
      defineField({name: 'photos', type: 'array', of: [defineArrayMember({type: 'doctorPhoto'})], validation: (rule) => rule.max(6)}),
      defineField({name: 'qualifications', type: 'array', of: [defineArrayMember({type: 'qualification'})]}),
      defineField({name: 'registrations', type: 'array', of: [defineArrayMember({type: 'registration'})]}),
      defineField({name: 'affiliations', type: 'array', of: [defineArrayMember({type: 'affiliation'})]}),
      defineField({name: 'awards', type: 'array', of: [defineArrayMember({type: 'award'})]}),
      defineField({name: 'memberships', type: 'array', of: [defineArrayMember({type: 'membership'})]}),
      stringList('services'),
      stringList('languages', {title: 'Languages spoken'}),
      defineField({
        name: 'consultationModes',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
        options: {list: ['In-clinic', 'Online', 'Home visit']},
      }),
    ].map((field) => ({...field, group: 'profile', ...syncedFrom('scheduRxDoctorId')})),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'website',
      options: {source: 'fullName'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'title', type: 'string', group: 'website', initialValue: 'Dr.', description: 'Shown before the name. Leave empty if the name already includes it.'}),
    defineField({name: 'shortName', type: 'string', group: 'website'}),
    defineField({name: 'pronouns', type: 'string', group: 'website'}),
    defineField({name: 'shortBio', type: 'text', rows: 2, group: 'website'}),
    defineField({name: 'ageGroups', type: 'string', group: 'website', description: 'Who the doctor sees, such as Adults and children.'}),
    defineField({name: 'publications', type: 'text', rows: 3, group: 'website'}),
    defineField({name: 'profileUrl', type: 'url', group: 'website', description: 'A public profile elsewhere, such as a hospital page.'}),
    defineField({name: 'journey', title: 'Doctor journey', type: 'richText', group: 'website'}),
    defineField({name: 'philosophy', type: 'text', rows: 4, group: 'website'}),
    defineField({name: 'portrait', type: 'altImage', group: 'website', description: 'A higher quality photo for the website. Without one, the main ScheduRx photo is used.'}),
    defineField({name: 'seo', type: 'seo', group: 'website'}),
  ],
  preview: {select: {title: 'fullName', subtitle: 'specialty', media: 'portrait'}},
})
