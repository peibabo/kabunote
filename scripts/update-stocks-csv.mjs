import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JPX_URL =
  'https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xlsx';
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data', 'stocks.csv');

// 規模コード: 1=TOPIX Core30, 2=TOPIX Large70, 4=TOPIX Mid400（合わせて TOPIX500）
const TOPIX500_SCALE_CODES = new Set(['1', '2', '4']);

async function main() {
  console.log('Downloading JPX data...');
  const res = await fetch(JPX_URL);
  if (!res.ok) {
    throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();

  console.log('Parsing Excel...');
  const workbook = XLSX.read(buf, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Skip header row (row 0)
  const stocks = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[1]) continue;

    const code = String(row[1]).trim();
    const name = String(row[2] ?? '').trim();
    // Remove parenthetical suffixes: "プライム（内国株式）" → "プライム"
    const sectorRaw = String(row[3] ?? '').trim();
    const sector = sectorRaw.replace(/（.*?）/g, '').trim();
    const market = String(row[5] ?? '-').trim() || '-';
    // 呼値の単位判定に使用
    const topix500 = TOPIX500_SCALE_CODES.has(String(row[8] ?? '').trim()) ? '1' : '0';

    stocks.push({ code, name, sector, market, topix500 });
  }

  // Sort by code (same order as existing CSV)
  stocks.sort((a, b) => a.code.localeCompare(b.code));

  // Build CSV
  const header = 'code,name,sector,market,topix500';
  const lines = stocks.map((s) => {
    // Escape fields containing commas or quotes
    const escapeCsv = (val) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    return [s.code, s.name, s.sector, s.market, s.topix500].map(escapeCsv).join(',');
  });
  const csv = [header, ...lines].join('\n') + '\n';

  writeFileSync(OUTPUT_PATH, csv, 'utf-8');
  console.log(`Written ${stocks.length} stocks to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
