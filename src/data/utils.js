import rawData from './pipeline.json';

const REPS = ["Troy Williams", "David Harbin", "Elijah Lee", "Stephen Mitchell"];
const COMMISSION_RATES = { Warm: 0.025, Cold: 0.035, "Brave Digital": 0.035 };

function num(v) { return typeof v === 'number' ? v : 0; }

function getRepAssessDeals(rep) {
  return rawData.assessDeals.filter(d => d.owner === rep);
}
function getRepPartnerDeals(rep) {
  return rawData.partnerDeals.filter(d => d.owner === rep);
}
function getRepAssessPreds(rep) {
  const ids = new Set(getRepAssessDeals(rep).map(d => d.id));
  return rawData.assessPreds.filter(p => ids.has(p.dealId));
}
function getRepPartnerPreds(rep) {
  const ids = new Set(getRepPartnerDeals(rep).map(d => d.id));
  return rawData.partnerPreds.filter(p => ids.has(p.dealId));
}

function getOpenDeals(rep) {
  const a = getRepAssessDeals(rep).filter(d => d.status === 'Open');
  const p = getRepPartnerDeals(rep).filter(d => d.status === 'Open');
  return { assess: a, partner: p };
}

function getClosedDeals(rep) {
  const a = getRepAssessDeals(rep).filter(d => d.status === 'Closed');
  const p = getRepPartnerDeals(rep).filter(d => d.status === 'Closed');
  return { assess: a, partner: p };
}

function getRepStats(rep) {
  const ad = getRepAssessDeals(rep);
  const pd = getRepPartnerDeals(rep);
  const aClosed = ad.filter(d => d.status === 'Closed');
  const aLost = ad.filter(d => d.status === 'Lost');
  const aOpen = ad.filter(d => d.status === 'Open');
  const pClosed = pd.filter(d => d.status === 'Closed');
  const pLost = pd.filter(d => d.status === 'Lost');
  const pOpen = pd.filter(d => d.status === 'Open');

  const aClosedRev = aClosed.reduce((s, d) => s + num(d.actualValue), 0);
  const pClosedRev = pClosed.reduce((s, d) => s + num(d.actualValue), 0);
  const aResolved = aClosed.length + aLost.length;
  const pResolved = pClosed.length + pLost.length;

  return {
    rep,
    assessTotal: ad.length, assessClosed: aClosed.length, assessLost: aLost.length, assessOpen: aOpen.length,
    assessWinRate: aResolved > 0 ? aClosed.length / aResolved : 0,
    assessClosedRevenue: aClosedRev,
    assessAvgDeal: aClosed.length > 0 ? aClosedRev / aClosed.length : 0,
    partnerTotal: pd.length, partnerClosed: pClosed.length, partnerLost: pLost.length, partnerOpen: pOpen.length,
    partnerWinRate: pResolved > 0 ? pClosed.length / pResolved : 0,
    partnerClosedRevenue: pClosedRev,
    partnerAvgDeal: pClosed.length > 0 ? pClosedRev / pClosed.length : 0,
    totalRevenue: aClosedRev + pClosedRev,
  };
}

function getAllRepStats() {
  return REPS.map(getRepStats);
}

function getDealPredictionHistory(dealId) {
  const isAssess = dealId.startsWith('A-');
  const preds = isAssess ? rawData.assessPreds : rawData.partnerPreds;
  return preds.filter(p => p.dealId === dealId).sort((a, b) => (a.predDate || '').localeCompare(b.predDate || ''));
}

function getRepPipelineForecast(rep) {
  const open = getOpenDeals(rep);
  const assessWeighted30 = open.assess.reduce((s, d) => s + num(d.predictedValue) * num(d.current30), 0);
  const assessWeighted60 = open.assess.reduce((s, d) => s + num(d.predictedValue) * num(d.current60), 0);
  const partnerWeighted30 = open.partner.reduce((s, d) => s + num(d.totalValue) * num(d.current30), 0);
  const partnerWeighted60 = open.partner.reduce((s, d) => s + num(d.totalValue) * num(d.current60), 0);
  const assessRaw = open.assess.reduce((s, d) => s + num(d.predictedValue), 0);
  const partnerRaw = open.partner.reduce((s, d) => s + num(d.totalValue), 0);

  return {
    assessOpen: open.assess.length, partnerOpen: open.partner.length,
    assessRaw, partnerRaw, totalRaw: assessRaw + partnerRaw,
    assessWeighted30, assessWeighted60, partnerWeighted30, partnerWeighted60,
    totalWeighted30: assessWeighted30 + partnerWeighted30,
    totalWeighted60: assessWeighted60 + partnerWeighted60,
  };
}

function getRepCommissionForecast(rep, closeBoostPct = 0) {
  const open = getOpenDeals(rep);
  const boost = closeBoostPct / 100;
  const items = [];

  open.assess.forEach(d => {
    const pipeline = d.pipeline || 'Cold';
    const rate = COMMISSION_RATES[pipeline] || 0.035;
    const base30 = num(d.current30);
    const boosted30 = Math.min(base30 + boost, 1);
    const val = num(d.predictedValue);
    items.push({
      id: d.id, name: d.name, type: 'Assessment', pipeline, value: val,
      closeChance: base30, boostedChance: boosted30, rate,
      baseCommission: val * base30 * rate,
      boostedCommission: val * boosted30 * rate,
    });
  });

  open.partner.forEach(d => {
    const pipeline = d.pipeline || 'Cold';
    const rate = COMMISSION_RATES[pipeline] || 0.035;
    const base30 = num(d.current30);
    const boosted30 = Math.min(base30 + boost, 1);
    const val = num(d.totalValue);
    items.push({
      id: d.id, name: d.name, type: 'Partnership', pipeline, value: val,
      closeChance: base30, boostedChance: boosted30, rate,
      baseCommission: val * base30 * rate,
      boostedCommission: val * boosted30 * rate,
    });
  });

  const totalBase = items.reduce((s, i) => s + i.baseCommission, 0);
  const totalBoosted = items.reduce((s, i) => s + i.boostedCommission, 0);
  return { items, totalBase, totalBoosted, additional: totalBoosted - totalBase };
}

function getPredictedVsActual(rep) {
  const closed = getClosedDeals(rep);
  const results = [];
  closed.assess.forEach(d => {
    results.push({
      id: d.id, name: d.name, type: 'Assessment',
      predicted: num(d.predictedValue), actual: num(d.actualValue),
      variance: num(d.actualValue) - num(d.predictedValue),
    });
  });
  closed.partner.forEach(d => {
    results.push({
      id: d.id, name: d.name, type: 'Partnership',
      predicted: num(d.totalValue), actual: num(d.actualValue),
      variance: num(d.actualValue) - num(d.totalValue),
    });
  });
  return results;
}

export {
  REPS, COMMISSION_RATES, num,
  getRepAssessDeals, getRepPartnerDeals, getRepAssessPreds, getRepPartnerPreds,
  getOpenDeals, getClosedDeals, getRepStats, getAllRepStats,
  getDealPredictionHistory, getRepPipelineForecast, getRepCommissionForecast,
  getPredictedVsActual,
};
