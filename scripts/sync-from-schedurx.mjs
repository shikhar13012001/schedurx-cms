#!/usr/bin/env node
// Copies clinic and doctor profiles from ScheduRx into Sanity. Website content written
// in the Studio is never touched. Safe to re-run.
//
//   node scripts/sync-from-schedurx.mjs                    # show what would change
//   node scripts/sync-from-schedurx.mjs --apply
//   node scripts/sync-from-schedurx.mjs --apply --clinic=<id>

import 'dotenv/config'
import {createClient as createSanity} from '@sanity/client'
import {createClient as createSupabase} from '@supabase/supabase-js'
import {clinicToSanity, doctorToSanity, slugify} from './profile-map.mjs'

const apply = process.argv.includes('--apply')
const only = process.argv.find((a) => a.startsWith('--clinic='))?.split('=')[1]

for (const name of ['SANITY_STUDIO_PROJECT_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', ...(apply ? ['SANITY_WRITE_TOKEN'] : [])]) {
  if (!process.env[name]) {
    console.error(`Missing ${name}. See .env.example.`)
    process.exit(1)
  }
}

const db = createSupabase(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const sanity = createSanity({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  apiVersion: '2026-02-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

// Finds by ScheduRx ID, then updates only the synced fields. Creates it if it's new.
async function upsert(type, idField, fields, onCreate = {}) {
  const existing = await sanity.fetch(`*[_type == $type && ${idField} == $id && !(_id in path("drafts.**"))][0]._id`, {type, id: fields[idField]})
  if (!apply) {
    console.log(`  would ${existing ? 'update' : 'create'} ${type}: ${fields.name ?? fields.fullName}`)
    return existing ?? `new-${fields[idField]}`
  }
  if (existing) {
    await sanity.patch(existing).set(fields).commit()
    return existing
  }
  return (await sanity.create({_type: type, ...fields, ...onCreate}))._id
}

let clinicQuery = db.from('Clinic').select('*')
if (only) clinicQuery = clinicQuery.eq('id', only)
const {data: clinics, error} = await clinicQuery
if (error) throw new Error(`Couldn't read clinics: ${error.message}`)

for (const clinic of clinics) {
  console.log(clinic.name)
  const sanityClinicId = await upsert('clinic', 'scheduRxClinicId', clinicToSanity(clinic))
  const {data: doctors, error: doctorError} = await db.from('Doctor').select('*').eq('clinicId', clinic.id)
  if (doctorError) throw new Error(`Couldn't read doctors: ${doctorError.message}`)
  for (const doctor of doctors.filter((d) => d.isActive !== false)) {
    await upsert('doctor', 'scheduRxDoctorId', doctorToSanity(doctor, sanityClinicId), {slug: {_type: 'slug', current: slugify(doctor.fullName)}})
  }
}
if (!apply) console.log('\nNothing changed. Re-run with --apply.')
