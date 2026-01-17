// src/rules/index.js

import { computeOwnerMoveIn120Day_CA_SACRAMENTO } from './CA-SACRAMENTO/ownerMoveIn120Day.js';

export function getRuleSet(jurisdictionId, noticeType) {
  if (jurisdictionId === 'CA-SACRAMENTO' && noticeType === 'OWNER_MOVE_IN_120_DAY') {
    return computeOwnerMoveIn120Day_CA_SACRAMENTO;
  }

  return null;
}