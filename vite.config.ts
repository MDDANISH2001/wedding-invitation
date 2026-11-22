import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * Subsets the Arabic + Urdu web fonts to exactly the letters used in
 * src/config/wedding.ts (Google Fonts `text=`), so they cost a few KB
 * instead of hundreds. Edit the config and the subset follows.
 */
function scriptFontSubset(): Plugin {
  const css = () => {
    const src = readFileSync(
      new URL("./src/config/wedding.ts", import.meta.url),
      "utf8",
    );
    // Arabic, Arabic Supplement, presentation forms A/B, ZWNJ/ZWJ
    const chars = new Set(src.match(/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻾‌‍]/gu) ?? []);
    const text = encodeURIComponent([...chars].sort().join("") + " ");
    return `https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Nastaliq+Urdu:wght@500&family=Aref+Ruqaa:wght@700&display=swap&text=${text}`;
  };
  return {
    name: "script-font-subset",
    transformIndexHtml: (html) => html.replace("%SCRIPT_FONTS%", css()),
  };
}

const THEME_COLORS: Record<string, string> = {
  classic: "#4B0082",
  midnight: "#070a1f",
  rose: "#4d0a1b",
  letterpress: "#e5ddcc",
  noor: "#0b0604",
};

/**
 * Bakes the theme into index.html so the first paint is already themed
 * (no flash): <html data-theme>, the foil / sky classes, the browser
 * theme colour, and the link-preview image for WhatsApp.
 */
function themeHtml(env: Record<string, string>): Plugin {
  const v = (k: string) => (env[k] ?? "").trim().toLowerCase();
  const theme = THEME_COLORS[v("VITE_THEME")] ? v("VITE_THEME") : "classic";
  const flag = (k: string, dflt: boolean) =>
    ["on", "true", "1", "yes"].includes(v(k))
      ? true
      : ["off", "false", "0", "no"].includes(v(k))
        ? false
        : dflt;
  const foil = flag("VITE_FOIL", theme !== "classic" && theme !== "noor");
  const sky = flag("VITE_SKY", theme === "midnight");
  const site = (env.VITE_SITE_URL ?? "").trim().replace(/\/+$/, "");
  return {
    name: "theme-html",
    transformIndexHtml: (html) =>
      html
        .replace(
          '<html lang="en">',
          `<html lang="en" data-theme="${theme}" class="${[foil && "foil", sky && "sky-on"].filter(Boolean).join(" ")}">`,
        )
        .replace('content="#4B0082"', `content="${THEME_COLORS[theme]}"`)
        .replace("%OG_IMAGE%", `${site}/og.jpg`)
        .replace("%SITE_URL%", site),
  };
}

/**
 * https://…/walima gets a real page of its own: dist/walima/index.html is the
 * same app (it reads the path and shows only the Walima), but with its own
 * title, description and WhatsApp thumbnail (public/og-walima.jpg). Link
 * previews are read before any script runs, so this has to be in the HTML.
 */
function walimaPage(env: Record<string, string>): Plugin {
  const site = (env.VITE_SITE_URL ?? "").trim().replace(/\/+$/, "");
  const src = readFileSync(
    new URL("./src/config/wedding.ts", import.meta.url),
    "utf8",
  );
  const name = (who: string) =>
    src.match(new RegExp(`${who}:\\s*\\{[^}]*?name:\\s*"([^"]+)"`, "s"))?.[1] ??
    who;
  const ev = src.match(
    /id:\s*"walima"[\s\S]*?start:\s*"([^"]+)"[\s\S]*?venueName:\s*"([^"]*)"[\s\S]*?venueAddress:\s*"([^"]*)"/,
  );
  const when = ev
    ? new Date(ev[1])
        .toLocaleString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        })
        .replace(" at ", " · ")
        .replace(/\b(am|pm)\b/, (s) => s.toUpperCase())
    : "";
  const where = ev ? [ev[2], ev[3]].filter(Boolean).join(", ") : "";
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const couple = `${name("groom")} weds ${name("bride")}`;
  const meta = (html: string, key: string, value: string) =>
    html.replace(
      new RegExp(`(<meta (?:property|name)="${key}" content=")[^"]*(")`),
      `$1${esc(value)}$2`,
    );

  return {
    name: "walima-page",
    apply: "build",
    enforce: "post",
    generateBundle(_, bundle) {
      const index = bundle["index.html"];
      if (!index || index.type !== "asset") return;
      let html = String(index.source);
      html = html.replace(
        /<title>[^<]*<\/title>/,
        `<title>${esc(`${couple} · Dawat-e-Walima`)}</title>`,
      );
      html = meta(
        html,
        "description",
        `You are invited to the Dawat-e-Walima of ${couple} · ${when}`,
      );
      html = meta(html, "og:title", `${couple} · Dawat-e-Walima`);
      html = meta(
        html,
        "og:description",
        [when, where].filter(Boolean).join(" · "),
      );
      html = meta(html, "og:image", `${site}/og-walima.jpg`);
      html = meta(html, "og:image:alt", `Dawat-e-Walima of ${couple}`);
      html = meta(html, "og:url", `${site}/walima`);
      this.emitFile({
        type: "asset",
        fileName: "walima/index.html",
        source: html,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [
      react(),
      tailwindcss(),
      scriptFontSubset(),
      themeHtml(env),
      walimaPage(env),
    ],
    build: { chunkSizeWarningLimit: 700 },
  };
});
