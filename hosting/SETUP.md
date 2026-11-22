# Connect Supabase Free

The account screens and Netlify configuration are prepared. No public site or paid service has been created. Apple is disabled. The current local copy remains usable without an account.

## Accounts you need

1. **Supabase:** your existing Free account and project. Signing into the Supabase dashboard with GitHub is the owner login; reader login providers are configured separately.
2. **Google Cloud / Google Auth Platform:** use your Google account to register a web sign-in application. A separate paid Google hosting subscription is not required by this implementation.
3. **Meta for Developers:** use a Facebook account to register a Facebook Login app. Complete the provider's current live-app requirements before enabling public sign-in.
4. **Resend or another SMTP email sender:** needed for email verification and password resets. A free sending tier is suitable for a small pilot, subject to its limits.
5. **Netlify:** your existing paid account when you decide to deploy. This step has not published anything.
6. **Apple later:** developer-program access and Apple web sign-in configuration. No Apple membership has been purchased.

## 1. Add the local public settings

The confirmed project is `https://rijgqjvbepslugpahcvo.supabase.co`.

Open `.env` in the app folder and fill `ORTHODOX_SUPABASE_PUBLIC_KEY` using the **Publishable** key from this same project. A legacy public `anon` key is also accepted. Keep Secret keys, `service_role` keys, database passwords, and provider client secrets out of this file. The app rejects secret/service-role keys for public configuration.

The root `.env` is ignored by Git, outside the served `dist/` folder, and excluded from the app ZIP. A safe blank `.env.example` is included. Provider flags stay `false` until each provider is configured. Environment variables explicitly supplied to Node/Netlify take precedence over the local file.

Restart with **Stop.cmd**, then **Start.cmd**, after changing local settings. Restarting does not remove browser progress. The Account page becomes active once the URL/key are valid. A valid key does not create database tables or complete provider setup.

## 2. Create the database tables

In this project's Supabase **SQL Editor**, run these files in order:

1. `supabase.sql` — initial account study-state/corrections/roles schema. Run once for a fresh project. If that foundation is already installed, do not blindly reapply its policies.
2. `email-preferences.sql` — optional email settings, consent history, and a restricted save function. This migration can be reapplied without erasing records.

No SQL needs your key pasted into it. Both migrations should report success before testing reader accounts. Each reader can access only their own saved study records and email preference. Editor/reviewer assignments remain trusted administration. The email consent function derives the reader ID, verified address, timestamp and consent wording on the server; callers cannot choose somebody else's identity or write the tables directly.

## 3. Configure email/password and outgoing email

In Supabase Auth, enable the Email provider and email confirmation. Set:

- **Site URL:** `http://127.0.0.1:4317/` while testing locally; use the final HTTPS site address for public hosting.
- **Allowed redirect URLs:** include `http://127.0.0.1:4317/` and every actual hosted origin you intend to use, including its trailing slash. Avoid unrestricted wildcard redirects.

Create a free email-sending account, verify a sending domain you control using its DNS instructions, then put the **SMTP** host/port/username/password and sender address in **Supabase's SMTP settings**. These credentials belong in Supabase, not `.env`, browser assets, Git, or chat.

Supabase's default email sender is restricted to project-team addresses and is not a public signup sender. Free SMTP plans also have daily/monthly limits. Configure and test verification, verification resend and password reset against a real non-team address before allowing public registrations. If using Resend, disable link tracking for authentication emails so account links retain their original destination.

## 4. Configure Google

Create/select a Google Cloud project and configure its Google Auth Platform branding/audience. Register a **Web application** OAuth client.

- App origins: your actual app origin(s), such as `http://127.0.0.1:4317` and later your HTTPS Netlify/domain origin.
- Authorized provider redirect URI: `https://rijgqjvbepslugpahcvo.supabase.co/auth/v1/callback`.

Put the Google client ID and client secret in **Supabase Auth → Providers → Google**. Keep the client secret there. While the Google app is in testing, add permitted test users; complete Google's publication requirements before wider access.

Only after this works, set `ORTHODOX_AUTH_GOOGLE_ENABLED=true` in local `.env` and the eventual Netlify environment. The app redirects through Supabase using SHA-256 PKCE; the code verifier stays in the originating tab. Finish sign-in in that same tab. Reading content needs no Google APIs or Gmail permissions.

## 5. Configure Facebook

Create a Meta application with the Facebook Login use case for web. Configure the account-email permission and valid OAuth redirect URI:

`https://rijgqjvbepslugpahcvo.supabase.co/auth/v1/callback`

Put the Meta app ID/secret into **Supabase Auth → Providers → Facebook**. Keep the secret there. Configure the actual website/domain and required public privacy/contact/data-deletion information in Meta. Development apps are limited to permitted users/roles; verify live access with an unrelated test reader before enabling public sign-in.

Then set `ORTHODOX_AUTH_FACEBOOK_ENABLED=true`. This requests the account email, not access to a reader's posts or friends.

## 6. Leave Apple disabled

Keep `ORTHODOX_AUTH_APPLE_ENABLED=false`. The visible Apple button is disabled and its authorization method also refuses to run.

Later setup requires an Apple web Services ID, associated primary App ID, team/key details, signing key, the Supabase callback URL and an Apple client secret configured in Supabase. The web-flow secret must be renewed within Apple's validity period (at most six months). Register the sender domain/address with Apple's private email relay if supporting Hide My Email, and test delivery. Signing keys and generated secrets must never be bundled in the browser or `.env`.

Enable the flag only after that setup and a real test succeed. This implementation has not purchased or enrolled in Apple's program.

## 7. Prepare Netlify when ready

Use the **existing app folder** as the Netlify base directory. Its `netlify.toml` specifies:

- Build command: `node scripts/prepare-netlify.cjs`.
- Publish directory: `dist`.
- Functions directory: `netlify/functions`.

Set these five variables in Netlify, available to **both builds and Functions**:

```text
ORTHODOX_SUPABASE_URL
ORTHODOX_SUPABASE_PUBLIC_KEY
ORTHODOX_AUTH_GOOGLE_ENABLED
ORTHODOX_AUTH_FACEBOOK_ENABLED
ORTHODOX_AUTH_APPLE_ENABLED
```

Use the same values as local settings, with only completed providers enabled. Do not upload `.env` or put provider/SMTP secrets in the site. The configuration function returns only validated public settings. The build writes a restrictive content-security policy containing the chosen Supabase origin. Rebuild after changing the URL or provider settings.

Deploy the app with its Functions/configuration, not just a drag-and-drop of `dist/`: static files alone cannot serve `/api/account-config`. No blanket HTML fallback is installed, so missing PDFs and other assets remain genuine errors. The local loopback server and shutdown endpoint are never deployed. Netlify accounts/deployments remain under the owner's control; no deployment was performed here.

## Email preferences and future mail

Signup consent starts unchecked. Email signup stores the explicit choice as an intent; after verification/sign-in the restricted database function records it with the verified address and server time. New social sign-ins see an unchecked preference on Account. Signing in is not consent. An existing preference always takes precedence over old signup metadata, so a withdrawal stays withdrawn.

The current wording/version is `updates-v2`: “Email me occasional updates about Holy Apostolic. Optional; you can change this preference anytime.” It covers project updates, not every possible future mailing purpose. The owner can run `export-email-opt-ins.sql` in the trusted SQL Editor and export the results there. No public mailing-list API is added. It includes only current opt-ins whose current verified email still matches the address at consent.

No campaign service or email campaign is connected. Before a future campaign, retrieve current preferences and implement the campaign's unsubscribe handling. Do not turn an old export into a permanent subscription list. Account deletion cascades to email preferences/history. Supabase/browser/database operators can access records under their administrative privileges; no end-to-end encryption is claimed.

## Pilot limits and verification

Supabase Free is selected. Monitor storage, bandwidth, Auth and SMTP limits in the actual project. Free projects can pause after inactivity and have no included automatic backups. Export the database through trusted administration, keep backups separately, and test restoration before users depend on the service. Browser exports preserve an individual reader's data; they are not a full database backup.

The app retains its established atomic revision-checked per-user study snapshot (under 5 MiB), separate guest storage and recoverable device copies. Concurrent revisions produce an explicit choice rather than silently overwriting notes. Failed saves retain local changes and retry when connected. Study content stays in static files; it is not duplicated per reader.

Run `npm run check`. Browser fixtures exercise the app flow but do not prove real credentials, live RLS or email delivery. Use `verify-live-isolation.cjs` only with two disposable, verified accounts in the intended live project, passing short-lived user tokens through environment variables. Test all enabled providers, email confirmation/recovery, opt-in/withdrawal, cross-device resume and account deletion before public access.

Primary setup references:

- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/social-sign-in/auth-facebook
- https://supabase.com/docs/guides/auth/social-sign-in/auth-apple
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/sessions/pkce-flow
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.netlify.com/build/functions/configuration/

Public release still requires the app's existing source-rights and operator-information decisions. This setup changes software/account functionality only; it does not certify religious teaching or distribution permissions.

## Existing installations after the rename

Reapply the updated `email-preferences.sql` before enabling the Holy Apostolic checkbox on an already configured project. It accepts `updates-v2` and preserves the exact historical `updates-v1` wording and existing rows/events. Old signup intents retain their original version. No live migration is performed by updating local files. The internal study identifiers and schema-1 backups continue to use their existing compatibility names.
