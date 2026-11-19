# System Architecture & Technical Specifications — StoryLab Voice

This document details the architectural design, UML models, data flow, and hardware/software constraints for **StoryLab Voice (Release 1.0)**, developed in accordance with **IEEE Std 830-1998** and **ISO/IEC 25010:2011**.

---

## 🏛️ 1. High-Level Architecture Overview

StoryLab Voice is an offline-first Progressive Web Application designed to operate in low-resource environments (Android 8+, 2 GB RAM, ≤ 25 MB storage budget, intermittent connectivity).

It is offline-**first**, not offline-**only**: every lesson, image and curated answer is bundled and served from the service-worker cache, so the app is fully usable with no network at all. When a network is present, free-form questions are answered by a language model behind a server-side proxy, and answers are spoken back to the student. The proxy is the only cloud dependency, it is optional at runtime, and no key ever reaches the browser.

```mermaid
graph TD
    subgraph Client [Client Device / Browser Shell]
        UI[App Shell & Router]
        Audio[Web Speech Engine STT/TTS]
        Canvas[HTML5 Canvas 2D Engine]
        SW[Service Worker CacheStorage]
        IDB[(IndexedDB: storylab_v1)]
    end

    subgraph Modules [Pedagogical Learning Engines]
        StoryLearn[StoryLearn Branching Stories]
        Chatbot[AI Voice Tutor Core]
        LabInBox[LabInBox Virtual Science Lab]
        Deck[Control Deck & Learning Record]
    end

    subgraph Server [Node.js 18 App Server]
        Static[Static File Server]
        Proxy[/api/tutor proxy\nGuardrail · Rate Limit · Key in env]
    end

    subgraph Remote [Optional Cloud Services]
        Groq[[Groq Inference API]]
        Cloud[School Sync / Analytics API]
    end

    UI --> Modules
    StoryLearn --> Audio
    Chatbot --> Audio
    LabInBox --> Canvas
    LabInBox --> Audio
    Modules --> IDB
    SW -.->|Cache-First Asset Serving| UI
    Static --> SW
    Chatbot -->|POST /api/tutor, SSE| Proxy
    Proxy -->|HTTPS| Groq
    IDB -.->|Queued Events, When Online| Cloud
```

---

## 📊 2. UML Diagrams & Academic Practical Mapping

The system design was developed across seven Software Architecture and Design (SAD) practical milestones:

| Practical | UML Modeling Domain | Key Focus Areas | Reference Document |
| :--- | :--- | :--- | :--- |
| **SRS** | **IEEE 830 Specification** | Spiral SDLC model, risk-driven iterations, offline-first voice constraints | [SAD_Assignment1-1-1.pdf](../SAD_Assignment1-1-1.pdf) |
| **PR-02** | **Use Case Analysis** | Actors: *Student*, *Teacher*, *Admin*, *AI Assistant*; Use Cases: UC-01 (Chatbot), UC-02 (StoryLearn), UC-03 (LabInBox) | [sadas2.pdf](../sadas2.pdf) |
| **PR-03** | **Structural Design** | Class, Deployment (PWA to low-spec Android), and Package diagrams | [sadas3-1.pdf](../sadas3-1.pdf) |
| **PR-04** | **System Architecture** | Component diagrams, Composite structure, and UML Profile extensions | [sadas4-1.pdf](../sadas4-1.pdf) |
| **PR-05** | **Workflow & State** | Activity diagrams for lesson branches; State Machines for voice interaction states (`idle`, `listening`, `thinking`, `speaking`) | [sadas5.pdf](../sadas5.pdf) |
| **PR-06** | **Interaction Diagrams** | Sequence diagrams for voice query processing; Communication diagrams for canvas apparatus updates | [sadas6.pdf](../sadas6.pdf) |
| **PR-07** | **Complex Interactions** | Interaction Overview and Timing diagrams for the voice latency budget (streamed answers) | [sadas7.pdf](../sadas7.pdf) |

---

## 💾 3. Offline-First Storage & Data Contracts

### 3.1 IndexedDB Schema (`storylab_v1`)

```javascript
// Database: storylab_v1
// Object Store 1: 'progress' (key: 'student')
{
  "stories": {
    "math-market": { "completed": true, "timestamp": 1730000000000 },
    "science-plants": { "completed": true, "timestamp": 1730000001000 }
  },
  "labs": {
    "acid-base": { "completed": true, "timestamp": 1730000002000 }
  }
}

// Object Store 2: 'sync_queue' (auto-increment key)
{
  "id": 1,
  "type": "analytics",
  "payload": { "event": "lab.completed", "labId": "acid-base" },
  "timestamp": 1730000002100
}
```

### 3.2 Service Worker Caching Strategy
- **Static Assets & App Shell**: Cache-first (`CACHE_VERSION = 'storylab-v10'`) pre-caching HTML, CSS, JavaScript, self-hosted Google Sans fonts, JSON datasets and lesson photography.
- **Analytics Sync**: Queued locally in IndexedDB when offline; automatically flushed via W3C Background Sync API (`analytics-flush`) or window `online` listeners.

---

## 🔌 4. Core Public JavaScript API Contracts

All modules communicate through strictly typed, decoupled contracts exposed on `window`:

```typescript
// 1. Storage Interface (Foundation)
window.DB.save(store: string, key: string, value: any): Promise<void>;
window.DB.load(store: string, key: string): Promise<any>;
window.DB.getAll(store: string): Promise<any[]>;
window.DB.queueSync(payload: object): Promise<void>;

// 2. Conversational Voice Interface (Chatbot Core)
window.Chatbot.speak(text: string, lang?: string): Promise<void>;
window.Chatbot.listen(lang?: string): Promise<string>;
window.Chatbot.listenLive(onInterim: (text: string) => void, lang?: string): void;
window.Chatbot.setLessonContext({ title: string, text: string } | null): void;
window.Chatbot.state: 'idle' | 'listening' | 'thinking' | 'speaking';

// 3. Application Routing Interface (Shell)
window.StoryLabRouter.navigate(route: 'home' | 'storylearn' | 'chatbot' | 'labinbox' | 'record'): void;

// 4. State & Session Ledger (Shell State)
window.StoryLabState.getProfile(): StudentProfile;
window.StoryLabState.logEvent(type: string, description: string, meta: object): Promise<void>;

// 5. Tutor Proxy Contract (Node.js, server-side only)
POST /api/tutor
  body: { question: string, language?: 'en'|'hi'|'mr', history?: Message[], context?: string, stream?: boolean }
  200:  { answer: string }            // stream: false
  200:  text/event-stream             // stream: true  →  data: {"delta":"..."} … data: [DONE]
  400:  empty or oversized body, 403: foreign origin, 429: rate limited, 503: no key configured
GET /api/tutor/health → { ok, configured, provider, model, stt }

POST /api/transcribe?lang=en|hi|mr     // speech → text when the browser has no
  body: audio/* binary (webm, ogg, wav, m4a; max 12 MB)   // usable recogniser
  200:  { text, model, language }
  403:  foreign origin, 429: rate limited, 503: no key configured
```

---

## 🎨 5. Industrial Design Language

Designed following field-instrument panel aesthetics:
- **Zero-Radius Edges**: All panels, buttons, and inputs strictly adhere to `border-radius: 0px`.
- **Palette**: Dark forge black (`#111111`), steel panel (`#1c1c1c`), and warning amber (`#f59e0b`) for active interactive states.
- **Visual Feedback**: Mechanical ventilation slot separators, corner rivet markings (`◈`), and live 5-bar animated audio waveforms.
- **Typography**: Self-hosted Google Sans Flex and Google Sans Code (WOFF2) with strict WCAG AA contrast compliance (minimum 4.5:1 on all text).

