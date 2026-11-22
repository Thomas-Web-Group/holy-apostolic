# Account and public-hosting setup

## Current setup — 4.2

Start with **[SETUP.md](SETUP.md)** for the complete Supabase Free / Google / Facebook / Apple / email instructions and Netlify configuration. The confirmed project URL is in the ignored root `.env`; add its matching Publishable key locally. This file and all `.runtime` data are excluded from the distribution ZIP. No live project schema or providers have been configured by this build.

Apply `supabase.sql` once to a fresh project, then `email-preferences.sql`. Apple stays disabled. Email opt-ins are separate from study snapshots; `export-email-opt-ins.sql` is an owner-only query in the trusted SQL Editor. Signup intent is finalized after verified sign-in, and old intent cannot override a later withdrawal. Social callbacks use tab-bound SHA-256 PKCE and clear callback codes from the address.

The app stays local until you choose hosting. No external service has been created, connected, or published. Reading, local notebooks, and downloads work without an account. Managed authentication and synchronization are implemented against Supabase Auth/PostgREST; live email delivery, real database policies, backups, and deployment require setup and verification in the intended project.

## Connect an account service

1. Create your own Supabase project. In its SQL editor, apply `supabase.sql` once. Review it first. It creates per-user study state, a compare-and-swap save function, private corrections, trusted editor/reviewer assignments, and self-account deletion. Existing tables/policies should be reconciled before reapplying; this is a migration, not an unconditional repeated startup script.
2. Enable email/password authentication and confirmation. Configure production email delivery, the site URL, and allowed redirect URLs. For local tests use `http://127.0.0.1:4317/`; for hosting use the final HTTPS origin. Email links clear their tokens from the URL before reading identity. Social callbacks exchange a code using the original tab's verifier. Recovery/resend requests specify the current app origin, which must be in the allow list.
3. Supply only the project URL and publishable key (or legacy public anon key) to the local server:

```powershell
$env:ORTHODOX_SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co'
$env:ORTHODOX_SUPABASE_PUBLIC_KEY = 'YOUR-PUBLISHABLE-KEY'
node server.cjs
```

Never provide a service-role key, secret key, database password, or signing key to the browser/configuration. The local server validates the project origin and rejects secret/service-role credentials. Its `/api/account-config` response contains public configuration only. The content security policy permits connections only to the configured provider and the app itself.

4. Create two test reader accounts. Test confirmation, login, logout, recovery, expiry, deletion, and synchronization. The supplied live isolation checker can use short-lived user tokens passed through environment variables. Never put credentials/tokens in a command argument, committed file, report, or ZIP. See `verify-live-isolation.cjs`.
5. Assign editor/reviewer roles using the trusted Supabase SQL interface, not user metadata:

```sql
insert into public.editor_roles(user_id,role) values ('USER-UUID','editor');
insert into public.editor_roles(user_id,role) values ('REVIEWER-UUID','reviewer');
```

An editor may investigate and prepare a correction. Only a reviewer may mark it reviewed. A review status is a workflow record; it is not a claim of ecclesiastical approval. Publishing actual content remains a source-file change, audit, and release operation.

## Data behavior

Guest data keeps its original keys. Signed-in users get separate local keys suffixed with their verified account ID. The UI explicitly offers guest import; it is not automatic. Conflicting guest and account notes are retained with labels. Existing schema-1 backups remain readable; new backups also contain the study-tools record. Legacy backups without that optional record do not erase a newer notebook.

Each signed-in page has its own actor-scoped cache and base revision, preventing two stale tabs from sharing a newer revision and silently overwriting notes. Reloads clone the previous page's copy without deleting the original. Older copies are listed for export on Account, including copies retained after session storage is lost. This deliberately favors recovery over automatic cache deletion. Export needed copies and clear account caches to reclaim finite browser storage. Clear-cache/sign-out does not delete synchronized state. Pending synchronization is invalidated when identity changes.

Account tokens remain in session storage for that browser tab. Account reading data is cached locally for offline use, so a shared browser profile is not a secure place for sensitive notes. Sign-out returns to guest data; account deletion also clears that account's local keys in the active browser. Other devices' offline copies cannot be remotely erased. Users can clear them in Settings. No end-to-end encryption is claimed.

Synchronized payloads have a database revision. A concurrent edit produces a visible conflict with separate exports and a choice of version. Both records are retained until the user chooses. Deletions and text edits are not silently merged. Failed requests retain local changes and can be retried. The database function checks the expected revision atomically. Account identity is checked against the provider; row-level policies are the server-side isolation boundary.

## Public deployment

The app now includes `netlify.toml`, a public-configuration Function and a build script for restrictive headers. Follow SETUP.md and configure Netlify's build/Function environment before deployment. Static-folder upload alone does not supply the configuration endpoint. The current local server is intentionally loopback-only and has a local shutdown endpoint; do not expose it on a public interface. No deployment was performed.

Before launch, review reproduction permissions for the chosen audience/territory, attribution, source accuracy, independent theological review status, privacy/contact details, account-data retention, recovery, monitoring, and tested database restoration. Use the app's editorial inventory as evidence, not as a certificate that distribution rights or theology have been approved. Configure the managed provider's email/rate-limit/abuse controls and backup retention for the actual deployment. Verify account isolation on the live backend before accepting real users.

Primary implementation references:

- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions

The current local integration is tested with controlled account-service responses. A mock test does not validate a deployed database or real email delivery.
