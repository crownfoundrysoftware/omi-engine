// src/routes/notice.js

import { NoticeRequestSchema } from "../validation/noticeRequest.js";
import { computeNotice } from "../domain/computeNotice.js";
import { readJsonBody, sendJson } from "../utils/http.js";

// Output contract enforcement (internal)
import { NoticeComputeResponseV1Schema } from "../contracts/noticeResult.v1.js";

// Robustness toggle (default: off unless explicitly enabled)
const ENFORCE_CONTRACT = process.env.ENFORCE_CONTRACT === "true";

export async function handleNoticeCompute(req, res, url) {
  if (req.method !== "POST" || url.pathname !== "/v1/notice/compute") return false;

  let body;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    sendJson(res, 400, {
      ok: false,
      error: "Invalid JSON (JavaScript Object Notation)",
      detail: String(err),
    });
    return true;
  }

  const parsed = NoticeRequestSchema.safeParse(body);
  if (!parsed.success) {
    sendJson(res, 422, {
      ok: false,
      error: "Validation failed",
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return true;
  }

  const request = parsed.data;

  let computed;
  try {
    computed = computeNotice(request);
  } catch (err) {
    sendJson(res, 500, {
      ok: false,
      error: "Computation failed",
      detail: String(err),
    });
    return true;
  }

  // Unsupported jurisdictionId/noticeType combination
  if (!computed.ok) {
    // Keep current behavior: 422 for unsupported combos
    sendJson(res, 422, computed);
    return true;
  }

  // Canonical success envelope
  const responsePayload = {
    ok: true,
    result: computed.result,
  };

  // Optional internal contract assertion (fail loudly if we ever drift)
  if (ENFORCE_CONTRACT) {
    const contractCheck = NoticeComputeResponseV1Schema.safeParse(responsePayload);
    if (!contractCheck.success) {
      sendJson(res, 500, {
        ok: false,
        error: "Internal contract mismatch",
        issues: contractCheck.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return true;
    }
  }

  sendJson(res, 200, responsePayload);
  return true;
}