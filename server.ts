import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

interface ManagementBriefPayload {
  periodLabel: string;
  occupancyPercent: number;
  onTimePerformancePercent: number;
  totalTrips: number;
  totalPassengers: number;
  ikmScore: number;
  noShowRatePercent: number;
  peakHoursSummary: string;
  weekendDemandPercent: number;
  weekdayDemandPercent: number;
  segmentBreakdown: Array<{ segment: string; percentage: number; trips: number }>;
  topRoutes: Array<{ routeName: string; percentage: number }>;
  accessConstrainedCount: number;
  maintenanceStopCount: number;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'dolan-darjo-api' });
  });

  app.post('/api/analytics/management-brief', async (req: Request, res: Response) => {
    const payload = req.body as ManagementBriefPayload | undefined;
    if (!payload || !payload.periodLabel) {
      res.status(400).json({
        error: 'Data metrik operasional tidak lengkap untuk disintesis.',
      });
      return;
    }

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch {
      res.status(503).json({
        error:
          'GEMINI_API_KEY belum dikonfigurasi pada Settings > Secrets. Silakan atur API key untuk menjalankan AI Insight & Recommendation Engine secara real-time.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const prompt = `Anda adalah Analis Kebijakan Transportasi Pariwisata senior untuk Dinas Kepemudaan, Olahraga, dan Pariwisata (Disporapar) Kabupaten Sidoarjo.
Buatlah ringkasan naratif eksekutif (Management Brief) berbahasa Indonesia yang formal, ringkas, berbasis data, dan langsung dapat ditindaklanjuti oleh Kepala Disporapar & Admin Sistem berdasarkan metrik aktual DOLAN DARJO berikut:

- Periode Evaluasi: ${payload.periodLabel}
- Utilisasi Armada Bus City Tour: ${payload.occupancyPercent}% (${payload.totalTrips} perjalanan, ${payload.totalPassengers} penumpang)
- On-Time Performance (Ketepatan Waktu): ${payload.onTimePerformancePercent}%
- Indeks Kepuasan Masyarakat (IKM): ${payload.ikmScore} / 5.0
- Tingkat Pembatalan Mendadak (No-Show): ${payload.noShowRatePercent}%
- Profil Jam Puncak (Peak Hours): ${payload.peakHoursSummary}
- Utilisasi Hari Kerja vs Akhir Pekan: Hari Kerja ${payload.weekdayDemandPercent}% vs Akhir Pekan ${payload.weekendDemandPercent}%
- Komposisi Segmen Pemohon: ${payload.segmentBreakdown.map((s) => `${s.segment} (${s.percentage}%, ${s.trips} trip)`).join('; ')}
- Rute ODL Paling Diminati: ${payload.topRoutes.map((r) => `${r.routeName} (${r.percentage}%)`).join('; ')}
- Titik Destinasi Terkendala Akses Bus Besar: ${payload.accessConstrainedCount} lokasi (butuh shuttle/drop-off)
- Armada Dalam Maintenance / Stop Operasi: ${payload.maintenanceStopCount} unit

Hasilkan output JSON terstruktur yang mencakup:
1. executiveSummary: Ringkasan eksekutif 2-3 kalimat mengenai kinerja keseluruhan.
2. peakHoursAnalysis: Analisis pola jam puncak (pagi rombongan sekolah vs akhir pekan) dan optimasi slot penjemputan.
3. weekendFleetRecommendation: Rekomendasi spesifik penambahan/realokasi unit armada di akhir pekan berdasarkan rasio okupansi akhir pekan vs hari kerja.
4. topRoutesAnalysis: Identifikasi rute ODL terpopuler masyarakat Sidoarjo dan potensi pengembangannya.
5. actionItems: Daftar 3-4 poin rekomendasi kebijakan konkret bagi Pimpinan Disporapar dan Dishub/mitra.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Gunakan bahasa birokrasi modern yang lugas, akurat, profesional khas Pemerintah Kabupaten Sidoarjo, serta hindari kalimat bertele-tele.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              peakHoursAnalysis: { type: Type.STRING },
              weekendFleetRecommendation: { type: Type.STRING },
              topRoutesAnalysis: { type: Type.STRING },
              actionItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'executiveSummary',
              'peakHoursAnalysis',
              'weekendFleetRecommendation',
              'topRoutesAnalysis',
              'actionItems',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json({
        ...parsed,
        generatedAt: new Date().toISOString(),
        model: 'gemini-4-hydrogen',
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Gagal memproses AI Management Brief dari layanan Gemini.';
      res.status(502).json({
        error: `Layanan AI Insight mengalami kendala: ${message}`,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';

    if (hmrDisabled) {
      app.get('/@vite/client', (_req: Request, res: Response) => {
        res.type('application/javascript').send(`
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if (typeof document !== 'undefined') {
  document.querySelectorAll('style[data-vite-dev-id]').forEach((el) => {
    sheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id="' + CSS.escape(id) + '"]').forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    decline() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}
export class ErrorOverlay {
  constructor() {}
  close() {}
}
`);
      });
    }

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        allowedHosts: true,
        ws: hmrDisabled ? false : { server: httpServer },
        hmr: hmrDisabled ? false : true,
        watch: hmrDisabled ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`DOLAN DARJO server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DOLAN DARJO server:', err);
  process.exit(1);
});
