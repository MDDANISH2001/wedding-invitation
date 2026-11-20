/**
 * ─────────────────────────────────────────────────────────────
 *  Wedding content — the single source of truth for every word
 *  on the site. Edit values here; no component needs to change.
 *
 *  Visual effects (touch effect, petals, lanterns, opening) are
 *  configured in `.env` — see `.env.example`.
 *
 *  Arabic / Urdu strings are rendered in Amiri (Arabic) and
 *  Noto Nastaliq Urdu. The font files are subset automatically
 *  to the letters used in this file (see vite.config.ts).
 *
 *  Dates use ISO 8601 with an explicit offset (+05:30 = IST), so
 *  the countdown is right wherever the guest opens the link.
 * ─────────────────────────────────────────────────────────────
 */

export interface ScheduleItem {
  label: string;
  /** Display time, e.g. "7:00 PM onwards". */
  time: string;
}

export interface WeddingEvent {
  id: string;
  title: string;
  /** Short name used in the date summary on the card. */
  shortTitle: string;
  /** Urdu title shown beside the English one. Empty hides it. */
  titleUrdu: string;
  subtitle: string;
  /** Start, ISO 8601 with offset. Drives the date shown + countdown. */
  start: string;
  schedule: ScheduleItem[];
  venueName: string;
  /** Second line of the venue. Empty hides it. */
  venueAddress: string;
  /** Google Maps link for the "Get directions" button. */
  mapsUrl: string;
  /** Show the directions button even before mapsUrl is set ("link coming soon"). */
  showDirections: boolean;
  ornament: "lantern" | "floral";
}

export interface Person {
  name: string;
  /** "Noor-e-Chashm" line above the name. */
  honorific: string;
  honorificUrdu: string;
  /** Lineage lines under the name (parents, grandparents). Wrap names in *stars* to highlight them. */
  lines: string[];
}

export interface RsvpContact {
  name: string;
  /** Shown as written; a tap dials the digits. Empty name hides the row. */
  phone: string;
}

/**
 * The two invitation views, picked by the link's query string:
 *   https://…/                   → both events (Baraat & Nikah + Walima)
 *   https://…/?invite=walima     → Walima only   (also ?view=walima or ?walima)
 */
export type InviteView = "all" | "walima";

const content = {
  bismillah: {
    arabic: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ",
    transliteration: "Bismillah-ir-Rahman-ir-Rahim",
    meaning: "In the name of Allah, the Most Gracious, the Most Merciful",
  },

  hosts: {
    names: "MD Mynuddin",
    request:
      "request the honour of your presence and blessings on the auspicious occasion of the Nikah of their beloved son",
  },

  groom: {
    name: "MD. Danish",
    honorific: "Noor-e-Chashm",
    honorificUrdu: "نورِ چشم",
    lines: [
      "Son of *MD Mynuddin alias Mynuddin*",
      "Grandson of Late *Shabir Ahamad*, Tyodhi wale",
    ],
  } satisfies Person,

  bride: {
    name: "Zainab",
    honorific: "Noor-e-Chashmi",
    honorificUrdu: "نورِ چشمی",
    lines: [
      "Daughter of *Mr. Ahsan*",
      "Granddaughter of Late *Mohd. Usman*, Badli wale",
    ],
  } satisfies Person,

  weds: "weds",
  monogram: { first: "D", second: "Z" },

  inshaAllah: { latin: "In-sha' Allah", urdu: "اِن شاءَ اللہ" },

  programme: {
    heading: "Programme",
    headingUrdu: "پروگرام",
    intro: "We would be honoured by your presence at both celebrations.",
  },

  events: [
    {
      id: "baraat",
      title: "Baraat & Nikah",
      shortTitle: "Nikah",
      titleUrdu: "بارات و نکاح",
      subtitle: "Nikah Ceremony",
      start: "2026-12-05T19:00:00+05:30",
      schedule: [
        { label: "Departure of Baraat", time: "7:00 PM" },
        { label: "Nikah", time: "9:00 PM" },
      ],
      venueName: "Venue to be announced",
      venueAddress: "",
      // TODO: paste the Google Maps link here when the location is final
      mapsUrl: "",
      showDirections: true,
      ornament: "lantern",
    },
    {
      id: "walima",
      title: "Dawat-e-Walima",
      shortTitle: "Walima",
      titleUrdu: "دعوتِ ولیمہ",
      subtitle: "Reception",
      start: "2026-12-06T19:00:00+05:30",
      schedule: [{ label: "Dinner", time: "To be announced" }],
      venueName: "254-B/184, Gali No. 1/1, D-Block",
      venueAddress: "Shoaib Enclave, Prem Nagar, Loni, Ghaziabad",
      // TODO: paste the Google Maps link here
      mapsUrl: "",
      showDirections: true,
      ornament: "floral",
    },
  ] satisfies WeddingEvent[],

  countdown: {
    target: "2026-12-05T19:00:00+05:30",
    label: "the Nikah",
    startedMessage:
      "Alhamdulillah — the celebrations have begun. Thank you for being part of our story.",
  },

  duas: {
    alhamdulillah: {
      arabic: "اَلْحَمْدُ لِلّٰهِ",
      latin: "Alhamdulillah",
      meaning: "All praise is due to Allah",
    },
    couple: {
      heading: "A dua for the couple",
      arabic:
        "بَارَكَ اللّٰهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا وَجَمَعَ بَيْنَكُمَا فِيْ خَيْرٍ",
      latin:
        "Barakallahu lakuma wa baraka 'alaykuma wa jama'a baynakuma fi khayr",
      meaning:
        "May Allah bless you both, shower His blessings upon you, and unite you in goodness.",
    },
    verse: {
      text: "And of His signs is that He created for you from yourselves mates that you may find tranquillity in them; and He placed between you affection and mercy.",
      source: "Surah Ar-Rum · 30:21",
    },
    welcomeUrdu: "آپ کی تشریف آوری ہمارے لیے باعثِ مسرت و افتخار ہوگی",
    welcome: "Your gracious presence will be a joy and an honour for us.",
  },

  compliments: {
    heading: "With Best Compliments From",
    headingUrdu: "منجانب",
    names: "All Relatives & Friends",
    namesUrdu: "جملہ اعزہ و احباب",
  },

  rsvp: {
    heading: "R.S.V.P.",
    /** Shown as written; a tap dials the number. Add names when you have them. */
    contacts: [
      { name: "", phone: "+91 78385 69272" },
      { name: "", phone: "+91 83681 39660" },
    ] as RsvpContact[],
    /** WhatsApp RSVP button; hidden until set. International digits, e.g. "919876543210". */
    whatsappNumber: "",
    buttonLabel: "Confirm attendance",
    message:
      "Assalamu alaikum! Insha'Allah I will attend the Nikah of MD Danish & Zainab. Name: … Number of guests: …",
    /** Small line under the button, e.g. a reply-by date. Empty hides it. */
    note: "",
  },

  /** A little one's invitation, written the way a toddler says it. Empty text hides it. */
  childNote: {
    text: "Mele Mamu ki chhadi me jalool jalool aana!",
    from: "— Mamu's little one",
  },

  closing: {
    arabic: "جَزَاكَ اللّٰهُ خَيْرًا",
    latin: "Jazakallahu Khairan",
    signOff: "With love and duas, the families of the bride & groom",
  },

  meta: {
    title: "MD Danish & Zainab · Nikah Invitation",
    description:
      "Bismillah — you are invited to the Nikah of MD Danish & Zainab · 5 & 6 December 2026",
  },
};

/** Per-view wording. Anything not listed here is shared by both views. */
const VIEWS = {
  all: {
    events: ["baraat", "walima"],
    request: content.hosts.request,
    programmeIntro: content.programme.intro,
    countdown: content.countdown,
    rsvpMessage: content.rsvp.message,
  },
  walima: {
    events: ["walima"],
    request:
      "request the pleasure of your company at the Dawat-e-Walima, celebrating the Nikah of their beloved son",
    programmeIntro: "We would be honoured by your presence at the Walima.",
    countdown: {
      ...content.countdown,
      target: "2026-12-06T19:00:00+05:30",
      label: "the Walima",
    },
    rsvpMessage:
      "Assalamu alaikum! Insha'Allah I will attend the Dawat-e-Walima of MD Danish & Zainab. Name: … Number of guests: …",
  },
} satisfies Record<InviteView, unknown>;

function readView(): InviteView {
  if (typeof window === "undefined") return "all";
  const q = new URLSearchParams(window.location.search);
  const v = (q.get("invite") ?? q.get("view") ?? "").toLowerCase();
  return v === "walima" || v === "valima" || q.has("walima") || q.has("valima")
    ? "walima"
    : "all";
}

export const VIEW: InviteView = readView();
const view = VIEWS[VIEW];

/** The content for the view this link asks for. Components read only this. */
export const wedding = {
  ...content,
  hosts: { ...content.hosts, request: view.request },
  programme: { ...content.programme, intro: view.programmeIntro },
  events: content.events.filter((e) =>
    (view.events as string[]).includes(e.id),
  ),
  countdown: view.countdown,
  rsvp: { ...content.rsvp, message: view.rsvpMessage },
};

/** Timezone used to render event dates (matches the offsets above). */
export const WEDDING_TIMEZONE = "Asia/Kolkata";
