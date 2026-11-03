# StoryLab Voice (Release 1.0)

> **A Voice-Guided Educational Ecosystem with AI Assistant, Multi-Subject Stories, and Virtual Labs**  
> *Developed for resource-constrained rural schools with an offline-first architecture.*

[![Status](https://img.shields.io/badge/Status-Prototype%20v1.0-brightgreen.svg)]()
[![PWA](https://img.shields.io/badge/PWA-Offline--First-orange.svg)]()
[![Design](https://img.shields.io/badge/Design-Industrial-amber.svg)]()

---

## 📖 Overview

**StoryLab Voice** is designed to eliminate barriers in education where physical laboratories, textbooks, and reliable high-speed broadband are unavailable.

Rather than navigating complex menus, students aged 6–15 interact with an **empathetic AI Voice Assistant Chatbot** that serves as an always-available personal tutor. The platform delivers:
1. **StoryLearn**: Interactive, branching educational stories across Mathematics, Science, Social Studies, and Environmental Studies (EVS).
2. **LabInBox**: A 2D voice-guided virtual science experiment simulator built on HTML5 Canvas.
3. **Control Deck & Learning Record**: Session tracking, offline analytics queue, and background cloud synchronization.

---

## 👥 Project Team & Work Division

Developed as part of the Software Architecture and Design (SAD) coursework by:

- **Aadesh Khande** (PRN: 202401100090) — *Lead & Foundation*: PWA Shell, Router, IndexedDB (`window.DB`), Offline Infra & Service Worker, Design System, Onboarding & Control Deck.
- **Pritam Tatkari** (PRN: 202401100099) — *Part 1: StoryLearn*: Multi-subject branching narrative engine & voice-guided learning stories.
- **Ritesh Gavhane** (PRN: 202401100082) — *Part 2: Chatbot Core*: Central speech synthesis (TTS) & recognition (STT) pipeline, animated waveform UI, and contextual intent matching.
- **Anurag Kumbhar** (PRN: 202401100109) — *Part 3: LabInBox*: 2D interactive canvas physics/chemistry simulator with voice-controlled apparatus interactions.

---

## ⚡ Key Architectural Features

- **100% Offline-First**: Once installed/cached, all lessons, virtual labs, voice synthesis, and progress tracking function without internet access.
- **Tight Resource Budget**: Total footprint ≤ 25 MB; executes within a strict 1.8s voice latency budget on devices with 2 GB RAM.
- **Client-side Storage**: Uses HTML5 IndexedDB (`storylab_v1`) to persist student progress and queue analytics.
- **Self-Hosted Assets**: Uses self-hosted Google Sans Flex and Google Sans Code fonts, eliminating external runtime dependencies.
- **Industrial Design System**: Built with an Industrial field-terminal aesthetic inspired by heavy instrumentation panels (dark steel, amber readouts, tactile cues, zero-radius mechanical edges).

---

## 🚀 Getting Started

### Local Execution (No build step required!)

StoryLab Voice is built with vanilla JavaScript, modern CSS, and open web standards (W3C Web Audio API, Web Speech API, Service Workers).

Simply serve the root directory using any local HTTP server:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using npx
npx serve .
```

Open your browser at `http://localhost:8000`.

---

## 📁 Repository Structure

```
.
├── index.html              # Shell entry point
├── manifest.webmanifest    # PWA web manifest
├── sw.js                   # Service Worker (offline cache-first & background sync)
├── PRODUCT.md              # Product specifications and constraints
├── README.md               # Project documentation
│
├── styles/
│   ├── tokens.css          # Design tokens (Industrial palette & typography)
│   ├── global.css          # Core layouts, buttons, panels, waveforms
│   └── screens.css         # Screen-specific layouts (Deck, Record, Onboarding)
│
├── src/
│   ├── shell/              # Foundation (Router, DB, State, Onboarding, Dashboard)
│   ├── storylearn/         # Part 1: StoryLearn module
│   ├── chatbot/            # Part 2: AI Voice Tutor Core
│   └── labinbox/           # Part 3: LabInBox canvas lab runner
│
├── data/
│   ├── stories/            # JSON branching story scripts
│   ├── labs/               # JSON virtual lab experiment specifications
│   └── orientation/        # Orientation & onboarding data
│
├── assets/fonts/           # Pre-cached Google Sans WOFF2 fonts
├── icons/                  # PWA SVG icons
└── .ai/                    # Architecture plans, build logs, and handover specs
```

---

## 📜 License & Acknowledgements

Developed strictly in alignment with IEEE Std 830-1998 and ISO/IEC 25010:2011 guidelines using the Spiral Software Development Life Cycle model.
