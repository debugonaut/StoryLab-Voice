# Gamma prompt — content-only deck, 6 slides (diagrams merged separately)

Paste into Gamma: **Create with AI → Paste in text**, with **image generation OFF**.
Diagram pages from the UML PDF are merged after slide 3.

---

## ROLE

You are writing the content of a university Software Architecture & Design (SAD) project presentation for a 4-person student team. A faculty panel grades five things: problem statement, objectives, methodology and design, progress so far, future work. Tone: precise, technical, honest — an engineering review, not a sales pitch.

## HARD CONSTRAINTS

- **Exactly 6 slides.** Do not add agenda, team, thank-you-only, appendix or divider slides. If a section feels thin, put the detail in the speaker notes instead of adding a slide.
- **No UML diagrams of any kind.** No use case, class, deployment, package, component, composite, state chart, activity, sequence, communication or interaction overview graphics or descriptions-as-images. Those pages come from the team's own diagram PDF and are merged after slide 3.
- **No generated images, icons, stock photos or illustrations.** Text and numbers only.
- 16:9. Dark surface, warm graphite panels, amber accent (#f59e0b), off-white text (#ece9dd), hard edges, thin grey rules.
- Every slide: headline of at most 8 words, then at most 4 bullets of at most 20 words each. No paragraph blocks.
- Speaker notes on every slide: 70–100 words, written as words a student would say aloud.
- Use the numbers below exactly. Never invent metrics, users, institutions, funding or dates.
- British/Indian English. Never use "revolutionary", "cutting-edge", "seamless", "empowering", "leveraging AI", "state-of-the-art".

## PROJECT FACTS

**Product:** StoryLab Voice — an offline-first, voice-guided learning app (Progressive Web App) for Indian students in classes 6–8 on low-spec Android phones in low-connectivity areas.

**Stack:** vanilla HTML/CSS/JavaScript, no framework or bundler; cache-first service worker; IndexedDB (`storylab_v1`); HTML5 Canvas 2D lab engine; Web Speech API; a zero-dependency Node.js 18 server that serves files and proxies tutor requests to Groq (`qwen/qwen3.8-27b`, with fallback across model ids).

**Modules:** Foundation shell — routing, onboarding, data layer, service worker, offline queue, design system (Aadesh). StoryLearn — branching stories with voice questions (Pritam). AI Voice Tutor — speech in, spoken answers, English/Hindi/Marathi (Ritesh). LabInBox — Canvas lab with spoken steps (Anurag).

**Content:** 9 branching stories across 4 subjects; 2 labs (Acids & Bases, Salt Dissolving in Water); 22 curated tutor topics in 5 categories; bundled photographs with licence credits.

**Tutor:** microphone → live recognition with interim transcript → curated answer (offline) or `/api/tutor` → Groq → answer streamed word by word → spoken aloud. Last three exchanges and the current story/lab step travel with each request. A guardrail refuses unsuitable questions before any provider call. Server: 16 KB cap, per-IP rate limit, same-origin check, key only in a git-ignored `.env`.

**Evidence:** smoke suite of 10 checks all passing (routes, MIME types, 404/400/403, guardrail, health, live answer, streaming). Imagery reduced 2044 KB → 1280 KB. Verified English and Hindi answers and the offline fallback. Microphone verified manually in Chrome — browser permissions cannot be scripted.

## THE 6 SLIDES

### Slide 1 — Problem statement
Headline: "One teacher, one pace, forty students."
- Teaching is one-to-many; a student who falls behind cannot ask again privately.
- Connectivity in target schools is intermittent rather than absent, and most learning apps assume always-on broadband.
- Textbooks carry early middle school, when reading confidence is still forming, and lab apparatus is often missing.
- Mainstream voice assistants are English-first and general-purpose, not curriculum-aligned.
Footer line: "StoryLab Voice is the teaching assistant that survives a bad connection."

### Slide 2 — Objectives
Headline: "Four objectives, each measurable."
1. Three learning modes — branching stories, voice tutor, virtual lab — in one app under 25 MB.
2. Hands-free spoken interaction in English, Hindi and Marathi.
3. Full usability with zero connectivity: cached shell, local content, locally queued progress.
4. Answers beyond a fixed script: a cloud model for free-form questions, curated offline answers as fallback.
Small line: out of scope — teacher dashboard, accounts, grading, content authoring.

### Slide 3 — Methodology and design
Headline: "Iterative, modular, revised after testing."
- Requirements first, then use cases, structural design, architecture, state and interaction modelling — revisited as implementation exposed constraints.
- Each module owned by one person behind a frozen contract (`window.DB`, `window.StoryLabState`, `window.StoryLabRouter`, `window.Chatbot`), allowing four parallel workstreams.
- The shell owns storage, routing and offline state; modules never touch IndexedDB directly, and content is JSON rather than code.
- The tutor is the only networked component, isolated behind one server boundary that fails safely.
Close with one line: "The UML models for this design follow on the next pages."

### Slide 4 — Progress so far
Headline: "Four modules, one working product."
- Onboarding, home deck, story library, virtual lab, voice tutor and learning record all functional.
- 9 stories playable end to end with branching, voice questions and saved completion; 2 Canvas labs with spoken steps.
- Tutor answers free-form questions in three languages, streams the answer as it arrives, and falls back to 22 curated topics offline.
- Evidence: 10/10 smoke checks passing; imagery cut from 2044 KB to 1280 KB; guardrail, rate limiting and same-origin checks in place.

### Slide 5 — Future work
Headline: "From a working prototype to a school-ready tool."
- More labs — the Canvas engine already draws the apparatus, so new experiments are JSON, not code.
- Complete Hindi and Marathi coverage of the interface, plus audio-first onboarding for students who cannot yet read it.
- A teacher view that reads the device's learning record, and an optional school sync endpoint.
- An offline speech model to remove the network dependency for voice, followed by a classroom pilot with a pre/post comprehension check.

### Slide 6 — Conclusion
Headline: "What this project demonstrates."
- A curriculum-aligned, voice-first learning app can run on the phones students already own.
- It stays useful with no network and gets smarter when one appears, because the unreliable part sits behind a boundary that fails safely.
- "Thank you — questions."

## SPEAKER-NOTE GUIDANCE

- Slide 3 notes must say that the UML pages follow and name only what each model answers — who the system serves, what the pieces are, how a request travels — without explaining the diagrams.
- Slide 4 notes should admit the microphone cannot be automated and was verified by hand; panels trust a team that states its limits.
