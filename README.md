# Holy Apostolic

An Orthodox learning resource with lessons, Saints and icons, services, prayers, the church year, and private study tools.

## GitHub source

Repository: [Thomas-Web-Group/holy-apostolic](https://github.com/Thomas-Web-Group/holy-apostolic), private. **main** is the single default/production branch. The repository root is this app folder; the surrounding workspace, research scratch files, ZIP exports, dependencies and runtime state are excluded.

Clone with `git clone https://github.com/Thomas-Web-Group/holy-apostolic.git`. The checked-in static app runs locally with Start.cmd or `npm start`; stop with Stop.cmd or `npm run stop`. For source maintenance or rebuilding, run `npm ci`, then `npm run check` and the documented build commands. `.gitattributes` preserves exact file bytes across platforms because source and Scripture audits use hashes.

When connecting this repository to Netlify, select **main**, leave the base directory at the repository root, and use the existing netlify.toml: build command `node scripts/prepare-netlify.cjs`, publish directory `dist`, Functions directory `netlify/functions`. Pushing this repository does not itself configure or deploy a Netlify site. Configure public Supabase app settings separately in Netlify; local .env and provider secrets are never committed. Keep private study exports outside the repository.

## Saint titles and profiles — 4.11.0

App-authored readings and labels now identify Saints with **St.** or **Sts.**, with appropriate Theotokos and Archangel titles. Names in readings link to the corresponding Saint profile. The Orthodox catechesis introduction links **St. Philaret of Moscow**. Short names use reviewed paragraph/source contexts so different Saints Cyril, John, Isaac and Philip are not merged, Bible references remain Scripture references, and Protestant authors are not assigned saintly titles.

The library has **213 profiles**, including **53 newly sourced lives** for people already named in lessons, prayers and historical material. Each new life has background, notable events, death circumstances, legacy, chronology and source references. Ten verified historical depictions were added with file-specific licences and credits; profiles without a verified reusable depiction show an honest image fallback. Ambiguous historical names remain unlinked until their identity and Orthodox recognition are established.

Original prayers, quotations, Scripture, publication titles and existing content files are unchanged. Display honorifics are separate from the text used by notebook anchors and highlight offsets, preserving older saved passages. Navigation labels keep their existing lesson/section destinations; personal notes are never rewritten. All public content remains static, with the same local startup, browser storage, offline collections and optional account setup.

## Clear lessons and navigation — 4.10.0

All **229 lessons** now start with modern-English explanations grounded in their existing source material. The new teaching layer covers **638 reading sections**, identifies authors and historical context where needed, and briefly defines key theme words. Catechism questions use modern editorial headings. Original quotations, Scripture, prayer units and published wording remain unchanged and available to expand. The explanation layer and its source/peer-review audit are separate files: `dist/content/lesson-explanations.json` and `lesson-explanations-audit.json`.

Navigation now uses **Learn**, **Prayers** and **Explore**. Explore links directly to Saints, icons, history, glossary, church guides, services and related resources; About remains in the footer. Existing lesson URLs, the `/learn/` address, saved notes, bookmarks, completion records and paragraph links are retained. Updated explanations have a new reading revision without deleting earlier completion records.

Sources and publication details are compact disclosures. Footnote links open the relevant reference; original passages retain exact wording and required attributions. Glossary and Bible previews work in the new explanatory text. Study tools remain outside the collapsed references. Printing includes references/credits and restores their prior state afterwards.

The menu ornament now sits below the wordmark with visible space. The beta notice starts hidden in HTML to prevent a dismissal flash, appears for a full ten idle seconds, pauses for hover/focus or a hidden tab, and can be closed with X. Only manual dismissal is remembered for the tab session; an automatic timeout does not permanently suppress a later full visit.

Run locally using **Start.cmd** or the existing **Holy Apostolic** Project Dashboard entry at **http://127.0.0.1:4317/**; stop with **Stop.cmd**. No dependency installation is needed to use the already-built app. Source maintenance commands and static Netlify preparation remain below. Refresh older tabs and download offline collections again for this edition. No live deployment or account/provider setup was performed.

## Independent pages and responsive navigation — 4.9.0

Public readings now have real URLs and complete static HTML: `/learn/`, `/lesson/d-start/`, `/saints/`, `/saint/seraphim/`, `/icons/`, `/prayers/`, `/glossary/`, and the other existing sections. Old `#/...` bookmarks continue to resolve. Each lesson, Saint, icon, prayer and glossary entry can be read without waiting for a catalogue or account. JavaScript adds filters, previews, diagrams, saved study tools and the browser-local rolling calendar.

Navigation runs independently of authentication. Selecting a page immediately shows its own loading status if its HTML is not already available. The clicked section takes priority over background downloads. After the initial page finishes loading, small section indexes warm one at a time, at least 1.6 seconds apart, while the visitor is idle. Background work pauses for interaction, hidden tabs and reduced-data connections. It does not download all biographies, large artwork, Bible books, PDFs or the source inventory. Text decoration is batched to keep clicks responsive. Individual reader payloads have a bounded memory cache.

Measured original text data: Saints **3.15 MB**, curriculum **1.98 MB**, icons **1.14 MB**, source inventory **1.05 MB**. The new curriculum index is **114 KB**. The Saints gallery uses its own **571 KB** index, with full biographies loaded individually. These are uncompressed file sizes, not promised network timings. Public Netlify hosting remains static; personal progress stays in the same browser storage or separately configured Supabase account.

The sidebar control is **Expand navigation / Collapse navigation**. Hover and keyboard expansion remain. Selecting a destination collapses the temporary hover panel so it cannot cover the next page's controls. The existing saved expanded/collapsed preference is retained.

Generated public files are in `dist/`. To rebuild after changing content or a renderer, run **npm ci**, then **npm run build:pages** and **npm run build:offline**. `npm ci` installs the pinned build-only HTML parser; visitors do not download it. **npm run prepare:static** performs both builds and refreshes the guest Netlify folder. The normal Netlify source build also regenerates pages and offline files. No database or server rendering is required to publish the public library.

## Welcome page and Netlify sharing — 4.8.0

The homepage now welcomes visitors with real, credited Orthodox church photographs, familiar navigation, and starting points for the curriculum, daily prayer and Saints. It is present in the initial static HTML; library files load in the background. Home never automatically opens a reading. The desktop left navigation is an icon rail that expands on hover or keyboard focus; choose Expand navigation to keep that preference across pages and visits. Mobile uses Menu.

The beta notice can be closed with X and hides after ten inactive seconds. Feedback is a simple **email + message** form with no beta/draft mode. Netlify Forms can email those submissions to you after you enable form detection and an email notification in your Netlify account. No live deployment or email delivery has been performed here.

For hosting, use the prepared **Holy-Apostolic-Netlify.zip** or run **npm run prepare:static** and upload the generated **outputs/holy-apostolic-netlify** folder. This guest package needs no database, Functions, secrets, or Node server. Guest progress already uses each browser's local storage; hosted and local addresses have separate records. Sign-up/login screens are prepared, but live accounts remain dependent on the separate Supabase setup. Follow **hosting/SHARE-SITE.md** for the exact Netlify upload, email notification and **holyapostolic.com** domain steps.

## Content-first reading — 4.7.0

Prayer pages open with the prayer itself. Publication/edition details and references follow the text, and repeated catalogue dates are omitted from display titles. Daily prayer leads the library; other complete published orders remain available below it. Reading size is fixed to Comfortable across the app. Generated-summary badges are removed while quotation/summary source records and exact published wording are retained.

Launch and storage are unchanged: use **Holy Apostolic** in the Project Dashboard or **Start.cmd** in this folder, at **http://127.0.0.1:4317/**. Stop with **Stop.cmd**. Refresh an old tab and re-download offline collections after this update. The current package remains **Holy-Apostolic.zip**. Optional live account setup remains separately pending.

## Holy Apostolic — 4.6.0

### Inside the church — clearer reading flow

The church guide now opens with three straightforward ways in: **Explore the space** (33 places and objects), **Follow the Divine Liturgy** (24 published moments), or **Read the visitor guide** (8 published topics). A single sequence bar above the map and reading names the current selection and the exact Previous/Next destinations, and explains that moving through the sequence updates both sides together. The same named navigation remains available after each source reading.

The map and reading now share the ordinary page scroll instead of creating nested vertical scrollbars. The plan scales to the available width; horizontal scrolling appears only after deliberately choosing **Enlarge diagram**. The existing left navigation, diagrams, source text, summaries, citations, 33 parts, 24 Liturgy moments, 8 visitor topics, jump menus, keyboard behavior, and URL-restored selections remain intact.

The church guide, Church Year, Prayer, and Saints pages have a focused navigation update. The Russian-style church arrangement now keeps its step controls anchored while moving through Liturgy or visitor guidance, constrains the diagram panel to the available desktop height, and gives every diagram label a clear background halo so selected outlines do not cross its wording. Tablet and phone layouts remain in normal page flow.

**Church year** now opens with a conventional monthly civil calendar at the top. It begins with the browser’s current local date, lets you move through the existing rolling 12-month window, and annotates civil days with the selected church-year commemorations. Clicking an annotation opens the existing sourced feast detail. The exact rolling range, Julian/revised fixed-date choice, filters, list, legacy civil-year links, and 1900–2099 limits remain.

**Prayer** now offers three guided published orders: Before Sleep, Commemoration of the Living and the Dead, and Thanksgiving After Communion. Each guide keeps one complete source unit in its printed sequence, highlights its current section, and identifies the source’s own rubric blocks. It does not combine separate entries, invent worship directions, or create a new prayer rule.

**Saints** now switches between the existing profile cards and a filter-aware historical timeline. The timeline uses broad browsing bands while preserving every profile’s source-qualified date, period, region, and uncertainty wording; it does not convert uncertain dates into exact points. All existing profile content, source links, searches, and saved study data are unchanged.

The app is **Holy Apostolic**. The browser title, header, home page, footer, installed-app manifest, cross favicon, export filenames and existing Project Dashboard entry use this identity. The current installed folder remains `outputs/the-orthodox-way` and the local address remains **http://127.0.0.1:4317/**. Launch with **Start.cmd** or **Holy Apostolic** in the Dashboard; stop with **Stop.cmd**. Existing progress, notes, favorites and schema-1 backups remain compatible through the unchanged internal identifiers.

Original brocade patterns, fine paper grain, foliate corner ornaments, illuminated rules and gilt picture frames enrich the existing forest-green/ivory design. Slim rounded gold scrollbars now carry that palette through the page, diagrams, tables and dialogs, with a deep-green track in the sidebar. Reading pages keep clear paper behind the source text; sacred image files and all published wording are unchanged. The layout remains responsive and keyboard accessible. Refresh an older tab to load the new styling; download offline collections again if you use them.

The current distributable is **Holy-Apostolic.zip**. Account setup remains as described in `hosting/SETUP.md`; no account service was activated or deployment made. The optional email checkbox uses the newly named `updates-v2` wording. The supplied email-preferences SQL supports both versions and preserves earlier records. If that SQL was already applied, reapply its updated version before using the new checkbox; this local update does not change a live database.

## Expanded church study edition — 4.4.0

The existing local app now contains **229 lessons in 46 modules**, **429 glossary terms**, **160 Saints profiles** and **130 icon entries**. The 45 new lessons expand 12 existing modules according to actual gaps; module lengths now vary from 4 to 13 lessons. Earlier IDs, notes, bookmarks, completion records and reading positions remain. New source readings add 67,266 published words and 62 separately identified KJV passages. Readings distinguish the printed 1906 service book, ancient catecheses, council definitions and current published policies.

**Inside the church** (`#/church`) has an original illustrated floor plan, an iconostasis with credited sample images, and schematic sacred objects. Select any of 33 parts, follow 24 Liturgy moments, or read 8 source-labelled visitor cards. Next/Previous controls, matching highlights, keyboard/select equivalents, diagram enlargement and reading shortcuts work on narrow screens. Hours/preparation are shown as overlapping. Layout variations and historical/local scope remain visible; the model is not a parish blueprint or a newly composed worship rule.

**Church authority** (`#/authority`) distinguishes ordained ministry, ROCOR governance and monastic offices. It includes 26 roles,27 source-linked relationships,12 dated/scoped published-policy examples, and primary readings. Administrative titles do not become additional sacramental orders. Each arrow has a written relationship and source; policy examples retain their jurisdiction and date.

Paragraph terms show a restrained dotted underline. Hover, tap or focus for the existing sourced definition, then choose **Learn More**. All 429 terms and aliases are indexed, including distinct senses and ordinary English plural forms. Headings, inputs, editable text and stored notes are preserved. Multiple-source definitions show every cited publication. Scripture and glossary previews can be used together. Notebook passage/revisit links retain the exact selected guide role, policy, place or Liturgy moment in an optional backward-compatible context field.

The existing ivory/forest-green design now has original manuscript-style rules, foliate borders, restrained gold framing and warmer prayer pages. Sacred artwork remains unmodified and uncropped. The home Psalm is an exact source-verified KJV quotation, with Hebrew numbering explicitly identified. The cross favicon and existing Dashboard entry are retained.

New data/audits: `saints-additions.json`, `curriculum-depth.json`, `church-authority.json`, `church-interior.json` and their separate `-audit.json` files, plus the expanded icon and image catalogues. The inventory now contains 1,007 source records and preserves all earlier records/revisions. Necessary summaries and definitions remain visibly AI-labelled; no prayers, religious exercises or ritual commands were composed for this update. Five visitor descriptions report the named publications' guidance; they do not form a universal ritual sequence. Four explicitly recorded OCR/figure-caption collations were checked against the actual 1906 printed pages. Full modern source evidence is retained in development files rather than bundled wholesale. No ecclesiastical approval is claimed.

Re-download existing offline collections after upgrading. The four collections total approximately 106 MiB; the reading/artwork collection is approximately 93 MiB. Download sizes are shown on **Offline reading**. All 273 distinct raster files are referenced, credited and included, along with emblems, ornaments and the guide interface. Public downloads remain separate from private study data. Live provider setup remains pending as described under Accounts; nothing was deployed or purchased.

## Illustrated library — 4.3.0

**Icons** is a separate navigation category with **50 entries**, searchable by name, alternate name, subject and included explanation. Subject filters cover Christ, the Theotokos, feasts, Scriptural scenes and Saints. Each entry has local artwork, an enlargement view, identification of the pictured work, sourced history/tradition and explanation, Scripture previews, numbered footnotes, related entries and image credits. The selection represents familiar and widely venerated icons and iconographic types; it is not a measured ranking of worldwide popularity.

The icon readings contain **37 exact KJV quotations and202 necessary source summaries** (9,597 words altogether). Modern full explanations remain linked to their publishers. Necessary summaries are labelled **Summary · AI-written**, retain their reasons and precise sources, and are not attributed as the source author's wording. Image identity, traditional attribution, and independently established historical authorship/date remain distinct. Where similar icon types or traditions differ, the entry identifies the scope. No prayers or worship instructions were composed for this addition.

All **80 Saints cards and profiles** now include an identified local picture. Click a card/picture to read the profile; click the profile picture to enlarge it. The displayed images include historic icons, mosaics, manuscript illustrations, paintings and photographs, identified in their source records. The original introductions, readings and detailed biographies are retained. All **46 curriculum modules** have their own outline emblem; the home page has matching section symbols. These original interface symbols are navigation artwork, not newly invented devotional icons.

Warm ivory, forest green, restrained gold rules and burgundy headings extend the existing design. Artwork is shown without cropping. Each image carries its named creator/attribution, file-specific public-domain or free-licence record and source link. Expand **Image details** for source qualifications, including traditional attribution and underlying-artwork notes where applicable. File licences are not a claim of worldwide rights clearance or ecclesiastical approval.

Pictures and the new icon readings are included in the existing **Curriculum, Saints, icons, glossary and prayer** offline collection. Re-download that collection after upgrading; an older downloaded collection does not contain the new artwork. The Bible and service-PDF collections remain separate. Downloaded public material is independent of private notes/progress. Existing start/stop, Dashboard entry, account configuration and saved-data formats are retained.

New portable records are in `dist/content/section-symbols.json`, `saint-images.json`, `icon-library.json`, `icon-images.json` and `icon-library-audit.json`. The source inventory retains earlier records/revisions and includes the new sources. Run `npm run build:offline` after served changes, followed by `npm run check`.

## Accounts update — 4.2.0

The Account page now supports email/password and configured Google/Facebook sign-in, with Apple prepared and disabled. Private progress, reading positions, notes, bookmarks, review activity and preferences use the existing revision-checked cloud sync. Guest data stays separate until explicitly imported. Pending/error/conflict status is visible, failed changes stay on the device, and reconnect/focus retries are supported.

An optional unchecked checkbox records permission for occasional project updates. It is independent of study progress and can be changed on Account. Consent wording/version, verified address, server time and history are stored in separate protected tables. No email campaign is sent or mailing platform connected. Apple activation and provider/SMTP secrets are managed separately.

**Setup:** open [hosting/SETUP.md](hosting/SETUP.md). The root `.env` is ignored by Git and excluded from app packages. Its project URL is filled; add the matching Publishable key privately. Stop/restart the local app after changing it. Database migrations, provider setup, SMTP delivery and live verification are still required. The browser/Node account checks use controlled responses; they do not certify a deployed Supabase project.

Netlify deployment files are included, using the existing app folder, `dist/`, and a public-config Function. Nothing has been published or purchased. Your existing Dashboard entry, local launch and curriculum are preserved.

## Start and stop

Double-click **Start.cmd**, or choose **Holy Apostolic** in your Project Dashboard. The app opens at **http://127.0.0.1:4317**. Double-click **Stop.cmd** to stop its server.

Node.js 20+ is the only runtime requirement. It is already installed on this computer. No installation or build step is needed.

Terminal alternative:

```powershell
Set-Location -LiteralPath 'C:\Users\rayth\Documents\Codex\2026-11-19\build-me-a-web-app-that-5\outputs\the-orthodox-way'
node server.cjs
```

Press Ctrl+C in that terminal to stop. Repeated launches reuse the existing server. The app is bound to your own computer at 127.0.0.1. Opening dist/index.html directly does not load the reading files.

## Saints and calendar update — 4.1.0

All **80 existing Saints profiles** now have sourced background, life and notable events, death/martyrdom accounts, writings/legacy, and chronologies: **320 biography sections and 252 dated events**. The original introductory summaries and41 published readings remain unchanged. Source-rich biographies include substantial published passages; shorter profiles identify the limits of their surviving or reproducible evidence. New content adds 36,191 quoted words and 10,772 words of necessary summaries, including chronology items. There are 205 exact quotation checks and 535 separately recorded summary-provenance checks.

**Death / martyrdom** labels and filtering distinguish martyrdom in the cited account, other recorded deaths, uncertain circumstances, and mixed accounts. These labels are not inferred solely from saint titles. A martyr designation and an independently established execution method are different claims. Thekla, Irenaeus, the Mesopotamian Cosmas/Damian pair, Juvenaly, and confessor accounts retain their specific source limits. Chronologies identify approximate dates and conflicting traditions. Quotations and AI-written summaries remain visually distinct, including quoted Scripture events.

Section links and numbered footnotes help navigate the longer profiles. Historical reference works are identified by author, edition and source type beside their citations, including dated Roman Catholic/Anglican references where used for biography. They are not presented as current Orthodox doctrinal authority. Search now includes expanded narrative details. New passages can be bookmarked/highlighted; their separate anchor scopes preserve the earlier published-reading anchors. Existing notes, progress, favorites, and introductory wording are retained.

**Church year** now defaults to today through the next12 months, sorted by civil date. Use **Order by** for commemoration name A–Z or calendar/cycle grouping; dates remain chronological within each group. Julian/revised fixed-date options and cycle/search filters remain. The rolling range uses your browser's local civil day, includes today, and excludes the corresponding date12 months later. It refreshes at local midnight or when returning to the tab on a new day. A rolling window can include two occurrences of the same movable feast; each has its own year-specific detail/link. **Civil year** remains available, and older year links retain their meaning.

The calendar remains the sourced selection of44 feasts/season boundaries, not a complete daily saints calendar or generated fasting/lectionary rule. Saints' publisher commemoration labels are not automatically imported as Julian dates. Calculations support1900–2099; a rolling range reaching the upper limit is explicitly limited. Download offline reading collections again after this release to include the expanded biographies and revised interface.

The original Saints audit/data are separate and unchanged. Expanded source-text checks and summary-provenance hashes are in saints-biographies-audit.json; full retained evidence and source anchors stay in the development working files rather than bundling whole modern copyrighted biographies. No independent theological or jurisdictional review is claimed. Source dates, genre, wording, and reproduction bases remain attributed.

## Connected study edition — 4.0.0

Current totals: **184 lessons /46 modules**, **401 glossary terms /15 categories**, **80 Saints profiles**, and **61 native prayer entries**. The existing history page and Scripture previews remain. Study and Reference navigation groups expand to show additional tools. Reading needs no account.

**Coverage map** has48 topics, prerequisite links, depth filters, and explicit included/partial/further-study coverage. Forty new lessons add21,813 quoted words and44 Scripture readings, including sustained Clement, Diognetus, Polycarp, Justin, Irenaeus, Didache, Cyril, and biblical covenant selections. **Protestant background** has13 scoped comparison topics using named published statements; PCA and Piper remain distinct examples. **Scripture and Fathers** searches passages and accompanying lesson authors without claiming verse-by-verse commentary. The **Source guide** distinguishes seven source types, editions, audiences, text verification, and theological review. No unverified pronunciation is generated. formation-audit.json records148 source checks.

**Saints** is a separate main category:80 profiles,17 women, filters for period/region/title/commemoration month, and41 native readings across33 profiles. Its91,621 quoted words include repeated selections and complete Antony1–94, Paul of Thebes, Hilarion, Paula Letter108, and Polycarp's Philippians. Modern lives use brief exact excerpts, necessary labelled synopses, and complete-source links. Historical editions supply the long readings. The121 quotation checks and80 synopsis provenance records are separate. Historical and hagiographic limits remain explicit. Commemoration labels follow the publisher; they are not automatically converted to civil dates. Specific calendar exceptions are identified. This is a substantial selection, not an exhaustive synaxarion or independent theological review.

**Services** supplies101 complete original1906 Hapgood facsimile pages in local PDFs for Divine Liturgy, Vespers, and Matins. Native readers contain49 published explanatory notes and five bounded service selections, linked to Scripture, terms, and lessons. These are selected transcriptions; the complete services are in the PDFs, retaining columns, rubrics, clergy/choir parts, and adjoining boundary-page text. No new worship directions are supplied. **Church year** has44 sourced commemorations/season boundaries, Julian or revised/Gregorian fixed dates, and the identified Orthodox Paschal calculation for1900–2099. Civil and liturgical date conventions are labelled. It does not invent daily fasting rules or a complete lectionary. worship-year-audit.json records70 quotation checks and PDF/source provenance.

On a reading, use **Revisit later**, **Add a question**, or **Report a correction**. Click/focus a quoted paragraph; Enter opens its passage controls. **Save passage** keeps the exact paragraph and its link. Select words within one paragraph, then **Highlight selection**. Controls remain outside quotations. The **Study notebook** searches passages, highlights, revisit items, and private questions. **Review cards** reveal exact published definitions and eligible prayers. These tools track study activity, not spiritual maturity. Changed source text can invalidate an anchor; the saved passage text remains available.

**Editorial review** stores private correction drafts and exports them without sending anything. Configured accounts can submit corrections; database-assigned editors/reviewers have a workflow. Private notebook questions are not submitted. Workflow review does not change published content or imply ecclesiastical approval. The searchable source inventory and revision history record reproduction bases and unresolved distribution limits. No independent theological review is recorded. Public distribution requires review for the intended territory, exact editions, permissions, attributions, and operator/privacy details.

**Accounts are not connected on this local installation.** The integration supports sign-up/in/out, verification/recovery, deletion, private synchronization, explicit guest import, and visible version conflicts when a provider is configured. See hosting/README.md and supabase.sql. No project is provisioned or published. Email delivery and deployed database policies require live setup/testing; controlled responses are not live verification.

Guest keys remain unchanged. Each signed-in page uses a separate account cache and revision to protect stale-tab edits. Reloads clone the prior copy; older copies remain exportable from Account, including after session-pointer loss. Export needed copies, then use **Remove account caches and sign out** to clear device copies without deleting synchronized data. Browser storage is finite. Tokens remain in tab session storage; local caches and exports are readable within the browser profile. No end-to-end encryption is claimed.

New schema-1 backups include notebook records. Malformed present notebook fields are rejected before restore. Legacy backups without these fields preserve the newer notebook. Existing progress, notes, bookmarks, prayers, metadata mirrors, and original IDs remain.

**Offline reading** downloads selectable text/interface, KJV, Brenton, and service-PDF collections (current collection sizes are shown on Offline reading). Public content is cached separately; API/authenticated requests and personal data are excluded. External readings/recordings still need internet. Download again after an app update. Removing downloads preserves progress. A web-app manifest is supplied; physical mobile installation behavior is unverified.


## Earlier source-reading edition

The original 72 lesson IDs and 18 modules are retained. The earlier3.0 expansion has144 lessons across36 modules, including 72 new lessons with 70,360 additional quoted words and 77 Scripture readings. Lessons contain attributed quotations and named full-reading links. Any necessary AI-written summary is explicitly labelled. Quotations identify the author or issuing body, work, edition/translation, section or page, and source link.

The earlier generated explanations, lesson summaries, reflection questions, quizzes, suggested practices, preparation steps, and assembled prayer guides have been removed. Navigation uses plain labels.

Substantial quoted readings use verified public-domain editions or an applicable reproduction permission. Restricted material is linked with a permitted brief quotation where appropriate. Licence attributions appear with the text. External readings and recordings need internet; included quotations are stored locally.

The original source-reading audit records matches against downloaded evidence using Unicode compatibility and whitespace normalization. It is included at dist/content/quotation-audit.json. New lessons, glossary quotations, and prayer blocks have a separate dist/content/expansion-audit.json record. This records textual matching and source provenance; it is not a claim of ecclesiastical review.

## Church History Timeline

Open **History timeline** in the navigation, or visit **http://127.0.0.1:4317/#/timeline**. Its 108 events run from the apostolic Church through modern Orthodox and Protestant developments. The default overview shows 42 key events; **Show all events** reveals the full chronology. Choose an era, theological topic, optional Reformed focus, or search term. Filters and selected events remain in the URL for direct links.

The timeline is a chronological list with written **Context** labels. Early history is separate from later denominational groupings. Context identifies the history being described; it does not indicate endorsement. Card spacing is not proportional to years. Open an event for primary readings, quoted rulings, subsequent developments, related lessons, and footnotes. Necessary historical summaries are explicitly labelled as AI-written and have recorded sources. The 72 curriculum lessons remain quotation-only.

For **Teaching / ruling** entries, **Who affirms this?** names the precise teaching being compared, limits the scope, and shows positions by named churches or confessional families. Open **Read positions and sources** for explanations, source locations, and footnotes. Agreement with one teaching does not establish acceptance of an entire council, its authority, or every canon. Qualified positions explain the distinction. **Not established here** is an explicit research limit, not agreement or rejection. Historical events receive no doctrinal agreement badges.

The page classifies all 108 entries: 50 teaching/canonical comparisons and 58 historical records. There are 162 position rows, including explicit limits where reception is unestablished. Protestant families are identified individually. Coptic evidence is labelled as Coptic rather than used to speak for every Oriental Orthodox church. Comparisons may describe the historical position of a named synod; those dates and limits remain visible.

Era buttons remain visible. Expand **Search and filter** to choose historical context, teaching versus history, theological topic, optional Reformed focus, or search within both events and reception notes. **Show all events** reveals the complete chronology. Filters and selected events remain in the URL.

**Branches** provides a selectable relationship diagram with 25 traditions, institutions, and teachers. Solid lines represent documented continuity, emergence, or separation; dashed lines represent influence. Select a node for the precise relationship and its sources. Selecting a card highlights all connected predecessors and the entire upstream set of connecting arrows. The selected card and predecessors have different appearances and a written legend. Dashed influence paths remain distinct from structural relationships. Drag horizontally with mouse or touch; scrolling remains available. Focus the diagram for left/right arrow keys and Home/End. PCA and John Piper appear within their Presbyterian and Baptist contexts.

**Rock and Sand** separates Fr. Josiah Trenham's assessment from the historical source readings. Verified book access is limited to the publicly available 2015 introduction excerpt, not the complete book or the user's paperback edition. Excerpt locators identify that edition only. Official author interviews are linked for listening; no unverified transcript is reproduced.

The original timeline adds 140 bibliographic records and 60 quotations checked against retained source evidence. Its portable quotation audit is dist/content/timeline-audit.json. The reception comparison adds 32 bibliographic records in dist/content/timeline-reception.json, with integrity hashes and retained-source provenance in reception-audit.json. Reception notes are necessary summaries, not new quotations; their audit is not a verbatim-matching claim. Original source evidence remains in the development working files and is not bundled wholesale. The main Sources page searches curriculum, history, and reception records.

## Curriculum and glossary

Open **Curriculum** for the46-module reading sequence. Search and filter by topic, introductory/intermediate/advanced depth, and suggested study stage: inquirer, catechumen, continuing parish life, or advanced study. These are editorial browsing aids; all material remains available. Existing completion records remain attached to their original lesson IDs. New lessons have their own edition marker.

The expansion covers divine language and Christology, Scripture and typology, the Commandments and Beatitudes, passions and virtues, prayer, the Holy Spirit and Tradition, sacraments and mystagogy, saints' lives, feasts, service vocabulary, and sourced confessional comparisons. Source readings remain quotations rather than new religious explanations. Historical service selections identify their published context and rubrics.

**Glossary** now contains401 terms across15 categories; the original371 comprise172 exact quotation definitions and199 necessary sourced summaries. Thirty additional source-based definitions are recorded in the formation audit. Summaries are labelled AI-written. Browse alphabetically or filter/search by topic, depth, suggested stage, and aliases. Definitions have source locations, related terms, and curriculum links. Lessons and native prayers also list glossary terms found in their text. Original Greek/Slavonic variants are included where verified; local usage can differ. This is a substantial vocabulary resource, not a claim to contain every term in every Orthodox language or jurisdiction.

## Native prayer library

**Prayer** now contains **61 native entries**, including **8 complete published orders**, **4 long orders**, whole morning/evening prayers, known prayers for memorization, meal orders, and prayers or complete petitions for occasions. The included text is stored locally. Collections, search, length filters, and favorites help find entries. Prayer readers save their position, provide text-size and print controls, and can hide/reveal the text for memorization without erasing the reading position.

Native texts identify *Orthodox Daily Prayers*, St. Tikhon's Seminary Press, **1982**. Complete included orders include Before Sleep, Commemoration of the Living and the Dead, The Three Canons, Thanksgiving After Communion, and published meal sequences. Wording, paragraph order, historical jurisdictional wording, rubrics, and unexpanded source cross-references are retained. Source rubrics are labelled; they are not new app-authored worship directions. The Three Canons retains the book's preparatory cross-reference rather than silently supplying another translation.

Project Gutenberg catalogues this edition as public domain **in the USA**; this is not a worldwide rights claim. Its RSV-derived Psalm sections are excluded because their rights are separate. Accordingly, the library offers complete individual morning prayers and does not claim a complete native Morning Rule or Compline. A copy of the Gutenberg source licence is included at dist/licenses/project-gutenberg.txt and linked from source credits. No invented prayer or assembled replacement rule is supplied.

The four original Mother of God Church references remain under **Original prayer-rule references**, with their exact original URLs:

- [Morning prayers, longer rule](https://churchmotherofgod.org/prayers/morning-prayers-longer-rule/)
- [For work](https://churchmotherofgod.org/prayers/for-work/)
- [For meals](https://churchmotherofgod.org/prayers/for-meals/)
- [Evening prayers, longer rule](https://churchmotherofgod.org/prayers/evening-prayers-longer-rule/)

Those pages retain their own editions and require internet. Their full reproduction permission was not verified, so they remain identified references alongside the native library.

## Scripture previews

Hover over an underlined Bible reference to read its passage. Keyboard focus also opens the preview; press Enter or Space to keep it open and move into its controls. Click or tap to keep a preview open. Use **Close** or Escape to dismiss it. Long passages scroll inside the preview, and **View whole chapter** supplies context. References inside existing links retain their destination and have a separate **Preview** button for keyboard and touch use.

Previews work throughout lessons, glossary definitions, native prayers, history details, citations, and displayed personal notes. Modern references, older Roman-numeral references, ranges, verse lists, and references split by a printed line break are recognized. Text being edited is left alone. The feature adds no saved-data fields and does not rewrite quotations, prayers, notes, or completion records.

Included texts load locally: the **King James Version (1769), with Apocrypha**, and **Brenton's English Septuagint**. Every preview names its translation and supplies source and rights information. The Bible editions also appear in **Sources**. These are separately identified reading aids; they do not replace a quoted author's translation or the prayer book's text. Their catalogue arrangement is not a statement about canon.

Psalm and book numbering require care. Where an edition or source-specific correspondence is verified, the preview uses it and explains any differing address. Otherwise it offers an edition/numbering choice rather than silently converting. Brenton numbers many Psalm titles as verses. Selecting an edition inspects that edition's printed address; it does not establish a verse correspondence. Greek Esther, Greek Daniel, and Greek Jeremiah can have different structure or ordering. Unspecified “following verses” show the stated start with a whole-chapter option. An unavailable address is identified explicitly, with a manual lookup rather than invented text.

The local corpus contains 133 book files and 65,827 published addresses: 65,826 text verses and one documented publisher placeholder at Brenton Proverbs 30:1. That placeholder displays the publisher's note directing readers to chapter 24, without asserting verse equivalence. Data integrity and source-extraction records are bundled in dist/scripture/corpus-audit.json. The previews require the local server but no internet connection; external source links still require internet.

## Saved data

Use the same browser profile and **http://127.0.0.1:4317** each time. Notes, bookmarks, completion, and reading positions remain in that browser's local storage. Native prayer favorites and reading positions are saved there too. Guest reading needs no account. Optional synchronization requires the configured provider described above.

Existing notes and completion records are preserved. Previously completed lessons with revised readings are labelled. Marking a revised reading complete updates its edition record without duplicating the original completion. New text positions are stored separately from original-edition positions. Prayer favorites and native prayer positions have a separate metadata mirror so older app tabs cannot erase them. Deliberate backup restore replaces that mirror after confirmation. Old prayer-step and quiz records remain in backups even though their former interfaces were removed.

In **Settings**, use **Export progress and notes** for a separate backup. Restoring supports both original and revised schema-1 backups and requires confirmation before replacing current browser data. Backup files contain readable personal notes. Changing browser profiles or clearing site data does not transfer or preserve browser storage automatically.

## Location and maintenance

App folder: `C:\Users\rayth\Documents\Codex\2026-11-19\build-me-a-web-app-that-5\outputs\the-orthodox-way`

The existing dashboard registration is retained, with a forest-green book icon and this folder's Start.cmd launcher. The app itself retains its Orthodox-cross favicon.

Read AGENTS.md before making changes and HANDOFF.md for verification and edition details. Run **npm run check** for the included syntax, structure, metadata, prayer-link, quotation-integrity, Scripture-parser, Bible-corpus, Saints, formation, service/calendar, and platform checks. New source text requires a fresh source verification audit as well.
