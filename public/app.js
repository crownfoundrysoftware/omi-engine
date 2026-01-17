// public/app.js

const form = document.getElementById("noticeForm");
const resultEl = document.getElementById("result");
const printBtn = document.getElementById("printBtn");
const APP_VERSION = "CF-OMI-APP v1.0.0";



function getBuildId() {
  const meta = document.querySelector('meta[name="build-id"]');
  return meta?.content || "DEV-BUILD";
}
const BUILD_ID = getBuildId();

document.addEventListener("DOMContentLoaded", () => {
const wmBuild = document.getElementById("wmBuild");
if (wmBuild) {
  wmBuild.textContent = BUILD_ID;
}
const pitchVersion = document.getElementById("pitchVersion");
if (pitchVersion) {
  pitchVersion.textContent = `${APP_VERSION} • Build ${BUILD_ID}`;
}
  const buildMeta = document.getElementById("buildMeta");
  const jurBadge = document.getElementById("jurBadge");

  if (jurBadge) {
    jurBadge.textContent =
      document.body.dataset.jurisdiction || "UNKNOWN";
  }

  if (buildMeta) {
    buildMeta.textContent = `Build ${getBuildId()}`;
  }

   if (pfBuild) {
    pfBuild.textContent = getBuildId();
  }
});


function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtVal(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function renderIssues(issues) {
  if (!issues || issues.length === 0) return "";
  return `
    <div class="card danger">
      <h3>Validation Issues</h3>
      <ul>
        ${issues.map((i) => `<li><code>${esc(i.path)}</code>: ${esc(i.message)}</li>`).join("")}
      </ul>
    </div>
  `;
}

/**
 * Step 1: Tone upgrade (boringly professional)
 * - Eligible => “Eligible — 120-Day Owner Move-In Notice May Be Served”
 * - Not Eligible => “Not Eligible — Owner Move-In Not Permitted”
 */
function renderEligibility(result) {
  const eligible = result?.eligibility?.eligible === true;
  const reasons = result?.eligibility?.reasons || [];

  if (eligible) {
    return `<div class="banner ok">Eligible — 120-Day Owner Move-In Notice May Be Served</div>`;
  }

  return `
    <div class="banner bad">Not Eligible — Owner Move-In Not Permitted</div>
    <div class="card danger">
      <h3>Reasons</h3>
      <ul>
        ${reasons
          .map((r) => `<li><strong>${esc(r.code)}</strong>: ${esc(r.message)}</li>`)
          .join("")}
      </ul>
    </div>
  `;
}

function renderKeyDates(result) {
  return `
    <div class="card">
      <h3>Calculated Dates</h3>
      <div class="grid">
        <div><div class="label">Effective Service Date</div><div class="value">${esc(fmtVal(result.effectiveServiceDate))}</div></div>
        <div><div class="label">Earliest Termination Date</div><div class="value">${esc(fmtVal(result.earliestTerminationDate))}</div></div>
        <div><div class="label">Notice Period Days</div><div class="value">${esc(fmtVal(result.noticePeriodDays))}</div></div>
      </div>
    </div>
  `;
}

function renderDetails(result) {
  return `
    <div class="card">
      <h3>Case Inputs</h3>
      <div class="grid">
        <div><div class="label">Jurisdiction</div><div class="value">${esc(fmtVal(result.jurisdictionId))}</div></div>
        <div><div class="label">Notice Type</div><div class="value">${esc(fmtVal(result.noticeType))}</div></div>
        <div><div class="label">Service Date</div><div class="value">${esc(fmtVal(result.serviceDate))}</div></div>
        <div><div class="label">Occupancy Date</div><div class="value">${esc(fmtVal(result.occupancyDate))}</div></div>
        <div><div class="label">Delivery Method</div><div class="value">${esc(fmtVal(result.deliveryMethod))}</div></div>
        <div><div class="label">Owner Natural Person</div><div class="value">${esc(fmtVal(result.ownerIsNaturalPerson))}</div></div>
        <div><div class="label">Ownership Percent</div><div class="value">${esc(fmtVal(result.ownershipPercent))}</div></div>
      </div>
    </div>
  `;
}

function renderClauses(result) {
  const clauses = result.requiredClauses || [];
  if (clauses.length === 0) return "";

  return `
    <div class="card">
      <h3>Required Clauses</h3>
      <ul>
        ${clauses.map((c) => `<li><strong>${esc(c.id)}</strong>: ${esc(c.text)}</li>`).join("")}
      </ul>
    </div>
  `;
}

/**
 * Step 2: Audit behind <details> toggle (collapsed by default)
 * Label: “Show Compliance Audit”
 */
function renderAudit(result) {
  const audit = result.audit || [];
  // Inject BUILD_ID as a first-class audit row
const buildAuditRow = {
  step: "BUILD_ID",
  value: getBuildId(),
  ruleId: "SYSTEM.BUILD"
};
  if (audit.length === 0) return "";

  // Pull LEGAL_AUTHORITY_SUMMARY out of the table
  const authorityRowIndex = audit.findIndex((a) => a.step === "LEGAL_AUTHORITY_SUMMARY");
  const authorityRow = authorityRowIndex >= 0 ? audit[authorityRowIndex] : null;

  const tableRows = [
  buildAuditRow,
  ...audit.filter((a) => a.step !== "LEGAL_AUTHORITY_SUMMARY")
];

  const authorityText = authorityRow ? esc(fmtVal(authorityRow.value)) : "";
  const authorityRuleId = authorityRow ? esc(authorityRow.ruleId || "") : "";

  return `
    <details class="details audit-card">
      <summary class="details__summary">Show Compliance Audit</summary>
      <div class="details__body">
        <table class="audit-table">
          <colgroup>
            <col class="audit-col-step" />
            <col class="audit-col-value" />
            <col class="audit-col-rule" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">Value</th>
              <th scope="col">Rule ID</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows
              .map(
                (a) => `
                <tr>
                  <td class="audit-step"><code class="rule-id">${esc(a.step)}</code></td>
                  <td class="audit-value">${esc(fmtVal(a.value))}</td>
                  <td class="audit-rule"><code class="rule-id">${esc(a.ruleId)}</code></td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>

        ${
          authorityRow
            ? `
          <div class="audit-addendum">
            <div class="audit-addendum__title">Addendum — Legal Authority Summary</div>
            <div class="audit-addendum__meta">
              <span class="audit-addendum__label">Rule ID:</span>
              <code class="rule-id audit-addendum__rule">${authorityRuleId}</code>
            </div>
            <div class="audit-addendum__text">${authorityText}</div>
          </div>
        `
            : ""
        }
      </div>
    </details>
  `;
}

function renderCitations(result) {
  const citations = result.citations || [];
  if (citations.length === 0) return "";

  // Build a single authority sentence programmatically
  const authorityLine = (() => {
    const parts = citations.map((c) => {
      const section = c.section ? ` ${c.section}` : "";
      const effective =
        c.effectiveFrom ? ` (effective ${c.effectiveFrom})` : "";
      return `${c.authority}${section}${effective}`;
    });

    return `
      <p class="authority-line">
        This calculation is lawful because ${parts.join(
          ", "
        )} collectively authorize it.
      </p>
    `;
  })();

  return `
    <div class="card">
      <h3>Legal Authority</h3>
      ${authorityLine}
      <ul>
        ${citations
          .map(
            (c) => `
            <li>
              <strong>${esc(c.authority)} ${esc(c.section || "")}</strong>
              ${c.url ? `— <a href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">Official source</a>` : ""}
              <div class="citation-summary">${esc(c.summary)}</div>
            </li>
          `
          )
          .join("")}
      </ul>
    </div>
  `;
}

/**
 * Step 3: Subtle disclaimer at bottom of successful results
 */
function renderDisclaimer() {
  return `
    <p class="disclaimer">
      This notice is generated based on current Sacramento and California law. Verify facts before service.
    </p>
  `;
}

function stableStringify(obj) {
  // Stable key order so the same data always hashes the same.
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

async function sha256Hex(input) {
  const enc = new TextEncoder();
  const bytes = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function nowLocalTimestamp() {
  const d = new Date();
  // e.g., 2026-01-16 02:14
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function updatePrintFooter(casePayload) {
  const footer = document.getElementById("printFooter");
  const gen = document.getElementById("pfGenerated");
  const hashEl = document.getElementById("pfHash");
  if (!footer || !gen || !hashEl) return;

  // Only hash what you consider “material facts” (inputs + computed outputs)
  const material = {
  buildId: BUILD_ID,
  appVersion: APP_VERSION,
  case: casePayload
};

const canonical = stableStringify(material);
const hash = await sha256Hex(canonical);

  gen.textContent = nowLocalTimestamp();
  // short display, but still uniquely useful; keep full in title for copy
  hashEl.textContent = hash.slice(0, 16) + "…" + hash.slice(-16);
  hashEl.title = hash;

  footer.style.display = "block";
}

function setResultHtml(html) {
  resultEl.innerHTML = html;
}

function showPrintButton(show) {
  printBtn.style.display = show ? "inline-block" : "none";
}

printBtn.addEventListener("click", () => window.print());

function initBrandMeta() {
  const jur = document.body?.dataset?.jurisdiction || "DEFAULT";

  const jurBadge = document.getElementById("jurBadge");
  if (jurBadge) jurBadge.textContent = jur.replaceAll("_", " ");

  const buildMeta = document.getElementById("buildMeta");
  if (buildMeta) buildMeta.textContent = `${APP_VERSION} • build ${BUILD_ID}`;
}

function initFooterScrollAnimation() {
  const footer = document.getElementById("pitchFooterBar");
  if (!footer) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) return;

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const y = window.scrollY || 0;
      // Very subtle: lift when user is actively moving (or past a threshold)
      if (y > 10) footer.classList.add("footer--lift");
      else footer.classList.remove("footer--lift");
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

document.addEventListener("DOMContentLoaded", () => {
  initBrandMeta();
  initFooterScrollAnimation();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // critical: stops the page refresh

  showPrintButton(false);
  setResultHtml(`<div class="card"><h3>Generating…</h3><p>Please wait.</p></div>`);

  const fd = new FormData(form);

  const payload = {
    jurisdictionId: "CA-SACRAMENTO",
    noticeType: "OWNER_MOVE_IN_120_DAY",
    serviceDate: fd.get("serviceDate"),
    occupancyDate: fd.get("occupancyDate"),
    deliveryMethod: fd.get("deliveryMethod"),
    ownerIsNaturalPerson: fd.get("ownerIsNaturalPerson") === "true",
    ownershipPercent: Number(fd.get("ownershipPercent")),
  };

  try {
    const resp = await fetch("/v1/notice/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!data.ok) {
      setResultHtml(`
        <div class="banner bad">Error</div>
        <div class="card danger">
          <h3>${esc(data.error || "Request failed")}</h3>
          ${data.detail ? `<p>${esc(data.detail)}</p>` : ""}
          ${renderIssues(data.issues)}
        </div>
      `);
      return;
    }

    const result = data.result;

    await updatePrintFooter({
  input: payload,
  output: result,
  version: APP_VERSION,
  build: BUILD_ID,
});

/* ✅ Jurisdiction theming hook (CSS reads body[data-jurisdiction]) */
document.body.dataset.jurisdiction = result.jurisdictionId || payload.jurisdictionId || "DEFAULT";

// Professional render (not raw JSON)
setResultHtml(`
  ${renderEligibility(result)}
  ${renderKeyDates(result)}
  ${renderDetails(result)}
  ${renderClauses(result)}
  ${renderAudit(result)}
  ${renderCitations(result)}
  ${renderDisclaimer()}
`);

/* ✅ Print checksum/footer hash (must be called after result exists) */
await updatePrintFooter({
  inputs: {
    jurisdictionId: result.jurisdictionId ?? payload.jurisdictionId ?? null,
    noticeType: result.noticeType ?? payload.noticeType ?? null,
    serviceDate: result.serviceDate ?? payload.serviceDate ?? null,
    occupancyDate: result.occupancyDate ?? payload.occupancyDate ?? null,
    deliveryMethod: result.deliveryMethod ?? payload.deliveryMethod ?? null,
    ownerIsNaturalPerson: result.ownerIsNaturalPerson ?? payload.ownerIsNaturalPerson ?? null,
    ownershipPercent: result.ownershipPercent ?? payload.ownershipPercent ?? null,
  },
  outputs: {
    effectiveServiceDate: result.effectiveServiceDate ?? null,
    earliestTerminationDate: result.earliestTerminationDate ?? null,
    noticePeriodDays: result.noticePeriodDays ?? null,
    eligibility: result.eligibility ?? null,
  },
  audit: result.audit ?? null,
  citations: result.citations ?? null,
});

showPrintButton(true);

    showPrintButton(true);
  } catch (err) {
    setResultHtml(`
      <div class="banner bad">Network / Server Error</div>
      <div class="card danger">
        <p>${esc(String(err))}</p>
      </div>
    `);
  }
});