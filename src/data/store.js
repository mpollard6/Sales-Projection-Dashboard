'use client';
import rawData from './pipeline.json';

const LS_KEY = 'harbinger_data_overrides';
const LS_GOALS_KEY = 'harbinger_goals';
const LS_REP_PROJECTIONS_KEY = 'harbinger_rep_projections';

function loadOverrides() {
  if (typeof window === 'undefined') return { assessDeals: {}, partnerDeals: {}, newAssessDeals: [], newPartnerDeals: [] };
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { assessDeals: {}, partnerDeals: {}, newAssessDeals: [], newPartnerDeals: [] }; }
  catch { return { assessDeals: {}, partnerDeals: {}, newAssessDeals: [], newPartnerDeals: [] }; }
}

function saveOverrides(o) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(o));
}

export function getMergedAssessDeals() {
  const o = loadOverrides();
  const merged = rawData.assessDeals.map(d => o.assessDeals[d.id] ? { ...d, ...o.assessDeals[d.id] } : d);
  return [...merged, ...(o.newAssessDeals || [])];
}

export function getMergedPartnerDeals() {
  const o = loadOverrides();
  const merged = rawData.partnerDeals.map(d => o.partnerDeals[d.id] ? { ...d, ...o.partnerDeals[d.id] } : d);
  return [...merged, ...(o.newPartnerDeals || [])];
}

export function updateDeal(id, changes) {
  const o = loadOverrides();
  const isAssess = id.startsWith('A-') || id.startsWith('NA-');
  const isNew = id.startsWith('NA-') || id.startsWith('NP-');

  if (isNew) {
    const list = isAssess ? 'newAssessDeals' : 'newPartnerDeals';
    const idx = (o[list] || []).findIndex(d => d.id === id);
    if (idx >= 0) o[list][idx] = { ...o[list][idx], ...changes };
  } else {
    const key = isAssess ? 'assessDeals' : 'partnerDeals';
    o[key][id] = { ...(o[key][id] || {}), ...changes };
  }
  saveOverrides(o);
}

export function addNewDeal(type, deal) {
  const o = loadOverrides();
  const list = type === 'assess' ? 'newAssessDeals' : 'newPartnerDeals';
  if (!o[list]) o[list] = [];
  const prefix = type === 'assess' ? 'NA-' : 'NP-';
  const maxId = o[list].reduce((m, d) => {
    const n = parseInt(d.id.replace(prefix, ''));
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  deal.id = `${prefix}${String(maxId + 1).padStart(3, '0')}`;
  o[list].push(deal);
  saveOverrides(o);
  return deal.id;
}

export function resetOverrides() {
  if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY);
}

export function hasOverrides() {
  const o = loadOverrides();
  return Object.keys(o.assessDeals || {}).length > 0 ||
    Object.keys(o.partnerDeals || {}).length > 0 ||
    (o.newAssessDeals || []).length > 0 ||
    (o.newPartnerDeals || []).length > 0;
}

export function getOverrideSummary() {
  const o = loadOverrides();
  return {
    editedAssess: Object.keys(o.assessDeals || {}).length,
    editedPartner: Object.keys(o.partnerDeals || {}).length,
    newAssess: (o.newAssessDeals || []).length,
    newPartner: (o.newPartnerDeals || []).length,
  };
}

// Goals
export function loadGoals() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_GOALS_KEY)) || {}; } catch { return {}; }
}

export function saveGoals(goals) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_GOALS_KEY, JSON.stringify(goals));
}

// Rep projections
export function loadRepProjections() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_REP_PROJECTIONS_KEY)) || {}; } catch { return {}; }
}

export function saveRepProjections(projections) {
  if (typeof window !== 'undefined') localStorage.setItem(LS_REP_PROJECTIONS_KEY, JSON.stringify(projections));
}
