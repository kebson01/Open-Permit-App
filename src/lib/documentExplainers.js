/**
 * lib/documentExplainers.js — what a checklist item actually is.
 *
 * Cities spell the same document many different ways: "Contract with total job
 * cost", "Signed contract with total job cost" and "Contract/Agreement with
 * total job cost" are one thing. Matching explainers by exact name could only
 * ever cover a handful, so each explainer carries `match_patterns` — lowercase
 * substrings — and the highest-priority pattern that matches wins.
 *
 * Priority is specificity: a named county form beats a general concept, and an
 * exact legacy name beats both.
 */
import { useEffect, useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

const SB_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

let _cache = null;
let _inflight = null;

export async function loadDocumentExplainers() {
  if (_cache) return _cache;
  if (_inflight) return _inflight;

  _inflight = fetch(
    `${SUPABASE_URL}/rest/v1/document_plain_english?select=id,official_name,plain_name,plain_description,where_to_get,download_url,match_patterns,priority&order=priority.desc`,
    { headers: SB_HEADERS }
  )
    .then(r => (r.ok ? r.json() : []))
    .then(data => {
      _cache = Array.isArray(data) ? data : [];
      _inflight = null;
      return _cache;
    })
    .catch(() => { _inflight = null; return []; });

  return _inflight;
}

export function useDocumentExplainers() {
  const [explainers, setExplainers] = useState(_cache || []);

  useEffect(() => {
    if (_cache) { setExplainers(_cache); return; }
    let alive = true;
    loadDocumentExplainers().then(e => { if (alive) setExplainers(e); });
    return () => { alive = false; };
  }, []);

  return explainers;
}

/**
 * Best explainer for a checklist item, or null when nothing matches.
 * Assumes `explainers` arrives ordered by priority descending.
 */
export function explainDocument(documentName, explainers = []) {
  if (!documentName) return null;
  const name = documentName.toLowerCase();

  for (const e of explainers) {
    const patterns = Array.isArray(e.match_patterns) ? e.match_patterns : [];
    if (patterns.some(p => p && name.includes(p))) return e;
  }
  return null;
}
