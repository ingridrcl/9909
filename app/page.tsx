'use client';

import { useEffect, useState } from 'react';

type Rx = { id: number; raw: string; result: string; busy: boolean; error: string };
const consentFields = [
  ['diagnosis', 'Diagnosis'], ['caraDiagnosis', 'Cara diagnosis'], ['tindakan', 'Tindakan'],
  ['indikasi', 'Indikasi'], ['tataCara', 'Tata Cara'], ['tujuan', 'Tujuan'],
  ['risiko', 'Risiko'], ['komplikasi', 'Komplikasi'], ['prognosis', 'Prognosis'],
  ['alternatifRisiko', 'Alternatif dan Risiko'],
] as const;
type Consent = Record<(typeof consentFields)[number][0], string>;
const blankConsent = (): Consent => Object.fromEntries(consentFields.map(([key]) => [key, ''])) as Consent;
function CopyIcon() {
  return <svg className="copy-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="8" y="8" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.7" />
  </svg>;
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<'resep' | 'consent'>('resep');
  const [rxItems, setRxItems] = useState<Rx[]>([{ id: 1, raw: '', result: '', busy: false, error: '' }, { id: 2, raw: '', result: '', busy: false, error: '' }]);
  const [diagnosis, setDiagnosis] = useState('');
  const [procedure, setProcedure] = useState('');
  const [consent, setConsent] = useState<Consent>(blankConsent());
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/session').then(async r => {
      if (!r.ok) return;
      const data = await r.json();
      setSessionExpiresAt(data.expiresAt);
      setAuthenticated(true);
    }).catch(() => {}).finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (!authenticated || sessionExpiresAt === null) return;
    const timer = window.setTimeout(() => {
      setAuthenticated(false);
      setSessionExpiresAt(null);
      setLoginError('Sesi berakhir. Masukkan passcode kembali.');
    }, Math.max(0, sessionExpiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [authenticated, sessionExpiresAt]);
  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoginError('');
    try { const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Passcode tidak cocok.'); setAuthenticated(true); setSessionExpiresAt(Date.now() + 5*60*1000); setPasscode(''); }
    catch (e) { setLoginError(e instanceof Error ? e.message : 'Gagal masuk.'); }
  }
  async function convertRx(id: number) {
    const item = rxItems.find(x => x.id === id); if (!item?.raw.trim()) { setRxItems(xs => xs.map(x => x.id === id ? {...x, error: 'Masukkan resep mentah terlebih dahulu.'} : x)); return; }
    setRxItems(xs => xs.map(x => x.id === id ? {...x, busy: true, error: ''} : x));
    try { const r = await fetch('/api/convert-recipe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text: item.raw }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Konversi gagal.'); setRxItems(xs => xs.map(x => x.id === id ? {...x, result: d.result, busy: false} : x)); }
    catch (e) { setRxItems(xs => xs.map(x => x.id === id ? {...x, busy: false, error: e instanceof Error ? e.message : 'Konversi gagal.'} : x)); }
  }
  async function convertAll() { await Promise.all(rxItems.filter(x => x.raw.trim()).map(x => convertRx(x.id))); }
  async function makeConsent(e: React.FormEvent) {
    e.preventDefault(); setConsentError(''); setConsentBusy(true);
    try { const r = await fetch('/api/create-consent', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ diagnosis, procedure }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Gagal membuat draft.'); setConsent({ ...d.result, diagnosis, caraDiagnosis: 'Anamnesis, pemeriksaan fisik, pemeriksaan penunjang' }); }
    catch (e) { setConsentError(e instanceof Error ? e.message : 'Gagal membuat draft.'); } finally { setConsentBusy(false); }
  }
  async function copy(text: string) { try { await navigator.clipboard.writeText(text); setNotice('Tersalin ke clipboard'); setTimeout(() => setNotice(''), 1800); } catch { setNotice('Clipboard tidak tersedia di browser ini'); setTimeout(() => setNotice(''), 2200); } }
  async function logout() { await fetch('/api/logout', { method:'POST' }); setAuthenticated(false); setSessionExpiresAt(null); }

  if (checking) return <main className="loading-screen"><span className="brand-mark">9909</span><div className="loader"/></main>;
  if (!authenticated) return <main className="login-screen"><div className="login-art"><div className="sun"/><span className="spark spark-one">✦</span><div className="art-window"><div className="window-bar"><i/><i/><i/><span>workspace / 9909</span></div><div className="art-content"><div className="leaf">✿</div><div className="art-name">9909</div><p>RAPIKAN DENGAN TENANG</p><div className="art-lines"><i/><i/><i/></div><div className="art-pill">✦  healthcare notes  ✦</div></div></div><div className="doodle-cross">✚</div></div><section className="login-card"><div className="tiny-label">RUANG KERJA PRIBADI</div><h1>Selamat datang<br/>di <em>9909.</em></h1><p className="muted">Masukkan passcode untuk melanjutkan.</p><form onSubmit={login}><label htmlFor="passcode">PASSCODE</label><input id="passcode" autoFocus inputMode="numeric" pattern="[0-9]*" maxLength={12} value={passcode} onChange={e => setPasscode(e.target.value.replace(/\D/g,''))} placeholder="••••"/><button className="primary full" type="submit">Buka workspace <span>↗</span></button></form>{loginError && <p className="error-text">{loginError}</p>}<div className="login-foot">PROTECTED SPACE <span>●</span> 9909</div></section></main>;

  return <main className="app-shell"><aside className="sidebar"><a className="logo" href="#"><span className="logo-icon" aria-hidden="true"></span><span>9909<small>MEDICAL DESK</small></span></a><div className="side-label">WORKSPACE</div><button className={`nav-item ${tab==='resep'?'active':''}`} onClick={()=>setTab('resep')}><span className="nav-icon">▤</span> Resep <span className="nav-arrow">↗</span></button><button className={`nav-item ${tab==='consent'?'active':''}`} onClick={()=>setTab('consent')}><span className="nav-icon" aria-hidden="true"></span> Informed Consent <span className="nav-arrow">↗</span></button><div className="sidebar-bottom"><div className="sidebar-sticker">✿<span>Carefully<br/>prepared.</span></div><div className="user-row"><div className="avatar">9</div><div><b>Private workspace</b><small>Session aktif</small></div><button title="Keluar" onClick={logout}>↗</button></div></div></aside>
    <section className="main-area"><header className="topbar"><div className="crumb">WORKSPACE <span>/</span> {tab==='resep'?'RESEP':'INFORMED CONSENT'}</div><div className="top-actions"><span className="date-label">9909</span></div></header>
      {tab==='resep' ? <div className="content"><div className="page-heading"><div><div className="eyebrow"><span>01</span> TOOLKIT / RESEP</div><h1>Resep<span className="heading-period">.</span></h1><p>Rapikan daftar terapi menjadi lebih jelas dan mudah dibaca.</p></div><div className="heading-stamp"><small>RX<br/>DESK</small></div></div><div className="action-row"><div className="mini-info"><span className="info-icon">i</span> Isi resep mentah, lalu konversi satu per satu atau sekaligus.</div><button className="primary" onClick={convertAll} disabled={rxItems.every(x=>!x.raw.trim()) || rxItems.some(x=>x.busy)}>✦ &nbsp; Convert all</button></div><div className="rx-grid">{rxItems.map((item, i)=><article className="rx-card" key={item.id}><div className="card-head"><div className="card-number">{String(i+1).padStart(2,'0')}</div><div><b>Resep {i+1}</b><small>{item.result?'HASIL TERSEDIA':'INPUT TERAPI'}</small></div><button className="more-btn" onClick={()=>setRxItems(xs=>xs.length>2?xs.filter(x=>x.id!==item.id):xs.map(x=>x.id===item.id?{...x,raw:'',result:'',error:''}:x))} title={rxItems.length>2?'Hapus field':'Kosongkan'}>{rxItems.length>2?'×':'↻'}</button></div><label className="field-label">RESEP MENTAH</label><textarea value={item.raw} onChange={e=>setRxItems(xs=>xs.map(x=>x.id===item.id?{...x,raw:e.target.value}:x))} placeholder={'Tempel resep mentah di sini…\n\nContoh: Paracetamol 500mg tab signa 3x1'} rows={6}/>{item.error&&<p className="error-text">{item.error}</p>}<div className="result-box"><div className="result-title"><span>HASIL RAPI</span>{item.result&&<button type="button" className="icon-button" onClick={()=>copy(item.result)} aria-label="Salin hasil resep" title="Salin hasil resep"><CopyIcon/></button>}</div>{item.busy?<div className="result-placeholder"><span className="loader small"/> Sedang merapikan…</div>:<pre className={item.result?'result-text':''}>{item.result||'Hasil konversi akan muncul di sini.'}</pre>}</div><button className="secondary full" onClick={()=>convertRx(item.id)} disabled={item.busy || !item.raw.trim()}>{item.busy?'Memproses…':'Convert resep'} <span>↗</span></button></article>)}</div><button className="add-field" onClick={()=>setRxItems(xs=>[...xs,{id:Date.now(),raw:'',result:'',busy:false,error:''}])}><span>＋</span> Tambah resep</button></div> : <div className="content consent-content"><div className="page-heading"><div><div className="eyebrow"><span>02</span> TOOLKIT / DOKUMEN</div><h1>Informed Consent<span className="heading-period">.</span></h1><p>Buat draft persetujuan tindakan untuk ditinjau dokter penanggung jawab.</p></div><div className="heading-stamp consent-stamp">✚<small>IC<br/>DESK</small></div></div><form className="consent-form" onSubmit={makeConsent}><div className="form-card"><div className="section-title"><span className="section-count">A</span><div><b>Informasi tindakan</b><small>Masukkan data klinis yang tersedia.</small></div></div><label htmlFor="diagnosis">DIAGNOSIS <span>OPSIONAL</span></label><input id="diagnosis" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} placeholder="Diagnosis (boleh dikosongkan)"/><label htmlFor="procedure">NAMA TINDAKAN <span>WAJIB</span></label><input id="procedure" value={procedure} onChange={e=>setProcedure(e.target.value)} placeholder="Contoh: insisi dan drainase abses" required/></div><button className="primary generate" type="submit" disabled={consentBusy || !procedure.trim()}>{consentBusy?<><span className="loader light small"/> Menyusun draft…</>:<>✦ &nbsp; Buat template persetujuan <span>↗</span></>}</button></form>{consentError&&<p className="error-text">{consentError}</p>}{consent.tindakan&&<><div className="output-heading"><div><div className="eyebrow"><span>OUTPUT</span> 10 FIELD</div><h2>Draft persetujuan</h2></div><button type="button" className="secondary copy-only" aria-label="Salin semua" title="Salin semua" onClick={()=>copy(consentFields.map(([key,label])=>`${label}: ${consent[key]}`).join('\n\n'))}><CopyIcon/></button></div><div className="consent-grid">{consentFields.map(([key,label],i)=><article className={`consent-field ${key==='tataCara'||key==='alternatifRisiko'?'wide':''}`} key={key}><div className="consent-label"><span>{String(i+1).padStart(2,'0')}</span>{label}<button type="button" className="icon-button" onClick={()=>copy(consent[key])} title={`Salin ${label}`} aria-label={`Salin ${label}`}><CopyIcon/></button></div><textarea rows={key==='tataCara'||key==='alternatifRisiko'?3:2} value={consent[key]} onChange={e=>setConsent(c=>({...c,[key]:e.target.value}))} readOnly={key==='caraDiagnosis'}/></article>)}</div></>}</div>}
    </section>{notice&&<div className="toast">✓ &nbsp; {notice}</div>}</main>;
}
