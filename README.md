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

## Where content lives

**Sanity holds doctor and clinic content and website content.** The dashboard's profile pages and the public site read the same published documents.

| Change made in | What happens |
|---|---|
| Dashboard profile | The backend saves to Sanity first. If that fails nothing changes, and the dashboard shows an error. |
| Sanity Studio | Publishing calls a signed webhook, which updates the ScheduRx tables' copy. |

The Doctor and Clinic tables keep a read-only copy so messaging, voice and scheduling don't call Sanity. Appointments, payments, patients and medical records stay in ScheduRx, joined by `scheduRxClinicId` and `scheduRxDoctorId`.

A clinic's working days and opening hours decide what can be booked, so they're changed in the dashboard and read-only here. Website hours are under **Locations and hours**.

### Connecting it

Backend env: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_WRITE_TOKEN`, `SANITY_WEBHOOK_SECRET`.

Add a Sanity webhook to `https://api.schedurx.com/webhooks/sanity`, for create and update, with the filter `_type in ["doctor", "clinic"]`, the projection `{...}`, drafts off, and the same secret.

To move existing profiles from the tables, once:

```bash
npm run migrate                # shows what would change
npm run migrate -- --apply
```

It copies only the fields in `scripts/profile-map.mjs`. A doctor's personal phone, UPI ID, fees and schedule rules stay out, as does all patient data. Anything already in Sanity is left alone.

## Rules

- No patient records, diagnoses or contact details in Sanity. Testimonials hold only the name a patient agreed to.
- A secret never gets a `SANITY_STUDIO_` prefix, because those values are bundled into the Studio.

## Access

Internal staff get a Sanity project role. Giving a clinic's own staff access to just their clinic would need custom roles, which depend on the Sanity plan, so check that before promising it.

## Campaign website (`web/`)

The clinic site patients see, served at `/<slug>` for each Live `websiteSettings`.

- `web/lib/campaign/` is the Clinic Studio renderer and model. The only change is that a site can now be indexed by search engines.
- `web/lib/practice-from-sanity.ts` turns Sanity documents into what the renderer reads. Every field lines up here.
- `web/lib/site-query.ts` has the query, shared with the Studio preview. Testimonials need recorded permission, and articles need approval.
- Book opens `book.schedurx.com/book/<clinic>` with the doctor already chosen.

```bash
cd web
npm install
cp .env.example .env.local   # fill in the project ID
npm run dev                  # then open /<slug> of a Live site
npm test
```

Section headings such as "A clearer path to feeling better." are still written into the renderer. The `page` documents and their sections aren't read by this site yet.

## Replacing the old Clinic Studio editor

| In the old editor | Now |
|---|---|
| Forms for every content section | Studio documents |
| Create, duplicate, search | Built into the Studio |
| Live preview at desktop, tablet and phone widths, full page | **Preview** tab on Website settings |
| Launch checklist, portrait prompt, HTML download | Same Preview tab |
| Image uploads | Sanity assets, with cropping |
| Releases, history, restore | Publishing and document history. Length of history depends on the Sanity plan |
| Archive | Status: Paused |
| JSON import and export | Not carried over. `sanity dataset export` covers backups |
