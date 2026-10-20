import { NextRequest, NextResponse } from 'next/server';
import { hasSession, openAI, unauthorized } from '../_lib';
export const maxDuration = 60;
const fields=['tindakan','indikasi','tataCara','tujuan','risiko','komplikasi','prognosis','alternatifRisiko'] as const;
const system=`Anda adalah asisten yang membuat draft template persetujuan tindakan kedokteran (informed consent) berdasarkan nama tindakan yang diberikan. Draft akan diverifikasi ulang oleh dokter penanggung jawab sebelum dipakai ke pasien, jadi buat seakurat dan sesingkat mungkin.\n\nWAJIB balas hanya dengan JSON valid tanpa markdown, struktur tepat: {"tindakan":"nama tindakan sesuai input, boleh dirapikan ejaannya","indikasi":"kondisi/diagnosis yang membuat tindakan ini diperlukan, singkat","tataCara":"ringkas dalam SATU kalimat saja, gambaran umum langkah tindakan","tujuan":"tujuan utama tindakan bagi pasien","risiko":"risiko yang mungkin terjadi selama/segera setelah tindakan, dipisah koma","komplikasi":"komplikasi yang mungkin timbul kemudian, dipisah koma","prognosis":"HARUS persis salah satu dari: Dubia, Dubia ad bonam, Dubia ad malam, Malam","alternatifRisiko":"pilihan tindakan/terapi lain beserta risikonya bila alternatif tersebut dipilih, singkat"}.\n\nATURAN: Bahasa Indonesia, istilah medis baku boleh digunakan. Prognosis harus persis salah satu pilihan di atas. Setiap field satu baris singkat (risiko/komplikasi/alternatif dipisah koma). Jika tindakan ambigu atau sangat jarang, tetap buat draft dengan asumsi paling umum. Jangan isi field diagnosis atau cara diagnosis, karena aplikasi menetapkannya dari input.`;
export async function POST(req: NextRequest) {
  if (!hasSession(req)) return unauthorized();
  const {diagnosis,procedure}=await req.json().catch(()=>({}));
  if (typeof procedure!=='string'||!procedure.trim()) return NextResponse.json({error:'Nama tindakan wajib diisi.'},{status:400});
  if (procedure.length>500||typeof diagnosis!=='string'||diagnosis.length>1000) return NextResponse.json({error:'Input terlalu panjang.'},{status:413});
  try {
    const raw=await openAI(system,`Diagnosis: ${diagnosis.trim()||'(kosong)'}\nNama tindakan: ${procedure.trim()}`,true);
    const parsed=JSON.parse(raw);
    for (const key of fields) if (typeof parsed[key]!=='string') throw new Error('Respons AI tidak lengkap. Coba ulangi.');
    const prognosis=['Dubia','Dubia ad bonam','Dubia ad malam','Malam']; if (!prognosis.includes(parsed.prognosis)) parsed.prognosis='Dubia';
    return NextResponse.json({result:parsed});
  } catch(e) { return NextResponse.json({error:e instanceof Error?e.message:'Terjadi kesalahan saat menghubungi OpenAI.'},{status:502}); }
}
