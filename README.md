# Luma Skin Quiz

Discover a personalized skincare plan in minutes. This app asks thoughtful questions about your skin, concerns, climate, and preferences, then builds a tailored routine with ingredient highlights and dermatologist quotes. Built by [Teda.dev](https://teda.dev), the simplest AI app builder for regular people.

## Features
- Beautiful landing page with asymmetric hero and rich storytelling
- 4-step quiz: basics, concerns, environment, preferences
- Personalized results with morning and evening routines
- Ingredient highlights with reasons and usage notes
- Curated dermatologist quotes based on your concerns
- LocalStorage persistence so your plan survives reloads
- Copy-to-clipboard, print, and save actions
- Accessible, mobile-first, WCAG-conscious design

## Stack
- HTML5 + Tailwind CSS (CDN)
- jQuery 3.7.x
- Modular JavaScript: `scripts/helpers.js`, `scripts/ui.js`, `scripts/main.js`

## Getting started
1. Open `index.html` to explore the landing page.
2. Click any call-to-action to open `app.html` and take the quiz.
3. Your personalized plan will be generated and can be saved, copied, or printed.

## File structure
- `index.html`: Marketing landing with CTA
- `app.html`: Main quiz and results interface
- `styles/main.css`: Custom CSS (no Tailwind directives)
- `scripts/helpers.js`: Storage, utilities, domain logic
- `scripts/ui.js`: App namespace, UI behavior, rendering
- `scripts/main.js`: App bootstrap and contract guard

## Notes
- Results are educational and not medical advice. Always patch test and consult a professional for personal concerns.
- No external build step required. Just open in a modern browser.
