// src/validation/noticeRequest.js
const ISODate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
import { z } from 'zod';



export const DeliveryMethodSchema = z.enum([
  'PERSONAL',
  'MAIL',
  'POSTING_MAIL',
]);

export const NoticeTypeSchema = z.enum([
  'OWNER_MOVE_IN_120_DAY',
]);

export const JurisdictionSchema = z.enum([
  'CA-SACRAMENTO',
]);

export const NoticeRequestSchema = z.object({
  jurisdictionId: JurisdictionSchema,
  noticeType: NoticeTypeSchema,
  serviceDate: ISODate,
  occupancyDate: ISODate,
  deliveryMethod: DeliveryMethodSchema,
  ownerIsNaturalPerson: z.boolean(),
  ownershipPercent: z.number().int().min(0).max(100),

  deliveryMethod: DeliveryMethodSchema,

  ownerIsNaturalPerson: z.boolean(),

  ownershipPercent: z
    .number()
    .min(0, 'ownershipPercent must be >= 0')
    .max(100, 'ownershipPercent must be <= 100'),
    
    }).superRefine((data, ctx) => {
  if (data.serviceDate > data.occupancyDate) {
    ctx.addIssue({
      path: ['occupancyDate'],
      message: 'occupancyDate must be on or after serviceDate',
    });
  }

  // Optional production guard (you can relax later):
  const today = new Date().toISOString().slice(0, 10);
  if (data.serviceDate > today) {
    ctx.addIssue({
      path: ['serviceDate'],
      message: 'serviceDate cannot be in the future',
    });
  }
});