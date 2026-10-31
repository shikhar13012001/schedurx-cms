import type {StructureBuilder, StructureResolver} from 'sanity/structure'
import {HomeIcon} from '@sanity/icons/Home'

const SECTIONS: [string, string][] = [
  ['websiteSettings', 'Website settings'],
  ['page', 'Pages'],
  ['doctor', 'Doctors'],
  ['location', 'Locations and hours'],
  ['service', 'Services'],
  ['testimonial', 'Testimonials'],
  ['faq', 'FAQs'],
  ['article', 'Articles'],
  ['articleCategory', 'Article categories'],
]

// Everything for one clinic, in one place, so content from different clinics can't
// get mixed up. New documents opened from here start with this clinic filled in.
function clinicContent(S: StructureBuilder, clinicId: string) {
  return S.list()
    .title('Website')
    .items([
      S.listItem()
        .title('Clinic profile')
        .icon(HomeIcon)
        .child(S.document().schemaType('clinic').documentId(clinicId)),
      S.divider(),
      ...SECTIONS.map(([type, title]) =>
        S.listItem()
          .title(title)
          .schemaType(type)
          .child(
            S.documentList()
              .title(title)
              .schemaType(type)
              .apiVersion('2026-02-01')
              .filter('_type == $type && clinic._ref == $clinicId')
              .params({type, clinicId})
              .initialValueTemplates([S.initialValueTemplateItem(`${type}-for-clinic`, {clinicId})]),
          ),
      ),
    ])
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('ScheduRx Websites')
    .items([
      S.listItem()
        .title('Clinics')
        .icon(HomeIcon)
        .child(
          S.documentTypeList('clinic')
            .title('Clinics')
            .child((clinicId) => clinicContent(S, clinicId)),
        ),
    ])

export const clinicTemplates = SECTIONS.map(([type, title]) => ({
  id: `${type}-for-clinic`,
  title: `${title} for this clinic`,
  schemaType: type,
  parameters: [{name: 'clinicId', type: 'string'}],
  value: ({clinicId}: {clinicId: string}) => ({clinic: {_type: 'reference', _ref: clinicId}}),
}))
