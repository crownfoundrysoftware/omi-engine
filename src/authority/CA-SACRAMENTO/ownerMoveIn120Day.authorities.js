// src/authority/CA-SACRAMENTO/ownerMoveIn120Day.authorities.js

/**
 * Authority registry for:
 *   - Jurisdiction: CA-SACRAMENTO
 *   - Notice type: OWNER_MOVE_IN_120_DAY
 *
 * HARDENED:
 * - Official URLs added
 * - Effective dates locked
 * - Scope limited strictly to notice validity + timing
 */

export const AUTHORITIES_OMI_120_SAC = Object.freeze({
  /**
   * Sacramento Tenant Protection and Relief Act
   * Owner Move-In provisions
   */
  SAC_CODE_5_156_090: {
    id: "SAC_CODE_5_156_090",
    authority: "Sacramento City Code",
    section: "§ 5.156.090",
    effectiveFrom: "2019-09-12",
    url: "https://codelibrary.amlegal.com/codes/sacramentoca/latest/sacramento_ca/0-0-0-16268",
    summary:
      "Sacramento Tenant Protection and Relief Act provision governing owner move-in evictions, including minimum 120 days’ written notice, ownership thresholds, and natural-person requirements.",
  },

  /**
   * California Tenant Protection Act (Just Cause)
   * Owner / Owner-Relative Occupancy
   */
  CA_CIV_1946_2: {
    id: "CA_CIV_1946_2",
    authority: "California Civil Code",
    section: "§ 1946.2",
    effectiveFrom: "2024-04-01",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1946.2",
    summary:
      "Statewide just-cause termination framework requiring a lawful no-fault reason for eviction after 12 months’ tenancy, including owner occupancy as a primary residence.",
  },

  /**
   * Service of Notices (Unlawful Detainer Context)
   */
  CA_CCP_1162: {
    id: "CA_CCP_1162",
    authority: "California Code of Civil Procedure",
    section: "§ 1162",
    effectiveFrom: "2011-01-01",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1162",
    summary:
      "Authorizes personal service, substituted service with mailing, and posting plus mailing for service of notices in unlawful detainer proceedings.",
  },

  /**
   * Mail Service Extension Rule
   */
  CA_CCP_1013: {
    id: "CA_CCP_1013",
    authority: "California Code of Civil Procedure",
    section: "§ 1013",
    effectiveFrom: "1969-07-01",
    url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=1013",
    summary:
      "Extends prescribed periods by five calendar days when service is made by mail within California.",
  },

  /**
   * Case Law — Posting + Mailing Effectiveness
   */
  CASE_WALTERS_V_MEYERS_1990: {
    id: "CASE_WALTERS_V_MEYERS_1990",
    authority: "California Court of Appeal (case law)",
    section: "Walters v. Meyers (1990) 226 Cal.App.3d Supp. 15",
    effectiveFrom: "1990-01-01",
    url: "https://law.justia.com/cases/california/court-of-appeal/3d/226/supp15.html",
    summary:
      "Holds that service by posting and mailing is effective on the date the notice is posted and mailed, not five days later.",
  },
});

/**
 * Helper: resolve a list of authority IDs into full authority objects.
 * Throws if an authority ID is missing (prevents silent drift).
 */
export function resolveAuthorities(authorityIds) {
  const out = [];
  for (const id of authorityIds) {
    const a = AUTHORITIES_OMI_120_SAC[id];
    if (!a) {
      throw new Error(`Unknown authorityId: ${id}`);
    }
    out.push(a);
  }
  return out;
}