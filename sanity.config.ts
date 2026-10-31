import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {clinicTemplates, structure} from './structure'

export default defineConfig({
  name: 'schedurx',
  title: 'ScheduRx Websites',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'placeholder',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool({structure}), visionTool()],
  schema: {
    types: schemaTypes,
    templates: (previous) => [...previous, ...clinicTemplates],
  },
})
