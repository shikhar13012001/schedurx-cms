// Connects Studio publishes to the backend, which keeps its copy of profiles in step.
// Needs a project admin's CLI login, and SANITY_WEBHOOK_SECRET in .env:
//
//   npx sanity exec scripts/create-webhook.ts --with-user-token
//
// Safe to run again: it does nothing if the webhook already exists.

import {readFileSync} from 'node:fs'
import {getCliClient} from 'sanity/cli'

const NAME = 'ScheduRx profile sync'
const TARGET = 'https://api.schedurx.com/webhooks/sanity'

const secret = /^SANITY_WEBHOOK_SECRET=(.*)$/m.exec(readFileSync('.env', 'utf8'))?.[1]?.trim().replace(/^["']|["']$/g, '')
if (!secret) throw new Error('SANITY_WEBHOOK_SECRET is missing from .env')

const client = getCliClient({apiVersion: '2021-10-04'}).withConfig({useProjectHostname: false, useCdn: false})
const {projectId, dataset} = client.config()
const url = `/hooks/projects/${projectId}`

const existing: {name: string; url: string}[] = await client.request({url})
const found = existing.find((hook) => hook.name === NAME)
if (found) {
  console.log(`Already set up: ${found.name} -> ${found.url}`)
} else {
  const created = await client.request({
    url,
    method: 'POST',
    body: {
      type: 'document',
      name: NAME,
      description: 'Keeps the backend copy of doctor and clinic profiles in step',
      url: TARGET,
      dataset,
      httpMethod: 'POST',
      apiVersion: 'v2026-02-01',
      includeDrafts: false,
      headers: {},
      secret,
      rule: {on: ['create', 'update'], filter: '_type in ["doctor", "clinic"]', projection: '{...}'},
    },
  })
  console.log(`Created: ${created.name} -> ${created.url} (${created.dataset})`)
}
