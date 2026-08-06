"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type AssetType = "股票" | "黄金";
type Asset = { id: string; code: string; name: string; type: AssetType; avgBuyPrice?: number; openingProfit: number; color: string };
type Price = { id: string; assetId: string; date: string; value: number; flow?: number };
type Store = { assets: Asset[]; prices: Price[] };

const COLORS = ["#c75b42", "#2d6a59", "#c7972e", "#536ea8", "#915f84"];
const emptyStore: Store = { assets: [], prices: [] };
const IS_LOCAL = import.meta.env.DEV;
const today = () => new Date().toISOString().slice(0, 10);
const money = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n).replace("-", "−");
const pct = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}%`;

type ChartSeries = { name: string; color: string; values: number[] };
function LineChart({ dates, series, moneyAxis=true }: { dates:string[]; series:ChartSeries[]; moneyAxis?:boolean }) {
  const [hovered,setHovered]=useState<{seriesIndex:number;pointIndex:number}|null>(null);
  const width=960, height=260, left=64, right=20, top=20, bottom=34;
  const values=series.flatMap(s=>s.values); const min=Math.min(0,...values), max=Math.max(1,...values); const span=Math.max(max-min,1);
  const x=(i:number)=>left+(i/Math.max(dates.length-1,1))*(width-left-right);
  const y=(v:number)=>top+(max-v)/span*(height-top-bottom);
  const ticks=[0,.25,.5,.75,1];
  const active=hovered&&series[hovered.seriesIndex]&&dates[hovered.pointIndex]?{series:series[hovered.seriesIndex],date:dates[hovered.pointIndex],value:series[hovered.seriesIndex].values[hovered.pointIndex],x:x(hovered.pointIndex),y:y(series[hovered.seriesIndex].values[hovered.pointIndex])}:null;
  return <div className="line-chart" onMouseLeave={()=>setHovered(null)}><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="投资走势折线图">{ticks.map(t=>{const val=max-span*t;return <g key={t}><line x1={left} x2={width-right} y1={top+(height-top-bottom)*t} y2={top+(height-top-bottom)*t} className="chart-grid"/><text x={left-10} y={top+(height-top-bottom)*t+4} textAnchor="end">{moneyAxis?money(val):val.toFixed(1)}</text></g>})}{min<0&&<line x1={left} x2={width-right} y1={y(0)} y2={y(0)} className="chart-zero"/>}{series.map((s,seriesIndex)=><g key={s.name}><polyline points={s.values.map((v,i)=>`${x(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{s.values.map((v,pointIndex)=><g key={pointIndex}><circle cx={x(pointIndex)} cy={y(v)} r="3.5" fill={s.color} stroke="#fbf8f1" strokeWidth="2"/><circle className="chart-hit" cx={x(pointIndex)} cy={y(v)} r="13" tabIndex={0} aria-label={`${dates[pointIndex]} ${s.name} ${moneyAxis?money(v):v.toFixed(2)}`} onMouseEnter={()=>setHovered({seriesIndex,pointIndex})} onFocus={()=>setHovered({seriesIndex,pointIndex})} onBlur={()=>setHovered(null)} onPointerDown={e=>{e.preventDefault();setHovered({seriesIndex,pointIndex})}}/></g>)}</g>)}{active&&<g className="chart-tooltip" transform={`translate(${Math.min(Math.max(active.x,116),width-116)} ${active.y<78?active.y+18:active.y-58})`}><rect x="-108" width="216" height="48" rx="8"/><text className="tooltip-date" x="-95" y="18">{active.date} · {active.series.name}</text><text className="tooltip-value" x="-95" y="37">{moneyAxis?money(active.value):active.value.toFixed(2)}</text></g>}</svg><div className="date-axis">{dates.map((d,i)=><span key={d} style={{left:`${dates.length===1?50:i/(dates.length-1)*100}%`}}>{d.slice(5).replace("-","/")}</span>)}</div></div>;
}

type AnalysisRow = { openingProfit:number; startValue:number; prices:Price[] };
function AnalysisPage({ rows, totalValue, totalProfit }: { rows:AnalysisRow[]; totalValue:number; totalProfit:number }) {
  const year=2026; const now=new Date(); const monthsElapsed=now.getFullYear()===year?now.getMonth()+1:12;
  const cumulative=Array.from({length:monthsElapsed},(_,index)=>{const month=index+1;const end=`${year}-${String(month).padStart(2,"0")}-31`;return rows.reduce((sum,row)=>{const value=row.prices.filter(p=>p.date<=end).at(-1)?.value??row.prices[0]?.value??0;const flows=row.prices.filter(p=>p.date<=end).reduce((n,p)=>n+(p.flow??0),0);return sum+(row.openingProfit??0)+(value-row.startValue)-flows},0)});
  const monthly=cumulative.map((value,index)=>value-(index?cumulative[index-1]:0)); const maxBar=Math.max(1,...monthly.map(Math.abs));
  const assetFour=totalValue*.04, profitFour=totalProfit*.04;
  const cards=[
    {label:"截至目前累计收益",value:money(totalProfit),sub:"全部资产合计",tone:totalProfit>=0?"up":"down"},
    {label:"截至目前总资产",value:money(totalValue),sub:"最新持仓总价值",tone:""},
    {label:"按 12 个月平均",value:money(totalProfit/12),sub:"累计收益 ÷ 12",tone:totalProfit>=0?"up":"down"},
    {label:"实际月均收益",value:money(totalProfit/monthsElapsed),sub:`累计收益 ÷ ${monthsElapsed} 个月`,tone:totalProfit>=0?"up":"down"},
  ];
  return <main><header><div className="brand"><span className="mark"><img src="./app-icon.svg" alt=""/></span><div><strong>仓鉴</strong><small>投资分析中心</small></div></div><nav><a href="#/">看板</a><a className="active" href="#/analysis">分析</a></nav><span className="saved"><i/> 数据截至最新记录</span></header><section className="analysis-hero"><span className="kicker">PORTFOLIO INTELLIGENCE · {year}</span><h1>让数字回答，<br/><em>收益意味着什么。</em></h1><p>以 2026 年 1 月 1 日作为分析起点，拆解累计收益、月均能力与 4% 指标。</p></section><section className="analysis-kpis">{cards.map(card=><div key={card.label}><span>{card.label}</span><strong className={card.tone}>{card.value}</strong><small>{card.sub}</small></div>)}</section><section className="monthly-panel"><div className="section-head"><div><span className="kicker">MONTHLY PROFIT</span><h2>实际每月收益</h2><p>每月末累计收益之差；新增投入只增加本金，不计为收益。</p></div><strong className={totalProfit>=0?"up":"down"}>{money(totalProfit)}</strong></div><div className="month-bars">{monthly.map((value,index)=><div key={index}><span className="bar-value">{money(value)}</span><div className="bar-space"><i className={value>=0?"positive":"negative"} style={{height:`${Math.max(Math.abs(value)/maxBar*100,3)}%`}}/></div><time>{index+1}月</time></div>)}</div></section><section className="four-grid"><div><span className="kicker">4% OF ASSETS</span><h2>总资产的 4%</h2><strong>{money(assetFour)}</strong><p>平均每月 <b>{money(assetFour/12)}</b></p><small>{money(totalValue)} × 4%</small></div><div><span className="kicker">4% OF PROFIT</span><h2>收益部分的 4%</h2><strong className={profitFour>=0?"up":"down"}>{money(profitFour)}</strong><p>平均每月 <b>{money(profitFour/12)}</b></p><small>{money(totalProfit)} × 4%</small></div></section><section className="method"><strong>计算说明</strong><span>初始值视为 {year}-01-01</span><span>当前按 {monthsElapsed} 个月计算实际月均</span><span>全年平均固定除以 12</span></section><footer>仓鉴 · 分析页面只读取已有持仓与每日记录</footer></main>;
}

export default function Home() {
  const [store, setStore] = useState<Store>(emptyStore);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<"asset" | "price" | "ledger" | null>(null);
  const [selected, setSelected] = useState("");
  const [date, setDate] = useState(today());
  const [close, setClose] = useState("");
  const [flow, setFlow] = useState("");
  const [ledgerProfit, setLedgerProfit] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [route, setRoute] = useState(()=>location.hash==="#/analysis"?"analysis":"dashboard");
  const savedSnapshot = useRef(JSON.stringify(emptyStore));

  useEffect(() => {
    fetch(IS_LOCAL ? "/api/portfolio" : "./portfolio-data.json", { cache: "no-store" }).then(r => r.json()).then((data: Store) => {
      savedSnapshot.current = JSON.stringify(data); setStore(data); setSelected(data.assets[0]?.id ?? "");
    }).catch(() => setStore(emptyStore)).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (!ready || !IS_LOCAL) return;
    const snapshot = JSON.stringify(store); if (snapshot === savedSnapshot.current) return; savedSnapshot.current = snapshot;
    fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: snapshot }).catch(() => {});
  }, [store, ready]);
  useEffect(()=>{const update=()=>setRoute(location.hash==="#/analysis"?"analysis":"dashboard");addEventListener("hashchange",update);return()=>removeEventListener("hashchange",update)},[]);

  const rows = useMemo(() => store.assets.map(asset => {
    const prices = store.prices.filter(p => p.assetId === asset.id).sort((a,b) => a.date.localeCompare(b.date));
    const latest = prices.at(-1);
    const first = prices[0];
    const startValue = first?.value ?? 0;
    const value = latest?.value ?? startValue;
    const openingProfit = asset.openingProfit ?? 0;
    const addedPrincipal = prices.reduce((sum,p) => sum + (p.flow??0), 0);
    const principal = startValue - openingProfit + addedPrincipal;
    const profit = openingProfit + (value - startValue) - addedPrincipal;
    return { ...asset, prices, first, latest, startValue, principal, value, profit, returnPct: principal ? profit / principal * 100 : 0 };
  }), [store]);
  const totals = useMemo(() => rows.reduce((a,r) => ({ principal:a.principal+r.principal, value:a.value+r.value, profit:a.profit+r.profit }), { principal:0, value:0, profit:0 }), [rows]);
  const scenarioRows = useMemo(() => rows.filter(r => !excluded.includes(r.id)), [rows, excluded]);
  const scenarioTotals = useMemo(() => scenarioRows.reduce((a,r) => ({ principal:a.principal+r.principal, value:a.value+r.value, profit:a.profit+r.profit }), { principal:0, value:0, profit:0 }), [scenarioRows]);
  const timeline = useMemo(() => {
    const dates=[...new Set(store.prices.map(p=>p.date))].sort();
    const valueAt=(row:(typeof rows)[number], date:string)=>row.prices.filter(p=>p.date<=date).at(-1)?.value??row.first?.value??0;
    const assetSeries=rows.map(row=>({name:row.name,color:row.color,values:dates.map(d=>valueAt(row,d))}));
    const totalValues=dates.map((d,i)=>assetSeries.reduce((sum,s)=>sum+s.values[i],0));
    const profitValues=dates.map((d,i)=>rows.reduce((sum,row,index)=>{const flows=row.prices.filter(p=>p.date<=d).reduce((n,p)=>n+(p.flow??0),0);return sum+(row.openingProfit??0)+(assetSeries[index].values[i]-row.startValue)-flows},0));
    return {dates,assetSeries,totalValues,profitValues};
  }, [rows, store.prices]);
  const expandedTrend = useMemo(() => {
    const row=rows.find(r=>r.id===expanded); if(!row) return null;
    let flows=0;
    const values=row.prices.map((p,index)=>{if(index>0) flows+=p.flow??0;return (row.openingProfit??0)+(p.value-row.startValue)-flows});
    return {row,dates:row.prices.map(p=>p.date),values};
  }, [rows, expanded]);

  function addAsset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const code = String(fd.get("code")).trim().toUpperCase();
    if (store.assets.some(a => a.code.toUpperCase() === code)) { alert("这个代码已经存在。"); return; }
    const avg = Number(fd.get("avgBuyPrice"));
    const asset: Asset = { id:crypto.randomUUID(), code, name:String(fd.get("name")).trim(), type:fd.get("type") as AssetType, avgBuyPrice:avg||undefined, openingProfit:Number(fd.get("openingProfit")), color:COLORS[store.assets.length % COLORS.length] };
    const firstPrice: Price = { id:crypto.randomUUID(), assetId:asset.id, date:String(fd.get("firstDate")), value:Number(fd.get("firstValue")) };
    setStore(s => ({ ...s, assets:[...s.assets, asset], prices:[...s.prices, firstPrice] })); setSelected(asset.id); setModal(null);
  }
  function addPrice(e: FormEvent) {
    e.preventDefault(); const price: Price = { id:crypto.randomUUID(), assetId:selected, date, value:Number(close), flow:Number(flow||0) };
    setStore(s => ({ ...s, prices:[...s.prices.filter(p => !(p.assetId===selected && p.date===date)), price] })); setClose(""); setFlow(""); setModal(null);
  }
  function updateLedger(e: FormEvent) {
    e.preventDefault();
    setStore(s => ({ ...s, assets:s.assets.map(a => a.id===selected ? { ...a, openingProfit:Number(ledgerProfit) } : a) }));
    setModal(null);
  }

  if(route==="analysis") return <AnalysisPage rows={rows} totalValue={totals.value} totalProfit={totals.profit}/>;

  return <main>
    <header><div className="brand"><span className="mark"><img src="./app-icon.svg" alt=""/></span><div><strong>仓鉴</strong><small>持仓价值记录</small></div></div><nav><a className="active" href="#/">看板</a><a href="#/analysis">分析</a></nav><div className="header-actions"><span className="saved"><i/> 欧元 · {IS_LOCAL?"本地编辑":"线上只读"}</span>{IS_LOCAL&&<><button className="ghost" onClick={()=>setModal("asset")}>＋ 添加资产</button><button className="ghost" disabled={!store.assets.length} onClick={()=>{const asset=store.assets.find(a=>a.id===selected)??store.assets[0];setSelected(asset.id);setLedgerProfit(String(asset.openingProfit??0));setModal("ledger")}}>设置初始收益</button><button className="primary" disabled={!store.assets.length} onClick={()=>{setDate(today());setClose("");setFlow("");setModal("price")}}>＋ 记录当天价值 / 投入</button></>}</div></header>

    <section className="hero"><div><p className="eyebrow">MY HOLDINGS</p><h1>从今天开始，<br/><em>记住价值。</em></h1><p className="intro">过去汇总成一个起点，今天之后按日记录；休市日无需填写。</p></div><div className="hero-total"><span>当前持仓总价值</span><strong>{money(totals.value)}</strong><p className={totals.profit>=0?"up":"down"}>{pct(totals.principal?totals.profit/totals.principal*100:0)} <b>{money(totals.profit)}</b></p><small>本金 {money(totals.principal)}</small></div></section>

    {!!timeline.dates.length&&<section className="charts"><div className="chart-card wide"><div className="chart-title"><div><span className="kicker">ASSET TREND</span><h2>各资产走势</h2><p>每条线代表一项资产的每日持仓总价值。</p></div><div className="chart-legend">{timeline.assetSeries.map(s=><span key={s.name}><i style={{background:s.color}}/>{s.name}</span>)}</div></div><LineChart dates={timeline.dates} series={timeline.assetSeries}/></div><div className="chart-card"><div className="chart-title"><div><span className="kicker">TOTAL VALUE</span><h2>总资产走势</h2></div><strong>{money(totals.value)}</strong></div><LineChart dates={timeline.dates} series={[{name:"总资产",color:"#20241e",values:timeline.totalValues}]}/></div><div className="chart-card"><div className="chart-title"><div><span className="kicker">TOTAL PROFIT</span><h2>盈利金额走势</h2></div><strong className={totals.profit>=0?"up":"down"}>{money(totals.profit)}</strong></div><LineChart dates={timeline.dates} series={[{name:"累计盈利",color:totals.profit>=0?"#2d6a59":"#c75b42",values:timeline.profitValues}]}/></div></section>}

    {!!store.assets.length&&<section className="allocation-panel"><div className="section-head"><div><span className="kicker">ASSET ALLOCATION</span><h2>资产配置</h2><p>对比当前价值权重与不含收益的本金投入权重。</p></div></div><div className="allocation-grid"><div><div className="allocation-title"><span>按当前总资产</span><strong>{money(totals.value)}</strong></div>{[...rows].sort((a,b)=>b.value-a.value).map(row=>{const share=totals.value?row.value/totals.value*100:0;return <div className="allocation-row" key={row.id}><div><span><i style={{background:row.color}}/>{row.name}</span><b>{share.toFixed(1)}%</b></div><div className="allocation-track"><i style={{width:`${share}%`,background:row.color}}/></div><small>{money(row.value)}</small></div>})}</div><div><div className="allocation-title"><span>按本金投入</span><strong>{money(totals.principal)}</strong></div>{[...rows].sort((a,b)=>b.principal-a.principal).map(row=>{const share=totals.principal?row.principal/totals.principal*100:0;return <div className="allocation-row" key={row.id}><div><span><i style={{background:row.color}}/>{row.name}</span><b>{share.toFixed(1)}%</b></div><div className="allocation-track"><i style={{width:`${share}%`,background:row.color}}/></div><small>{money(row.principal)}</small></div>})}</div></div></section>}

    {!!store.assets.length&&<section className="contribution-panel"><div className="section-head"><div><span className="kicker">WHAT-IF ANALYSIS</span><h2>假设只买了这些资产</h2><p>正数表示创造收益，负数表示拖累收益；组合亏损时也不会把亏损显示成正贡献。</p></div><div className="scenario-total"><small>模拟总收益</small><strong className={scenarioTotals.profit>=0?"up":"down"}>{money(scenarioTotals.profit)}</strong><span>{pct(scenarioTotals.principal?scenarioTotals.profit/scenarioTotals.principal*100:0)}</span></div></div><div className="asset-filters">{rows.map(row=>{const active=!excluded.includes(row.id);return <button key={row.id} className={active?"active":""} onClick={()=>setExcluded(x=>active?[...x,row.id]:x.filter(id=>id!==row.id))}><i style={{background:row.color}}/>{active?"✓ ":""}{row.name}</button>})}<button className="reset-filter" disabled={!excluded.length} onClick={()=>setExcluded([])}>全部恢复</button></div>{scenarioRows.length?<div className="contribution-list">{[...scenarioRows].sort((a,b)=>b.profit-a.profit).map(row=>{const contribution=scenarioTotals.profit?row.profit/Math.abs(scenarioTotals.profit)*100:0;return <div key={row.id}><div className="contribution-label"><span><i style={{background:row.color}}/>{row.name}<small>{row.code}</small></span><span><strong className={row.profit>=0?"up":"down"}>{money(row.profit)}</strong><b className={contribution>=0?"up":"down"}>{contribution>=0?"+":""}{contribution.toFixed(1)}%</b></span></div><div className="contribution-track"><i className={contribution<0?"loss":""} style={{width:`${Math.min(Math.abs(contribution),100)}%`,background:row.color}}/></div></div>})}</div>:<div className="scenario-empty">至少保留一项资产来进行模拟</div>}</section>}

    {!store.assets.length ? <section className="blank"><span className="kicker">START HERE</span><h2>还没有资产</h2><p>先添加现有资产，并记录今天的持仓总价值和截至今天的累计收益。</p>{IS_LOCAL&&<button className="primary" onClick={()=>setModal("asset")}>添加第一项资产</button>}</section> : <section className="holdings"><div className="section-head"><div><span className="kicker">PORTFOLIO</span><h2>我的资产</h2><p>点击资产可以展开查看总账和每天记录的持仓价值。</p></div><span className="count">{store.assets.length} 项资产</span></div><div className="asset-list">{rows.map(row=><article key={row.id} className={expanded===row.id?"open":""}><button className="asset-main" onClick={()=>setExpanded(expanded===row.id?null:row.id)}><span className="asset-icon" style={{background:row.color}}>{row.code.slice(0,2)}</span><span className="identity"><strong>{row.name}</strong><small>{row.code} · {row.type}</small></span><span><small>本金</small><strong>{money(row.principal)}</strong></span><span><small>当前持仓价值</small><strong>{money(row.value)}</strong></span><span className="asset-performance"><small>累计收益 / 涨跌幅</small><strong className={row.profit>=0?"up":"down"}><span className="asset-profit">{money(row.profit)}</span><span className="asset-return">{pct(row.returnPct)}</span></strong></span><span className="chevron">{expanded===row.id?"−":"＋"}</span></button>{expanded===row.id&&<div className="asset-detail"><div className="metric-row"><div><small>当前持仓价值</small><strong>{money(row.value)}</strong></div><div><small>截至目前收益</small><strong className={row.profit>=0?"up":"down"}>{money(row.profit)}</strong></div><div><small>累计涨跌幅</small><strong className={row.returnPct>=0?"up":"down"}>{pct(row.returnPct)}</strong></div><div><small>最后记录</small><strong>{row.latest?.date ?? "尚未记录"}</strong></div></div>{expandedTrend&&expandedTrend.row.id===row.id&&<section className="single-asset-chart embedded"><div className="chart-title"><div><span className="kicker">ASSET PROFIT TREND</span><h2>{row.name} · 收益变化</h2><p>已扣除后续新增投入，包含初始累计盈亏。</p></div><div className="single-profit"><small>最新累计收益</small><strong className={row.profit>=0?"up":"down"}>{money(row.profit)}</strong><span>{pct(row.returnPct)}</span></div></div><div className="chart-legend"><span><i style={{background:row.color}}/>{row.code} 累计收益</span></div><LineChart dates={expandedTrend.dates} series={[{name:row.name,color:row.color,values:expandedTrend.values}]}/></section>}<div className="price-history"><div className="history-head"><h3>每日持仓总价值</h3>{IS_LOCAL&&<button onClick={()=>{setSelected(row.id);setDate(today());setClose("");setModal("price")}}>＋ 记录价值</button>}</div><div className="price-grid">{[...row.prices].reverse().map(p=><div key={p.id}><time>{p.date}</time><strong>{money(p.value)}</strong>{IS_LOCAL&&<button aria-label="删除记录" onClick={()=>setStore(s=>({...s,prices:s.prices.filter(x=>x.id!==p.id)}))}>×</button>}</div>)}</div></div>{IS_LOCAL&&<button className="delete-link" onClick={()=>{if(confirm(`删除 ${row.name} 和全部价值记录？`))setStore(s=>({assets:s.assets.filter(a=>a.id!==row.id),prices:s.prices.filter(p=>p.assetId!==row.id)}))}}>删除这项资产</button>}</div>}</article>)}</div></section>}

    <footer>仓鉴 · 周末和休市日无需补录 · 第一条持仓价值记录视为历史起点</footer>

    {modal&&<div className="modal-backdrop" onMouseDown={()=>setModal(null)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={()=>setModal(null)}>×</button>{modal==="asset"?<><span className="kicker">OPENING BALANCE</span><h2>建立资产总账</h2><p>输入今天的持仓总价值和其中已经赚到的钱；系统会自动得到本金。</p><form onSubmit={addAsset}><div className="form-row"><label>名称<input autoFocus required name="name" placeholder="例如 黄金"/></label><label>类别<select name="type"><option>股票</option><option>黄金</option></select></label></div><label>代码或简称<input required name="code" placeholder="例如 GOLD"/></label><label>平均买入价（€，可选）<input name="avgBuyPrice" type="number" min="0" step="0.0001" placeholder="不知道可以留空"/></label><label>总账日期<input required name="firstDate" type="date" defaultValue={today()}/></label><div className="form-row"><label>当天持仓总价值（€）<input required name="firstValue" type="number" min="0" step="0.01" placeholder="例如 105"/></label><label>截至当天累计收益（€）<input required name="openingProfit" type="number" step="0.01" placeholder="例如 5；亏损填负数"/></label></div><p className="formula">示例：持仓 €105，其中收益 €5 → 本金 €100</p><button className="primary submit">保存总账起点</button></form></>:<><span className="kicker">DAILY VALUE</span><h2>记录持仓总价值</h2><p>填写账户里这项资产当天显示的总价值。收益会在初始总账基础上自动更新。</p><form onSubmit={addPrice}><div className="form-row"><label>资产<select value={selected} onChange={e=>setSelected(e.target.value)}>{store.assets.map(a=><option key={a.id} value={a.id}>{a.name} · {a.code}</option>)}</select></label><label>日期<input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><label className="main-field">当天持仓总价值（€）<input autoFocus required type="number" min="0" step="0.01" value={close} onChange={e=>setClose(e.target.value)} placeholder="例如 106.50"/></label><button className="primary submit">保存当天价值</button></form></>}</div></div>}
    {modal==="price"&&<div className="modal-backdrop ledger-modal" onMouseDown={()=>setModal(null)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={()=>setModal(null)}>×</button><span className="kicker">DAILY VALUE & CAPITAL</span><h2>记录当天价值和投入</h2><p>持仓总价值必填；当天没有投入时，新增投入留空即可。取出资金请填负数。</p><form onSubmit={addPrice}><div className="form-row"><label>资产<select value={selected} onChange={e=>setSelected(e.target.value)}>{store.assets.map(a=><option key={a.id} value={a.id}>{a.name} · {a.code}</option>)}</select></label><label>日期<input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><label className="main-field">当天持仓总价值（€）<input autoFocus required type="number" min="0" step="0.01" value={close} onChange={e=>setClose(e.target.value)} placeholder="例如 205"/></label><label>当天新增投入（€）<input type="number" step="0.01" value={flow} onChange={e=>setFlow(e.target.value)} placeholder="默认 0；投入 100 填 100"/></label><p className="formula">新增投入只增加本金，不会计入收益。同一资产同一天再次保存会覆盖当天原记录。</p><button className="primary submit">保存当天记录</button></form></div></div>}
    {modal==="ledger"&&<div className="modal-backdrop ledger-modal" onMouseDown={()=>setModal(null)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={()=>setModal(null)}>×</button><span className="kicker">OPENING PROFIT</span><h2>设置截至起点的收益</h2><p>先选择资产，再填写第一条记录当天已经累计赚到的钱。亏损请填负数。</p><form onSubmit={updateLedger}><label>资产<select value={selected} onChange={e=>{setSelected(e.target.value);const a=store.assets.find(x=>x.id===e.target.value);setLedgerProfit(String(a?.openingProfit??0))}}>{store.assets.map(a=><option key={a.id} value={a.id}>{a.name} · {a.code}</option>)}</select></label><label className="main-field">截至第一条记录的累计收益（€）<input autoFocus required type="number" step="0.01" value={ledgerProfit} onChange={e=>setLedgerProfit(e.target.value)} placeholder="例如 5；亏损填 -5"/></label><p className="formula">当前第一条持仓价值：{money(store.prices.filter(p=>p.assetId===selected).sort((a,b)=>a.date.localeCompare(b.date))[0]?.value??0)}。系统会用“持仓价值 − 收益”计算本金。</p><button className="primary submit">保存初始收益</button></form></div></div>}
  </main>;
}
