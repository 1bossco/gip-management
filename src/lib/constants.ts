// ============================================================
// GIP MANAGEMENT SYSTEM — CONSTANTS
// All static config, lookup tables, and domain rules
// ============================================================

import type { DocumentField, Sector, TargetGroup, EducationalStatus } from "@/types";

// ── Document Field Registry ───────────────────────────────────

export const DOCUMENT_FIELDS: {
  field: DocumentField;
  label: string;
  shortLabel: string;
  required: boolean;
}[] = [
  { field: "DOC_RESUME",                   label: "Resume",                   shortLabel: "Resume",     required: true },
  { field: "DOC_BIRTH_CERTIFICATE",        label: "PSA Birth Certificate",    shortLabel: "PSA Birth",  required: true },
  { field: "DOC_VALID_ID",                 label: "Valid ID",                 shortLabel: "Valid ID",   required: true },
  { field: "DOC_CERTIFICATE_OF_INDIGENCY", label: "Certificate of Indigency", shortLabel: "Indigency",  required: true },
  { field: "DOC_TOR",                      label: "Transcript of Records",    shortLabel: "TOR",        required: true },
  { field: "DOC_DIPLOMA",                  label: "Diploma",                  shortLabel: "Diploma",    required: true },
  { field: "DOC_GIP_FORM",                 label: "GIP Form",                 shortLabel: "GIP Form",   required: true },
];

export const TOTAL_REQUIRED_DOCS  = DOCUMENT_FIELDS.filter(d => d.required).length;
export const DOCUMENT_FIELD_NAMES = DOCUMENT_FIELDS.map(d => d.field);

// ── Status Colors ─────────────────────────────────────────────

export const STATUS_COLORS = {
  COMPLETE:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  INCOMPLETE:  { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500"   },
  PENDING:     { bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-500"     },
  APPROVED:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  DISAPPROVED: { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
  OPEN:        { bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-500"     },
  CLOSED:      { bg: "bg-gray-100",    text: "text-gray-600",    dot: "bg-gray-400"    },
  CANCELLED:   { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
} as const;

// ── Sectors ───────────────────────────────────────────────────

export const SECTORS: { value: Sector; label: string }[] = [
  { value: "AGRICULTURE",    label: "Agriculture"    },
  { value: "EDUCATION",      label: "Education"      },
  { value: "ENVIRONMENT",    label: "Environment"    },
  { value: "HEALTH",         label: "Health"         },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
  { value: "LIVELIHOOD",     label: "Livelihood"     },
  { value: "SOCIAL SERVICES",label: "Social Services"},
  { value: "TOURISM",        label: "Tourism"        },
  { value: "OTHERS",         label: "Others"         },
];

// ── Target Groups ─────────────────────────────────────────────

export const TARGET_GROUPS: { value: TargetGroup; label: string }[] = [
  { value: "YOUTH",      label: "Youth (15-30)"               },
  { value: "PWD",        label: "Person with Disability (PWD)" },
  { value: "SENIOR",     label: "Senior Citizen"              },
  { value: "FARMER",     label: "Farmer / Fisherfolk"         },
  { value: "FISHERFOLK", label: "Fisherfolk"                  },
];

// ── Educational Status ────────────────────────────────────────

export const EDUCATIONAL_STATUS_OPTIONS: { value: EducationalStatus; label: string }[] = [
  { value: "COLLEGE",    label: "College"                     },
  { value: "SHS",        label: "Senior High School (SHS)"    },
  { value: "ALS",        label: "Alternative Learning System" },
  { value: "GRADUATE",   label: "Graduate / Post-Graduate"    },
  { value: "VOCATIONAL", label: "Technical / Vocational"      },
];

export const SHS_TRACKS = [
  "Academic - ABM",
  "Academic - HUMSS",
  "Academic - STEM",
  "Academic - GAS",
  "TVL - ICT",
  "TVL - Home Economics",
  "TVL - Agri-Fishery Arts",
  "TVL - Industrial Arts",
  "Sports Track",
  "Arts and Design Track",
];

export const YEAR_LEVELS = [
  "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Graduate",
];

// ── Municipalities of Bataan + PGB ────────────────────────────
// 12 municipalities + 1 city + PGB (Provincial Gov't of Bataan)
// PGB is treated as a slot allocation unit like a municipality

export const MUNICIPALITIES = [
  "ABUCAY",
  "BAGAC",
  "BALANGA CITY",
  "DINALUPIHAN",
  "HERMOSA",
  "LIMAY",
  "MARIVELES",
  "MORONG",
  "ORANI",
  "ORION",
  "PILAR",
  "SAMAL",
  "PGB",
];

// ── Residence municipalities (address dropdowns) ──────────────
// The 12 municipalities + city where an applicant can actually live.
// Excludes PGB, which is a slot-allocation unit, not a place of residence.

export const ADDRESS_MUNICIPALITIES = MUNICIPALITIES.filter((m) => m !== "PGB");

// ── Barangays by municipality ─────────────────────────────────
// 237 barangays of Bataan, keyed by the MUNICIPALITY values above.
//
// ⚠ DRAFTED FROM PSGC NAMES — VERIFY AGAINST THE OFFICIAL DOH/PSA LIST
// BEFORE GOING LIVE. These names are printed onto transmittal documents,
// so a misspelled or missing barangay is a real problem. Counts per
// municipality are noted below and total 237.

export const BARANGAYS_BY_MUNICIPALITY: Record<string, string[]> = {
  // 9
  "ABUCAY": [
    "Bangkal", "Calaylayan (Pob.)", "Capitangan", "Gabon", "Laon (Pob.)",
    "Mabatang", "Omboy", "Salian", "Wawa (Pob.)",
  ],

  // 14
  "BAGAC": [
    "Atilano L. Ricardo", "Bagumbayan (Pob.)", "Banawang", "Binuangan",
    "Binukawan", "Ibaba", "Ibis", "Pag-asa (Wawa-Sibacan)", "Parang",
    "Paysawan", "Quinawan", "San Antonio", "Saysain", "Tabing-Ilog (Pob.)",
  ],

  // 25
  "BALANGA CITY": [
    "Bagumbayan", "Cabog-Cabog", "Camacho", "Cataning", "Central",
    "Cupang North", "Cupang Proper", "Cupang West", "Dangcol (Bernabe)",
    "Doña Francisca", "Ibayo", "Lote", "Malabia", "Munting Batangas (Cadre)",
    "Poblacion", "Pto. Rivas Ibaba", "Pto. Rivas Itaas", "San Jose",
    "Sibacan", "Talisay", "Tanato", "Tenejero", "Tortugas", "Tuyo",
    "Bagong Silang",
  ],

  // 46
  "DINALUPIHAN": [
    "Aquino", "Bangal", "Bayan-bayanan", "Bonifacio (Pob.)", "Burgos (Pob.)",
    "Colo", "Daang Bago", "Dalao", "Del Pilar (Pob.)", "Gen. Luna (Pob.)",
    "Gomez (Pob.)", "Happy Valley", "Jose C. Payumo, Jr.", "Kataasan",
    "Layac", "Luacan", "Mabini Ext. (Pob.)", "Mabini Proper (Pob.)",
    "Magsaysay", "Maligaya", "Naparing", "New San Jose", "Old San Jose",
    "Padre Dandan (Pob.)", "Pag-asa", "Pagalanggang", "Payangan", "Pentor",
    "Pinulot", "Pita", "Rizal (Pob.)", "Roosevelt", "Roxas (Pob.)",
    "Saguing", "San Benito", "San Isidro (Pob.)", "San Pablo (Bulate)",
    "San Ramon", "San Simon", "Santa Isabel (Tabacan)", "Santo Niño",
    "Sapang Balas", "Torres Bugauen (Pob.)", "Tubo-tubo", "Tucop",
    "Zamora (Pob.)",
  ],

  // 23
  "HERMOSA": [
    "A. Rivera (Pob.)", "Almacen", "Bacong", "Balsic", "Bamban",
    "Burgos-Soliman (Pob.)", "Cataning (Pob.)", "Culis", "Daungan (Pob.)",
    "Judge Roman Cruz Sr. (Mandama)", "Mabiga", "Mabuco", "Maite",
    "Mambog - Mandama", "Palihan", "Pandatung", "Pulo", "Saba",
    "Sacrifice Valley", "San Pedro (Pob.)", "Santo Cristo (Pob.)", "Sumalo",
    "Tipo",
  ],

  // 12
  "LIMAY": [
    "Alangan", "Duale", "Kitang 2 & Luz", "Kitang I", "Lamao", "Landing",
    "Poblacion", "Reformista", "San Francisco de Asis", "St. Francis II",
    "Townsite", "Wawa",
  ],

  // 18
  "MARIVELES": [
    "Alas-asin", "Alion", "Balon-Anito", "Baseco Country (Nassco)",
    "Batangas II", "Biaan", "Cabcaben", "Camaya", "Ipag", "Lucanin",
    "Malaya", "Maligaya", "Mt. View", "Poblacion", "San Carlos",
    "San Isidro", "Sisiman", "Townsite",
  ],

  // 5
  "MORONG": [
    "Binaritan", "Mabayo", "Nagbalayong", "Poblacion", "Sabang",
  ],

  // 29
  "ORANI": [
    "Apollo", "Bagong Paraiso (Pob.)", "Balut (Pob.)", "Bayan (Pob.)",
    "Calero (Pob.)", "Centro I (Pob.)", "Centro II (Pob.)", "Dona",
    "Kabalutan", "Kaparangan", "Maria Fe", "Masantol", "Mulawin", "Pag-asa",
    "Paking-Carbonero (Pob.)", "Palihan (Pob.)", "Pantalan Bago (Pob.)",
    "Pantalan Luma (Pob.)", "Parang Parang (Pob.)", "Puksuan", "Sibul",
    "Silahis", "Tagumpay", "Tala", "Talimundoc", "Tapulao",
    "Tenejero (Pob.)", "Tugatog", "Wawa (Pob.)",
  ],

  // 23
  "ORION": [
    "Arellano (Pob.)", "Bagumbayan (Pob.)", "Balagtas (Pob.)", "Balut (Pob.)",
    "Bantan", "Bilolo", "Calungusan", "Camachile", "Daang Bago (Pob.)",
    "Daang Bilolo (Pob.)", "Daang Pare", "General Lim (Kaput)", "Kapunitan",
    "Lati (Pob.)", "Lusungan (Pob.)", "Puting Buhangin", "Sabatan",
    "San Vicente (Pob.)", "Santa Elena", "Santo Domingo",
    "Villa Angeles (Pob.)", "Wakas (Pob.)", "Wawa (Pob.)",
  ],

  // 19
  "PILAR": [
    "Ala-uli", "Bagumbayan", "Balut I", "Balut II", "Bantan Munti", "Burgos",
    "Del Rosario (Pob.)", "Diwa", "Landing", "Liyang", "Nagwaling",
    "Panilao", "Pantingan", "Poblacion", "Rizal (Pob.)", "Santa Rosa",
    "Wakas North", "Wakas South", "Wawa",
  ],

  // 14
  "SAMAL": [
    "East Calaguiman (Pob.)", "East Daang Bago (Pob.)", "Gugo", "Ibaba (Pob.)",
    "Imelda", "Lalawigan", "Palili", "San Juan (Pob.)", "San Roque (Pob.)",
    "Santa Lucia", "Sapa", "Tabing Ilog", "West Calaguiman (Pob.)",
    "West Daang Bago (Pob.)",
  ],
};

// Slot allocation units for batch creation (used in CreateBatchModal)
export const BATCH_MUNICIPALITIES: { key: string; label: string }[] = [
  { key: "ABUCAY",       label: "Abucay"           },
  { key: "BAGAC",        label: "Bagac"            },
  { key: "BALANGA CITY", label: "Balanga City"     },
  { key: "DINALUPIHAN",  label: "Dinalupihan"      },
  { key: "HERMOSA",      label: "Hermosa"          },
  { key: "LIMAY",        label: "Limay"            },
  { key: "MARIVELES",    label: "Mariveles"        },
  { key: "MORONG",       label: "Morong"           },
  { key: "ORANI",        label: "Orani"            },
  { key: "ORION",        label: "Orion"            },
  { key: "PILAR",        label: "Pilar"            },
  { key: "SAMAL",        label: "Samal"            },
  { key: "PGB",          label: "PGB (Provincial)" },
];

// ── Civil Status / Sex ────────────────────────────────────────

export const CIVIL_STATUS_OPTIONS = ["SINGLE", "MARRIED", "WIDOWED", "SEPARATED"];
export const SEX_OPTIONS          = ["MALE", "FEMALE"];

// ── Statuses ──────────────────────────────────────────────────

export const APPLICATION_STATUSES  = ["PENDING", "APPROVED", "DISAPPROVED"] as const;
export const DOCUMENT_STATUSES     = ["COMPLETE", "INCOMPLETE"] as const;
export const REGISTRATION_STATUSES = ["COMPLETE", "INCOMPLETE"] as const;

// ── Batch Name Generation ─────────────────────────────────────
// Format: 2026-GIP-BATCH 1  (matches your Google Sheet exactly)
// Resets to 1 every new calendar year

export function generateBatchName(batchNumber: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `${y}-GIP-BATCH ${batchNumber}`;
}

// Get next available batch number for current year
export function getNextBatchNumber(existingBatchNames: string[]): number {
  const year = new Date().getFullYear();
  const nums = existingBatchNames
    .filter(n => n.startsWith(`${year}-GIP-BATCH`))
    .map(n => {
      const m = n.match(/BATCH\s+(\d+)$/);
      return m ? parseInt(m[1]) : 0;
    })
    .filter(n => !isNaN(n));
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}

// ── GIP ID Format ─────────────────────────────────────────────

export function parseGipId(gipId: string): { year: number; seq: number } | null {
  const match = gipId.match(/^GIP-(\d{4})-(\d{5})$/);
  if (!match) return null;
  return { year: parseInt(match[1]), seq: parseInt(match[2]) };
}

// ── Pagination ────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ── Date Helpers ──────────────────────────────────────────────

export const DATE_FORMAT         = "YYYY-MM-DD";
export const DISPLAY_DATE_FORMAT = "MMM DD, YYYY";

// ── API Action Types ──────────────────────────────────────────

export const API_ACTIONS = {
  REGISTER:             "register",
  UPDATE_DOCUMENT:      "updateDocument",
  APPROVE:              "approveApplicant",
  GET_APPLICANTS:       "getApplicants",
  GET_APPLICANT:        "getApplicant",
  GET_DASHBOARD:        "getDashboard",
  GET_INCOMPLETE:       "getIncomplete",
  GET_BATCHES:          "getBatches",
  CREATE_BATCH:         "createBatch",
  UPDATE_BATCH_STATUS:  "updateBatchStatus",
  GENERATE_TRANSMITTAL: "generateTransmittal",
  LOGIN:                "login",
} as const;

export type ApiAction = (typeof API_ACTIONS)[keyof typeof API_ACTIONS];

// ── Storage / Cookie Keys ─────────────────────────────────────

export const STORAGE_KEYS = {
  AUTH_TOKEN:         "gip_auth_token",
  AUTH_USER:          "gip_auth_user",
  MONITORING_FILTERS: "gip_monitoring_filters",
} as const;

export const COOKIE_KEYS = {
  SESSION: "gip_session",
} as const;

// ── Session Expiry ────────────────────────────────────────────

export const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours

// ── Monitoring Table Columns ──────────────────────────────────

export const MONITORING_COLUMNS = [
  { key: "GIP_ID",               label: "GIP ID",       sortable: true,  width: "w-32" },
  { key: "SURNAME",              label: "Surname",      sortable: true,  width: "w-28" },
  { key: "FIRST_NAME",           label: "First Name",   sortable: true,  width: "w-28" },
  { key: "MUNICIPALITY",         label: "Municipality", sortable: true,  width: "w-28" },
  { key: "SECTOR",               label: "Sector",       sortable: true,  width: "w-28" },
  { key: "DOCUMENT_STATUS",      label: "Doc Status",   sortable: true,  width: "w-24" },
  { key: "APPLICATION_STATUS",   label: "App Status",   sortable: true,  width: "w-24" },
  { key: "TOTAL_SUBMITTED_DOCS", label: "Docs",         sortable: true,  width: "w-16" },
  { key: "MISSING_DOCUMENTS",    label: "Missing",      sortable: false, width: "w-40" },
  { key: "BATCH_NAME",           label: "Batch",        sortable: true,  width: "w-32" },
  { key: "DATE_REGISTERED",      label: "Registered",   sortable: true,  width: "w-28" },
] as const;