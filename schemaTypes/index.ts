import {blockTypes} from './blocks'
import {altImage, callToAction, link, richText, seo} from './objects/common'
import {affiliation, award, doctorPhoto, membership, qualification, registration} from './objects/profile'
import {clinic, doctor} from './documents/profiles'
import {article, articleCategory, faq, page, service, testimonial, websiteSettings} from './documents/website'

export const schemaTypes = [
  clinic,
  doctor,
  websiteSettings,
  page,
  service,
  testimonial,
  faq,
  article,
  articleCategory,
  altImage,
  seo,
  link,
  callToAction,
  richText,
  doctorPhoto,
  qualification,
  registration,
  affiliation,
  award,
  membership,
  ...blockTypes,
]
