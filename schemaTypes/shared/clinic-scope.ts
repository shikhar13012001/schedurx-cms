import {defineField} from 'sanity'

// Every piece of website content belongs to exactly one clinic.
export const clinicField = defineField({
  name: 'clinic',
  type: 'reference',
  to: [{type: 'clinic'}],
  description: 'The clinic whose website this belongs to.',
  validation: (rule) => rule.required(),
  options: {disableNew: true},
})

// Reference pickers only offer content from the same clinic.
export const sameClinic = {
  filter: ({document}: any) => {
    const clinic = document?.clinic?._ref
    return clinic ? {filter: 'clinic._ref == $clinic', params: {clinic}} : {filter: 'false', params: {}}
  },
}

// One of something per clinic, such as website settings or a homepage.
export function onePerClinic(type: string, extra = '', extraParams: Record<string, unknown> = {}) {
  return async (clinic: {_ref?: string} | undefined, context: any) => {
    if (!clinic?._ref) return true
    const id = String(context.document?._id ?? '').replace(/^drafts\./, '')
    const others = await context.getClient({apiVersion: '2026-02-01'}).fetch(
      `count(*[_type == $type && clinic._ref == $clinic && !(_id in [$id, "drafts." + $id]) ${extra}])`,
      {type, clinic: clinic._ref, id, ...extraParams},
    )
    return others === 0 || 'This clinic already has one of these.'
  }
}
