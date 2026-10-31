// What moves from ScheduRx to Sanity. These are allowlists on purpose: a new column
// in ScheduRx stays out of Sanity until someone adds it here. Patient data is never
// read, and neither are a doctor's personal phone, UPI ID, fees or schedule rules.

const CLINIC_FIELDS = ['name', 'description', 'phone', 'email', 'logoUrl', 'addressLine1', 'addressLine2', 'locality', 'city', 'state', 'pincode', 'landmark', 'mapsUrl', 'googleReviewUrl', 'facilities', 'paymentMethods', 'workingDays', 'openingHour', 'closingHour']
const DOCTOR_FIELDS = ['fullName', 'specialty', 'headline', 'bio', 'services', 'languages', 'consultationModes']
const DOCTOR_LISTS = {
  photos: {type: 'doctorPhoto', fields: ['url', 'isPrimary']},
  qualifications: {type: 'qualification', fields: ['degree', 'institution', 'year']},
  registrations: {type: 'registration', fields: ['number', 'council', 'year']},
  affiliations: {type: 'affiliation', fields: ['organization', 'role']},
  awards: {type: 'award', fields: ['name', 'year']},
  memberships: {type: 'membership', fields: ['name', 'sinceYear']},
}
const NUMERIC = new Set(['year', 'sinceYear'])

function copy(row, fields) {
  const out = {}
  for (const field of fields) {
    const value = row?.[field]
    out[field] = value === undefined || value === '' ? null : value
  }
  return out
}

function listItems(rows, {type, fields}) {
  if (!Array.isArray(rows)) return []
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row, i) => {
      const item = {_type: type, _key: `${type}-${i}`}
      for (const field of fields) {
        const value = row[field]
        if (value === undefined || value === null || value === '') continue
        // The dashboard's forms can save years as text.
        item[field] = NUMERIC.has(field) ? Number(value) : value
      }
      return item
    })
}

export function clinicToSanity(row) {
  return {scheduRxClinicId: row.id, ...copy(row, CLINIC_FIELDS)}
}

export function doctorToSanity(row, sanityClinicId) {
  const lists = Object.fromEntries(Object.entries(DOCTOR_LISTS).map(([name, spec]) => [name, listItems(row[name], spec)]))
  const years = Number(row.additionalInfo?.yearsExperience)
  return {
    scheduRxDoctorId: row.id,
    clinic: {_type: 'reference', _ref: sanityClinicId},
    ...copy(row, DOCTOR_FIELDS),
    ...lists,
    yearsExperience: Number.isFinite(years) && row.additionalInfo?.yearsExperience !== '' ? years : null,
  }
}

export function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/^dr\.?\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
