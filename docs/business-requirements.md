# Video Training Platform: Business Requirements

*Church in Frankfurt · Video Training. As of 26 October 2026. Rules from Lebensstrom e.V.*

One website to replace our Google Forms and Sheets: the saints register and manage their own registration, and the serving ones coordinate everything in one shared place.

| Date | Milestone |
| --- | --- |
| 29 Oct 2026, 13:00 | Church registers with Lebensstrom |
| 1 Dec 2026, 16:00 | Outline order due |
| 21–26 Dec 2026 | Live training in Anaheim |
| 7 days after the end | Fees, questionnaire, reimbursements due |

## Contents

1. [Summary](#1-summary)
2. [Scope](#2-scope)
3. [Registration](#3-registration)
4. [Coordination](#4-coordination)
5. [Email](#5-email)
6. [Reporting to Lebensstrom](#6-reporting-to-lebensstrom)
7. [Lebensstrom rules the system follows](#7-lebensstrom-rules-the-system-follows)
8. [Decisions made](#8-decisions-made)
9. [Technical approach](#9-technical-approach)
10. [Later](#10-later)

## 1. Summary

Today everything is copied and pasted from one training to the next. That sometimes breaks registration, and changing a registration takes a lot of back and forth. The new system removes that hand work, follows Lebensstrom's rules automatically, and collects what we report to Lebensstrom while the training runs.

- **Registration.** For the saints: register, see the schedule and fee, edit, cancel.
- **Coordination.** For the serving ones: groups, attendance, payments, outlines, hymns, services, rules, verses and reporting.

## 2. Scope

**In the first version**

- Registration with self-service edit and cancel
- A shared coordination site for several serving ones, updating live
- Study groups, attendance, payment tracking by hand, outlines
- Hymns, verses, rules, services, testing schedule
- Email to registrants
- Collecting the Lebensstrom report data as we go

**Not included**

- Online payment. Saints pay by bank transfer to the church's IBAN.
- Tracking test failures. In practice they don't happen.
- Streaming the messages. They stay on the LSM webcast.
- Sending the report automatically. We sign and email it ourselves.

**Languages:** the site and emails in German, English and Russian, and registrants choose a training language from the same three. More languages can be added later.

## 3. Registration

For the saints. A registrant can go through the whole process alone, from reading the schedule to getting a confirmation email they can use to change things later.

### Registering

1. The form walks through every step and shows the schedule (days and times of every session) and the fee. Both come from the coordination side; nobody types them into the form.
2. A choice of seat type:
   - **Full-time.** All sessions are selected automatically.
   - **Part-time.** Tick the sessions you will attend.
   - **Shared seat.** Two people share one seat, for example a couple with a child at home, so one attends at a time. Always full-time, both names, one fee.
3. Confirm being 18 or older and having read the training rules, which the form shows.
4. Everything today's form asks: first and last name, study-group language, outline language, an optional second outline in another language, email, phone, comments.
5. Optional checkboxes: "I attended the live training in Anaheim" and "I am from Ukraine and not gainfully employed". Either sets the fee to €0.
6. The form shows how much to pay and where: the church's IBAN and a reference, with training and outline as two separate amounts.
7. One person can submit as many registrations as they want, for example for family members, from the same email address.
8. A warning if someone seems to be registered already (same name and email).

### Changing a registration

9. Every registration gets its own edit link in the confirmation email. No password or account needed.
10. With that link the registrant can edit or cancel.

| Change | Allowed until |
| --- | --- |
| New registration | End of the first day of the local training |
| Seat type and chosen sessions | Start of the first session |
| Cancel | Start of the first session |
| Name, contact details, languages, comments | Any time during the training |

After a cutoff the registrant sees a note to contact the coordinators. Coordinators can still change anything.

## 4. Coordination

For the serving ones. Several people log in to the same site, everyone can edit, and changes show up for everyone right away. It must work well on a phone as well as a computer.

### Setting up a training

1. Create a new training by copying the last one: sessions, rules, services, fees and outline prices come along, and only the dates change. No more copying spreadsheets between years.
2. Enter the schedule once. The German, English and Russian session names on the form come from the same dates, so they can never disagree.
3. Set the fee per seat and the outline price for each training. For December 2026: €70 and €5.

### Registrations and seats

4. See every registration with its seat type (own or shared, and who shares it), sessions, languages and payment status.
5. Add, change or cancel any registration on someone's behalf.
6. Each registration belongs to a locality: Frankfurt, or a neighbouring city that registered through Frankfurt.

### Study groups

7. Put registrants into study groups by language and locality. The system suggests groups of 8–10, and the serving ones adjust them by hand.

### Attendance

8. Take attendance during each message, quickly, on a phone or a computer, for people in the room or on Zoom.
9. Four marks per session: present, absent, excused, or not registered for that session.
10. Someone counts as absent only for sessions they registered for. For part-timers, that means the sessions they had chosen when the training began.
11. Absences are counted and anyone over the limit (any unexcused, or more than two excused) is shown. For reporting only: nothing happens to the registrant.

### Payments, tracked by hand

12. Two separate checkboxes per registration: training fee paid and outline paid. A serving one ticks them when the money arrives. Nothing is matched automatically.
13. A payment can be marked waived, with a reason (Anaheim attendee, Ukrainian and not employed, or a hardship reduction).
14. Running totals: seats, fees received, outline money received, still unpaid.

### Outlines

15. Count how many outlines are needed in each language, including second outlines.
16. Enter how many were ordered per language and see the extras compared with registrations.

### Per-message content

17. The hymns for each message, and for each hymn whether it exists in German and in Russian. All hymns exist in English; only some exist in German or Russian. This arrives late, so entry must be quick.
18. The verses for each message, ready to show on screen.
19. The rules as slides. They change very little, so they carry over each year with small edits.
20. Rules, verses and hymns open easily on any of the three to four computers used in a session (one per language, plus one for slides).

### Testing

21. A testing schedule tied to the study groups, easy to change at the last minute.

### Services (Aufgaben)

22. Each service and who leads it: Technik (tech), Regeln (rules), Lieder (hymns), Versen (verses), Fragen (questions), plus attendance, payments, name tags and groups. Services can be added or removed.

### Name tags

23. A print-ready list of name tags: one per seat, both names on a shared seat.

## 5. Email

Email is a big part of the system. Every email goes out in German, English and Russian.

| Email | When | Contents |
| --- | --- | --- |
| Pre-registration announcement | When registration opens | Dates, how to register, the deadline |
| Confirmation | After each registration and each change | What they registered for, amount and IBAN, their personal edit link |
| Cancellation | When a registration is cancelled | Confirmation that it is cancelled |
| Payment reminder | Sent by a coordinator to everyone unpaid | Amounts still open and the IBAN |
| Before the training | A few days before the first session | Schedule, place or Zoom details, rules, what to bring |
| Message to all or a group | Any time, by a coordinator | Free text, such as a schedule change |

The Zoom link only goes to registered people, never to a public page.

## 6. Reporting to Lebensstrom

Within 7 days of the last session, the contact brother pays the fees to Lebensstrom and emails a signed questionnaire. The system gathers that data as the training runs, so nothing is forgotten.

1. A report page, always up to date, with every questionnaire answer:
   - Final seats, fees collected, total amount
   - Outline money received
   - Ukrainian saints not employed (fee waived)
   - First and last day, with a note if they changed
   - Tested? Absences limited to two? Name tags? Assigned seats?
   - Online or in person
   - For messages 1–12: date shown and number absent
2. Room to add notes and answer the yes/no questions during the training.
3. One click gives a printable copy laid out like the Lebensstrom questionnaire, to sign and send by email.
4. A place for costs to reimburse, with photos of the invoices, sent along with the questionnaire.
5. Localities that registered through Frankfurt are counted in Frankfurt's report.

## 7. Lebensstrom rules the system follows

From the Lebensstrom video training page for December 2026 (updated 9 Oct 2026). Where the page and the questionnaire PDF differ, the page wins.

| Rule | How the system applies it |
| --- | --- |
| Registrants must be 18 or older | A required checkbox on the form |
| Full-time, part-time or shared seat; a shared seat is full-time and pays once | Seat types on the form; a shared seat forces full-time |
| €70 per seat; €0 for Anaheim attendees and Ukrainian saints not gainfully employed | Fee set per training; waivers as checkboxes |
| Outlines €5 each, printed only (DE, EN, RU), invoiced separately | Outline payment tracked apart from the fee |
| Church registration by 29 Oct 2026, 13:00 | Deadline on the coordination dashboard |
| Outline order by 1 Dec 2026, 16:00; order extras for late sign-ups | Outline counts and extras ready before then |
| Free changes until the start; no new registrations after the first day | Registration closes automatically after day one |
| No unexcused absences; at most two excused | Counted and shown for the report |
| Part-timers count as absent only for sessions chosen before the start | Session choices lock at the first session |
| Name tag required; one per seat, both names on a shared seat | Name tag export |
| Study groups of 8–10 | Group suggestions |
| Tests for messages 1–10; attendance for all 12 | Testing schedule and attendance |
| Webcast login and Zoom ID never shared with individual registrants | Visible only to coordinators |
| Fees, questionnaire and reimbursements due within 7 days of the end | Report page and dashboard reminder |

## 8. Decisions made

No questions are open. Each one raised while preparing this document is answered below.

Basis: **Lebensstrom** = from the Lebensstrom page; **Coordinators** = decided by us; **Working decision** = follows from the rules, can change.

| Question | Decision | Basis |
| --- | --- | --- |
| How many absences are allowed? | None unexcused, at most two excused. | Lebensstrom |
| What happens when someone goes over? | Nothing. It is recorded for the report only. | Coordinators |
| Do we track test failures? | No. In practice they don't happen. | Coordinators |
| Do we take payments online? | No. Bank transfer to the church's IBAN, ticked by hand. | Coordinators |
| What fee do we charge? | Set per training. For December 2026, €70 per seat, the amount we owe Lebensstrom. | Lebensstrom |
| Who pays nothing? | Anaheim attendees, Ukrainian saints not gainfully employed, and hardship waivers granted by the coordinators (with a reason). | Lebensstrom |
| Questionnaire due in one week or two? | One week (7 days). The PDF's "two weeks" is outdated. | Lebensstrom |
| Tests cover 1–10 but attendance covers 12. Conflict? | No. Test 1–10, take attendance for all 12. | Lebensstrom |
| Until when can people register? | Through the first day of the local training. | Lebensstrom |
| Until when can part-timers change sessions? | Until the first session starts, so absences are counted correctly. | Lebensstrom |
| Until when can people cancel? | Until the first session starts. After that, coordinators handle it. | Working decision |
| Can a shared seat be part-time? | No. Shared seats are always full-time. | Lebensstrom |
| Several registrations from one email? | Yes. Each registration gets its own edit link. | Coordinators |
| How do registrants edit without an account? | A personal edit link in the confirmation email, as with today's plugin. | Coordinators |
| Who can see contact details? | Coordinators only. | Working decision |
| What happens to personal data afterwards? | Names and contacts are deleted once the report is filed and accepted. Only counts are kept. | Working decision |
| Which questionnaire form? | The December 2026 version from the Lebensstrom page. | Lebensstrom |
| Which account do fees go to? | Saints pay the church. The church transfers to Lebensstrom e.V., reference "Spende 2026 WT". | Lebensstrom |

## 9. Technical approach

Built with Next.js for the website and Supabase (Postgres) for the database. Email, hosting and data protection need their own services and setup.

### Go-live: January 2027, in three stages

| Stage | Ready by | Includes |
| --- | --- | --- |
| 1. Registration | About 20 Nov 2026 | Form in three languages, confirmation email with edit link, edit and cancel, registration list, payment checkboxes, outline counts |
| 2. During the training | One week before the first session | Study groups, attendance on a phone, hymns, verses and rules for the screen, services, testing schedule, name tags, reminders |
| 3. After the training | The last session | Report page, printable questionnaire, reimbursements |

Stage 1 must be live before the outline order on 1 Dec. If it slips, registration opens on the current Google Form and the data is imported later.

### How the stack covers the requirements

| Requirement | With Next.js and Supabase |
| --- | --- |
| Schedule and fee on the form | Pages read the training, sessions and fee from Supabase |
| Edit and cancel without an account | A long random token per registration in the email link, checked on the server |
| Several coordinators editing live | Supabase Auth for coordinator logins; Supabase Realtime pushes changes to every screen |
| Who sees what | Row-level security: registrants see nothing directly; coordinators see their training |
| Attendance on a phone | A mobile-first page that saves on the phone first and syncs when Wi-Fi returns |
| German, English and Russian | All text translated; per-language hymn data in the database |
| Copy last training | A database function that copies sessions, rules, services and prices |

### What else is needed

| Need | Why | Plan |
| --- | --- | --- |
| Email service | Supabase only sends its own login emails | Resend free plan: 3,000 emails a month, 100 a day |
| A domain | Emails from a free address land in spam | A church domain with SPF and DKIM |
| Website hosting | Supabase hosts only the database | Vercel or Railway, EU region |
| Supabase plan | Free projects pause after a week without use; no daily backups | Pro (about $25 a month), or keep-alive plus own backups |
| Spam protection | A public form attracts bots | Cloudflare Turnstile and rate limits |

### Data protection

- Database and website hosted in the EU (Supabase Frankfurt region)
- Data processing agreements with every provider
- A privacy notice (Datenschutzerklärung) and an Impressum, linked from the form
- Contact details for coordinators only; deleted after the report is accepted

### Ownership

- All accounts belong to the church, under a shared church email
- At least two coordinators as admins
- A separate test copy for trying changes before a training
- Expected cost: roughly $25–50 a month on paid plans

## 10. Later

Wanted, but not needed for the first training on the new system.

- **Transfer a registration.** Hand a registration to another person when someone can no longer come.
- **Digital information packet.** Rules and verses for each registrant in one place.
- **City groups.** Mannheim, Heidelberg and nearby cities sometimes do part of the training on their own and may want to split off.
- **More languages.** Training languages beyond English, German and Russian.
- **Other trainings.** A different number of messages, such as ITERO with 8.
