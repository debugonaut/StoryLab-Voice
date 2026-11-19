# Diagram sources (current)

The Canva deck predates the cloud tutor. These three files are the corrected
versions of the diagrams that changed; render them and replace the matching
frames in Canva.

| File | Replaces | What changed |
|---|---|---|
| `deployment.mmd` | deployment node in `sadas4-1.pdf` | adds the Node.js proxy node, the `.env` key artefact, the Groq API node, and the "no key reaches the browser" constraint |
| `sequence-tutor.mmd` | sequence diagram in `sadas6.pdf` | adds the `/api/tutor` proxy lifeline, the guardrail/rate-limit stage, token-level SSE streaming, and history/lesson-context |
| `sequence-offline.mmd` | new (offline branch of `sadas6.pdf`) | the same interaction with no network: cache-served shell, curated answer, OFFLINE badge, queued event |

## Rendering

1. Open <https://mermaid.live>.
2. Paste the `.mmd` file contents into the code panel.
3. Use **Actions → PNG**, scale 2x for legibility, transparent or dark background.
4. In Canva, replace the old frame with the PNG; keep the original caption and
   figure number.
5. In the exported PDF for the panel, diagrams should be readable at 100% zoom.

## Still to redraw by hand (not covered here)

- **Class diagram** — add a `«module»` stereotype to every JavaScript module and
  split each box into an exported-surface compartment and a private compartment.
  There are no ES classes in the codebase, so unlabelled class boxes look
  fabricated next to the source tree.
- **Component diagram** — show `TutorSession` requiring the *Tutor API* interface
  in addition to speech recognition and synthesis.
- **Package diagram** — add `tools` (server + smoke tests) as a package that the
  browser packages do **not** depend on.
