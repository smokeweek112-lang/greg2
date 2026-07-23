import localFont from "next/font/local";

export const helveticaNeue = localFont({
  src: [
    { path: "../public/fonts/HelveticaNeueCyr-UltraLight.woff2", weight: "100", style: "normal" },
    { path: "../public/fonts/HelveticaNeueCyr-Thin.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/HelveticaNeueCyr-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/HelveticaNeueCyr-Roman.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/HelveticaNeueCyr-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/HelveticaNeueCyr-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/HelveticaNeueCyr-Heavy.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/HelveticaNeueCyr-Black.woff2", weight: "900", style: "normal" },
    { path: "../public/fonts/HelveticaNeueBoldCondensed.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/HelveticaNeueBlackCondensed.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-helvetica-neue",
  display: "swap",
});

export const arsenica = localFont({
  src: [
    { path: "../public/fonts/Arsenica-Thin.woff2", weight: "100", style: "normal" },
    { path: "../public/fonts/Arsenica-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/Arsenica-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Arsenica-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Arsenica-Demibold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/Arsenica-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Arsenica-Extrabold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-arsenica",
  display: "swap",
});

export const ogg = localFont({
  src: [
    { path: "../public/fonts/Ogg-Thin.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/Ogg-Light.woff2", weight: "300", style: "normal" },
  ],
  variable: "--font-ogg",
  display: "swap",
});

export const didot = localFont({
  src: [
    { path: "../public/fonts/Didot-Thin.woff2", weight: "200", style: "normal" },
    { path: "../public/fonts/Didot-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ogg",
  display: "swap",
});
