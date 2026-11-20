# D & Z — A Nikah Invitation Experience

A mobile-first digital invitation for **MD Danish & Zainab**: Baraat & Nikah on 5 December 2026 and Dawat-e-Walima on 6 December 2026. It's built to be opened from a WhatsApp link on a phone.

React 19 + TypeScript + Vite + Tailwind v4 + motion. Built with yarn.

```bash
yarn            # install
yarn dev        # local dev server
yarn build      # production build → dist/
yarn preview    # serve the build on http://localhost:4173
yarn art        # re-extract the artwork from art-src/design-sheet.png
```

## The experience

0. **Envelope**: the Bismillah in gold above a deep-lavender "Nikah Invitation · دعوت نامہ" envelope. When the guest taps the gold D & Z wax seal, it cracks and the flap opens. The real first card then rises out, the envelope drops away, and the card grows into place to become page 1 (about 3.5s).
1. **The card**, in the arched floral frame. It carries:
   - the Bismillah in Arabic, its transliteration and its meaning
   - the hosts' line
   - *Noor-e-Chashm* MD Danish *weds* *Noor-e-Chashmi* Zainab, with their lineage
   - Insha'Allah and both dates
2. **Programme**:
   - the mosque at dusk
   - a Save the Date seal and a live countdown
   - In-sha' Allah in Urdu and English under the heading
   - a Baraat & Nikah card (Baraat departs 7 PM, Nikah 9 PM, with a Get directions button) and a Dawat-e-Walima card, each with schedule rows and a venue
3. **Duas & RSVP**:
   - Alhamdulillah in a cusped floral frame
   - the dua for the couple (*Barakallahu lakuma…*) and Surah Ar-Rum 30:21
   - an Urdu welcome line
   - R.S.V.P. contacts (side by side) and an optional WhatsApp button
   - a toddler's speech bubble: *"Mele Mamu ki chhadi me jalool jalool aana!"* (`childNote` in wedding.ts)
   - "With Best Compliments From" (منجانب) and Jazakallahu Khairan

## Two invitation links

| Link | Shows |
| --- | --- |
| `https://<site>/` | both events: Baraat & Nikah + Dawat-e-Walima |
| `https://<site>/?invite=walima` | Walima only: the hosts' line, dates, programme, countdown and RSVP message switch to the Walima |

`?view=walima` and `?walima` also work. The per-view wording is in `VIEWS` at the bottom of `src/config/wedding.ts`.

## Editing wedding details

All words live in **`src/config/wedding.ts`**: names, lineage lines, events (`schedule` rows, venue, `mapsUrl`; `showDirections: true` keeps the directions button visible as "coming soon" until `mapsUrl` is filled), RSVP contacts, duas and Urdu lines. Empty values hide their element: a venue address, a maps button, RSVP contacts, the WhatsApp button and the RSVP note.

The Arabic font (Amiri) and the Urdu font (Noto Nastaliq Urdu) are subset at build time to exactly the letters used in that file. `vite.config.ts` handles this, so new Urdu text just works after a rebuild.

## Effects (`.env`)

Effects are configured only in `.env`; there is no settings UI on the site. Copy `.env.example` to `.env`, then rebuild (or restart `yarn dev`).

| Variable | Values | Default |
| --- | --- | --- |
| `VITE_TOUCH_EFFECT` | `petals` · `sparks` · `ripple` · `mehndi` · `none` | `petals` |
| `VITE_AMBIENT_PETALS` | petals on screen at once, 0–150 | `14` |
| `VITE_PETAL_COLOR` | petal colour: `lavender` · `pink` · `rose` · `red` · `maroon` · `peach` · `gold` · `white` · `purple` or any hex (`#e05a7a`); comma-separate to mix (`red,white`) | `lavender` |
| `VITE_AMBIENT_LANTERNS` | floating lantern lights at once, 0–30 | `6` |
| `VITE_OPENING` | `seal` (tap to open) · `auto` | `seal` |

What each touch effect does:
- **petals**: each tap bursts lavender petals, and dragging leaves a trail of them.
- **sparks**: golden embers that rise and fade.
- **ripple**: rings of golden and lavender light.
- **mehndi**: a henna-style ink trail with self-drawing curls and dots.

How they're built:
- Everything runs on one `<canvas>` (`src/fx/`) with no extra libraries; the effects code is about 4 KB gzipped.
- The canvas pixel ratio is capped at 1.5 on phones.
- The render loop sleeps when idle or when the tab is hidden.
- The whole layer is skipped for guests who prefer reduced motion.
- Lanterns respond to phone tilt on Android and to the mouse on desktop.

## Artwork

The ornamental separators are hand-drawn SVG (`src/components/art/DecorativeDivider.tsx`), sharp at any size. All other decoration comes from `art-src/design-sheet.png`, processed by `scripts/extract-art.mjs` into `src/assets/art/*.webp`:

1. **Denoise:** the whole sheet is cleaned once with ffmpeg's `nlmeans` filter. If ffmpeg isn't on PATH, set `FFMPEG=path/to/ffmpeg.exe`.
2. **Cut out:** each element is cropped and the sheet background removed (edge flood fill, then halo removal and colour decontamination).
3. **Colour grade:** to the palette in `art-src/color-grading.png`, with ivory paper `#FDF6E3`, deeper lavender and warmer bronze.
4. **Upscale and sharpen:** 3× Lanczos plus an unsharp mask. Line ornaments get flat ink colour and a re-sharpened alpha.
5. **Seamless tiles:** made for the frame sides, the lattice bands and the mirrored geometric tile.

The sheet is only 1264 px wide, so the art is soft on very sharp screens. If you run the same sheet through an AI upscaler, the pipeline picks up the larger file automatically, because coordinates scale with it:

```bash
yarn art path/to/upscaled-sheet.png
```

## Structure

```
src/config/wedding.ts       all content
src/config/env.ts           typed .env effect settings
src/fx/                     canvas ambience + touch effects
src/components/layout/      EnvelopeGate, InvitationBook (sticky page stack), Sheet, PageNav
src/components/sections/    InvitationHero, WeddingEvents, EventInvitationCard, WeddingCountdown, ClosingInvitation
src/components/art/         ArtImage, frames (arched card, cusp frame), florals, lanterns, dividers
scripts/extract-art.mjs     artwork pipeline
art-src/                    source images (not deployed)
```

## Performance notes

- **Page size:** about 300 DOM nodes and about 130 KB of gzipped JS. It uses no WebGL and no Three.js.
- **Images:** only the envelope and card art load eagerly; everything else is lazy WebP.
- **Fonts:** subset Arabic and Urdu fonts of a few KB each.
- **Reduced motion:** honoured everywhere.
