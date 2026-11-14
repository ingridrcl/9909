'use client';

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

type Patient = Record<string, string>;
const anamnesis = [
  ['Keluhan Utama', 'Keluhan Utama'], ['Keluhan Tambahan', 'Keluhan Tambahan'],
  ['Riwayat Penyakit Sekarang', 'Riwayat Penyakit Sekarang'], ['Riwayat Penyakit Dahulu', 'Riwayat Penyakit Dahulu'],
  ['Riwayat Penyakit Keluarga', 'Riwayat Penyakit Keluarga'], ['Riwayat Pekerjaan', 'Riwayat Pekerjaan'],
  ['Status Sosial', 'Status Sosial'], ['Status Kejiwaan dan Kebiasaan', 'Status Kejiwaan dan Kebiasaan'],
];
const physical = ['Kepala', 'Mata', 'THT', 'Mulut', 'Gigi', 'Leher', 'Jantung', 'Dada dan Payudara', 'Perut', 'Urogenital', 'Anggota Gerak', 'Status Neurologis', 'Muskuloskeletal'];
const clinical = ['Laboratorium', 'Radiologi', 'Diagnosis Kerja', 'Diagnosis Banding', 'Terapi (Obat)', 'Planning'];
const val = (p: Patient, key: string) => p[key]?.trim() || '—';

export default function Assessment() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [index, setIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [inputMode, setInputMode] = useState<'excel' | 'text'>('excel');
  const [sourceText, setSourceText] = useState('');
  const [processingText, setProcessingText] = useState(false);
  const patient = patients[index];

  async function loadFile(file?: File) {
    if (!file) return;
    setError('');
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      const cleaned = rows.filter(row => Object.values(row).some(value => String(value).trim())).map(row =>
        Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), String(value ?? '').trim()])),
      );
      if (!cleaned.length) throw new Error('Tidak ada baris pasien pada sheet pertama. Pastikan baris pertama berisi judul kolom.');
      if (!cleaned.some(row => Object.keys(row).some(key => /nama pasien/i.test(key)))) throw new Error('Kolom “Nama Pasien” tidak ditemukan. Pastikan baris pertama berisi judul kolom.');
      setPatients(cleaned); setIndex(0); setFileName(file.name);
    } catch (e) { setError(e instanceof Error ? e.message : 'File Excel tidak dapat dibaca.'); }
  }
  async function parseClinicalText() {
    if (!sourceText.trim()) { setError('Tempel teks rekam medis terlebih dahulu.'); return; }
    setError(''); setProcessingText(true);
    try {
      const response = await fetch('/api/parse-assessment-text', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: sourceText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Teks tidak dapat diproses.');
      setPatients(data.patients); setIndex(0); setFileName(`Teks klinis · ${data.patients.length} pasien`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal memproses teks.'); }
    finally { setProcessingText(false); }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice('Tersalin ke clipboard'); }
    catch { setNotice('Clipboard tidak tersedia di browser ini'); }
    window.setTimeout(() => setNotice(''), 1800);
  }
  const displayName = patient ? `${val(patient, 'Nama Pasien')}${patient.Usia ? ` · ${patient.Usia}` : ''}` : '';
  const examRows = useMemo(() => {
    const rows = physical.map(part => ({ part, description: 'Dalam batas normal', normal: true }));
    const abnormal = val(patient || {}, 'Pemeriksaan Fisik Abnormal');
    if (abnormal !== '—') rows.push({ part: 'Temuan Abnormal', description: abnormal, normal: false });
    return rows;
  }, [patient]);

  return <div className="content assessment-content">
    <div className="page-heading"><div><div className="eyebrow"><span>03</span> TOOLKIT / KLINIS</div><h1>Assessment Awal<span className="heading-period">.</span></h1><p>Unggah Excel, lalu salin isian per bagian dan per pasien.</p></div><div className="heading-stamp assessment-stamp"><small>ASSESS<br/>DESK</small></div></div>
    <div className="assessment-input-tabs" role="tablist" aria-label="Sumber data assessment"><button type="button" role="tab" aria-selected={inputMode === 'excel'} className={inputMode === 'excel' ? 'selected' : ''} onClick={() => { setInputMode('excel'); setError(''); }}>Unggah Excel</button><button type="button" role="tab" aria-selected={inputMode === 'text'} className={inputMode === 'text' ? 'selected' : ''} onClick={() => { setInputMode('text'); setError(''); }}>Tempel teks klinis</button></div>
    {inputMode === 'excel' ? <label className="assessment-upload" htmlFor="assessment-file"><span className="upload-mark">↑</span><span><b>{fileName || 'Pilih file Excel pasien'}</b><small>Format .xlsx atau .xls · dibaca di browser</small></span><span className="secondary upload-button">Pilih file</span><input id="assessment-file" type="file" accept=".xlsx,.xls" onChange={e => loadFile(e.target.files?.[0])}/></label> : <div className="assessment-text-entry"><label htmlFor="clinical-text">Tempel SOAP, catatan IGD, atau data rekam medis. Bisa berisi beberapa pasien.</label><textarea id="clinical-text" value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder={'Contoh:\nNama: Ny. A\nS: Sesak napas sejak 2 hari...\nO: TD 120/80, nadi 90x/menit...\nA/: Pneumonia\nTerapi DPJP: ...\nPlanning: ...'} rows={8}/><div className="assessment-text-actions"><small>Teks dikirim ke API AI untuk dipetakan menjadi field assessment.</small><button type="button" className="primary" onClick={parseClinicalText} disabled={processingText || !sourceText.trim()}>{processingText ? <><span className="loader light small"/> Membaca teks…</> : <>Proses teks <span>↗</span></>}</button></div></div>}
    {error && <p className="error-text" role="alert">{error}</p>}
    {!patient ? <div className="assessment-empty"><span>▤</span><h2>Belum ada data pasien</h2><p>Unggah workbook dengan satu baris judul kolom dan satu pasien pada setiap baris.</p></div> : <>
      <div className="patient-switcher"><button className="secondary" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>← Sebelumnya</button><div className="patient-current"><small>PASIEN {index + 1} DARI {patients.length}</small><b>{displayName}</b></div><button className="secondary" onClick={() => setIndex(i => Math.min(patients.length - 1, i + 1))} disabled={index === patients.length - 1}>Berikutnya →</button></div>
      <section className="assessment-section"><div className="assessment-section-head"><div><span>A</span><h2>Anamnesa</h2></div><button className="secondary" onClick={() => copy(anamnesis.map(([label,key]) => `${label}\n${val(patient,key)}`).join('\n\n'))}>Salin bagian</button></div>
        {anamnesis.slice(0, 6).map(([label,key]) => <Field key={key} label={label} value={val(patient,key)} onCopy={copy}/>)}
        <Field label="Status Sosial" value={val(patient,'Status Sosial')} onCopy={copy}/>
        <div className="assessment-choice"><span>Status ekonomi</span><div>{['Cukup','Sedang','Tinggi'].map(x => <label key={x}><input type="radio" checked={val(patient,'Status Ekonomi').toLowerCase() === x.toLowerCase()} readOnly/> {x}</label>)}</div></div>
        <Field label="Status Kejiwaan dan Kebiasaan" value={val(patient,'Status Kejiwaan dan Kebiasaan')} onCopy={copy}/>
      </section>
      <section className="assessment-section"><div className="assessment-section-head"><div><span>B</span><h2>Pemeriksaan Umum</h2></div><button className="secondary" onClick={() => copy(['Kesadaran','Keadaan Umum','Tekanan Darah','Nadi','Suhu','Pernapasan','Status Gizi','Nyeri (VAS)'].map(k => `${k}: ${val(patient,k)}`).concat(examRows.map(r => `${r.part}: ${r.description}`)).join('\n'))}>Salin bagian</button></div>
        <div className="vitals-grid">{[['Kesadaran','Kesadaran'],['Keadaan Umum','Keadaan Umum'],['Tekanan Darah','Tekanan Darah'],['Nadi','Nadi'],['Suhu','Suhu'],['Pernapasan','Pernapasan'],['Status Gizi','Status Gizi'],['Nyeri (VAS)','Nyeri (VAS)']].map(([label,key]) => <Field key={key} label={label} value={val(patient,key)} onCopy={copy} compact/> )}</div>
        <div className="physical-table"><div className="physical-head"><span>Pemeriksaan Fisik</span><span>Normal</span><span>Deskripsi</span></div>{examRows.map(row => <div className="physical-row" key={row.part}><span>{row.part}</span><span><input aria-label={`${row.part} normal`} type="checkbox" checked={row.normal} readOnly/></span><div>{row.description}<button aria-label={`Salin ${row.part}`} onClick={() => copy(row.description)}><CopyIcon/></button></div></div>)}</div>
      </section>
      <section className="assessment-section"><div className="assessment-section-head"><div><span>C</span><h2>Pemeriksaan Penunjang & Rencana</h2></div><button className="secondary" onClick={() => copy(clinical.map(k => `${k}\n${val(patient,k)}`).join('\n\n'))}>Salin bagian</button></div><div className="clinical-fields">{clinical.map(k => <Field key={k} label={k} value={val(patient,k)} onCopy={copy}/>)}</div></section>
    </>}
    {notice && <div className="toast">✓ &nbsp; {notice}</div>}
  </div>;
}

function Field({ label, value, onCopy, compact = false }: { label: string; value: string; onCopy: (text: string) => void; compact?: boolean }) {
  return <div className={`assessment-field ${compact ? 'compact' : ''}`}><label>{label}</label><div className="assessment-value">{value}<button aria-label={`Salin ${label}`} onClick={() => onCopy(value)}><CopyIcon/></button></div></div>;
}
function CopyIcon() { return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M16 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.7"/></svg>; }
