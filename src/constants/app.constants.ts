export const APP_CONFIG = {
  name: "JUVECONFE",
  fullName: "Juventud en Conferencia",
  shortName: "JUVECONFE",
  url: "https://juve.vidaeternaiglesia.com",

  // URL del sitio estático para navegación web (puede ser local o producción)
  staticSiteUrl: process.env.STATIC_SITE_URL || "http://localhost:4321",

  // URL FIJA para emails (SIEMPRE producción, nunca localhost)
  staticSiteUrlForEmails: "https://juve.vidaeternaiglesia.com",

  email: {
    noreply: "administracion@vidaeternaiglesia.com",
    support: "administracion@vidaeternaiglesia.com",
  },
} as const;

export const COLORS = {
  primary: "#8b3fff",
  secondary: "#00B4D8",
} as const;
