// src/rules/CA-SACRAMENTO/ownerMoveIn120Day.js

import { resolveAuthorities } from "../../authority/CA-SACRAMENTO/ownerMoveIn120Day.authorities.js";

function addDaysISO(isoDateString, days) {
  const d = new Date(isoDateString);
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

/**
 * Delivery method hardening (Phase 2B.3.3)
 *
 * Model:
 * - PERSONAL: effective same day
 * - MAIL: +5 calendar days (CCP § 1013)
 * - POSTING_MAIL: effective same day (CCP § 1162(a)(3) + Walters v. Meyers)
 */
function computeEffectiveServiceMeta({ serviceDateISO, deliveryMethod }) {
  if (deliveryMethod === "PERSONAL") {
    return {
      effectiveServiceDate: serviceDateISO,
      ruleId: "RULE_EFFECTIVE_PERSONAL_CCP_1162_A1",
      authorityIds: ["CA_CCP_1162"],
    };
  }

  if (deliveryMethod === "MAIL") {
    return {
      effectiveServiceDate: addDaysISO(serviceDateISO, 5),
      ruleId: "RULE_EFFECTIVE_MAIL_CCP_1013_A_PLUS_5_CALENDAR_DAYS",
      authorityIds: ["CA_CCP_1013"],
    };
  }

  if (deliveryMethod === "POSTING_MAIL") {
    return {
      effectiveServiceDate: serviceDateISO,
      ruleId: "RULE_EFFECTIVE_POSTING_MAIL_CCP_1162_A3_WALTERS_V_MEYERS",
      authorityIds: ["CA_CCP_1162", "CASE_WALTERS_V_MEYERS_1990"],
    };
  }

  // Defensive fallback (should be unreachable due to upstream validation)
  return {
    effectiveServiceDate: serviceDateISO,
    ruleId: "RULE_EFFECTIVE_UNKNOWN_FALLBACK",
    authorityIds: [],
  };
}

const REQUIRED_CLAUSES_PLACEHOLDER = [
  {
    id: "CLAUSE_OMI_INTENT",
    text: "Owner intends to occupy the unit as a primary residence. (Placeholder clause text)",
  },
];

/**
 * Derived authority sentence (Phase 2B.3 evidentiary audit)
 * IMPORTANT: must be generated from citations[] to avoid drift.
 */
function buildAuthoritySummary(citations) {
  if (!Array.isArray(citations) || citations.length === 0) return null;

  // Stable ordering: authority → section
  const sorted = [...citations].sort((a, b) => {
    if (a.authority !== b.authority) {
      return a.authority.localeCompare(b.authority);
    }
    return a.section.localeCompare(b.section);
  });

  const parts = sorted.map((c) => {
    const eff = c.effectiveFrom ? ` (effective ${c.effectiveFrom})` : "";
    return `${c.authority} ${c.section}${eff}`;
  });

  return (
    "This calculation is lawful because " +
    parts.join(", ") +
    " collectively authorize it."
  );
}

function buildAudit({
  serviceDateISO,
  occupancyDateISO,
  deliveryMethod,
  noticePeriodDays,
  effectiveServiceDate,
  effectiveServiceRuleId,
  earliestTerminationDate,
  ownerNaturalPersonPass,
  ownershipThresholdPass,
  citations, // NEW
}) {
  return [
    { step: "SERVICE_DATE_INPUT", value: serviceDateISO, ruleId: "RULE_SERVICE_DATE_USER_INPUT" },
    { step: "OCCUPANCY_DATE_INPUT", value: occupancyDateISO, ruleId: "RULE_OCCUPANCY_DATE_USER_INPUT" },
    { step: "DELIVERY_METHOD_INPUT", value: deliveryMethod, ruleId: "RULE_DELIVERY_METHOD_USER_INPUT" },

    { step: "ELIGIBILITY_OWNER_NATURAL_PERSON", value: ownerNaturalPersonPass ? "PASS" : "FAIL", ruleId: "RULE_OWNER_NATURAL_PERSON_GATE" },
    { step: "ELIGIBILITY_OWNERSHIP_THRESHOLD", value: ownershipThresholdPass ? "PASS" : "FAIL", ruleId: "RULE_OWNERSHIP_THRESHOLD_GATE" },

    { step: "EFFECTIVE_SERVICE_DATE", value: effectiveServiceDate, ruleId: effectiveServiceRuleId },
    { step: "NOTICE_PERIOD_DAYS", value: noticePeriodDays, ruleId: "RULE_NOTICE_PERIOD_120_PLACEHOLDER" },
    { step: "EARLIEST_TERMINATION_DATE", value: earliestTerminationDate, ruleId: "RULE_ADD_DAYS_CALENDAR_UTC" },

    // NEW: evidentiary summary row (derived from citations)
    {
      step: "LEGAL_AUTHORITY_SUMMARY",
      value: buildAuthoritySummary(citations),
      ruleId: "RULE_AUTHORITY_COMPOSITE_DERIVED",
    },
  ];
}

export function computeOwnerMoveIn120Day_CA_SACRAMENTO(request) {
  const serviceDateISO = request.serviceDate;
  const occupancyDateISO = request.occupancyDate;
  const deliveryMethod = request.deliveryMethod;

  const noticePeriodDays = 120; // still placeholder until we harden Sacramento + state text fully

  // Eligibility gates
  const ownerNaturalPersonPass = request.ownerIsNaturalPerson === true;

  const ownershipPercentNum =
    typeof request.ownershipPercent === "number" ? request.ownershipPercent : Number.NaN;
  const ownershipThresholdPass = Number.isFinite(ownershipPercentNum) && ownershipPercentNum >= 51;

  const reasons = [];
  if (!ownerNaturalPersonPass) {
    reasons.push({ code: "OWNER_NOT_NATURAL_PERSON", message: "Owner must be a natural person." });
  }
  if (!ownershipThresholdPass) {
    reasons.push({
      code: "OWNERSHIP_BELOW_THRESHOLD",
      message: "Ownership percent must meet the threshold for Owner Move-In.",
    });
  }

  const eligible = reasons.length === 0;

  // Effective service + authorities (conditional)
  const effectiveMeta = eligible
    ? computeEffectiveServiceMeta({ serviceDateISO, deliveryMethod })
    : {
        effectiveServiceDate: null,
        ruleId: `RULE_EFFECTIVE_${deliveryMethod}_SKIPPED_NOT_ELIGIBLE`,
        authorityIds: [],
      };

  const effectiveServiceDate = effectiveMeta.effectiveServiceDate;

  const earliestTerminationDate = eligible
    ? addDaysISO(effectiveServiceDate, noticePeriodDays)
    : null;

  const requiredClauses = eligible ? REQUIRED_CLAUSES_PLACEHOLDER : [];

  // Baseline authorities always relevant to this notice type + jurisdiction,
  // plus method-specific service authorities.
  const authorityIds = [
    "SAC_CODE_5_156_090",
    "CA_CIV_1946_2",
    ...effectiveMeta.authorityIds,
  ];

  const citations = resolveAuthorities(authorityIds);

  // Audit must be built AFTER citations exist (so summary is derivable)
  const audit = buildAudit({
    serviceDateISO,
    occupancyDateISO,
    deliveryMethod,
    noticePeriodDays,
    effectiveServiceDate,
    effectiveServiceRuleId: effectiveMeta.ruleId,
    earliestTerminationDate,
    ownerNaturalPersonPass,
    ownershipThresholdPass,
    citations,
  });

  return {
    jurisdictionId: request.jurisdictionId,
    noticeType: request.noticeType,

    serviceDate: serviceDateISO,
    occupancyDate: occupancyDateISO,
    deliveryMethod,
    ownerIsNaturalPerson: request.ownerIsNaturalPerson,
    ownershipPercent: request.ownershipPercent,

    noticePeriodDays,
    effectiveServiceDate,
    earliestTerminationDate,

    requiredClauses,

    eligibility: { eligible, reasons },
    audit,
    citations,
  };
}