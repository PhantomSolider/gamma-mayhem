## Live demo

Play Gamma Mayhem: https://gamma-mayhem.vercel.app/

Gamma Mayhem is a cosmic retro arcade game built as a lightweight browser project.

It is designed to be simple to run, easy to deploy, and reliable:

- Plain HTML
- Plain CSS
- Plain JavaScript
- No API keys
- No external assets
- Zero-dependency for basic play

## How to play

Open `index.html` in a browser.

Controls:

- Move: WASD or Arrow Keys
- Phi Pulse: Space
- Pause: P
- Restart: Enter

Mobile/touch controls are included below the game area.

## Game concept

You pilot the Core through a gamma belt. The opening seconds are paced for learning, then the run gets faster and more crowded:

- Gamma rays show warning lanes before the damaging beam appears.
- Entropy shards fall in readable patterns.
- Gravity wells bend your movement without taking control away.
- Black holes pull you off path later in the run.
- Phi Orbs charge the Phi Pulse.
- Phi Shield appears briefly when you use the pulse.

## Why this project is stable

Gamma Mayhem runs with plain HTML, CSS, JavaScript, and Canvas. There is no build step for basic use.

## Optional deployment

This can be deployed as a static site. Use these settings if a deploy tool asks:

- Framework Preset: Other
- Build Command: leave blank
- Output Directory: `./`
- Install Command: leave blank

## How I Used OpenAI Codex and GPT-5.6

I used **GPT-5.6** as a planning, reasoning, and evaluation partner throughout development. It helped me transform the original idea into a clear gameplay loop, define each mechanic, identify edge cases, create focused testing instructions, evaluate design decisions, and refine the project's documentation and presentation.

I used **OpenAI Codex** directly within the project to inspect and modify the codebase, implement gameplay systems, diagnose problems, and verify targeted improvements. Codex supported development and testing across player movement, collisions, scoring, escalating waves, gravity wells, black holes, Phi Orb collection, Phi Pulse, keyboard controls, touch controls, responsive design, and game-state management.

My development process followed a repeated cycle:

**Plan → Implement → Playtest → Diagnose → Refine → Verify**

Rather than accepting the first functional version, I used GPT-5.6 to reason through design, balance, clarity, and quality, then used Codex to implement and test focused changes. I remained responsible for the original concept, creative direction, gameplay decisions, evaluation, and final quality standard.
