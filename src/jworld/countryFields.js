export function emptyCountryPayload() {
  return {
    official_name: "",
    common_names: "",
    motto: "",
    short_description: "",
    lore: "",
    leader: "",
    memberships: "",
    capital: "",
    population: "",
    languages: "",
    religion: { summary: "" },
    currency: "",
    land_area: "",
    cctlds: "",
    timezones: "",
    driving_side: "",
    phone_codes: "",
    politics: {
      government_type: "",
      head_of_state: "",
      head_of_government: "",
      political_orientation: "",
      army_size: "",
      military_doctrine: "",
    },
    government: {
      legislature: "",
      legal_system: "",
      languages: "",
      national_day: "",
      admin_divisions: "",
    },
    geography: {
      location: "",
      area: "",
      terrain: "",
      climate: "",
      maritime_zones: "",
    },
    symbols: {
      emblem: "",
      colors: "",
      anthem: "",
      royal_house: "",
      motto_latin: "",
    },
    flag_path: null,
  };
}

export function countryToPayload(country) {
  const base = emptyCountryPayload();
  if (!country) return base;
  return {
    ...base,
    official_name: country.official_name || "",
    common_names: country.common_names || "",
    motto: country.motto || "",
    short_description: country.short_description || "",
    lore: country.lore || "",
    leader: country.leader || "",
    memberships: country.memberships || "",
    capital: country.capital || "",
    population: country.population || "",
    languages: country.languages || "",
    religion:
      country.religion && typeof country.religion === "object"
        ? { ...base.religion, ...country.religion }
        : base.religion,
    currency: country.currency || "",
    land_area: country.land_area || "",
    cctlds: country.cctlds || "",
    timezones: country.timezones || "",
    driving_side: country.driving_side || "",
    phone_codes: country.phone_codes || "",
    politics:
      country.politics && typeof country.politics === "object"
        ? { ...base.politics, ...country.politics }
        : base.politics,
    government:
      country.government && typeof country.government === "object"
        ? { ...base.government, ...country.government }
        : base.government,
    geography:
      country.geography && typeof country.geography === "object"
        ? { ...base.geography, ...country.geography }
        : base.geography,
    symbols:
      country.symbols && typeof country.symbols === "object"
        ? { ...base.symbols, ...country.symbols }
        : base.symbols,
    flag_path: country.flag_path || null,
  };
}

export const INFOBOX_FIELDS = [
  { key: "leader", label: "Leader" },
  { key: "memberships", label: "Membership in International Org's" },
  { key: "capital", label: "Capital" },
  { key: "population", label: "Population" },
  { key: "languages", label: "Language(s)" },
  { key: "currency", label: "Currency" },
  { key: "land_area", label: "Land Area (km² / sq mi)" },
  { key: "cctlds", label: "ccTLD(s)" },
  { key: "timezones", label: "Timezone(s)" },
  { key: "driving_side", label: "Driving on what road side?" },
  { key: "phone_codes", label: "Phone area code" },
];

export const SECTION_FIELDS = {
  politics: [
    { key: "government_type", label: "Government Type" },
    { key: "head_of_state", label: "Head of State" },
    { key: "head_of_government", label: "Head of Government" },
    { key: "political_orientation", label: "Political Orientation" },
    { key: "army_size", label: "Army Size" },
    { key: "military_doctrine", label: "Military Doctrine" },
  ],
  government: [
    { key: "legislature", label: "Legislature" },
    { key: "legal_system", label: "Legal System" },
    { key: "languages", label: "Languages" },
    { key: "national_day", label: "National Day" },
    { key: "admin_divisions", label: "Administrative Divisions" },
  ],
  geography: [
    { key: "location", label: "Location" },
    { key: "area", label: "Area" },
    { key: "terrain", label: "Terrain" },
    { key: "climate", label: "Climate" },
    { key: "maritime_zones", label: "Maritime Zones" },
  ],
  symbols: [
    { key: "emblem", label: "National Emblem" },
    { key: "colors", label: "Colors" },
    { key: "anthem", label: "Anthem" },
    { key: "royal_house", label: "Royal House" },
    { key: "motto_latin", label: "Motto (Latin)" },
  ],
};
