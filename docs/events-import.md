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
