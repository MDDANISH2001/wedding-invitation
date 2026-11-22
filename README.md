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
| `https://<site>/walima` | Walima only (its own page, title and WhatsApp thumbnail `og-walima.jpg`): the hosts' line, dates, programme, countdown and RSVP message switch to the Walima |

`?invite=walima`, `?view=walima` and `?walima` also work, but they share the main thumbnail, so send `/walima`. The per-view wording is in `VIEWS` at the bottom of `src/config/wedding.ts`.

## Editing wedding details

All words live in **`src/config/wedding.ts`**: names, lineage lines, events (`schedule` rows, venue, `mapsUrl`; `showDirections: true` keeps the directions button visible as "coming soon" until `mapsUrl` is filled), RSVP contacts, duas and Urdu lines. Empty values hide their element: a venue address, a maps button, RSVP contacts, the WhatsApp button and the RSVP note.

The Arabic font (Amiri) and the Urdu font (Noto Nastaliq Urdu) are subset at build time to exactly the letters used in that file. `vite.config.ts` handles this, so new Urdu text just works after a rebuild.

## Look and effects (`.env`)

Everything is configured only in `.env`; there is no settings UI on the site. Copy `.env.example` to `.env`, then rebuild (or restart `yarn dev`).

### Themes

`VITE_THEME` changes the whole look. Each theme brings its own defaults for the other switches, and anything you set explicitly in `.env` wins.

| Theme | Look | Defaults it turns on |
| --- | --- | --- |
| `classic` | The original lavender watercolour design from the design sheet. | CSS envelope, no foil, no sky |
| `midnight` | Mughal night garden: deep indigo, gold-leaf Redouté roses and Mughal marigolds, cusped arches with jaali lattice. | 3D envelope, foil, night sky, gold + white petals |
| `rose` | Rose & saffron: Redouté's roses in full colour on maroon velvet, saffron gold. | 3D envelope, foil, rose + red petals |
| `letterpress` | Ivory & gold: cotton paper, one deep ink, gold foil, pressed type, engraved florals. | 3D envelope, foil, white + cream petals |
| `noor` | A self-playing film: raised gold lettering writes itself in light over a lamp-lit room with the Qur'an on its rehal, then settles on a details page. A different layout, not a recolour. See [The noor theme](#the-noor-theme). | its own opening; envelope, sky, foil and petals don't apply |

### Switches

| Variable | Values | Default |
| --- | --- | --- |
| `VITE_THEME` | `classic` · `midnight` · `rose` · `letterpress` · `noor` | `classic` |
| `VITE_ENVELOPE` | `3d` (lit three.js envelope) · `classic` (CSS envelope) | from the theme |
| `VITE_OPENING` | `seal` (tap to open) · `auto` | `seal` |
| `VITE_SKY` | `on` · `off`: three.js night sky behind the pages, with lanterns that light up as you scroll | from the theme |
| `VITE_FOIL` | `on` · `off`: gold lettering catches the light as the phone tilts or the cursor moves | from the theme |
| `VITE_DUA` | `rabbirhamhuma` · `rabbana-hablana` · `off`: a recited dua with a floating player | `off` |
| `VITE_DUA_AUTOPLAY` | `on` (starts with the seal tap) · `off` (play button only) | `on` |
| `VITE_GUEST_NAME` | `on` · `off`: `…/?to=Rahman%20Family` greets the guest on the envelope and the card | `on` |
| `VITE_CALENDAR` | `on` · `off`: "Add to calendar" (Google, plus an `.ics` for Apple and Outlook) | `on` |
| `VITE_HAPTICS` | `on` · `off`: a short vibration on the seal tap (Android) | `on` |
| `VITE_TOUCH_EFFECT` | `petals` · `sparks` · `ripple` · `mehndi` · `none` | `petals` |
| `VITE_AMBIENT_PETALS` | petals on screen at once, 0–150 | `14` |
| `VITE_PETAL_COLOR` | `lavender` · `pink` · `rose` · `red` · `maroon` · `peach` · `gold` · `white` · `purple` or any hex; comma-separate to mix. Leave empty for the theme's colours. | from the theme |
| `VITE_AMBIENT_LANTERNS` | floating lantern lights at once, 0–30 | from the theme |
| `VITE_SITE_URL` | the site's public address, e.g. `https://dz-nikah.example.com`. WhatsApp needs it to show the preview image. | empty |

### The noor theme

`VITE_THEME=noor` replaces the envelope and the card pages with a short film, built from the same `wedding.ts`:

1. **Tap to begin**: a breathing crescent of light, "Dawat-e-Nikah · دعوت نامہ" and the guest's name. The tap starts the dua (`VITE_DUA`), because browsers allow sound only after a tap.
2. **The scenes play by themselves**, about 6 seconds each:
   - As-salamu Alaikum
   - the Bismillah
   - the hosts and their request
   - the groom
   - the bride
   - the couple, joined by a thread of light
   - Surah An-Naba 78:8, "And We created you in pairs"
   - one scene per event: date, **Hijri date**, schedule and venue
   - Save the Date, with the days to go
   
   Story-style bars at the top show progress. A tap moves to the next scene, and **Skip** jumps to the end.
3. **The details page**: every event with *Get directions* and *Add to calendar*, a live countdown, the duas, R.S.V.P., the child's note, the compliments, and *Watch again*.

How it's drawn:
- English lines write themselves letter by letter (names) or word by word (longer lines) in raised gold, and a star of light skims across each one.
- Arabic and Urdu stay joined and are unveiled right to left.
- The Arabic display face is Aref Ruqaa. The Latin faces are Cinzel Decorative, Cinzel and Pinyon Script, all from Google Fonts.

The Hijri dates are plain text in `wedding.ts` (`hijri` on each event). They come from the Umm al-Qura calendar (25 and 26 Jumada al-Akhirah 1448), so change them by a day if the local moon sighting differs. Words that only the film uses live in `noor` in `wedding.ts`.

**Why it runs smoothly on phones.** There is no WebGL and no video.
- `scripts/noor-art.mjs` bakes the scenery once at build time: the room, the blurred Qur'an, the bokeh, the light shafts and a dust tile, about 85 KB in all.
- On the phone, every movement is `transform` / `opacity`, which the browser runs on the GPU compositor. That covers the slowly breathing room, the swaying light shafts, two layers of drifting dust, a few floating lights and the sparks.
- No blur or `backdrop-filter` runs live.
- Measured with the CPU slowed 6×: a typical frame takes 7 ms and 95% of frames stay under 14 ms. Short hitches happen only at scene changes.
- With reduced motion on, the guest goes straight to the details page.

### The 3D parts (three.js)

- **Only loaded when used.** three.js sits in its own chunk (~145 KB gzipped) and is downloaded only for the 3D envelope or the sky. The classic theme never loads it.
- **Built for phones.**
  - Pixel ratio is capped (1.5 on weaker phones, 1.25 for the sky).
  - There are no shadows or post-processing: glows are additive sprites, and all particle motion runs in shaders.
  - Shaders compile before the first frame.
  - On weaker phones the sky draws every other frame.
  - Everything is disposed once the envelope is done.
- **Safe fallbacks.**
  - Without WebGL 2, or for guests who prefer reduced motion, the classic CSS envelope plays instead.
  - If the sky can't start, the pages keep their CSS night background.
- **The envelope.** Gold printing is real metallic material, so it glints as the phone tilts. The wax seal is embossed with the monogram and cracks in two; the flap swings open, light and sparks pour out, and the real card rises from the pocket to its place.

### Dua recitation

The recitations are by Mishary Rashid Alafasy, from everyayah.com, saved in `public/audio/`:
- `rabbirhamhuma` is Surah Al-Isra 17:24, the dua for one's parents.
- `rabbana-hablana` is Surah Al-Furqan 25:74, the dua for spouses and children.

Browsers only allow sound after a tap, so the seal tap starts it. A floating button can always play or pause it, and while it plays the Arabic text and its meaning are shown. To use a different recording, replace the mp3 file and keep the same name.

What each touch effect does:
- **petals**: each tap bursts lavender petals, and dragging leaves a trail of them.
- **sparks**: golden embers that rise and fade.
- **ripple**: rings of golden and lavender light.
- **mehndi**: a henna-style ink trail with self-drawing curls and dots.

How the touch and ambient effects are built (`src/fx/`):
- There's no canvas and no per-frame JavaScript. Every petal, lantern, spark and ring is a small element animated once with the Web Animations API, using only `transform` and `opacity`. The browser runs those on the GPU compositor, so they stay smooth while the page scrolls, loads fonts or runs React, and they can't freeze.
- Each falling petal has three layers (fall, sway, tumble) with a real 3-D flip. Petal art is a tiny SVG in the chosen colour.
- Touch particles remove themselves when they finish, and at most 240 exist at once.
- The ambient layer leans slightly with the mouse on desktop and with phone tilt on Android.
- The whole layer is skipped for guests who prefer reduced motion.

## Artwork

### New themes (`midnight`, `rose`, `letterpress`)

The florals are public-domain (CC0) museum scans from the Cleveland Museum of Art Open Access collection:
- Pierre-Joseph Redouté's *Les Roses* (1817–24).
- A Mughal *Flowering Marigold* album page (c. 1650).

`yarn theme-art` (`scripts/theme-art.mjs`) processes them:
1. **Download:** fetches the scans once into `art-src/cc0/`.
2. **Cut out:** removes the paper (colour distance plus a chroma boost for pale petals, speck removal, and decontamination of the paper tint from the edges).
3. **Arrange:** composes the cutouts into the shapes the components use: `spray`, `arc`, `sprig`, `corner`, `marigold` and `bloom`.
4. **Render per theme:** natural colour (rose), gold leaf (midnight) or single-ink engraving (letterpress), written to `src/assets/themes/`.

Arches, jaali lattice, lanterns, the mosque, the medallion and the save-the-date seal are vector geometry (`src/components/art/mughal.tsx`), so they're sharp at any size.

### Noor theme

The background photograph is "Qur'an and Rehal" by Sayyed Shahab-o-Din Vajedi (CC BY 4.0, Wikimedia Commons). It's stored in `art-src/photos/rehal.jpg`, and `yarn noor-art` blurs and colour-grades it into the room scene. The credit line is printed at the foot of the details page, as the licence requires.

The couple's Taj Mahal picture (`art-src/goldnoor.png`) appears in the "weds" scene. `yarn noor-art` crops it around the Taj, cuts it into a gold-rimmed Mughal arch and fades it into the room. The output is `src/assets/noor/taj-window.webp`.

The noor WhatsApp preview is composed by `scripts/og-image.mjs` from the same artwork: the room, the Taj window, and the Bismillah, names, dates and Hijri dates in raised gold. The fonts are in `art-src/fonts/`.

The WhatsApp link preview (`public/og.jpg`, 1200×630) is generated in the current theme before every build by `scripts/og-image.mjs`, using the OFL fonts in `art-src/fonts/`.

### Classic theme

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
src/fx/                     ambience + touch effects (compositor-driven DOM), foil, dua audio
src/three/                  three.js: 3D envelope, night sky, shared helpers (lazy-loaded)
src/theme/palette.ts        theme colours for JS-drawn art (CSS colours: index.css [data-theme])
src/components/layout/      EnvelopeGate, InvitationBook (sticky page stack), Sheet, PageNav
src/components/sections/    InvitationHero, WeddingEvents, EventInvitationCard, WeddingCountdown, ClosingInvitation
src/components/art/         ArtImage, ThemeArt, frames, mughal (arch card, lanterns, mosque…), florals, dividers
src/components/extras/      SkyLayer, DuaPlayer
src/noor/                   the noor theme: film, scenes, gold lettering, backdrop, details page
scripts/extract-art.mjs     classic artwork pipeline
scripts/theme-art.mjs       new themes' botanical art from CC0 scans
scripts/noor-art.mjs        noor theme's baked room, light shafts, dust and bokeh
scripts/og-image.mjs        WhatsApp / social preview image
art-src/                    source images (not deployed)
```

## Performance notes

- **Page size:** about 300 DOM nodes and about 146 KB of gzipped JS for the site. three.js (~145 KB gzipped) loads separately, and only for the 3D envelope or the sky.
- **Measured (4× CPU throttle, integrated GPU):** the 3D envelope idles with no main-thread long tasks, and the site stays responsive after opening.
- **Images:** only the envelope and card art load eagerly; everything else is lazy WebP.
- **Fonts:** subset Arabic and Urdu fonts of a few KB each.
- **Reduced motion:** honoured everywhere.
