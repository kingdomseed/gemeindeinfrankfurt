# Weekly import of events from the announcement email

Every week the church sends "Gemeinde-Ankündigungen [dd.mm.yyyy - dd.mm.yyyy]" (German only, through Mailchimp). A scheduled Claude task reads the newest one and adds its dated events to the site as **drafts**. An editor reviews them in `/admin` → Events and publishes.

## Steps for the weekly task

1. Find the newest email with subject `Gemeinde-Ankündigungen` from the church's Mailchimp sender.
2. Read the section **Wichtige Ankündigungen**. Each heading there is one candidate event.
3. Keep an item only if it has a date. Skip the Bible verses at the top, **Wöchentlicher Genuss**, **Gebetsanliegen** and the regular meetings under **Versammlungen diese Woche** (prayer meeting, brothers' meeting, the Lord's Day meeting), unless the email says one of them is moved, cancelled or special that week.
4. Write a JSON array in the shape of `importedEvent` (`src/lib/domain/event-import.ts`), one entry per event:
   - `importKey`: lowercase words and the month or date, such as `dach-uni-konferenz-2026-12`. Use the same key for the same event every week, so a repeated announcement is skipped.
   - Times in Frankfurt time with the offset (`+01:00` in winter, `+02:00` in summer). With a date but no time, set `allDay: true` and give midnight of that day; for several days, `endsAt` is midnight of the last day.
   - `link`: the registration link, if there is one. Prefer the German link when the email gives several.
   - `de`: the email's own wording, shortened to a title and a few lines of details. `en` and `ru`: faithful translations of the German.
5. Run `npm run events:import -- <file>.json` with `SITE_URL` and `PAYLOAD_API_KEY` set.
6. Report what was added and skipped.

## Rules

- Say "Lord's Day" (Tag des Herrn, День Господень), never "Sunday".
- No personal data: no names of saints, phone numbers, e-mail addresses, Zoom links or meeting passwords. The import drops Mailchimp's subscriber id from links.
- Never publish. Drafts only; a person publishes.

# Weekly announcement

The same task also adds the whole week as one **Announcement** draft (`/admin` → Announcements), which the home page and `/announcements` show once published.

1. From the same email, write a JSON array with one entry in the shape of `importedAnnouncement` (`src/lib/domain/event-import.ts`):
   - `importKey`: `ankuendigungen-` and the Monday of the week, such as `ankuendigungen-2026-11-30`. The week starts on the Monday after the send date; trust the send date over the subject, which is sometimes left from an earlier week.
   - `publishedAt`: that Monday at midnight, Frankfurt time with the offset. `showUntil`: the date of the following Lord's Day, such as `2026-12-06`; it shows through that whole day.
   - `de`, `en`, `ru`: a title such as "Ankündigungen 30. November – 6. Dezember 2026", and Markdown with three parts: **Wichtige Ankündigungen**, the week's meetings by day with the address, and **Gebetsanliegen**.
2. Keep only the key details of each item: what, when, where, cost, deadline and the sign-up link. Leave out long prose, Bible and ministry quotes and **Wöchentlicher Genuss**.
3. Keep the prayer requests, without names or anything else that identifies a person or family.
4. Run `npm run announcements:import -- <file>.json` with `SITE_URL` and `PAYLOAD_API_KEY` set. A week already there is skipped.

The rules above apply here too. The import refuses a Zoom link and drops Mailchimp's subscriber id from every link.
