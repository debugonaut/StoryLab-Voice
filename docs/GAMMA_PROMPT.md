# Gamma prompt — StoryLab Voice SAD presentation

Paste everything below the line into Gamma (Create with AI → Paste in text → Generate).
Upload the 11 UML diagram images first, in the order listed, so Gamma can place them.
Replace every `[[ ... ]]` placeholder with the real figure number or screenshot.

---

## ROLE

You are preparing a university Software Architecture & Design (SAD) project presentation for a 4-person student team. The audience is a faculty panel evaluating a rubric: problem statement, objectives, methodology and design (including all UML diagrams), progress so far, and future work. The tone is precise, technical and honest — an engineering review, not a sales pitch.

## OUTPUT FORMAT

- 16:9 widescreen, 20–24 slides.
- Dark "industrial instrument panel" visual language that matches the product: near-black backgrounds (#0a0c0b, #141815), warm graphite panels, amber accent (#f59e0b), off-white text (#ece9dd), zero border radius, thin steel-grey rules, small monospaced uppercase labels for section tags.
- One idea per slide. Headline of at most 8 words, then at most 4 short bullets or one diagram. No paragraph slides.
- Every diagram slide: the diagram large and centred, a one-line caption under it, and 3 bullets maximum describing what a viewer should notice.
- Speaker notes for every slide: 60–90 words, written as something a student would actually say out loud.
- Use the numbers given below exactly. Do not invent metrics, users, test results, funding, or institutions.

## PROJECT FACTS (use these, do not embellish)

**Product:** StoryLab Voice — an offline-first, voice-guided learning app (Progressive Web App) for Indian students in classes 6–8 on low-spec Android devices in low-connectivity areas.

**Stack:** vanilla HTML/CSS/JavaScript (no framework, no bundler), service worker cache-first app shell, IndexedDB database `storylab_v1`, HTML5 Canvas 2D lab engine, Web Speech API for speech-to-text and text-to-speech, and a small zero-dependency Node.js 18 server (`tools/server.mjs`) that serves static files and proxies AI tutor requests to Groq (`qwen/qwen3.8-27b`, with automatic fallback across model ids).

**Modules and owners:**
- Foundation / app shell — routing, onboarding, IndexedDB data layer, service worker, offline queue, design system — Aadesh
- StoryLearn — branching story player with voice questions — Pritam
- AI Voice Tutor — speech input, spoken answers, three languages (English, Hindi, Marathi) — Ritesh
- LabInBox — Canvas 2D virtual science lab with spoken step-by-step guidance — Anurag

**Built content:** 9 branching stories across 4 subjects, 2 virtual lab experiments (Acids & Bases; Salt Dissolving in Water), 22 curated tutor topics in 5 categories, locally bundled photographs with licence credits.

**Tutor pipeline:** microphone → live speech recognition with interim transcript → either a curated topic answer (instant, offline) or a request to `/api/tutor` → Groq → streamed answer rendered word by word → spoken aloud. The last three exchanges and the current story/lab step travel with each request, so follow-up questions and "ask about this lesson" work. A guardrail refuses unsuitable questions before any provider call. Server-side: 16 KB request cap, per-IP rate limiting, same-origin check, key held only in a git-ignored `.env`.

**Verification:** automated smoke suite (`npm test`) with 10 checks — static routes, MIME types, 404/400/403 paths, guardrail, health, a live model answer, and SSE streaming — all passing. Story imagery reduced from 2044 KB to 1280 KB. Real Hindi answer verified; English answer verified ("What is 2 plus 2?" → streamed response). Microphone input cannot be automated; it was verified manually in Chrome with permission granted.

**Storage:** `progress` store keyed `student` (per-story and per-lab completion with timestamps); `sync_queue` store for events recorded while offline; queued events flush on reconnect.

## RUBRIC SECTIONS AND SLIDE PLAN

### 1. Problem statement (2 slides)
- Slide 1 — "Class 6–8 students in low-connectivity schools lose learning time." Bullets: teaching is one-to-many and one pace for everyone; textbooks are text-heavy for early readers; most learning apps assume constant broadband and a mid-range phone; science experiments need apparatus many schools do not have; existing voice assistants are English-first and general-purpose, not curriculum-aligned.
- Slide 2 — "So we built the teaching assistant that survives a bad connection." One-line product statement, three proof points: works with no network after first load, speaks and listens in three languages, runs on a 2 GB Android phone with no install.

### 2. Objectives (1 slide)
Four objectives, each measurable:
1. Deliver three learning modes — branching stories, a voice tutor, a virtual lab — in one app under 25 MB.
2. Support spoken interaction in English, Hindi and Marathi, hands-free, for students who cannot type comfortably.
3. Remain usable with zero connectivity: cached shell, local content, locally queued progress.
4. Answer beyond a fixed script: a cloud language model for free-form questions, with curated offline answers as the fallback.

Add a small "out of scope" line: no teacher dashboard, no accounts, no marks or grading, no content authoring at this stage.

### 3. Methodology and design (1 slide + 11 diagram slides)
- Methodology slide: iterative, risk-driven development across the SAD practical milestones — requirements (IEEE 830 style SRS), use case analysis, structural design, architecture, workflow/state modelling, interaction modelling, complex interactions. Say plainly that the design was revisited after implementation revealed new constraints (the AI provider hop, streaming).
- Then ONE slide per diagram, in this order. Each slide headline should name the diagram and what it answers, e.g. "Use Case Diagram — who the system serves". Bullets should interpret the diagram, not restate it.

1. **Use Case Diagram** — actors: Student (primary), Teacher (indirect, reads the learning record on the device), AI Assistant (secondary/system actor). Use cases: enrol and set language, play a story, ask a question by voice, run a lab experiment, view progress, sync queued events. Include `<<include>>` for "recognise speech" and "store progress", and `<<extend>>` "ask about current lesson".
2. **Class Diagram** — present the JavaScript modules as classes with stereotypes: `Router`, `StateStore`, `DB`, `StoryPlayer`, `TutorSession`, `LabRunner`, `SyncQueue`, plus content entities `Story`, `Step`, `Lab`, `ExperimentStep`, `StudentProfile`, `ProgressRecord`, `TutorExchange`. Show multiplicities (one profile has many progress records; one story has many steps).
3. **Deployment Diagram** — nodes: student's Android device (Chrome, service worker cache, IndexedDB, Canvas, Web Speech), the Node.js application server (static files + `/api/tutor` proxy, rate limiter, key in environment), and the external Groq inference API. Label protocols: HTTPS for the proxy call, no direct browser-to-provider call.
4. **Package Diagram** — `shell` (router, state, db, ui, onboarding, dashboard, record, offline), `storylearn`, `chatbot`, `labinbox`, `data` (story and lab JSON), `assets`, `styles`, `tools`. Show dependency direction: modules depend on shell contracts (`window.DB`, `window.StoryLabState`, `window.StoryLabRouter`), shell depends on nothing.
5. **Component Diagram** — components with provided/required interfaces: AppShell provides routing; StoryEngine requires content repository and speech output; TutorSession requires speech recognition, speech synthesis and the tutor API; LabEngine requires canvas renderer and speech; ProgressLedger requires the DB; SyncService requires the DB and network.
6. **Composite Structure Diagram** — inside `TutorSession`: microphone capture, recogniser, transcript buffer, answer resolver (curated library vs model call), streaming reader, speech synthesiser, state indicator. Show ports and how an utterance flows between the parts.
7. **State Chart Diagram** — the voice session: `idle → listening → thinking → speaking → idle`, with self-transitions and guards: silence timeout returns to idle, empty transcript returns to idle with a prompt, model unavailable falls back to the curated answer, user interrupts speech to re-enter listening. This is the diagram that maps most directly to real code — say so.
8. **Activity Diagram** — "ask the tutor a question": start → capture audio → transcribe → decision "curated topic?" → yes: answer from library / no: call proxy → decision "model available?" → stream answer or fall back → speak → save exchange → end. Include the offline branch (no network → curated answer only).
9. **Sequence Diagram** — the one that must be current: Student → Browser UI → Speech API → TutorSession → Node proxy → Groq, with the streamed response returning in chunks, then TTS. Also show a second, shorter lifeline set for the offline path.
10. **Communication Diagram** — same scenario expressed as numbered messages between objects, emphasising the collaboration rather than time order: UI ↔ TutorSession ↔ Recogniser, TutorSession ↔ AnswerResolver ↔ Proxy, TutorSession ↔ Synthesiser, TutorSession ↔ ProgressLedger.
11. **Interaction Overview Diagram** — the end-to-end lesson loop with frames: open story → listen to narration → answer a comprehension question → optionally ask the tutor → complete → progress saved → queued sync when online.

For every diagram slide, add one honest line in the speaker notes naming the design decision it justifies (e.g. "the proxy exists so the API key never reaches the browser").

### 4. Progress so far (3 slides)
- **What works today** — four modules integrated behind one shell; 9 stories and 2 labs playable end to end; voice tutor answering free-form questions in three languages; progress persisted locally; offline banner and queued sync; installable PWA.
- **Engineering evidence** — a table or three stat cards: 10/10 smoke checks passing; 3 languages; 9 stories + 2 labs; 2.0 MB → 1.25 MB image payload; streamed answers with three-turn memory; guardrail and rate limiting in place. Add a small screenshot strip of Home, StoryLearn, Tutor, Lab.
- **What we learned / adjusted** — retired model id forced a fallback list; browsers refuse microphone access on plain HTTP for non-localhost devices, so demos must run on localhost or HTTPS; the first design assumed no cloud at all, and the AI proxy was added after testing showed curated answers alone were too limited. Frame these as design iterations, not failures.

### 5. Future work (1–2 slides)
- Content: more labs (the Canvas engine already renders beakers and flasks, so new experiments are data, not code), more stories per subject, teacher-authored packs.
- Access: full Hindi and Marathi coverage of the interface (currently the tutor is localised, the shell is English), audio-first onboarding for non-readers.
- Learning: spaced revision from the progress ledger, per-student difficulty adaptation.
- Platform: a small teacher view that reads the device's learning record, optional school sync endpoint, an offline speech model to remove the network dependency for voice.
- Evaluation: a classroom pilot with a pre/post comprehension check, and accessibility testing with screen-reader users.

### 6. Closing (1 slide)
One sentence on what StoryLab Voice proves: a curriculum-aligned, voice-first learning app can run on the phones students already own, and can still answer new questions when the network appears. Then "Thank you / Questions".

### 7. Appendix (2 slides, optional but rubric-friendly)
- Rubric map: a table with the rubric row, the slide numbers that satisfy it, and the artefact (diagram figure, screenshot, test output).
- Diagram inventory: the 11 diagrams, the practical each belongs to, and the date/version they were last revised.

## STYLE RULES FOR GAMMA

- Never write "revolutionary", "cutting-edge", "seamless", "empowering" or "leveraging AI".
- Prefer verbs and numbers: "answers in 1.8 s", "runs on Android 8", "9 stories".
- No stock photos of smiling students; use product screenshots and diagrams.
- Keep diagram labels legible: if a diagram is dense, place it full-bleed with a short caption instead of shrinking it into a two-column layout.
- British/Indian English spelling throughout.
- Every claim in a bullet must be traceable to the facts above or to a diagram.
