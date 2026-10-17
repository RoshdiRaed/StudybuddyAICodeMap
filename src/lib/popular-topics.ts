/**
 * The starting-point topics Sheets and Flashcards offer, taken from the
 * Topics (curriculum) page so the three agree. `topic` is what goes into the
 * box — a curriculum title, or a phrase contained in one, so a sheet or deck
 * made from it counts toward that topic's coverage. `label` is the chip's
 * short name; `system` is the curriculum system it sits under.
 */
export interface PopularTopic {
  label: string;
  short: string;
  topic: string;
  system: string;
}

export const POPULAR_TOPICS: readonly PopularTopic[] = [
  { label: "Heart Failure", short: "HF", topic: "Heart Failure", system: "Cardiovascular" },
  { label: "Acute Coronary Syndrome", short: "ACS", topic: "Acute Coronary Syndrome", system: "Cardiovascular" },
  { label: "Pneumonia", short: "PN", topic: "Pneumonia — Community, Hospital & Atypical", system: "Respiratory" },
  { label: "Diabetic Ketoacidosis", short: "DKA", topic: "Diabetic Ketoacidosis", system: "Endocrinology" },
  { label: "Ischemic Stroke", short: "CVA", topic: "Ischemic Stroke", system: "Neurology" },
  { label: "Nephrotic Syndrome", short: "NS", topic: "Nephrotic Syndrome", system: "Renal & Urinary" },
  { label: "Sepsis", short: "SEP", topic: "Sepsis & Septic Shock", system: "Infectious Disease" },
];
