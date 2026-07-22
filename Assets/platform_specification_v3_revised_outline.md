# Revised Specification — Recommended Outline (v3)

**Working document for Nick · July 2026**
Restructures the July 2026 spec (`platform_specification_v3 (1).docx`) and inserts the sections identified in the gap analysis.

Tags: **[NEW]** = section that did not exist in the July 2026 spec. **[EXPANDED]** = existed but needed substantial additions. **[carried over]** = largely as written in the July 2026 spec. Carried-over text is reproduced from the source document; `[EXPANDED]` sections keep the original bullets and add the outline's new items as open questions (see Appendix C); `[NEW]` sections are scaffolded as open questions only — no commercial, legal, or safeguarding decisions have been fabricated here.

---

## 1. Vision and Purpose `[carried over]`

### 1.1 The Problem It Solves

Pamina Rich has operated a professional tutoring practice in Perth, Western Australia for twenty years. Her practice serves approximately forty students per week, all referred through word of mouth. She has a waiting list of students she cannot reach, students who need the quality of teaching her practice delivers but cannot access it because of geographic distance, limited session availability, or cost barriers.

This platform exists to solve that problem. It extends the reach of Pamina's teaching to students who cannot access her in person, students in regional and remote Western Australia, students on her waiting list, and students who need support outside of tutoring session hours.

The platform does not replace the teacher-student relationship. It makes that relationship possible where it would otherwise be absent.

### 1.2 What the Platform Delivers

The platform delivers asynchronous English and Literature ATAR tutoring content to Western Australian students in Years 7 through 12, aligned to the SCASA curriculum and WACE ATAR examinations.

It is not a generic tutoring platform. Every piece of content on the platform reflects Pamina's specific analytical frameworks, her twenty years of teaching experience, and her deep knowledge of what WA examiners are looking for. The platform delivers her teaching at scale, with the same quality, rigour, and precision that her in-person students receive.

### 1.3 The Platform Is a Methodology Platform

The platform is not a fixed text library. It is a methodology platform.

The platform's analytical frameworks transfer to any text a teacher or student is working with. The specific texts used as worked examples are demonstrations of the methodology, not the boundaries of it. New texts slot into existing content type templates as the platform grows. The architecture must support indefinite scaling as new texts and content types are added, without requiring a rebuild.

### 1.4 The Primary Student Cohort

The platform's primary cohort is aspirational students from Asian immigrant families in Western Australia. These students are high-achieving, highly motivated, and often face a specific challenge: the English and Literature ATAR curriculum requires students to bring their own cultural background, reading position, and lived experience to their analytical writing. For students from non-Western cultural traditions, this can feel like a disadvantage. The platform treats it as an asset.

The platform's content is built on a translation model, not a remediation model. It does not correct students' cultural backgrounds. It shows them how those backgrounds are analytically powerful.

### 1.5 Launch Cohort and Growth `[gap — new content]`

- Launch cohort size: **open question** — how many students at Term 1 2027 launch (Pamina's current ~40/week practice, waitlist, or a broader open cohort)?
- Six-month growth assumption: **open question** — what user-count/content-volume growth is the architecture being sized for by mid-2027?

*(See Appendix C — these two figures gate the commercial model in Section 2 and the scalability targets in Section 9.)*

---

## 2. Commercial Model `[NEW]`

No commercial terms currently exist in the source spec. This section is a placeholder for decisions that materially change build scope — it must be closed with Pamina before the development contract is signed (see Sequencing Note).

- **Pricing structure**: subscription / per-course / term-based — decision owed.
- **Free tier or trial**: yes/no, and terms if yes.
- **Family plans**: whether multiple children under one account/billing relationship is in scope.
- **Payment provider**: which processor (e.g. Stripe), and whether it's already selected.
- **Billing mechanics**: invoicing cadence, GST handling, refund policy, cancellation policy, failed-payment handling (dunning, grace period, account suspension).
- **Access-control matrix**: what each account tier (free/paid/family/etc.) can view vs. download vs. submit for AI feedback.
- **Budget envelope**: one-off build budget, and monthly running-cost ceiling (hosting + AI usage) the architecture must stay under.

---

## 3. Users, Accounts and Onboarding `[EXPANDED]`

### 3.1 Carried over from Section 2.1 (Student Accounts)

- Secure student account creation and login
- Student profile including year level, course type (Literature ATAR, English ATAR, General English), and school
- Progress tracking: which content has been accessed, which tasks have been completed
- Privacy-compliant data handling — students are minors, data must be collected minimally and handled securely
- Parent or guardian visibility of student progress *(original spec marked this "to be discussed" — resolved below, pending decision)*

### 3.2 New for this revision

- **Registration model**: open signup / invite-only / waitlist-first — decision owed.
- **Year-level or school verification**: is any verification required at signup, or is year level self-declared (as the current onboarding flow implements)?
- **Parent account model and progress visibility**: resolve the "to be discussed" item above — does a parent get their own login, a shared view, or periodic reports?
- **Parental consent flow at signup**, including handling of under-15 students specifically (Australian Privacy Act / APP guidance on consent capacity for minors).
- **Roles**: student, parent, admin (Pamina), developer/support — confirm this is the full role set. *(Current build implements student + a flat admin allow-list only; parent and developer/support roles do not yet exist in the schema.)*
- **Admin impersonation — standing requirement (built 22 July 2026)**: admins can impersonate any user for testing (session-level swap, always-visible banner, one-click stop, audit-logged). **Every feature — new and eventual — must respect impersonation**: (a) server logic acts on the effective (impersonated) user; (b) anything with real-world side effects — payments, outbound email/notifications, external AI submissions, consent/T&C acceptance — must detect an active impersonation and block or clearly mark the action as admin-performed, so an admin testing as a student can never silently charge, email, or legally bind the real user; (c) audit-relevant writes record the impersonating admin's identity; (d) any new page/layout must show the impersonation banner. This requirement carries over unchanged to the eventual Clerk migration.
- **Bootstrap admin recovery (built 22 July 2026)**: the `ADMIN_EMAILS` secret lists emails that are granted the admin role automatically at each login — covers first-admin creation on a fresh deploy and lockout recovery. Not a password bypass: identity is still verified by the sign-in provider.

---

## 4. Functional Requirements — Content and Tools `[EXPANDED]`

### 4.1 Carried over (Sections 2.2–2.8, 2.11 of source spec)

**Content Delivery**
- Organised content library accessible by year level, course type, text, and content type
- Documents delivered in a format students can read on screen and download (PDF preferred for formatted documents)
- Search functionality — students can search by text title, year level, or content type
- Content flagged as new or recently updated
- Mobile-responsive design — many students access content on phones

**Text Title Formatting Convention**
The WA academic convention for text titles is inverted commas and underline applied consistently throughout all platform content. Technical requirement: all text titles across the platform must be wrapped in a specific CSS tag that automatically applies inverted commas and underline formatting, applied consistently to every text title in every document across the platform — a platform-wide design decision, not a document-by-document formatting task.

**Curriculum Mapping Tool** (primary entry point)
- Maps student inputs (year level, course, text being studied, task type, upcoming assessment) to relevant platform content
- Student answers a short series of questions and is directed to the specific content most relevant to their immediate need
- Must handle the full range of year levels (7–12), course types, and task types (essay, close reading, short answer, creative writing)
- Must be updatable as new content is added without requiring a rebuild

**Comparative Novel Study Tool (Years 7–9)**
- Visual plotting board mapping story structure across two or three novels simultaneously
- Elements: story arc (exposition, rising action, climax, falling action, resolution), character arc, thematic development, key conventions (foreshadowing, turning points, symbolism)
- Interactive — students fill in the board themselves, comparison across texts visible as they work
- Designed for Years 7–9, potentially applicable across all year levels

**Metalanguage Framework**
- Embedded metalanguage: curriculum terms built into analytical documents at the point of need (blue curriculum term boxes, green model sentence boxes) — a content design principle, not a separate feature
- Standalone Metalanguage Dictionary: searchable/tabbed reference resource, accessible from any page without losing the student's place *(implemented — see `MetalanguageDictionary.tsx`)*

**Cultural Context Library Hub Navigation**
- Hub-level navigation showing all six hubs and status (available / coming soon)
- Within-hub sequential navigation through the document sequence
- Cross-hub connections where relevant
- Hub documents accessible both through hub navigation and the curriculum mapping tool

**Video Content Delivery**
- Video hosting or embedded playback (streaming, not downloadable)
- Video as mandatory prerequisite before certain hub content unlocks
- Mobile-compatible playback

**Platform Experience**
- Clean, professional design appropriate for a high-achieving student cohort
- Fast load times
- Intuitive navigation — a student should find what they need within three clicks
- Consistent design language across all content types
- Accessibility compliance *(specific standard now set in Section 9)*

### 4.2 New for this revision

- **Video gating logic**: define "completed" (e.g. ≥90% watched) and exactly what it unlocks — currently undefined.
- **Comparative tool persistence**: save-state, resume, export/print, and whether Pamina can view student boards (for teaching QA/intervention) — currently undefined; no persistence layer exists for the comparative tool yet.
- **Content protection**: per-student PDF watermarking; download-vs-view-only policy by content type (e.g. model essays view-only, worksheets downloadable) — currently undefined and unbuilt.

---

## 5. AI Feedback Engine `[EXPANDED]`

### 5.1 Carried over from Section 2.9

The AI feedback engine is included at launch (confirmed decision, July 2026).

- Students submit essay or close reading responses through the platform
- The AI engine provides feedback structured around the platform's existing analytical frameworks (nine-sentence paragraph structure, B vs A comparison principles, close reading dominant-reading framework)
- Feedback is generated within Pamina's pedagogical framework, not generic AI feedback
- All feedback is clearly identified as AI-assisted
- The engine will be tested against real student essays in Pamina's teaching practice before launch

**AI content-blocking requirement**: the platform must block AI from writing whole essays or whole short answers for students — a fundamental ethical and pedagogical requirement. The AI feedback engine assesses and responds to student writing; it does not produce student writing. Demonstration writing (model essays, paragraphs, sentences) that Pamina has produced and approved is maintained on the platform, clearly identified as model writing, and is not submittable as a student's own work.

### 5.2 New for this revision

- **Provider and model selection**: which LLM provider/model, and on what basis (cost, quality, data-handling terms)?
- **Per-submission cost model** and **latency target** (student-facing turnaround expectation for feedback).
- **Per-student usage limits**: submission caps to bound AI spend.
- **Calibration mechanism decision**: retrieval-augmented prompting / worked-example (few-shot) prompting / fine-tuning — and the specific role of the Google Drive corpus (Section 6) in whichever mechanism is chosen.
- **Feedback QA**: human-review or spot-check workflow, escalation path when feedback is wrong, and a working definition of "acceptable feedback."
- **Content-blocking enforcement design**: must be layered, not prompt-only — output templates that structurally can't contain a full essay, length caps, logging of all generations, and adversarial testing (red-teaming) against jailbreak attempts to extract full essay drafts.
- **Fallback plan** if the engine fails pre-launch testing — e.g. human-reviewed feedback delivered via the Drive pipeline (Section 6) as a stopgap at launch.
- **AI-assisted labelling on all feedback** — carried over as a requirement, i.e. every AI-generated feedback artifact must be visibly labelled as AI-assisted, consistent with 5.1's "clearly identified" requirement.

---

## 6. Google Drive Pipeline `[EXPANDED]`

### 6.1 Carried over from Section 2.10

A Google Drive MCP integration is confirmed and working as a live content pipeline. Students share their work to a Google Doc. Pamina reads the work, adds corrections and model writing directly to the same document. The AI reads the document, seeing both the student's original work and Pamina's interventions simultaneously.

Over time, the accumulation of student work alongside Pamina's corrections becomes the calibration data for the AI feedback engine. The platform architecture must support this pipeline's integration with the student account and essay submission system.

### 6.2 New for this revision

- **Throughput ceiling**: how many Pamina-hours per week can realistically go into this pipeline, and what does that cap on student volume?
- **Queueing**: how submissions queue when demand exceeds that ceiling.
- **Student-facing turnaround expectation**: what SLA (if any) is communicated to students/parents for Drive-pipeline feedback, distinct from the AI engine's latency target (5.2).

---

## 7. Data, Privacy and Safeguarding `[NEW]`

Carries forward the principles in original Section 3.4 (Student Data and Privacy); everything else here is new and unresolved.

**Carried over (3.4):**
- Data collection must be minimal — only what is necessary for the platform to function
- Student data must be stored securely and not shared with third parties
- A clear privacy policy must be in place before launch
- Parent or guardian consent mechanisms where required
- Student essay submissions will contain sensitive personal content — the data-handling framework for this must be designed before the AI feedback engine is activated

**New:**
- **Data-flow map**: every system student work touches — platform database, Google Drive/Workspace, the AI provider — end to end.
- **Data residency position**: where data is hosted/processed (source spec confirms Australian hosting for the platform itself — does that extend to the AI provider and Google Drive processing?) and the AI provider's data-processing terms (training-use opt-out, retention period).
- **Consent register**: platform use, parental consent, use of student work as AI calibration data (Section 5.2/6.1), and testing-participation consent (Section 11) — tracked as distinct, separately revocable consents.
- **Retention and deletion policy**: for essays, feedback, and closed accounts.
- **Safeguarding protocol**: detection of concerning content in student submissions (self-harm, abuse disclosure, etc.), escalation path to a human, defined AI behaviour on flagged content, and any mandatory reporting obligations under WA/Commonwealth law.

---

## 8. Legal `[NEW]`

- **Privacy policy, terms of service, acceptable-use / academic-integrity policy**: none currently drafted.
- **Copyright position**: fair-dealing analysis for quoted set texts (extensive quotation of texts like *A Doll's House*, *Frankenstein*, etc. in worked examples); licensing position for documentary/film companion media used in the Cultural Context Library hubs.
- **Copyright notice automation** `[carried over from source 2.12]`: copyright notice automatically applied to all documents.

---

## 9. Non-Functional Requirements `[NEW]`

- **Accessibility**: target **WCAG 2.2 AA** (source spec only said "accessibility compliance" — this sets the specific standard).
- **Performance budgets**: defined load times on mid-range mobile over 4G, using a regional WA connectivity baseline — concrete numbers not yet set (source spec only said "fast load times... content must be accessible without significant wait").
- **Uptime target**, backup and disaster-recovery plan.
- **Supported browser/device matrix.**
- **Security**: pre-launch security review / penetration test; secure handling of minors' data (ties to Section 7).
- **Scalability targets restated as numbers**: concurrent users, content volume — source spec (3.3) states the *principle* ("must scale... without performance degradation, new texts and content types addable without rebuild") but no numeric targets exist yet; these should derive from the six-month growth assumption in Section 1.5.

---

## 10. Content Management and Operations `[EXPANDED]`

### 10.1 Carried over from Section 2.12

- Pamina must be able to add, update, and organise content without developer assistance for routine updates
- A simple CMS that does not require technical knowledge to operate
- Version control — ability to update documents without losing previous versions
- Copyright notice automatically applied to all documents *(also listed under Section 8 — Legal)*

### 10.2 New for this revision

- **Admin dashboard**: review queue, student activity, flags, AI usage and cost.
- **Student support channel** and response-time expectations.
- **Notifications**: feedback ready, new content published, prerequisite completed.
- **Analytics instrumentation**: KPIs are still "to be agreed" (per source spec cover page) — build the measurement infrastructure now so it's ready once KPIs are set, rather than retrofitting later.
- **Post-launch maintenance and bug-fix arrangement**: contract schedule with the developer beyond launch.

---

## 11. Testing and Acceptance `[NEW]`

### 11.1 Carried over (testing model, from Sections 1.5 / 3.2)

Testing model: individual design targets and features are tested on real students in Pamina's teaching practice, on texts they are currently studying at school. This live testing with real students on real assessments is the platform's quality-assurance mechanism before launch, against the standard of **90–100% correct before anything reaches a student**.

### 11.2 New for this revision

- **Environments**: staging must be separate from production.
- **Testing-specific parental consent**: distinct from platform-use consent (Section 7) — covers a student's work being used in pre-launch feature testing.
- **UAT process and acceptance criteria per feature**: each Section 4/5 functional requirement needs a testable pass condition.
- **Adversarial testing of AI content-blocking** (Section 5.2) with real students attempting to extract full essay drafts.

---

## 12. Delivery Plan and Milestones `[EXPANDED]`

### 12.1 Carried over

- **Launch date**: Term 1 2027 (mid-January to first week of February 2027).
- **Launch model**: single-stage. All features, including the AI feedback engine, active at launch — no phased rollout.

### 12.2 New for this revision

- **Contract milestones with dates**: design sign-off, content migration, AI engine testable, UAT start, launch — none currently dated beyond the launch window itself.
- **Internal must-work-first build ordering**: the public launch remains single-stage (no phased *release*), but the build itself should still be sequenced internally (e.g. accounts/content before AI engine before Drive-pipeline calibration).
- **Risk register**: AI engine failing pre-launch testing (mitigated by the Section 5.2 fallback plan), timeline slip over the Christmas period, key-person dependency on Pamina (content authorship and the Drive-pipeline correction workflow both currently depend on her personally).

---

## 13. Existing Content Inventory `[carried over]`

*(Original Section 4, unchanged.)*

### 13.1 Content Types

| Content Type | Description |
|---|---|
| Literature ATAR Paragraph Structure Documents | Nine-sentence analytical paragraph framework, text-specific, with worked examples and annotations. Built for: *A Doll's House*, *Frankenstein* (×2), *Top Girls*, *Hedda Gabler*, *Life of Pi*. |
| Literature ATAR Introduction Structure | Six-part introduction framework. *Macbeth* worked example, transferable to all texts. |
| B vs A Comparison Documents | Sentence-by-sentence comparison of B-range and A-range analytical writing, with annotations naming exactly where the gap is. Seven documents built. |
| Close Reading Teaching Suites | Teaching note plus B vs A comparison. Built for: *Ghost Cities* (Siang Lu), *Types of Beach Sand* (Scott-Patrick Mitchell). |
| Cultural Context Library | Six-hub architecture (see 13.3). Major content type. American Hub partially built. |
| Student Diagnostic Feedback Documents | Text-specific diagnostic assessment of student essays with model paragraph rewrite and annotated teaching notes. Delivered via Google Drive pipeline. |
| Metalanguage: Embedded | Curriculum terms built into analytical documents at the moment they are needed. Blue curriculum term boxes and green model sentence boxes. |
| Metalanguage: Dictionary | Standalone reference resource. Three tabs built. |
| Comparative Novel Study Tool | Visual plotting board for Years 7–9. Confirmed in live teaching. To be built as interactive platform tool. |
| Cross-Cultural Entry Documents | Framework documents mapping non-Western cultural traditions to WA ATAR analytical frameworks. Built for: Afghan/Dari. |
| Creative Writing Guides | Task-specific guides, rationale documents, and current affairs guides. Multiple documents built for Years 8–9. |
| Grammar Reference Section | Persistent grammar reference layer. Partially built. |
| Short Answer Style Guide | Framework for comprehending tasks and short answer responses. |
| Parent Information Section | Parent-facing documents. AI statement document complete. |
| Video Content | Prerequisite viewing for Cultural Context Library hubs. First video (*How Novels Work*) priority build. |

### 13.2 Volume of Content Built to Date (as of July 2026)

- Six text-specific Literature ATAR paragraph structure documents
- One Literature ATAR introduction structure document
- Seven B vs A comparison documents (six essay, one close reading)
- Two complete close reading teaching suites
- Three American Race Hub documents (Documents 1 and 2 complete, Document 3 in progress)
- Colonial context teaching note (*No Sugar* and Canadian colonial parallel)
- *God of Small Things* Task 7 teaching note
- Seventeen-plus student diagnostic feedback documents
- Multiple creative writing guides, current affairs guides, and rationale documents
- Grammar reference section (partially built)
- Cross-cultural entry documents
- Parent Information Section: AI statement
- Platform scope and orientation documents

All content has been built and tested with real students across Year 9 to Year 12, and meets the 90–100% correct standard.

### 13.3 The Cultural Context Library: Six-Hub Architecture

The Cultural Context Library provides a universal framework for classifying literature from different countries and cultures. Each hub follows the same template. The empowered/disempowered analytical framework is the universal lens across all hubs; the axis of empowerment differs by hub.

Hub template: prerequisite video → Document 1 (Historical Foundation) → Document 2 (Documentary or Film Companion) → Document 3 onwards (text-specific context and metalanguage, embedded metalanguage structure).

| Hub | Primary Axis | Status |
|---|---|---|
| 1: American | Race. Empowered/disempowered groups defined by racial hierarchy. | Documents 1–2 COMPLETE. Document 3 (*The Help*) IN PROGRESS. Documents 4–6 TO BUILD. |
| 2: Australian | Colonial history and Australian identity. | TO BUILD. Texts to be confirmed. |
| 3: Indigenous Australian | Sovereignty, dispossession, Stolen Generations, living culture. | Partial build. *No Sugar* Canadian colonial context COMPLETE. Full hub TO BUILD. |
| 4: British | Class and colonial legacy. | TO BUILD. Texts to be confirmed. |
| 5: Indian | Caste, colonial legacy, gender. | TO BUILD. Anchor text: *The God of Small Things* (Roy). |
| 6: Holocaust | Racial and ethnic identity under totalitarianism. | TO BUILD. Four texts already on platform. |

### 13.4 Text Library

| Year Level | Texts |
|---|---|
| Year 12 Literature ATAR | *The God of Small Things* (Roy), *True Country* (Kim Scott), *Yellowface* (R.F. Kuang) |
| Year 11 Literature ATAR | *A Doll's House* (Ibsen), *Frankenstein* (Shelley), *Top Girls* (Churchill), *Hedda Gabler* (Ibsen), *Life of Pi* (Martel) |
| Year 11 English ATAR | *Requiem for a Beast* (Ottley), *No Sugar* (Jack Davis), *Happyend* (film, Neo Sora), *The Book Thief* (Zusak), *The Arrival* (Shaun Tan) |
| Year 10 Perth Modern | *The Crucible* (Miller), *Death of a Salesman* (Miller), *A Streetcar Named Desire* (Williams), *Into the Spiderverse* (film) |
| Year 9 | *The Boy in the Striped Pyjamas* (Boyne), *They Came on Viking Ships* (French), *Salt to the Sea* (Sepetys), *Parvana* (Ellis), *The Giver* (Lowry), *Son* (Lowry), *The Curious Incident of the Dog in the Night-Time* (Haddon) |
| Year 7–8 | *Once* (Gleitzman), *Hatchet* (Paulsen), *Sadako and a Thousand Cranes* |
| Unseen texts (close reading) | *Ghost Cities* (Siang Lu), *Types of Beach Sand* (Scott-Patrick Mitchell) |

*(Architecture must support this list growing indefinitely — see Section 1.3.)*

---

## Appendix A — Design Principles and Ethical Framework `[carried over from source Section 3, unchanged in substance]`

**The Ethical Design Framework.** This platform is designed in alignment with the Center for Humane Technology's AI Roadmap (2026), specifically Principles 3 and 4.

- *Principle 3 — AI design must center human well-being*: the AI on this platform is a production tool, not a pedagogical agent. Students receive Pamina's teaching, structured and delivered with the help of AI. The platform does not simulate human relationships, foster AI dependence, or position AI as a substitute for teacher expertise.
- *Principle 4 — AI must not automate away meaningful human work*: the platform amplifies Pamina's expertise; it does not replace it. Every document reflects her analytical voice and pedagogical framework. AI makes it possible to deliver her teaching at scale — the teaching remains hers.

**The Quality Standard.** 90–100% correct before anything reaches a student. An ethical commitment to students, not perfectionism. The live-testing model (Section 11) is the mechanism for meeting this standard before launch.

**The Methodology-First Architecture.** The platform's analytical frameworks are the product; the texts are worked examples. New texts must be addable without a rebuild; content-type templates must be reusable across texts; the curriculum mapping tool must be updatable as content grows; the Cultural Context Library hub structure must be extensible; the platform must scale without performance degradation.

**Student Data and Privacy.** See Section 7 (now expanded from this principle).

**The Human Relationship at the Centre.** The platform exists to extend a human teacher's reach, not replace human teaching. A student using the platform should feel they are receiving the guidance of an experienced teacher delivered through technology — not the output of an algorithm.

---

## Appendix B — Glossary `[NEW]`

| Term | Meaning |
|---|---|
| **Hub** | One of the six Cultural Context Library units (Section 13.3), each built around a single axis of empowerment/disempowerment and a fixed document template. |
| **Suite** | A Close Reading Teaching Suite — a teaching note paired with a B vs A comparison document, built for a specific unseen text. |
| **Embedded metalanguage** | Curriculum terms defined inline within an analytical document, at the point the student needs them (blue term boxes, green model-sentence boxes) — distinct from the standalone Dictionary. |
| **B vs A comparison** | A document type that compares B-range and A-range analytical writing sentence-by-sentence, annotating exactly where the gap in quality is. |
| **Nine-sentence paragraph structure** | Pamina's Literature ATAR analytical paragraph framework — the structural backbone the AI feedback engine (Section 5) is built to assess against. |
| **Dominant reading** | The close-reading framework term for the interpretation a text's own structure and technique most strongly invite, as distinct from a resistant or alternative reading. |
| **Empowered/disempowered framework** | The universal analytical lens applied across all six Cultural Context Library hubs; the specific axis (race, class, caste, etc.) varies by hub. |
| **Drive pipeline** | The Google Drive-based workflow (Section 6) where students submit work, Pamina corrects it in place, and the corrected document becomes AI calibration data. |

*(Populate further as new platform-specific terms are coined — this list currently covers terms already used elsewhere in this document.)*

---

## Appendix C — Decision Log `[NEW]`

Open questions raised by this revision, needing an owner and a due date. Populate as decisions are made.

| # | Question | Section | Owner | Due | Status |
|---|---|---|---|---|---|
| 1 | Launch cohort size and six-month growth assumption | 1.5 | Pamina / Nick | TBD | Open |
| 2 | Pricing structure, free tier, family plans | 2 | Pamina / Nick | TBD | Open |
| 3 | Payment provider and billing mechanics (GST, refunds, cancellation) | 2 | Nick | TBD | Open |
| 4 | Access-control matrix by account tier | 2 | Pamina / Nick | TBD | Open |
| 5 | Budget envelope and monthly running-cost ceiling | 2 | Nick | TBD | Open |
| 6 | Registration model (open / invited / waitlist-first) | 3 | Pamina | TBD | Open |
| 7 | Parent account model and progress visibility | 3 | Pamina | TBD | Open |
| 8 | Parental consent flow, incl. under-15 handling | 3 / 7 | Pamina / Legal | TBD | Open |
| 9 | Confirm full role set (student, parent, admin, developer/support) | 3 | Nick | TBD | Open |
| 10 | Video "completed" threshold and unlock logic | 4 | Pamina / Developer | TBD | Open |
| 11 | Comparative tool save-state, resume, export, Pamina visibility | 4 | Developer | TBD | Open |
| 12 | PDF watermarking and download-vs-view-only policy by content type | 4 | Pamina / Nick | TBD | Open |
| 13 | AI provider/model selection, cost model, latency target | 5 | Developer | TBD | Open |
| 14 | Per-student AI usage limits | 5 | Nick | TBD | Open |
| 15 | Calibration mechanism (retrieval / few-shot / fine-tuning) | 5 | Developer | TBD | Open |
| 16 | Feedback QA workflow and escalation path | 5 | Pamina | TBD | Open |
| 17 | Content-blocking enforcement design (layered) | 5 | Developer | TBD | Open |
| 18 | Fallback plan if AI engine fails pre-launch testing | 5 | Pamina / Developer | TBD | Open |
| 19 | Drive-pipeline throughput ceiling and student-facing turnaround | 6 | Pamina | TBD | Open |
| 20 | Data-flow map across platform / Drive / AI provider | 7 | Developer | TBD | Open |
| 21 | Data residency and AI-provider data-processing terms | 7 | Nick | TBD | Open |
| 22 | Consent register design | 7 | Legal | TBD | Open |
| 23 | Retention and deletion policy | 7 | Legal / Developer | TBD | Open |
| 24 | Safeguarding protocol for concerning submission content | 7 | Pamina / Legal | TBD | Open |
| 25 | Privacy policy, ToS, acceptable-use policy drafting | 8 | Legal | TBD | Open |
| 26 | Fair-dealing analysis for quoted texts; media licensing | 8 | Legal | TBD | Open |
| 27 | Performance budgets, uptime target, backup/DR, security review | 9 | Developer | TBD | Open |
| 28 | Numeric scalability targets (concurrent users, content volume) | 9 | Developer | TBD | Open |
| 29 | Admin dashboard scope | 10 | Pamina / Developer | TBD | Open |
| 30 | Post-launch maintenance/bug-fix contract | 10 | Nick | TBD | Open |
| 31 | UAT acceptance criteria per feature | 11 | Developer | TBD | Open |
| 32 | Contract milestone dates | 12 | Nick / Developer | TBD | Open |
| 33 | Risk register sign-off | 12 | Nick | TBD | Open |

---

### Sequencing Note

Sections 2, 3, 5 and 12 contain the decisions that change build scope — close those with Pamina before the development contract is signed. Sections 7, 8 and 11 can be drafted in parallel during the design phase but must be complete before the AI engine is activated with real student data.
