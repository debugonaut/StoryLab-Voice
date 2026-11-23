# StoryLab Voice — presentation script

Timings assume a 12–14 minute slot. Lines marked ✂ can be dropped for a 10-minute cut.
Diagram pages sit between slide 3 and slide 4.

---

## Slide 1 — Problem statement (1:15)

Good morning. We are presenting StoryLab Voice, a voice-first tutor for students in classes six to eight.

Start with the classroom. One teacher, forty students, one pace. If a student falls behind, they cannot ask again quietly — asking in front of the class costs them something, so they stop asking.

The second constraint is the connection. In the schools we are designing for, connectivity is intermittent rather than absent. Most learning apps assume the opposite: always-on broadband, a mid-range phone, an app store install.

Third, the material. Textbooks carry early middle school, exactly when reading confidence is still forming, and science experiments need apparatus many schools simply do not have.

And the tools that do exist are English-first, general-purpose assistants — not aligned to the syllabus the student is actually being examined on.

So the product statement is one line: a teaching assistant that survives a bad connection.

---

## Slide 2 — Objectives (1:00)

We set four objectives, each one measurable.

One: three learning modes — branching stories, a voice tutor and a virtual lab — inside a single app under twenty-five megabytes.

Two: hands-free spoken interaction in English, Hindi and Marathi, because typing is the barrier for our youngest users.

Three: full usability with zero connectivity — cached interface, local content, progress queued locally and synced later.

Four: answers beyond a fixed script. A cloud language model for free-form questions, with curated offline answers as the fallback.

We deliberately left out the teacher dashboard, accounts, grading and content authoring. Those are real needs, and they are the next phase, not this prototype.

---

## Slide 3 — Methodology and design (1:15)

Method: iterative, and honestly revised. We started with requirements, then use cases, structural design, architecture, state and interaction modelling — and went back over the design twice when implementation disagreed with it.

Structurally, four people worked in parallel behind frozen contracts. Each module talks to the shell through a small published interface — storage, state, router, voice. No module touches the database directly, and content is data, not code, so a new lesson never means a code change.

The shell owns storage, navigation and offline state. StoryLearn and the lab are players driven by JSON. The tutor is the only component with a network dependency, and it is isolated behind a single server boundary that fails safely.

The UML models for that design follow on the next pages.

---

## Diagram pages (4–5 minutes; ✂ in the 10-minute cut keep 3, 7 and 9 only)

**1. Use case.** Three actors: the student, the teacher who reads the record on the device, and the tutor behind the proxy. Six main use cases, with speech recognition and progress storage as included behaviour.

**2. Class.** Our modules drawn as classes with a module stereotype — Router, StateStore, DB, StoryPlayer, TutorSession, LabRunner — plus the content entities they operate on.

**3. Deployment.** Three nodes: the student's phone, our Node server, and the model provider. The important edge is the middle one — the API key lives on the server and never reaches the browser.

**4. Package.** Dependency direction matters more than the boxes: modules depend on the shell, the shell depends on nothing.

**5. Component.** What each part provides and what it requires. The tutor requires three things: recognition, synthesis, and the tutor API.

**6. Composite structure.** Inside the tutor session: capture, recognition, answer resolution, streaming, speech output.

**7. State chart.** The voice session in four states — idle, listening, thinking, speaking — with silence, empty transcript and provider failure each returning safely to idle.

**8. Activity.** Asking a question, including the offline branch: no network means a curated answer, not an error.

**9. Sequence.** The current one. Browser to proxy to provider, the answer returning in chunks, then spoken. This is the diagram that changed most after testing.

**10. Communication.** The same collaboration as numbered messages, which shows the coupling rather than the timing.

**11. Interaction overview.** The whole lesson loop: open a story, answer, optionally ask the tutor, finish, save, sync when online.

That is the design. Here is what actually exists today.

---

## Slide 4 — Progress so far (1:30)

Four modules, one working product. Onboarding, home, story library, virtual lab, voice tutor and learning record are all functional.

Nine branching stories across four subjects play end to end, with voice questions, wrong-answer feedback and saved completion. Two Canvas labs run with spoken step guidance and save their completion to the same progress store.

The tutor answers free-form questions in three languages, streams the answer as it arrives, keeps the last three exchanges so follow-ups work, and falls back to twenty-two curated topics when the network is gone.

Evidence, not adjectives: ten out of ten smoke checks pass, covering routes, error paths, the child-safety guardrail and streaming. Imagery came down from two thousand and forty-four kilobytes to one thousand two hundred and eighty.

One limit we will state ourselves: microphone input cannot be automated, so it was verified by hand in Chrome. Everything else on these numbers was scripted and re-run.

*(Optional live demo here: 90 seconds — open a story, answer one question wrong, finish a lab, ask the tutor one question.)*

---

## Slide 5 — Future work (1:00)

Content: more labs. The canvas engine already draws beakers and flasks, so a new experiment is a JSON file, not new code. More stories per subject, and eventually teacher-authored packs.

Access: complete Hindi and Marathi coverage of the interface — today only the tutor is localised — and audio-first onboarding for students who cannot yet read the interface.

Platform: a teacher view that reads the learning record already sitting on the device, and an optional school sync endpoint.

And evaluation: an offline speech model to remove the network dependency for voice, then a classroom pilot with a pre/post comprehension check, and accessibility testing with screen-reader users.

---

## Slide 6 — Conclusion (0:30)

What this project demonstrates is narrow and, we think, useful: a curriculum-aligned, voice-first learning app can run on the phones students already own. It stays useful with no network, and gets better when a network appears — because the unreliable part sits behind a boundary that fails safely.

Thank you. We are happy to take questions.

---

## Likely questions

**"Why no framework?"** Payload and device budget. Vanilla JavaScript keeps the app under a megabyte and readable on a two-gigabyte phone; the cost is manual state handling, which the shell centralises.

**"What happens when the model is down?"** The proxy retries alternative model ids; if none answer, the client falls back to the curated library and the badge shows offline. The lesson still completes.

**"Is the student's data safe?"** Progress stays in the browser's own database. Questions sent to the model carry no name or ID, and the key never reaches the client.

**"Why is the tutor online at all if the app is offline-first?"** Curated answers cover the syllabus; the model covers curiosity. Offline-first means the app never depends on the network, not that it refuses one.

**"How would this scale to a school?"** The proxy is stateless and the app is static, so one small server can serve a school; the sync endpoint is the only missing piece.
