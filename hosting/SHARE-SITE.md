# Share Holy Apostolic on Netlify

The prepared **holy-apostolic-netlify** folder is a static website for **holyapostolic.com**. Visitors do not install Node or run a local server. Their progress is saved in their own browser. Supabase is not needed for this guest-reading version.

## Upload the site

1. Use the prepared **Holy-Apostolic-Netlify.zip**, unzip it, and upload the folder containing **index.html** to your Netlify project's deploy dropzone. To recreate that folder from the app source, run **npm run prepare:static**. It is generated beside the existing app as `outputs/holy-apostolic-netlify`.
2. Enable **Forms → form detection**, then deploy or redeploy that folder. Netlify should detect a form named **feedback**.
3. Under **Forms → Submission notifications**, add an email notification for **feedback** addressed to your email. Using the email on your Netlify account is the simplest choice. Netlify then sends the visitor's email and message to you. The field named `email` sets the notification's Reply-to address.
4. Under **Domain management**, add **holyapostolic.com** and follow Netlify's exact DNS instructions for that project. Choose one primary HTTPS address and redirect its alternative hostnames to it.

The folder is already built; manual uploads do not need a build command. Keep `.env`, Node server files, source project folders and private runtime files out of the upload. The supplied static package contains public website files only. It includes a disabled public account configuration so guest use needs no Functions or database.

Test one real feedback submission after deployment. Form recognition, the recipient notification, and live email delivery must be verified in your Netlify account; they cannot be confirmed from the local server. The local form has the same simple interface, and preserves entered text if a submission fails.

## Guest progress and accounts

Progress, notes, bookmarks and prayer favorites persist in browser local storage. Public offline downloads use a separate browser cache. Visitors do not share a progress record. Changing browser/device or clearing browser data gives a separate or empty guest record.

Your current `http://127.0.0.1:4317` progress will not automatically appear on `https://holyapostolic.com`. Export a backup in local **Settings**, then restore it in Settings on the hosted site if you want to bring it over. Different domains, including a temporary Netlify address or `www`, have separate browser storage.

The homepage includes Sign up and Log in links. Live account creation, Google/Facebook login and synchronized progress still require the Supabase/provider/SMTP setup in **SETUP.md**. Apple remains disabled. The static guest package deliberately does not activate those services. For accounts later, deploy the full source project with its existing `netlify.toml`, build command and account-config Function instead of replacing the guest configuration with guessed credentials.

## Homepage, notice and navigation

All public readings have their own static HTML pages and normal shareable URLs. The homepage and reading text do not wait for authentication or other libraries. Small indexes warm gradually after the first page loads; clicking a section gives it priority and shows a loading message only where needed. Artwork, Bible books, full biographies and PDFs load when used. Old hash links remain compatible.

The desktop navigation starts as an icon rail, expands on hover or keyboard focus, and has Expand navigation / Collapse navigation to preserve its width across pages and visits in that browser. Mobile visitors use the Menu button. The beta notice has an X and dismisses after ten inactive seconds; interaction with the notice pauses dismissal. It stays dismissed for the current tab session.

The feedback page requests only email and message, plus invisible platform/anti-spam fields. It does not subscribe visitors to email updates. The notice and search-engine exclusions identify the current development release; they are not a password. If you want access limited to invited friends, use Netlify's visitor password protection.

## Official references

- [Deploy a static folder](https://docs.netlify.com/deploy/create-deploys/)
- [Enable form detection](https://docs.netlify.com/manage/forms/setup/)
- [Email notifications and Reply-to](https://docs.netlify.com/manage/forms/notifications/)
- [Attach your domain](https://docs.netlify.com/manage/domains/manage-domains/assign-a-domain-to-your-site-app/)
- [Browser storage and origins](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Netlify visitor access](https://docs.netlify.com/manage/security/secure-access-to-sites/overview/)
