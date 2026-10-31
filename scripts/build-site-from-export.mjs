#!/usr/bin/env node
// Builds an importable starter site for one clinic from its exported ScheduRx profile.
// The output holds real names and details, so keep it out of the repo.
//
//   node scripts/build-site-from-export.mjs <export.json> <output.ndjson> --doctor=<name>
//
// The export is {clinic, doctors}. Only --doctor is included; repeat the option for more.

import {readFileSync, writeFileSync} from 'node:fs'
import {clinicToSanity, doctorToSanity, slugify} from './profile-map.mjs'

const [input, output] = process.argv.slice(2)
const wanted = process.argv.filter((a) => a.startsWith('--doctor=')).map((a) => a.split('=')[1].toLowerCase())
if (!input || !output) {
  console.error('Usage: build-site-from-export.mjs <export.json> <output.ndjson> --doctor=<name>')
  process.exit(1)
}

const {clinic, doctors} = JSON.parse(readFileSync(input, 'utf8'))
const chosen = doctors.filter((d) => wanted.includes(String(d.fullName).toLowerCase()))
if (!chosen.length) throw new Error(`No doctor matches. Found: ${doctors.map((d) => d.fullName).join(', ')}`)

const noNulls = (doc) => Object.fromEntries(Object.entries(doc).filter(([, value]) => value !== null))
const ref = (_ref, _key) => ({_type: 'reference', _ref, ...(_key ? {_key} : {})})
// The clinic's address keeps its full name, unlike a doctor's.
const base = slugify(`x ${clinic.name}`).replace(/^x-/, '') || clinic.id
const clinicId = `${base}-clinic`

const docs = [{_id: clinicId, _type: 'clinic', ...noNulls(clinicToSanity(clinic))}]
for (const row of chosen) {
  const _id = `${base}-doctor-${slugify(row.fullName)}`
  docs.push({_id, _type: 'doctor', title: 'Dr.', slug: {_type: 'slug', current: slugify(row.fullName)}, ...noNulls(doctorToSanity(row, clinicId))})
}
const leadId = docs[1]._id

const serviceNames = [...new Set(chosen.flatMap((row) => row.services ?? []))]
serviceNames.forEach((name, i) =>
  docs.push({_id: `${base}-service-${i}`, _type: 'service', clinic: ref(clinicId), name, slug: {_type: 'slug', current: slugify(name)}, doctors: chosen.length === 1 ? [ref(leadId, 'lead')] : []}),
)

docs.push({
  _id: `${base}-settings`,
  _type: 'websiteSettings',
  clinic: ref(clinicId),
  siteName: clinic.name,
  slug: {_type: 'slug', current: base},
  status: 'draft',
  primaryDoctor: ref(leadId),
  design: {layout: 'editorial', theme: 'forest', font: 'theme', density: 'comfortable', corners: 'soft', portraitSide: 'right', showBrand: true, motion: true, sections: ['care', 'about', 'visit', 'gallery', 'reviews', 'faq'], hidden: []},
  booking: {label: 'Book a consultation', mode: 'schedurx', currency: 'INR'},
  trust: {rights: false},
  consent: {images: false, facts: false},
})

writeFileSync(output, docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n')
console.log(`${docs.length} documents: ${docs.map((doc) => doc._type).join(', ')}`)
