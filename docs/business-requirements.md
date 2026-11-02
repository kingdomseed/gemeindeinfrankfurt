# Frankfurt Video Training Platform: Business Requirements

_Written by Jason Holt. Source: the shared "Frankfurt Video Training Platform: Business Requirements" doc, as of 2 Nov 2026. Update this file when that doc changes._

## Summary

We want one website for the church in Frankfurt's video training to replace our Google Forms and Sheets. Saints register and manage their own registration, and the serving ones coordinate everything in one shared place.

Today everything is copied and pasted from one training to the next. That sometimes breaks registration, and changing a registration takes a lot of back and forth. The new system should remove that hand work, follow Lebensstrom's rules automatically, and collect what we report to Lebensstrom while the training is running.

The system has two sides:

- **Registration**, for the saints: register, see the schedule and fee, edit, cancel.
- **Coordination**, for the serving ones: groups, attendance, payments, outlines, hymns, services, rules, verses and reporting.

## Scope

| In the first version                                             | Not included                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Registration with self-service edit and cancel                   | **Online payment.** Saints pay by bank transfer to the church's IBAN.            |
| Shared coordination site for several serving ones, updating live | Tracking test failures. In practice they don't happen.                           |
| Study groups, attendance, payment tracking by hand, outlines     | Streaming the messages. They stay on the Lebensstrom/LSM webcast.                |
| Hymns, verses, rules, services, testing schedule                 | Sending the report to Lebensstrom automatically. We sign and email it ourselves. |
| Email to registrants                                             |                                                                                  |
| Collecting the Lebensstrom report data as we go                  |                                                                                  |

Languages: the site and messages to registrants in **German, English and Russian**. Registrants choose a training language of **English, German or Russian**, and adding more languages later must be easy.

## Registration (for the saints)

A saint can go through the whole process on their own, from reading the schedule to getting a confirmation email they can use to change things later.

**Registering**

1. The form walks the registrant through every step. It shows the **schedule** (days and times of every session) and the **fee**. The coordination side supplies both, so no one types them into the form.
2. The registrant chooses a seat type:
   - **Full-time.** All sessions are selected automatically.
   - **Part-time.** They tick the sessions they will attend.
   - **Shared seat.** Two people share one seat, for example a couple with a child at home, so one of them attends each time. A shared seat is always full-time, has both names, and pays one fee.
3. They confirm they are **18 or older** and that they have **read the training rules**, which the form shows.
4. They enter everything today's form asks for: first and last name, study-group language, outline language, an optional second outline in another language, email, phone and comments.
5. Optional checkboxes: "I attended the live training in Anaheim" and "I am from Ukraine and not gainfully employed". Either one sets the fee to €0.
6. The form shows **how much to pay and where**: the church's IBAN and a reference. Training and outline are shown as two separate amounts.
7. One person can submit **as many registrations as they want**, for example for family members, all from the same email address.
8. The system warns if someone registers who seems to be registered already (same name and email).

**Changing a registration**

9. Every registration gets its own **edit link** in the confirmation email. No password or account is needed.
10. With that link the registrant can **edit** or **cancel** their registration.
11. What can change, and until when:

| Change                                     | Allowed until                                  |
| ------------------------------------------ | ---------------------------------------------- |
| New registration                           | The end of the first day of the local training |
| Seat type and chosen sessions              | The start of the first session                 |
| Cancel                                     | The start of the first session                 |
| Name, contact details, languages, comments | Any time during the training                   |

After a cutoff, the registrant sees a note to contact the coordinators instead. Coordinators can still make any change from the coordination side.

## Coordination (for the serving ones)

Several serving ones log in to the same coordination site. Everyone can edit, and changes show up for everyone right away. It must work well on a **phone** as well as a computer.

**Setting up a training**

1. Create a new training by **copying the last one**: sessions, rules, services, fees and outline prices come along, and only the dates need changing. No more copying spreadsheets between years.
2. Enter the **schedule** once. The German, English and Russian session names on the form come from the same dates, so they can never disagree.
3. Set the **fee per seat** and the **outline price** for this training. For December 2026 these are €70 and €5.

**Registrations and seats**

4. See every registration with its seat type (own seat or shared seat, and who shares it), sessions, languages and payment status.
5. Add, change or cancel any registration on someone's behalf.
6. Each registration belongs to a **locality**: Frankfurt, or a neighbouring city that registered through Frankfurt.

**Study groups**

7. Put registrants into **study groups** by language and locality. The system suggests groups of 8–10, and the serving ones adjust them by hand.

**Attendance**

8. Take attendance **during each message**, quickly, on a phone or computer, for the people in the room or on Zoom.
9. Each person has one of four marks per session: present, absent, excused, or not registered for that session.
10. A person is only counted absent for sessions they registered for. For part-timers, that means the sessions they had chosen when the training began.
11. The system counts each person's unexcused and excused absences and shows anyone over the limit (any unexcused absence, or more than two excused). This is **for reporting only**: nothing happens to the registrant.

**Payments (tracked by hand)**

12. Two separate checkboxes per registration: **training fee paid** and **outline paid**. A serving one ticks them when the money arrives. Nothing is matched automatically.
13. A payment can also be marked **waived**, with a reason (Anaheim attendee, Ukrainian and not employed, or a hardship reduction).
14. Running totals: seats, fees received, outline money received, still unpaid.

**Outlines**

15. The system counts how many outlines are needed in each language, including second outlines.
16. The serving ones enter how many were **ordered** in each language. The system shows the **extras** compared with the registrations.

**Per-message content**

17. For each message: the **hymns** to sing, and for each hymn whether it exists in **German** and in **Russian**. All hymns exist in English, and only some exist in German or Russian. This information arrives late, so it must be quick to enter.
18. For each message: the **verses**, ready to show on screen.
19. The **rules**, ready to show on screen as slides. They change very little each year, so they carry over and get small edits.
20. Rules, verses and hymns must open easily on any of the **three to four computers** used in a session (one per language, plus one for slides).

**Testing**

21. A **testing schedule** tied to the study groups, easy to change at the last minute because it is often made up as we go.

**Services (Aufgaben)**

22. A list of services and **who leads each one**: Technik (tech), Regeln (rules), Lieder (hymns), Versen (verses), Fragen (questions), plus attendance, payments, name tags and groups. Services can be added or removed.

**Name tags**

23. Export a print-ready list of name tags: one per seat, with both names on a shared seat.

**Webcast access**

24. Lebensstrom sends the church the **login for the LSM website** where the training videos are played. The system stores it, and only coordinators serving in **AV (Technik)** can see it. It never appears on the form, in emails or in the WhatsApp group.

## Email

Email is a big part of the system. Every email goes out in German, English and Russian.

| Email                         | When                                            | Contents                                                                           |
| ----------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Pre-registration announcement | When registration opens                         | Dates, how to register, the deadline                                               |
| Confirmation                  | Right after each registration and each change   | What they registered for, the amount to pay and the IBAN, their personal edit link |
| Cancellation                  | When a registration is cancelled                | Confirmation that it is cancelled                                                  |
| Payment reminder              | Sent by a coordinator, to everyone still unpaid | Amounts still open and the IBAN                                                    |
| Before the training           | A few days before the first session             | Schedule, place, rules, what to bring, and how to join the private WhatsApp group  |
| Message to all or to a group  | Any time, sent by a coordinator                 | Free text, for example a schedule change                                           |

The Zoom link for our local meeting goes only to registered people, through the training's private WhatsApp group, never to a public page. It is a different thing from the Lebensstrom webcast login (see Webcast access).

## Reporting to Lebensstrom after the training

Within **7 days** of the last session, the contact brother pays the fees to Lebensstrom and emails a signed questionnaire. The system fills in that data as the training runs, so nothing is forgotten.

1. A report page that is always up to date and shows every questionnaire answer:
   - final number of seats, number of fees collected, total amount collected
   - outline money received
   - number of Ukrainian saints who are not employed (their fee is waived)
   - first and last day of the training, with a note if they differ from the registered dates
   - whether trainees were tested, absences were limited to two, name tags were required, and seats were assigned
   - online or in person
   - for each of the 12 messages, the date shown and the number absent
2. The serving ones can add notes and answer the yes/no questions on the page during the training.
3. One click gives a **printable copy** laid out like the Lebensstrom questionnaire, to sign and send by email.
4. A place to record **costs to reimburse**, with photos of the invoices, so they go out together with the questionnaire.
5. Localities that registered through Frankfurt are counted in Frankfurt's report.

## Lebensstrom rules the system follows

These come from the [Lebensstrom video training page](https://lebensstrom.de/video-training-en/) for December 2026 (updated 9 Oct 2026). Where the page and the questionnaire PDF differ, the page wins.

| Rule                                                                                                | How the system applies it                                        |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Registrants must be 18 or older                                                                     | A required checkbox on the form                                  |
| Seats are full-time, part-time, or shared; a shared seat is full-time and pays once                 | Seat types on the form; a shared seat forces full-time           |
| €70 per seat; €0 for Anaheim attendees and for Ukrainian saints who are not gainfully employed      | Fee set per training; waivers as checkboxes                      |
| Outlines are €5 each, printed only, in German, English or Russian, and invoiced separately          | Outline payment tracked apart from the fee                       |
| Church registration with Lebensstrom by 29 Oct 2026, 13:00                                          | Deadline shown on the coordination dashboard                     |
| Outline order by 1 Dec 2026, 16:00; order extras for late sign-ups                                  | Outline counts and extras ready before this date                 |
| Numbers can change free of charge until the start; no new registrations after the first day         | Registration closes automatically after day one                  |
| No unexcused absences; at most two excused                                                          | Counted and shown for the report                                 |
| Part-timers count as absent only for sessions they chose before the start                           | Session choices lock at the first session                        |
| Name tag required; one per seat, both names on a shared seat                                        | Name tag export                                                  |
| Study groups of 8–10                                                                                | Group suggestions                                                |
| Tests for messages 1–10; attendance for all 12                                                      | Testing schedule and attendance                                  |
| The webcast login (from Lebensstrom, for the LSM website) is not shared with individual registrants | Stored in the system; visible only to coordinators serving in AV |
| Fees, questionnaire and reimbursements are due within 7 days of the end                             | Report page and reminder on the dashboard                        |

## Decisions made

No questions are open. Every question raised while preparing this document is answered below, either by the Lebensstrom page, by the coordinators, or as a working decision that follows from the rules.

| Question                                                                | Decision                                                                                                                                            | Basis                                                           |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| How many absences are allowed?                                          | None unexcused, at most two excused                                                                                                                 | Lebensstrom page; confirmed by the coordinators                 |
| What happens when someone goes over?                                    | Nothing. It is recorded for the report only.                                                                                                        | Coordinators                                                    |
| Do we track test failures?                                              | No. In practice they don't happen.                                                                                                                  | Coordinators                                                    |
| Do we take payments online?                                             | No. Bank transfer to the church's IBAN, ticked by hand.                                                                                             | Coordinators                                                    |
| What fee do we charge?                                                  | The fee per seat is set for each training. For December 2026 it is €70, the amount we owe Lebensstrom per seat.                                     | Lebensstrom page                                                |
| Who pays nothing?                                                       | Anaheim attendees, Ukrainian saints who are not gainfully employed, and anyone the coordinators grant a hardship waiver (with a reason)             | Lebensstrom page; past practice                                 |
| When must the questionnaire go in: one week or two?                     | Within one week (7 days). The PDF's "two weeks" is outdated.                                                                                        | Lebensstrom page                                                |
| Tests cover messages 1–10 but attendance covers 12. Is that a conflict? | No. Test 1–10, take attendance for all 12.                                                                                                          | Lebensstrom page                                                |
| Until when can people register?                                         | Through the first day of the local training                                                                                                         | Lebensstrom page                                                |
| Until when can part-timers change sessions?                             | Until the first session starts. After that their choices are fixed, so absences are counted correctly.                                              | Follows from the Lebensstrom absence rule                       |
| Until when can people cancel?                                           | Until the first session starts. After that, coordinators handle it.                                                                                 | Working decision, in line with the free changes until the start |
| Can a shared seat be part-time?                                         | No. Shared seats are always full-time.                                                                                                              | Lebensstrom page                                                |
| Can one email address be used for several registrations?                | Yes. Each registration gets its own edit link.                                                                                                      | Coordinators                                                    |
| How do registrants edit without an account?                             | A personal edit link in the confirmation email                                                                                                      | Coordinators (as with today's plugin)                           |
| Who can see contact details?                                            | Coordinators only                                                                                                                                   | Working decision                                                |
| What happens to personal data afterwards?                               | Names and contact details are deleted once the report is filed and accepted. Only counts are kept.                                                  | Working decision                                                |
| Which questionnaire form do we use?                                     | The December 2026 version from the Lebensstrom page                                                                                                 | Lebensstrom page                                                |
| Which account do fees go to?                                            | Saints pay the church. The church transfers to Lebensstrom e.V. with the reference "Spende 2026 WT".                                                | Lebensstrom page                                                |
| Who gets the Zoom link, and who gets the webcast login?                 | Everyone registered gets our local Zoom link through the private WhatsApp group. Only coordinators serving in AV see the Lebensstrom webcast login. | Coordinators                                                    |

## Technical approach

The system is built with **Next.js** for the website and **Supabase** (Postgres) for the database. Both fit the requirements well. Email, hosting and data protection still need their own services and setup.

**How the stack covers the requirements**

| Requirement                                                 | With Next.js and Supabase                                                                                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public registration form, schedule and fee from the backend | Next.js pages read the training, sessions and fee from Supabase                                                                                    |
| Edit and cancel without an account                          | A long random token per registration, stored hashed, in the email link. Server-side Next.js code checks it; registrants never get database access. |
| Several coordinators editing live                           | Supabase Auth for coordinator logins; Supabase Realtime pushes changes to every open screen                                                        |
| Who sees what                                               | Postgres row-level security: registrants see nothing directly; coordinators see their training's data                                              |
| Attendance on a phone                                       | A mobile-first Next.js page, installable on the home screen                                                                                        |
| German, English and Russian                                 | A translation library (such as next-intl) with all text in three languages; per-language hymn data in the database                                 |
| Copy last training                                          | A database function that copies a training's sessions, rules, services and prices                                                                  |
| Printable questionnaire and name tags                       | Print-ready pages, or PDFs generated on the server                                                                                                 |

**What the stack does not give us**

| Need                                 | Why it matters                                                                                                                                                                                                                                                                                                                                                          | Recommended                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| An email service                     | Supabase only sends its own login emails, with a low limit. Confirmations, edit links and reminders need a real sender.                                                                                                                                                                                                                                                 | Resend: its free plan covers 3,000 emails a month and 100 a day, which is enough for about 30 registrants. Send from our own domain. |
| A domain                             | Emails from a free address land in spam; registrants need an address they trust                                                                                                                                                                                                                                                                                         | A church domain or subdomain, with SPF and DKIM set up for email                                                                     |
| Hosting for Next.js                  | Supabase hosts the database, not the website                                                                                                                                                                                                                                                                                                                            | Vercel or Railway, in an EU region                                                                                                   |
| A paid Supabase plan                 | Free projects **pause after a week without use**. Data is kept, and a paused project can be resumed from the dashboard for up to 1 year ([Supabase docs](https://supabase.com/docs/guides/platform/free-project-pausing)), but the site is offline until someone resumes it. Our system sits idle for months between trainings, and the free plan has no daily backups. | Supabase Pro (about $25 a month), or a scheduled job that keeps a free project awake and our own backups                             |
| Spam protection                      | A public form gets bot sign-ups                                                                                                                                                                                                                                                                                                                                         | Cloudflare Turnstile on the form and rate limits                                                                                     |
| Unreliable Wi-Fi in the meeting room | Attendance taken during the message must not be lost                                                                                                                                                                                                                                                                                                                    | Attendance saves on the phone first and syncs when the connection returns                                                            |

**Data protection (GDPR)**

The system stores names, emails and phone numbers of people in Germany, so German data protection law applies.

- Host the Supabase database and the website in the **EU** (Supabase has a Frankfurt region).
- Sign the **data processing agreements** offered by Supabase, the host and the email service.
- Publish a **privacy notice** (_Datenschutzerklärung_) and, for a public German site, an **Impressum**. The form links to both.
- Keep only what is needed, limit contact details to coordinators, and delete personal data after the report is accepted (see Decisions).

**Ownership and running costs**

- Accounts (Supabase, hosting, email, domain) belong to the **church**, under a shared church email address, with at least two coordinators as admins. That way the system does not depend on one person.
- A separate test copy (staging) for trying changes before a training.
- Expected cost: roughly $25–50 a month on paid plans, or close to zero on free plans with the trade-offs above.

**Timing**

The outline order is due on **1 Dec 2026**, and registration for the January 2027 local training normally opens before then. Building, testing and translating the whole system in time is not realistic. **Decided: the new system is used for the January 2027 training. To make that possible, it is built in three stages, each ready before the moment it is needed**.

| Stage                  | Ready by                          | Includes                                                                                                                                                                     |
| ---------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Registration        | About 20 Nov 2026                 | Registration form in three languages, confirmation email with edit link, edit and cancel, coordinator list of registrations, payment checkboxes, outline counts per language |
| 2. During the training | One week before the first session | Study groups, attendance on a phone, hymns, verses and rules for the screen, services, testing schedule, name tags, reminder emails                                          |
| 3. After the training  | The last session                  | Report page and printable questionnaire, reimbursements                                                                                                                      |

Stage 1 must be live before the outline order on 1 Dec, so the counts come from the new system. If stage 1 slips, registration opens on the current Google Form and the data is imported later. Everything not in a stage can follow after January.

## Later: ideas for after the first version

These are wanted, but not needed for the first training on the new system.

- **Transfer a registration** to another person, for example when someone can no longer come.
- A **digital information packet** for each registrant, with the rules and verses built in.
- **City groups** for Mannheim, Heidelberg and the other cities around Frankfurt, which sometimes do part of the training on their own and may want to split off.
- **More training languages** beyond English, German and Russian.
- Use for **other trainings** with a different number of messages, such as ITERO with 8 messages.
