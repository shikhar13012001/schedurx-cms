import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  deployment: {appId: 'istrxyszpj5xjwo3l3o5jx79'},
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'placeholder',
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
})
