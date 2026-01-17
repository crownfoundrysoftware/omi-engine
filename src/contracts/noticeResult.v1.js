// src/contracts/noticeResult.v1.js

import { z } from "zod";

// Strict YYYY-MM-DD (ISO 8601 calendar date)
export const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD");

export const DeliveryMethodSchema = z.enum(["PERSONAL", "MAIL", "POSTING_MAIL"]);

export const EligibilityReasonSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

export const EligibilitySchema = z.object({
  eligible: z.boolean(),
  reasons: z.array(EligibilityReasonSchema),
});

export const AuditEntrySchema = z.object({
  step: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ruleId: z.string().min(1),
});

export const CitationSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const RequiredClauseSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

// This is the canonical "result" payload shape (inside { ok: true, result })
export const NoticeComputeResultV1Schema = z
  .object({
    jurisdictionId: z.string().min(1),
    noticeType: z.string().min(1),

    serviceDate: ISODate,
    occupancyDate: ISODate,
    deliveryMethod: DeliveryMethodSchema,

    ownerIsNaturalPerson: z.boolean(),
    ownershipPercent: z.number(),

    noticePeriodDays: z.number().int().positive(),

    effectiveServiceDate: ISODate.nullable(),
    earliestTerminationDate: ISODate.nullable(),

    requiredClauses: z.array(RequiredClauseSchema),

    eligibility: EligibilitySchema,

    audit: z.array(AuditEntrySchema),
    citations: z.array(CitationSchema),
  })
  .strict();

// This is the full HTTP 200 response envelope
export const NoticeComputeResponseV1Schema = z
  .object({
    ok: z.literal(true),
    result: NoticeComputeResultV1Schema,
  })
  .strict();