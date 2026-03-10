import rawData from './pipeline.json';

const REPS = ["Troy Williams", "David Harbin", "Elijah Lee", "Stephen Mitchell"];
const COMMISSION_RATES = { Warm: 0.025, Cold: 0.035, "Brave Digital": 0.035 };
const PIPELINES = ["Warm", "Cold", "Brave Digital"];

function num(v) { return typeof v === 'number' && !isNaN(v) ? v : 0; }
function monthsBetween(d1, d2) {
  if (!d1||!d2) return null;
  const a=new Date(d1),b=new Date(d2);
  return isNaN(a)||isNaN(b)?null:Math.max(0,(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth());
}
function getQuarter(ds){if(!ds)return null;return Math.floor(new Date(ds).getMonth()/3)+1;}
function getYear(ds){if(!ds)return null;return new Date(ds).getFullYear();}
function getMonth(ds){if(!ds)return null;return new Date(ds).getMonth()+1;}
function getMonthName(n){return['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][n]||'';}
const NOW="2026-03-10";
function withMonthsOpen(deals){return deals.map(d=>({...d,monthsOpen:monthsBetween(d.dateEntered,NOW)}));}

// Core accessors
function getAssessDeals(rep,pipeFilter){
  let d=(!rep||rep==='admin')?rawData.assessDeals:rawData.assessDeals.filter(x=>x.owner===rep);
  if(pipeFilter&&pipeFilter!=='all')d=d.filter(x=>x.pipeline===pipeFilter);
  return d;
}
function getPartnerDeals(rep,pipeFilter){
  let d=(!rep||rep==='admin')?rawData.partnerDeals:rawData.partnerDeals.filter(x=>x.owner===rep);
  if(pipeFilter&&pipeFilter!=='all')d=d.filter(x=>x.pipeline===pipeFilter);
  return d;
}
function getAssessPreds(rep){const ids=new Set(getAssessDeals(rep).map(d=>d.id));return rawData.assessPreds.filter(p=>ids.has(p.dealId));}
function getPartnerPreds(rep){const ids=new Set(getPartnerDeals(rep).map(d=>d.id));return rawData.partnerPreds.filter(p=>ids.has(p.dealId));}

function getOpenDeals(rep,forecastOnly=false,pipeFilter){
  let a=getAssessDeals(rep,pipeFilter).filter(d=>d.status==='Open');
  let p=getPartnerDeals(rep,pipeFilter).filter(d=>d.status==='Open');
  if(forecastOnly){a=a.filter(d=>d.inCurrentForecast);p=p.filter(d=>d.inCurrentForecast);}
  return{assess:a,partner:p};
}
function getClosedDeals(rep,filters,pipeFilter){
  let a=getAssessDeals(rep,pipeFilter).filter(d=>d.status==='Closed');
  let p=getPartnerDeals(rep,pipeFilter).filter(d=>d.status==='Closed');
  if(filters){
    if(filters.year){a=a.filter(d=>getYear(d.actualCloseDate)===filters.year);p=p.filter(d=>getYear(d.actualCloseDate)===filters.year);}
    if(filters.quarter){a=a.filter(d=>getQuarter(d.actualCloseDate)===filters.quarter);p=p.filter(d=>getQuarter(d.actualCloseDate)===filters.quarter);}
    if(filters.month){a=a.filter(d=>getMonth(d.actualCloseDate)===filters.month);p=p.filter(d=>getMonth(d.actualCloseDate)===filters.month);}
  }
  return{assess:a,partner:p};
}

// Weighted calcs — respects 30/60 day window
function calcWeighted30(d){
  const val=num(d.predictedValue||d.totalValue);
  return(d.closeWindow||'').trim()==='30 Days'?val*num(d.chancePrimary):0;
}
function calcWeighted60(d){
  const val=num(d.predictedValue||d.totalValue),w=(d.closeWindow||'').trim();
  if(w==='30 Days')return val*num(d.chanceFallback);
  if(w==='60 Days')return val*num(d.chancePrimary);
  return 0;
}
// Projected number of closes
function calcCloses30(d){return(d.closeWindow||'').trim()==='30 Days'?num(d.chancePrimary):0;}
function calcCloses60(d){
  const w=(d.closeWindow||'').trim();
  if(w==='30 Days')return num(d.chanceFallback);
  if(w==='60 Days')return num(d.chancePrimary);
  return 0;
}

function getRepPipelineForecast(rep,pipeFilter){
  const allOpen=getOpenDeals(rep,false,pipeFilter);
  const fo=getOpenDeals(rep,true,pipeFilter);
  return{
    assessOpenAll:allOpen.assess.length,partnerOpenAll:allOpen.partner.length,
    assessOpenForecast:fo.assess.length,partnerOpenForecast:fo.partner.length,
    assessRaw:fo.assess.reduce((s,d)=>s+num(d.predictedValue),0),
    partnerRaw:fo.partner.reduce((s,d)=>s+num(d.totalValue),0),
    get totalRaw(){return this.assessRaw+this.partnerRaw;},
    assessW30:fo.assess.reduce((s,d)=>s+calcWeighted30(d),0),
    assessW60:fo.assess.reduce((s,d)=>s+calcWeighted60(d),0),
    partnerW30:fo.partner.reduce((s,d)=>s+calcWeighted30(d),0),
    partnerW60:fo.partner.reduce((s,d)=>s+calcWeighted60(d),0),
    get totalW30(){return this.assessW30+this.partnerW30;},
    get totalW60(){return this.assessW60+this.partnerW60;},
    assessCloses30:fo.assess.reduce((s,d)=>s+calcCloses30(d),0),
    assessCloses60:fo.assess.reduce((s,d)=>s+calcCloses60(d),0),
    partnerCloses30:fo.partner.reduce((s,d)=>s+calcCloses30(d),0),
    partnerCloses60:fo.partner.reduce((s,d)=>s+calcCloses60(d),0),
    get totalCloses30(){return this.assessCloses30+this.partnerCloses30;},
    get totalCloses60(){return this.assessCloses60+this.partnerCloses60;},
  };
}

function getRepStats(rep,filters,pipeFilter){
  const ad=getAssessDeals(rep,pipeFilter),pd=getPartnerDeals(rep,pipeFilter);
  const closed=getClosedDeals(rep,filters,pipeFilter);
  const aLost=ad.filter(d=>d.status==='Lost'),pLost=pd.filter(d=>d.status==='Lost');
  const aClosedRev=closed.assess.reduce((s,d)=>s+num(d.actualValue),0);
  const pClosedRev=closed.partner.reduce((s,d)=>s+num(d.actualValue),0);
  const aRes=closed.assess.length+aLost.length,pRes=closed.partner.length+pLost.length;
  return{
    rep:rep==='admin'?'All Reps':rep,
    assessTotal:ad.length,assessClosed:closed.assess.length,assessLost:aLost.length,
    assessOpen:ad.filter(d=>d.status==='Open').length,
    assessWinRate:aRes>0?closed.assess.length/aRes:0,assessClosedRevenue:aClosedRev,
    assessAvgDeal:closed.assess.length>0?aClosedRev/closed.assess.length:0,
    partnerTotal:pd.length,partnerClosed:closed.partner.length,partnerLost:pLost.length,
    partnerOpen:pd.filter(d=>d.status==='Open').length,
    partnerWinRate:pRes>0?closed.partner.length/pRes:0,partnerClosedRevenue:pClosedRev,
    partnerAvgDeal:closed.partner.length>0?pClosedRev/closed.partner.length:0,
    totalRevenue:aClosedRev+pClosedRev,
  };
}
function getAllRepStats(filters,pipeFilter){return REPS.map(r=>getRepStats(r,filters,pipeFilter));}

function getDealPredictionHistory(dealId){
  const isA=dealId.startsWith('A-');
  return(isA?rawData.assessPreds:rawData.partnerPreds).filter(p=>p.dealId===dealId).sort((a,b)=>(a.predDate||'').localeCompare(b.predDate||''));
}

function getRepCommissionForecast(rep,boost=0,manualIds=[]){
  const all=getOpenDeals(rep,false);
  const b=boost/100,ms=new Set(manualIds),items=[];
  const add=(d,type)=>{
    const pipe=d.pipeline||'Cold',rate=COMMISSION_RATES[pipe]||0.035;
    const mc=ms.has(d.id),inf=d.inCurrentForecast;
    const bp=mc?1:(inf?num(d.chancePrimary):0);
    const boosted=mc?1:(inf?Math.min(bp+b,1):0);
    const val=type==='Assessment'?num(d.predictedValue):num(d.totalValue);
    items.push({id:d.id,name:d.name,type,pipeline:pipe,value:val,
      oneTime:num(d.oneTime),onboarding:num(d.onboarding),ongoing:num(d.ongoing),
      closeWindow:d.closeWindow||'',chancePrimary:bp,boostedPrimary:boosted,
      chanceFallback:num(d.chanceFallback),rate,
      baseCommission:val*bp*rate,boostedCommission:val*boosted*rate,
      manualClose:mc,inCurrentForecast:inf});
  };
  all.assess.forEach(d=>add(d,'Assessment'));
  all.partner.forEach(d=>add(d,'Partnership'));
  const tb=items.reduce((s,i)=>s+i.baseCommission,0);
  const tbo=items.reduce((s,i)=>s+i.boostedCommission,0);
  return{items,totalBase:tb,totalBoosted:tbo,additional:tbo-tb};
}

function getPredictedVsActual(rep,pipeFilter){
  const closed=getClosedDeals(rep,null,pipeFilter);
  const r=[];
  closed.assess.forEach(d=>r.push({id:d.id,name:d.name,type:'Assessment',predicted:num(d.predictedValue),actual:num(d.actualValue),variance:num(d.actualValue)-num(d.predictedValue),closeDate:d.actualCloseDate,owner:d.owner}));
  closed.partner.forEach(d=>r.push({id:d.id,name:d.name,type:'Partnership',predicted:num(d.totalValue),actual:num(d.actualValue),variance:num(d.actualValue)-num(d.totalValue),closeDate:d.actualCloseDate,owner:d.owner}));
  return r;
}

function getRepFunnelStats(rep){
  const ad=getAssessDeals(rep),pd=getPartnerDeals(rep);
  const te=ad.length,ac=ad.filter(d=>d.status==='Closed').length,al=ad.filter(d=>d.status==='Lost').length;
  const pr=ad.filter(d=>d.promoted==='Yes').length,pc=pd.filter(d=>d.status==='Closed').length;
  return{totalEntered:te,assessClosed:ac,assessLost:al,
    assessCloseRate:(ac+al)>0?ac/(ac+al):0,entryToCloseRate:te>0?ac/te:0,
    promoted:pr,promotionRate:ac>0?pr/ac:0,
    partnerClosed:pc,partnerCloseRate:pr>0?pc/pr:0,fullFunnelRate:te>0?pc/te:0};
}

// Momentum: compare current forecast count/value to previous period
function getMomentum(rep){
  const preds=rawData.assessPreds.concat(rawData.partnerPreds);
  const repDeals=new Set([...getAssessDeals(rep).map(d=>d.id),...getPartnerDeals(rep).map(d=>d.id)]);
  const repPreds=preds.filter(p=>repDeals.has(p.dealId));
  const periods=[...new Set(repPreds.map(p=>p.period))].sort();
  if(periods.length<2)return{trend:'stable',change:0,prevDeals:0,curDeals:0};
  const cur=periods[periods.length-1],prev=periods[periods.length-2];
  const curCount=repPreds.filter(p=>p.period===cur).length;
  const prevCount=repPreds.filter(p=>p.period===prev).length;
  const change=curCount-prevCount;
  return{trend:change>0?'growing':change<0?'shrinking':'stable',change,prevDeals:prevCount,curDeals:curCount,curPeriod:cur,prevPeriod:prev};
}

// Win streak: consecutive closes by date
function getWinStreak(rep){
  const all=[...getClosedDeals(rep).assess,...getClosedDeals(rep).partner]
    .filter(d=>d.actualCloseDate).sort((a,b)=>b.actualCloseDate.localeCompare(a.actualCloseDate));
  if(!all.length)return 0;
  // Count from most recent — streak is consecutive months with at least one close
  const months=new Set();
  all.forEach(d=>{const dt=new Date(d.actualCloseDate);months.add(`${dt.getFullYear()}-${dt.getMonth()}`);});
  const sorted=[...months].sort().reverse();
  let streak=1;
  for(let i=1;i<sorted.length;i++){
    const[y1,m1]=sorted[i-1].split('-').map(Number),[y2,m2]=sorted[i].split('-').map(Number);
    const diff=(y1*12+m1)-(y2*12+m2);
    if(diff===1)streak++;else break;
  }
  return streak;
}

// Revenue velocity: avg days from entry to close for closed deals
function getRevenueVelocity(rep){
  const all=[...getClosedDeals(rep).assess,...getClosedDeals(rep).partner];
  const withDays=all.filter(d=>d.dateEntered&&d.actualCloseDate).map(d=>{
    const diff=Math.round((new Date(d.actualCloseDate)-new Date(d.dateEntered))/(1000*60*60*24));
    return{...d,daysToClose:diff};
  });
  if(!withDays.length)return{avgDays:0,avgRevPerDay:0,deals:0};
  const avgDays=withDays.reduce((s,d)=>s+d.daysToClose,0)/withDays.length;
  const totalRev=withDays.reduce((s,d)=>s+num(d.actualValue),0);
  return{avgDays:Math.round(avgDays),avgRevPerDay:Math.round(totalRev/Math.max(1,withDays.reduce((s,d)=>s+d.daysToClose,0))),deals:withDays.length};
}

// Forecast accuracy: avg absolute % error
function getForecastAccuracy(rep){
  const pva=getPredictedVsActual(rep);
  if(!pva.length)return{score:0,avgPctError:0,deals:0};
  const errs=pva.filter(d=>d.predicted>0).map(d=>Math.abs(d.variance)/d.predicted);
  const avgErr=errs.length>0?errs.reduce((s,e)=>s+e,0)/errs.length:0;
  return{score:Math.max(0,Math.round((1-avgErr)*100)),avgPctError:avgErr,deals:errs.length};
}

// Pipeline coverage ratio
function getPipelineCoverage(rep,monthlyTarget=175000){
  const f=getRepPipelineForecast(rep);
  return{raw:f.totalRaw,target:monthlyTarget,ratio:f.totalRaw/Math.max(1,monthlyTarget)};
}

// Historical revenue by pipeline source
function getRevByPipeline(rep){
  const result={};
  ['Warm','Cold','Brave Digital'].forEach(pipe=>{
    const s=getRepStats(rep,null,pipe);
    const open=getOpenDeals(rep,false,pipe);
    result[pipe]={closedRev:s.totalRevenue,closedCount:s.assessClosed+s.partnerClosed,
      openCount:open.assess.length+open.partner.length,
      openValue:open.assess.reduce((sum,d)=>sum+num(d.predictedValue),0)+open.partner.reduce((sum,d)=>sum+num(d.totalValue),0)};
  });
  return result;
}

function getAvailableYears(){
  const dates=[...rawData.assessDeals.filter(d=>d.actualCloseDate).map(d=>d.actualCloseDate),...rawData.partnerDeals.filter(d=>d.actualCloseDate).map(d=>d.actualCloseDate)];
  return[...new Set(dates.map(d=>getYear(d)))].filter(Boolean).sort();
}
function getCurrentForecastPeriod(){return rawData.currentForecastPeriod||{assess:'Unknown',partner:'Unknown'};}

export{
  REPS,COMMISSION_RATES,PIPELINES,num,withMonthsOpen,calcWeighted30,calcWeighted60,
  getAssessDeals,getPartnerDeals,getAssessPreds,getPartnerPreds,
  getOpenDeals,getClosedDeals,getRepStats,getAllRepStats,
  getDealPredictionHistory,getRepPipelineForecast,getRepCommissionForecast,
  getPredictedVsActual,getRepFunnelStats,getAvailableYears,getYear,getMonth,getQuarter,getMonthName,
  getCurrentForecastPeriod,getMomentum,getWinStreak,getRevenueVelocity,getForecastAccuracy,
  getPipelineCoverage,getRevByPipeline,calcCloses30,calcCloses60,
};
