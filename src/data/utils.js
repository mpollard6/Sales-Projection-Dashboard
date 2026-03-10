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
function getQuarter(ds) { if (!ds) return null; return Math.floor(new Date(ds).getMonth() / 3) + 1; }
function getYear(ds) { if (!ds) return null; return new Date(ds).getFullYear(); }
function getMonth(ds) { if (!ds) return null; return new Date(ds).getMonth() + 1; }

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
  if (forecastOnly) { a = a.filter(d => d.inCurrentForecast); p = p.filter(d => d.inCurrentForecast); }
  return { assess: a, partner: p };
}
function getClosedDeals(rep, filters) {
  let a = getAssessDeals(rep).filter(d => d.status === 'Closed');
  let p = getPartnerDeals(rep).filter(d => d.status === 'Closed');
  if (filters) {
    if (filters.year) { a = a.filter(d => getYear(d.actualCloseDate) === filters.year); p = p.filter(d => getYear(d.actualCloseDate) === filters.year); }
    if (filters.quarter) { a = a.filter(d => getQuarter(d.actualCloseDate) === filters.quarter); p = p.filter(d => getQuarter(d.actualCloseDate) === filters.quarter); }
    if (filters.month) { a = a.filter(d => getMonth(d.actualCloseDate) === filters.month); p = p.filter(d => getMonth(d.actualCloseDate) === filters.month); }
  }
  return { assess: a, partner: p };
}

const NOW = "2026-03-10";
function withMonthsOpen(deals) { return deals.map(d => ({ ...d, monthsOpen: monthsBetween(d.dateEntered, NOW) })); }

// CORRECT weighted calculation: respects 30/60 day window
function calcWeighted30(d) {
  const val = num(d.predictedValue || d.totalValue);
  const w = (d.closeWindow || '').trim();
  if (w === '30 Days') return val * num(d.chancePrimary);
  return 0; // 60-day window deals don't contribute to 30-day
}
function calcWeighted60(d) {
  const val = num(d.predictedValue || d.totalValue);
  const w = (d.closeWindow || '').trim();
  if (w === '30 Days') return val * num(d.chanceFallback); // fallback chance for 30-day deals
  if (w === '60 Days') return val * num(d.chancePrimary); // primary chance for 60-day deals
  return 0;
}

function getRepStats(rep, filters) {
  const ad = getAssessDeals(rep); const pd = getPartnerDeals(rep);
  const closed = getClosedDeals(rep, filters);
  const aLost = ad.filter(d => d.status === 'Lost'); const pLost = pd.filter(d => d.status === 'Lost');
  const aClosedRev = closed.assess.reduce((s, d) => s + num(d.actualValue), 0);
  const pClosedRev = closed.partner.reduce((s, d) => s + num(d.actualValue), 0);
  const aResolved = closed.assess.length + aLost.length;
  const pResolved = closed.partner.length + pLost.length;
  return {
    rep: rep === 'admin' ? 'All Reps' : rep,
    assessTotal: ad.length, assessClosed: closed.assess.length, assessLost: aLost.length,
    assessOpen: ad.filter(d => d.status === 'Open').length,
    assessWinRate: aResolved > 0 ? closed.assess.length / aResolved : 0,
    assessClosedRevenue: aClosedRev,
    assessAvgDeal: closed.assess.length > 0 ? aClosedRev / closed.assess.length : 0,
    partnerTotal: pd.length, partnerClosed: closed.partner.length, partnerLost: pLost.length,
    partnerOpen: pd.filter(d => d.status === 'Open').length,
    partnerWinRate: pResolved > 0 ? closed.partner.length / pResolved : 0,
    partnerClosedRevenue: pClosedRev,
    partnerAvgDeal: closed.partner.length > 0 ? pClosedRev / closed.partner.length : 0,
    totalRevenue: aClosedRev + pClosedRev,
  };
}
function getAllRepStats(filters) { return REPS.map(r => getRepStats(r, filters)); }

function getDealPredictionHistory(dealId) {
  const isAssess = dealId.startsWith('A-');
  return (isAssess ? rawData.assessPreds : rawData.partnerPreds).filter(p => p.dealId === dealId).sort((a, b) => (a.predDate || '').localeCompare(b.predDate || ''));
}

function getRepPipelineForecast(rep) {
  const allOpen = getOpenDeals(rep, false);
  const forecastOpen = getOpenDeals(rep, true);
  return {
    assessOpenAll: allOpen.assess.length, partnerOpenAll: allOpen.partner.length,
    assessOpenForecast: forecastOpen.assess.length, partnerOpenForecast: forecastOpen.partner.length,
    assessRaw: forecastOpen.assess.reduce((s, d) => s + num(d.predictedValue), 0),
    partnerRaw: forecastOpen.partner.reduce((s, d) => s + num(d.totalValue), 0),
    get totalRaw() { return this.assessRaw + this.partnerRaw; },
    assessWeighted30: forecastOpen.assess.reduce((s, d) => s + calcWeighted30(d), 0),
    assessWeighted60: forecastOpen.assess.reduce((s, d) => s + calcWeighted60(d), 0),
    partnerWeighted30: forecastOpen.partner.reduce((s, d) => s + calcWeighted30(d), 0),
    partnerWeighted60: forecastOpen.partner.reduce((s, d) => s + calcWeighted60(d), 0),
    get totalWeighted30() { return this.assessWeighted30 + this.partnerWeighted30; },
    get totalWeighted60() { return this.assessWeighted60 + this.partnerWeighted60; },
  };
}

function getRepCommissionForecast(rep, closeBoostPct = 0, manualCloseIds = []) {
  const allOpen = getOpenDeals(rep, false);
  const boost = closeBoostPct / 100;
  const manualSet = new Set(manualCloseIds);
  const items = [];
  const addDeal = (d, type) => {
    const pipeline = d.pipeline || 'Cold';
    const rate = COMMISSION_RATES[pipeline] || 0.035;
    const isManualClose = manualSet.has(d.id);
    const inForecast = d.inCurrentForecast;
    const basePrimary = isManualClose ? 1 : (inForecast ? num(d.chancePrimary) : 0);
    const boostedPrimary = isManualClose ? 1 : (inForecast ? Math.min(basePrimary + boost, 1) : 0);
    const val = type === 'Assessment' ? num(d.predictedValue) : num(d.totalValue);
    items.push({
      id: d.id, name: d.name, type, pipeline, value: val,
      oneTime: num(d.oneTime), onboarding: num(d.onboarding), ongoing: num(d.ongoing),
      closeWindow: d.closeWindow || '',
      chancePrimary: basePrimary, boostedPrimary, chanceFallback: num(d.chanceFallback), rate,
      baseCommission: val * basePrimary * rate,
      boostedCommission: val * boostedPrimary * rate,
      manualClose: isManualClose, inCurrentForecast: inForecast,
    });
  };
  allOpen.assess.forEach(d => addDeal(d, 'Assessment'));
  allOpen.partner.forEach(d => addDeal(d, 'Partnership'));
  const totalBase = items.reduce((s, i) => s + i.baseCommission, 0);
  const totalBoosted = items.reduce((s, i) => s + i.boostedCommission, 0);
  return { items, totalBase, totalBoosted, additional: totalBoosted - totalBase };
}

function getPredictedVsActual(rep) {
  const closed = getClosedDeals(rep);
  const results = [];
  closed.assess.forEach(d => results.push({ id: d.id, name: d.name, type: 'Assessment', predicted: num(d.predictedValue), actual: num(d.actualValue), variance: num(d.actualValue) - num(d.predictedValue), closeDate: d.actualCloseDate, owner: d.owner }));
  closed.partner.forEach(d => results.push({ id: d.id, name: d.name, type: 'Partnership', predicted: num(d.totalValue), actual: num(d.actualValue), variance: num(d.actualValue) - num(d.totalValue), closeDate: d.actualCloseDate, owner: d.owner }));
  return results;
}

function getRepFunnelStats(rep) {
  const ad = getAssessDeals(rep);
  const pd = getPartnerDeals(rep);
  const totalEntered = ad.length;
  const assessClosed = ad.filter(d => d.status === 'Closed').length;
  const assessLost = ad.filter(d => d.status === 'Lost').length;
  const promoted = ad.filter(d => d.promoted === 'Yes').length;
  const partnerClosed = pd.filter(d => d.status === 'Closed').length;
  return {
    totalEntered, assessClosed, assessLost,
    assessCloseRate: (assessClosed + assessLost) > 0 ? assessClosed / (assessClosed + assessLost) : 0,
    entryToCloseRate: totalEntered > 0 ? assessClosed / totalEntered : 0,
    promoted,
    promotionRate: assessClosed > 0 ? promoted / assessClosed : 0,
    partnerClosed,
    partnerCloseRate: promoted > 0 ? partnerClosed / promoted : 0,
    fullFunnelRate: totalEntered > 0 ? partnerClosed / totalEntered : 0,
  };
}

function getAvailableYears() {
  const dates = [...rawData.assessDeals.filter(d => d.actualCloseDate).map(d => d.actualCloseDate), ...rawData.partnerDeals.filter(d => d.actualCloseDate).map(d => d.actualCloseDate)];
  return [...new Set(dates.map(d => getYear(d)))].filter(Boolean).sort();
}

function getCurrentForecastPeriod() { return rawData.currentForecastPeriod || { assess: 'Unknown', partner: 'Unknown' }; }

export {
  REPS, COMMISSION_RATES, PIPELINES, num, withMonthsOpen, calcWeighted30, calcWeighted60,
  getAssessDeals, getPartnerDeals, getAssessPreds, getPartnerPreds,
  getOpenDeals, getClosedDeals, getRepStats, getAllRepStats,
  getDealPredictionHistory, getRepPipelineForecast, getRepCommissionForecast,
  getPredictedVsActual, getRepFunnelStats, getAvailableYears, getYear, getMonth, getQuarter,
  getCurrentForecastPeriod,
};
