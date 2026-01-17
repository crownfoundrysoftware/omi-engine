// src/domain/computeNotice.js

import { getRuleSet } from '../rules/index.js';

export function computeNotice(request) {
  const compute = getRuleSet(request.jurisdictionId, request.noticeType);

  if (!compute) {
    return {
      ok: false,
      error: 'Unsupported jurisdictionId/noticeType combination',
    };
  }

  const result = compute(request);

  return {
    ok: true,
    result,
  };
}