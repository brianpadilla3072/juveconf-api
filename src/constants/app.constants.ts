export const APP_CONFIG = {
  name: "JuveConf",
  fullName: "Juventud en Conferencia",
  shortName: "JuveConf",
  url: "https://juveconf.com",

  // URL del sitio estático para navegación web (puede ser local o producción)
  staticSiteUrl: process.env.STATIC_SITE_URL || "http://localhost:4321",

  // URL FIJA para emails (SIEMPRE producción, nunca localhost)
  staticSiteUrlForEmails: "https://www.juveconfe.com",

  email: {
    noreply: "equipo@juveconfe.com",
    support: "equipo@juveconfe.com",
  },
} as const;

export const COLORS = {
  primary: "#8b3fff",
  secondary: "#00B4D8",
} as const;
