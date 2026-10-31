import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {LAYOUTS, THEMES, validateData} from './campaign/model'
import {renderSite} from './campaign/render'
import {imageUrl, plainText, practiceFromSanity, type SiteDocs} from './practice-from-sanity'

const env = {projectId: 'proj', dataset: 'production', whatsappNumber: '+17113298585'}

// The same sample a Sanity import would create, joined the way SITE_QUERY joins it.
function sampleSite(): SiteDocs {
  const docs = readFileSync(join(process.cwd(), '../seed/sample-site.ndjson'), 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  const all = (type: string) => docs.filter((doc) => doc._type === type)
  return {
    ...all('websiteSettings')[0],
    clinic: all('clinic')[0],
    doctors: all('doctor'),
    services: all('service'),
    locations: all('location'),
    faqs: all('faq'),
    testimonials: all('testimonial'),
    articles: all('article').map((a) => ({...a, approved: true})),
  }
}

test('sample Sanity content passes the campaign site\'s own validator', () => {
  assert.doesNotThrow(() => validateData(practiceFromSanity(sampleSite(), env)))
})

test('the site shows what\'s in Sanity', () => {
  const html = renderSite(practiceFromSanity(sampleSite(), env), 'https://example.test', {indexable: true})
  for (const expected of ['Sample Skin &amp; Family Clinic', 'Dr. Sample Doctor', 'Acne care', 'Do I need an appointment?', 'Indiranagar', 'Sample testimonial text', 'Book a consultation', 'MBBS']) {
    assert.ok(html.includes(expected), expected)
  }
  assert.ok(!/content="noindex/.test(html), 'a live site can be found by search engines')
})

test('every layout and theme renders', () => {
  for (const layout of LAYOUTS) {
    for (const theme of THEMES) {
      const site = sampleSite()
      site.design = {...site.design, layout: layout.id, theme: theme.id}
      assert.ok(renderSite(practiceFromSanity(site, env)).includes(theme.colors[0]), `${layout.id}/${theme.id}`)
    }
  }
})

test('the site is noindex unless told otherwise', () => {
  assert.ok(/content="noindex/.test(renderSite(practiceFromSanity(sampleSite(), env))))
  assert.ok(/content="noindex/.test(renderSite(practiceFromSanity(sampleSite(), env), '', {indexable: false})))
})

test('content from the dashboard is enough: no location written, clinic profile used', () => {
  const site = sampleSite()
  site.locations = []
  site.clinic.workingDays = ['Mon', 'Sat']
  site.clinic.openingHour = 9
  site.clinic.closingHour = 20
  const [location] = practiceFromSanity(site, env).locations
  assert.equal(location.address, '12 Sample Road')
  assert.equal(location.postcode, '560038')
  assert.deepEqual(location.hours[0], {day: 'Monday', closed: false, slots: [{start: '09:00', end: '20:00'}]})
  assert.equal(location.hours[1].closed, true)
})

test('a synced doctor keeps a clean name, and the lead doctor comes first', () => {
  const site = sampleSite()
  site.doctors = [{_id: 'a', fullName: 'Asha Rao', title: 'Dr.'}, {_id: 'b', fullName: 'Dr. Bina Das', title: 'Dr.'}]
  site.primaryDoctor = {_ref: 'b'}
  const {doctors} = practiceFromSanity(site, env)
  assert.deepEqual([doctors[0].id, doctors[0].name], ['b', 'Bina Das'])
})

test('WhatsApp booking opens at this clinic through the shared number', () => {
  const site = sampleSite()
  site.clinic.scheduRxClinicId = 'poc-clinic-001'
  const {booking} = practiceFromSanity(site, env)
  assert.equal(booking.whatsapp, '+17113298585')
  assert.equal(booking.message, 'CLINIC poc-clinic-001 - Hi')
})

test('portrait: uploaded first, then the dashboard photo, with its crop', () => {
  const site = sampleSite()
  site.doctors[0].photos = [{url: 'https://x.test/synced.jpg', isPrimary: true}]
  assert.equal(practiceFromSanity(site, env).media[0].url, 'https://x.test/synced.jpg')
  site.doctors[0].portrait = {asset: {_ref: 'image-abc123-800x1000-jpg'}, alt: 'Portrait', hotspot: {x: 0.4, y: 0.25}}
  const practice = practiceFromSanity(site, env)
  assert.match(practice.media[0].url, /^https:\/\/cdn\.sanity\.io\/images\/proj\/production\/abc123-800x1000\.jpg/)
  assert.deepEqual([practice.design.focalX, practice.design.focalY], [40, 25])
})

test('helpers cope with empty and odd values', () => {
  assert.equal(plainText(undefined), '')
  assert.equal(plainText([{_type: 'block', children: [{text: 'One'}]}, {_type: 'altImage'}, {_type: 'block', children: [{text: 'Two'}]}]), 'One\n\nTwo')
  assert.equal(imageUrl({asset: {_ref: 'nonsense'}}, env), '')
  assert.doesNotThrow(() => renderSite(practiceFromSanity({clinic: {name: 'Bare'}} as unknown as SiteDocs, env)))
})

test('a script in content can\'t run on the page', () => {
  const site = sampleSite()
  site.clinic.name = '<script>alert(1)</script>'
  const html = renderSite(practiceFromSanity(site, env))
  assert.ok(!html.includes('<script>alert(1)</script>'))
})
