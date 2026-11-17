# Company Vercel deployment

November 17, 2026. Source R10; application R9.

GitHub is the source repository. Vercel runs the shared estimator at its own HTTPS address. Staff use that address and their approved Google accounts; they do not need GitHub accounts. The public Livewire website does not need to change.

## Ownership and prerequisites

The company Vercel project owner or web application developer handles deployment and database configuration. A Google Workspace or Google Cloud administrator supplies a company-owned OAuth web client and approved employee identities. WordPress/Elementor editing alone is not the work required for this application.

Use `Livewire-Electrical/livewire-lighting-budget` and the existing company Vercel team. The company GitHub/Vercel administrators authorize that repository through the company's own accounts.

An existing company-approved PostgreSQL database is required for shared saving. Vercel function files are temporary and cannot serve as the project database. Confirm database availability, access, backup policy and any charges within the existing company arrangements before enabling a new service. This package neither provisions a database nor establishes that one is included with the Vercel account. Shared project saving requires that storage to be configured before staff rollout.

## Repository and build

This is a cumulative source replacement. Extract the ZIP and update the repository root with all included files and folders. Do not upload the ZIP as the application, omit nested folders, or place an enclosing ZIP folder at the repository root. The `source-manifest.json` inventory must travel with the source. `npm run verify` reports missing or mixed-version files.

Import the updated repository into a new estimator project within the company Vercel team. Do not replace the company's public website project.

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Framework preset | Other |
| Node.js | 22.x |
| Install command | `npm ci` |
| Build command | `npm run build:vercel` |
| Output directory | `public` |
| Function entry point | `api/index.js`, configured by `vercel.json` |
| Application URL | Stable approved HTTPS address, including a company Vercel address if preferred |

The build validates the complete source and company catalog. It generates a public directory containing only `robots.txt`; application routes are served by the Node function. Do not change the output directory to `dist`, `pricing`, the repository root or `distribution`. Those directories contain internal application and pricing material.

## Company environment settings

Set the following in Vercel project environment settings. Do not put populated secrets in GitHub, client-side assets or a customer document. Redeploy after changing environment settings.

| Variable | Required value |
| --- | --- |
| `LIVEWIRE_ORIGIN` | Exact stable estimator origin, such as `https://estimator.company.example`, with no path |
| `DATABASE_URL` | Company-approved PostgreSQL connection URL, preferably the provider's pooled endpoint; retain its required TLS parameters |
| `LIVEWIRE_GOOGLE_DOMAIN` | Actual Google Workspace domain used by staff |
| `LIVEWIRE_GOOGLE_CLIENT_ID` | Company OAuth web client ID |
| `LIVEWIRE_GOOGLE_CLIENT_SECRET` | Company OAuth web client secret |
| `LIVEWIRE_MEMBERS` | JSON mapping approved work emails to `owner`, `pricing` or `sales`; at least one owner is required |

Membership example, using placeholders only:

```json
{"owner@company.example":"owner","estimator@company.example":"pricing","sales@company.example":"sales"}
```

Vercel supplies `VERCEL=1`. Do not set a production `LIVEWIRE_DB_PATH`, point it at `/tmp`, or use SQLite on Vercel. The application refuses to start without PostgreSQL in that environment. The database account needs permission to create and use the estimator tables, indexes and sequence. Names begin with `lw_estimator_`; no existing application tables are replaced. Configure provider connection and storage limits for the expected company workload. The function pool is limited to four connections per active instance; this is not a global connection cap.

Restrict production credentials to the Production environment. A Preview deployment needs its own approved origin, OAuth callback and separate test database. Do not connect preview branches to production projects or pricing. An unconfigured function returns an unavailable response without exposing configuration values.

## Google sign-in

Create or use a company-owned OAuth client of type Web application. Configure the consent screen for the company's employees and register this exact redirect URI:

```text
<LIVEWIRE_ORIGIN>/auth/google/callback
```

The application requests `openid email`. It checks the verified Google domain, email, approved membership and enrolled Google subject. The hosted domain hint alone does not authorize access. Cookies are Secure, HttpOnly and SameSite=Lax. Login flows and sessions live in PostgreSQL so a later request can reach a different function instance. Sessions last eight hours. Removing a member from configuration and redeploying removes their application access; existing records are retained.

## Projects, photos and pricing

The first successful application initialization creates the database objects and registers the repository catalog. Saved projects retain their catalog release until an owner or pricing administrator explicitly reprices them. Sales staff may inspect company prices but cannot publish changes. Customer documents exclude supplier costs and private handoff notes/photos. The shared application's existing approval requirement remains in force before a customer range is released.

The app automatically divides large saves, imports and calculation requests into small authenticated requests. Sections belong to one employee and one endpoint, expire after 15 minutes, and cannot be reused after finalization. Expired sections are cleared when another upload begins. Larger JSON responses stream. Each project supports up to 24 compressed JPEG photos, up to eight per room, subject to the existing image limits and 8 MB project-file limit. Photos are stored with the job in PostgreSQL, so this version does not require a separate object-storage subscription. A failed upload leaves the previously saved revision in place. Conflicting saves require reopening the newer revision.

For migration of earlier test jobs only, the import action under Shared projects accepts existing estimator JSON files. Save imported jobs to shared projects afterward. Import preserves validated room scope, notes and photos and uses company-managed pricing. Imported approvals and catalogs are not trusted as hosted approvals. Normal staff work uses shared saving and reopening. Existing SQLite databases are not migrated automatically.

Back up the PostgreSQL database, including project records, pricing and identity enrollment. Verify restoration to a separate test database. Repository history backs up code and catalog source; it does not back up saved jobs. The database provider owns recovery, retention and connection configuration. No automatic database backup service is created by the application.

## Acceptance before staff rollout

The hosted release checks run with `npm run verify`, `npm test` and `npm run build:vercel`. The verification workflow also retains development bundle regression checks. PostgreSQL tests use the actual PostgreSQL engine through PGlite, with simulated Google claims. They do not establish live Google or database-provider connectivity.

Complete these checks on the configured deployment:

1. Sign in as an approved sales employee and owner; reject an unlisted account. Confirm sign-out invalidates the session and private API requests require authentication.
2. Create a job with lights, controls, shades, notes and photos. Reopen it from another employee's session and after a deployment. Confirm two simultaneous saves cannot silently overwrite each other.
3. Confirm the expected catalog release, correct pricing roles and administrator approval workflow. Walk through the guided flow and verify required answers appear at their relevant step.
4. Generate the customer PDF and the separate internal Estimator handoff PDF. Check the range, 4% low-end retainer, scope and exclusions, and verify that room notes/photos appear only in the estimator handoff. Confirm supplier costs, private notes and photos are absent from the customer PDF. Check physical iPad interaction and the company's browser/print output.
5. Confirm database backups and a test restoration. Check the company provider's actual storage/connection limits and billing settings before enabling production use.

Live Vercel operation, Google sign-in and backup restoration require acceptance on the configured company environment.

## Maintainer handoff

Deploy the updated `Livewire-Electrical/livewire-lighting-budget` repository as a separate application in the existing company Vercel team. Use the supplied `vercel.json` and build settings. Configure existing approved PostgreSQL storage and a company Google OAuth client, with the exact application callback and employee membership list. Keep credentials in Vercel environment settings. Validate shared saving, role checks, photos and customer PDF output before staff rollout. Preserve the current public Livewire site. Confirm any proposed additional service charges before provisioning.

## Platform references

- https://vercel.com/kb/guide/is-sqlite-supported-in-vercel
- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/guides/connection-pooling-with-serverless-functions
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/postgres
