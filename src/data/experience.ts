// Founder experience — the engagements behind Innovation Ways' two decades of
// telecom-billing and finance depth. Drives the Europe map + popups in
// ExperienceMap.astro. Third-person about the founder (chrome voice rule).
//
// Each `cityKey` joins to a projected marker in src/data/europe-map.json. Pins are
// placed at the COMPANY's home location (where the organisation is), not where the
// work was physically done — most engagements were delivered remotely from Lisbon.
//
// Logos live in /public/logos/<logo>, workplace photos in /public/workplaces/<photo>.
// Missing assets degrade gracefully (wordmark / "photo to be added") — see
// ExperienceMap.astro. All content here is public-level (LinkedIn-grade); it names
// past employers but reveals no client-internal system logic.

export interface Engagement {
  id: string; // unique — dialog id + default asset filename
  cityKey: string; // joins europe-map.json cities[].key
  city: string; // display location label
  company: string; // employer / operator name
  sector: string; // short tag
  dateRange: string;
  title: string; // role title (LinkedIn-aligned)
  logo: string; // /logos/...
  photo: string; // /workplaces/...
  description: string; // plain-English, third-person about the founder
}

export const engagements: Engagement[] = [
  {
    id: "sunrise",
    cityKey: "zurich",
    city: "Zürich, Switzerland",
    company: "Sunrise",
    sector: "Telecom billing",
    dateRange: "2016 – present",
    title: "Principal Engineer — Postpaid Billing",
    logo: "/logos/sunrise.svg",
    photo: "/workplaces/sunrise.jpg",
    description:
      "Sérgio is the sole developer of Sunrise's internal invoicing system, which produces millions of final and proforma invoices every month — with zero major production incidents since he took it over. He is the last line for postpaid-billing production issues, and led the billing-side design of major deliveries including the Swiss QR-code payment slips, Balanced Invoices, and the Kenan FX platform upgrade.",
  },
  {
    id: "orange",
    cityKey: "bordeaux",
    city: "Bordeaux, France",
    company: "Orange",
    sector: "Telecom billing",
    dateRange: "2015 – 2016",
    title: "Senior Billing Specialist",
    logo: "/logos/orange.svg",
    photo: "/workplaces/orange.jpg",
    description:
      "As a Kenan billing subject-matter expert, Sérgio supported Orange France's billing-platform upgrade — authoring and presenting the implementation plan, and supporting the migration tests and parallel runs that de-risked the cutover.",
  },
  {
    id: "vodafone-tr",
    cityKey: "istanbul",
    city: "Istanbul, Türkiye",
    company: "Vodafone",
    sector: "Telecom billing",
    dateRange: "2013 – 2014",
    title: "Senior Billing Consultant",
    logo: "/logos/vodafone.svg",
    photo: "/workplaces/vodafone-tr.jpg",
    description:
      "Sérgio worked the billing perspective of Vodafone Turkey's Bundle Promotions project — analysing a new promotions solution that spanned the CRM (Siebel), TIBCO and Kenan, and building a new business adapter for its product-catalogue approach.",
  },
  {
    id: "vodafone-es",
    cityKey: "madrid",
    city: "Madrid, Spain",
    company: "Vodafone",
    sector: "Telecom billing",
    dateRange: "2011 – 2012",
    title: "Senior Billing Consultant",
    logo: "/logos/vodafone.svg",
    photo: "/workplaces/vodafone-es.jpg",
    description:
      "Sérgio led the SETTLER → ICT migration that moved Vodafone Spain's transit-communications billing onto a new platform, mapping the legacy reference data across while preserving exact rating parity.",
  },
  {
    id: "bnp-paribas",
    cityKey: "paris",
    city: "Paris, France",
    company: "BNP Paribas",
    sector: "Securities settlement",
    dateRange: "2008 – 2013",
    title: "Senior Developer & IT Team Coordinator",
    logo: "/logos/bnp-paribas.svg",
    photo: "/workplaces/bnp-paribas.jpg",
    description:
      "At BNP Paribas Securities Services, Sérgio led the Portuguese MIS team that aggregated data from every internal system into the monthly client-portfolio reports investors used to see their whole asset position in one place. He later worked on ISISET, the bank's global settlement application used to settle client instructions across more than 100 countries.",
  },
  {
    id: "vodafone-pt",
    cityKey: "lisbon",
    city: "Lisbon, Portugal",
    company: "Vodafone",
    sector: "Telecom billing",
    dateRange: "2006 – 2015",
    title: "Senior Billing Consultant",
    logo: "/logos/vodafone.svg",
    photo: "/workplaces/vodafone-pt.jpg",
    description:
      "Across several engagements, Sérgio worked on Vodafone Portugal's billing platform (Comverse / Amdocs Kenan) — from early maintenance and document production through to upgrades, a payments-reconciliation gateway, and Portuguese-law invoice-adjustment work. This is where his telecom-billing specialism took root.",
  },
  {
    id: "axa",
    cityKey: "lisbon",
    city: "Lisbon, Portugal",
    company: "AXA",
    sector: "Insurance documentation",
    dateRange: "2008",
    title: "Document Production Consultant",
    logo: "/logos/axa.svg",
    photo: "/workplaces/axa.jpg",
    description:
      "Sérgio joined AXA Portugal's document-production team, building and maintaining the Oracle-based systems that generated the insurer's customer documents.",
  },
];
