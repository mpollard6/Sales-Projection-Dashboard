import rawData from './pipeline.json';

const REPS = ["Troy Williams", "David Harbin", "Elijah Lee", "Stephen Mitchell"];
const COMMISSION_RATES = { Warm: 0.025, Cold: 0.035, "Brave Digital": 0.035 };
const PIPELINES = ["Warm", "Cold", "Brave Digital"];

function num(v) { return typeof v === 'number' && !isNaN(v) ? v : 0; }
function monthsBetween(d1, d2) {
  if (!d1 || !d2) return null;
  const a = new Date(d1), b = new Date(d2);
  if (isNaN(a) || isNaN(b)) return null;
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth());
}
function getQuarter(dateStr) {
  if (!dateStr) return null;
  const m = new Date(dateStr).getMonth();
  return Math.floor(m / 3) + 1;
}
function getYear(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}
function getMonth(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).getMonth() + 1;
}

// Core data accessors
function getAssessDeals(rep) {
  if (!rep || rep === 'admin') return rawData.assessDeals;
  return rawData.assessDeals.filter(d => d.owner === rep);
}
function getPartnerDeals(rep) {
  if (!rep || rep === 'admin') return rawData.partnerDeals;
  return rawData.partnerDeals.filter(d => d.owner === rep);
}
function getAssessPreds(rep) {
  const ids = new Set(getAssessDeals(rep).map(d => d.id));
  return rawData.assessPreds.filter(p => ids.has(p.dealId));
}
function getPartnerPreds(rep) {
  const ids = new Set(getPartnerDeals(rep).map(d => d.id));
  return rawData.partnerPreds.filter(p => ids.has(p.dealId));
}

function getOpenDeals(rep, forecastOnly = false) {
  let a = getAssessDeals(rep).filter(d => d.status === 'Open');
  let p = getPartnerDeals(rep).filter(d => d.status === 'Open');
  if (forecastOnly) {
    a = a.filter(d => d.inCurrentForecast);
    p = p.filter(d => d.inCurrentForecast);
  }
  return { assess: a, partner: p };
}
function getClosedDeals(rep, filters) {
  let a = getAssessDeals(rep).filter(d => d.status === 'Closed');
  let p = getPartnerDeals(rep).filter(d => d.status === 'Closed');
  if (filters) {
    if (filters.year) {
      a = a.filter(d => getYear(d.actualCloseDate) === filters.year);
      p = p.filter(d => getYear(d.actualCloseDate) === filters.year);
    }
    if (filters.quarter) {
      a = a.filter(d => getQuarter(d.actualCloseDate) === filters.quarter);
      p = p.filter(d => getQuarter(d.actualCloseDate) === filters.quarter);
    }
    if (filters.month) {
      a = a.filter(d => getMonth(d.actualCloseDate) === filters.month);
      p = p.filter(d => getMonth(d.actualCloseDate) === filters.month);
    }
  }
  return { assess: a, partner: p };
}

// Add months open to open deals
const NOW = "2026-03-10";
function withMonthsOpen(deals) {
  return deals.map(d => ({
    ...d,
    monthsOpen: monthsBetween(d.dateEntered, NOW),
  }));
}

function getRepStats(rep, filters) {
  const ad = getAssessDeals(rep);
  const pd = getPartnerDeals(rep);
  const closed = getClosedDeals(rep, filters);
  const aLost = ad.filter(d => d.status === 'Lost');
  const pLost = pd.filter(d => d.status === 'Lost');
  const aOpen = ad.filter(d => d.status === 'Open');
  const pOpen = pd.filter(d => d.status === 'Open');

  const aClosedRev = closed.assess.reduce((s, d) => s + num(d.actualValue), 0);
  const pClosedRev = closed.partner.reduce((s, d) => s + num(d.actualValue), 0);
  const aResolved = closed.assess.length + aLost.length;
  const pResolved = closed.partner.length + pLost.length;

  return {
    rep: rep === 'admin' ? 'All Reps' : rep,
    assessTotal: ad.length, assessClosed: closed.assess.length, assessLost: aLost.length, assessOpen: aOpen.length,
    assessWinRate: aResolved > 0 ? closed.assess.length / aResolved : 0,
    assessClosedRevenue: aClosedRev,
    assessAvgDeal: closed.assess.length > 0 ? aClosedRev / closed.assess.length : 0,
    partnerTotal: pd.length, partnerClosed: closed.partner.length, partnerLost: pLost.length, partnerOpen: pOpen.length,
    partnerWinRate: pResolved > 0 ? closed.partner.length / pResolved : 0,
    partnerClosedRevenue: pClosedRev,
    partnerAvgDeal: closed.partner.length > 0 ? pClosedRev / closed.partner.length : 0,
    totalRevenue: aClosedRev + pClosedRev,
  };
}

function getAllRepStats(filters) {
  return REPS.map(r => getRepStats(r, filters));
}

function getDealPredictionHistory(dealId) {
  const isAssess = dealId.startsWith('A-');
  const preds = isAssess ? rawData.assessPreds : rawData.partnerPreds;
  return preds.filter(p => p.dealId === dealId).sort((a, b) => (a.predDate || '').localeCompare(b.predDate || ''));
}

function getRepPipelineForecast(rep) {
  const allOpen = getOpenDeals(rep, false);
  const forecastOpen = getOpenDeals(rep, true);
  return {
    assessOpenAll: allOpen.assess.length, partnerOpenAll: allOpen.partner.length,
    assessOpenForecast: forecastOpen.assess.length, partnerOpenForecast: forecastOpen.partner.length,
    assessRaw: forecastOpen.assess.reduce((s, d) => s + num(d.predictedValue), 0),
    partnerRaw: forecastOpen.partner.reduce((s, d) => s + num(d.totalValue), 0),
    totalRaw: forecastOpen.assess.reduce((s, d) => s + num(d.predictedValue), 0) + forecastOpen.partner.reduce((s, d) => s + num(d.totalValue), 0),
    assessWeighted30: forecastOpen.assess.reduce((s, d) => s + num(d.predictedValue) * num(d.current30), 0),
    assessWeighted60: forecastOpen.assess.reduce((s, d) => s + num(d.predictedValue) * num(d.current60), 0),
    partnerWeighted30: forecastOpen.partner.reduce((s, d) => s + num(d.totalValue) * num(d.current30), 0),
    partnerWeighted60: forecastOpen.partner.reduce((s, d) => s + num(d.totalValue) * num(d.current60), 0),
    get totalWeighted30() { return this.assessWeighted30 + this.partnerWeighted30; },
    get totalWeighted60() { return this.assessWeighted60 + this.partnerWeighted60; },
  };
}

function getRepCommissionForecast(rep, closeBoostPct = 0, manualCloseIds = []) {
  const allOpen = getOpenDeals(rep, false);
  const boost = closeBoostPct / 100;
  const manualSet = new Set(manualCloseIds);
  const items = [];

  const addDeal = (d, type, valKey) => {
    const pipeline = d.pipeline || 'Cold';
    const rate = COMMISSION_RATES[pipeline] || 0.035;
    const isManualClose = manualSet.has(d.id);
    const inForecast = d.inCurrentForecast;
    // Only use close % for deals in current forecast (or manual closes)
    const base30 = isManualClose ? 1 : (inForecast ? num(d.current30) : 0);
    const boosted30 = isManualClose ? 1 : (inForecast ? Math.min(base30 + boost, 1) : 0);
    const val = type === 'Assessment' ? num(d.predictedValue) : num(d.totalValue);
    items.push({
      id: d.id, name: d.name, type, pipeline, value: val,
      oneTime: num(d.oneTime), onboarding: num(d.onboarding), ongoing: num(d.ongoing),
      closeChance: base30, boostedChance: boosted30, rate,
      baseCommission: val * base30 * rate,
      boostedCommission: val * boosted30 * rate,
      manualClose: isManualClose, inCurrentForecast: inForecast,
    });
  };

  allOpen.assess.forEach(d => addDeal(d, 'Assessment', 'predictedValue'));
  allOpen.partner.forEach(d => addDeal(d, 'Partnership', 'totalValue'));

  const totalBase = items.reduce((s, i) => s + i.baseCommission, 0);
  const totalBoosted = items.reduce((s, i) => s + i.boostedCommission, 0);
  return { items, totalBase, totalBoosted, additional: totalBoosted - totalBase };
}

function getPredictedVsActual(rep) {
  const closed = getClosedDeals(rep);
  const results = [];
  closed.assess.forEach(d => results.push({
    id: d.id, name: d.name, type: 'Assessment',
    predicted: num(d.predictedValue), actual: num(d.actualValue),
    variance: num(d.actualValue) - num(d.predictedValue),
    closeDate: d.actualCloseDate, owner: d.owner,
  }));
  closed.partner.forEach(d => results.push({
    id: d.id, name: d.name, type: 'Partnership',
    predicted: num(d.totalValue), actual: num(d.actualValue),
    variance: num(d.actualValue) - num(d.totalValue),
    closeDate: d.actualCloseDate, owner: d.owner,
  }));
  return results;
}

// Get available years/quarters from data
function getAvailableYears() {
  const dates = [
    ...rawData.assessDeals.filter(d => d.actualCloseDate).map(d => d.actualCloseDate),
    ...rawData.partnerDeals.filter(d => d.actualCloseDate).map(d => d.actualCloseDate),
  ];
  return [...new Set(dates.map(d => getYear(d)))].filter(Boolean).sort();
}

function getCurrentForecastPeriod() {
  return rawData.currentForecastPeriod || { assess: 'Unknown', partner: 'Unknown' };
}

export {
  REPS, COMMISSION_RATES, PIPELINES, num, withMonthsOpen,
  getAssessDeals, getPartnerDeals, getAssessPreds, getPartnerPreds,
  getOpenDeals, getClosedDeals, getRepStats, getAllRepStats,
  getDealPredictionHistory, getRepPipelineForecast, getRepCommissionForecast,
  getPredictedVsActual, getAvailableYears, getYear, getMonth, getQuarter,
  getCurrentForecastPeriod,
};
