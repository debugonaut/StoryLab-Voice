# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS (vanilla). No bundler. PWA with Service Worker. Runs in Chromium-based browsers (Chrome 88+) on Android 8+ and desktop. No backend framework — backend is a lightweight static JSON data layer with IndexedDB for offline persistence. Delegated to prototype-first approach.

## Users

**Primary:** Rural students aged 6–15 in resource-constrained schools across India. They interact via voice and touch on shared Android tablets with 2 GB RAM and intermittent 2G/3G connectivity. Many have limited literacy; voice is the primary interface.

**Secondary:** Rural teachers / NGO facilitators who assign modules, monitor progress, and view learning summaries.

## Product Purpose

StoryLab Voice democratizes STEM and humanities education for rural Indian schools without physical labs or reliable internet. An AI Voice Assistant chatbot narrates branching educational stories (StoryLearn) and guides students through 2D virtual science experiments (LabInBox) entirely through spoken dialogue. The app works 100% offline once installed.

## Positioning

The only offline-first, voice-primary educational platform that combines multi-subject story-based learning with voice-guided virtual science labs — requiring no teacher mediation and no internet after first install.

## Operating Context

- Shared Android tablets in classrooms, often without personal accounts
- Ambient classroom noise up to 65 dB
- No WiFi; intermittent 2G/3G for sync only
- Students may switch between Marathi/Hindi and English
- Sessions are 15–30 minutes, guided by the voice chatbot

## Capabilities and Constraints

- **Offline-first:** 100% functional with no internet after Service Worker install
- **Storage budget:** ≤ 25 MB total (PWA assets + JSON + speech models)
- **Latency budget:** Speech-to-response ≤ 1.8s on 2 GB RAM
- **Voice:** Web Speech API (SpeechSynthesis + SpeechRecognition) — fully on-device
- **No cloud AI for prototype:** intent matching is static keyword map
- **Modules:** AI Voice Chatbot Core, StoryLearn, LabInBox
- **Progress:** stored in IndexedDB per student session
- **Analytics sync:** Background Sync API; queues when offline, flushes on reconnect

## Brand Commitments

- **Name:** StoryLab Voice
- **Voice/tone:** Empathetic, encouraging, judgment-free. Speaks like a patient tutor.
- **Visual language:** Industrial — dark steel panels, amber accent, hard edges, mechanical motifs

## Evidence on Hand

- SRS document: SAD_Assignment1-1-1.pdf
- Use case analysis: sadas2.pdf
- UML class/deployment diagrams: sadas3-1.pdf
- System architecture diagrams: sadas4-1.pdf
- Activity/state diagrams: sadas5.pdf
- Sequence/communication diagrams: sadas6.pdf
- Interaction overview/timing diagrams: sadas7.pdf

## Product Principles

1. **Voice first, always** — every learning path must be completable without reading or typing.
2. **Offline is the baseline** — online connectivity is a bonus, never a requirement.
3. **Prototype discipline** — ship the simplest thing that proves the concept; no over-engineering.
4. **One shared shell** — all modules plug into a single PWA shell via clean JS contracts.

## Accessibility & Inclusion

- 100% voice-navigable; touch as secondary input
- `lang="hi"` / `lang="en-IN"` switching for TTS
- Minimum tap target 48×48px (WCAG 2.5.5)
- Contrast: all text ≥ 4.5:1 against dark panel backgrounds

