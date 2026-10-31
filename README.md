# ScheduRx Websites (Sanity Studio)

Content for individual doctor and clinic websites on schedurx.com. This repo is the Studio and content model only. The website frontend comes later.

## Setup

```bash
npm install
cp .env.example .env      # fill in the project ID
npm run dev
npm run seed              # optional sample clinic
```

## How content is organised

Everything belongs to one `clinic`. In the Studio, open **Clinics**, pick a clinic, and all its content is there. Reference pickers only offer content from the same clinic.

| Document | What it holds |
|---|---|
| `clinic` | Name, contact details, address, hours, facilities |
| `doctor` | Name, qualifications, registrations, biography, languages |
| `websiteSettings` | Address, domain, branding, navigation, footer, default SEO. One per clinic |
| `page` | Homepage, About, Contact and others, built from reusable sections |
| `service` | Services and treatments, with their doctors and FAQs |
| `testimonial` | Patient reviews. Can't be approved without recorded permission |
| `faq`, `article`, `articleCategory` | FAQs and blog |

Page sections are in `schemaTypes/blocks/index.ts`. Adding one there makes it available on every clinic's pages.

## Where each field comes from

**ScheduRx owns profiles.** Fields under a document's "From ScheduRx" tab match the dashboard's doctor profile page and clinic profile, using the same names. Once a document has a ScheduRx ID, those fields are read-only here and update through the sync.

**Sanity owns website content.** Fields under "Website only", and every other document, are edited here. The sync never touches them.

```bash
npm run sync                # shows what would change
npm run sync -- --apply
```

The sync only copies the fields listed in `scripts/profile-map.mjs`. A doctor's personal phone, UPI ID, fees and schedule rules stay out, as does all patient data.

## Rules

- No patient records, diagnoses or contact details in Sanity. Testimonials hold only the name a patient agreed to.
- A secret never gets a `SANITY_STUDIO_` prefix, because those values are bundled into the Studio.

## Access

Internal staff get a Sanity project role. Giving a clinic's own staff access to just their clinic would need custom roles, which depend on the Sanity plan, so check that before promising it.

## Campaign website

The dashboard's campaign website has to line up with this model. Its implementation is being provided separately, and sections or settings will be adjusted to match once it's reviewed.
