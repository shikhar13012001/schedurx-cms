import {test} from 'node:test'
import assert from 'node:assert/strict'
import {clinicToSanity, doctorToSanity, slugify} from './profile-map.mjs'

const doctorRow = {
  id: 'doc-1',
  clinicId: 'c1',
  fullName: 'Dr. Priya Sharma',
  specialty: 'Dermatology',
  headline: 'Consultant Dermatologist',
  bio: 'About me',
  languages: ['English', 'Hindi'],
  services: ['Acne care'],
  consultationModes: ['In-clinic'],
  photos: [{url: 'https://x.test/a.jpg', isPrimary: true, secret: 'dropped'}],
  qualifications: [{degree: 'MBBS', institution: 'AIIMS', year: '2010'}],
  registrations: [{number: 'DMC123', council: 'Delhi', year: 2011}],
  affiliations: [{organization: 'City Hospital', role: 'Consultant'}],
  awards: [{name: 'Best Doctor', year: 2020}],
  memberships: [{name: 'IADVL', sinceYear: '2015'}],
  additionalInfo: {yearsExperience: '12', notes: 'private'},
  personalPhone: '+919800000000',
  upiId: 'priya@upi',
  feeInr: 500,
  breaks: [],
}

test('a doctor copies across with the profile page\'s field names', () => {
  const doc = doctorToSanity(doctorRow, 'sanity-clinic')
  assert.equal(doc.scheduRxDoctorId, 'doc-1')
  assert.deepEqual(doc.clinic, {_type: 'reference', _ref: 'sanity-clinic'})
  assert.equal(doc.fullName, 'Dr. Priya Sharma')
  assert.equal(doc.yearsExperience, 12)
  assert.deepEqual(doc.languages, ['English', 'Hindi'])
  assert.deepEqual(doc.qualifications, [{_type: 'qualification', _key: 'qualification-0', degree: 'MBBS', institution: 'AIIMS', year: 2010}])
  assert.equal(doc.memberships[0].sinceYear, 2015)
})

test('private doctor details never reach Sanity', () => {
  const text = JSON.stringify(doctorToSanity(doctorRow, 'c'))
  for (const secret of ['+919800000000', 'priya@upi', 'private', 'dropped', 'feeInr', 'breaks']) assert.ok(!text.includes(secret), secret)
})

test('a clinic copies only its public profile, and blanks clear the old value', () => {
  const doc = clinicToSanity({id: 'c1', name: 'Sunrise', description: '', tokenAmountPaise: 30000, plan: {planId: 'premium'}, settings: {x: 1}, facilities: ['Parking']})
  assert.equal(doc.scheduRxClinicId, 'c1')
  assert.equal(doc.name, 'Sunrise')
  assert.equal(doc.description, null)
  assert.deepEqual(doc.facilities, ['Parking'])
  for (const secret of ['tokenAmountPaise', 'plan', 'settings']) assert.ok(!(secret in doc), secret)
})

test('messy saved values don\'t break it', () => {
  const doc = doctorToSanity({id: 'd', fullName: 'A', qualifications: 'not a list', awards: [null, {name: 'X'}], additionalInfo: null}, 'c')
  assert.deepEqual(doc.qualifications, [])
  assert.deepEqual(doc.awards, [{_type: 'award', _key: 'award-0', name: 'X'}])
  assert.equal(doc.yearsExperience, null)
})

test('slugs drop the Dr. prefix', () => {
  assert.equal(slugify('Dr. Priya Sharma'), 'priya-sharma')
  assert.equal(slugify("Dr. Sharma's Clinic"), 'sharmas-clinic')
})
