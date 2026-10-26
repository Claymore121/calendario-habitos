import * as XLSX from 'xlsx';
import { HABITS, MONTHS, WEEKDAYS_LONG, addDays, countHabit, daysInMonth, elapsedCount, fromKey, pct, rangeKeys, toKey } from './utils.js';

/** Devuelve las keys (yyyy-mm-dd) del rango elegido */
export function keysForRange(data, range, today = new Date()) {
  if (range === 'mes') {
    return rangeKeys(new Date(today.getFullYear(), today.getMonth(), 1), daysInMonth(today.getFullYear(), today.getMonth()));
  }
  if (range === '30') return rangeKeys(addDays(today, -29), 30);
  if (range === 'semana') return rangeKeys(addDays(today, -6), 7);
  // Todo: desde el primer registro hasta hoy
  const keys = Object.keys(data).sort();
  if (!keys.length) return [];
  const first = fromKey(keys[0]);
  const last = fromKey(keys[keys.length - 1]) > today ? fromKey(keys[keys.length - 1]) : today;
  return rangeKeys(first, Math.round((last - first) / 864e5) + 1);
}

const yn = (v) => (v === true ? 'Sí' : v === false ? 'No' : '');

export function buildWorkbook(data, keys) {
  const wb = XLSX.utils.book_new();

  // Hoja 1: registros diarios
  const rows = [['Fecha', 'Día', ...HABITS.map((h) => h.label), 'Cumplidos']];
  keys.forEach((k) => {
    const e = data[k] || {};
    const d = fromKey(k);
    rows.push([
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`,
      WEEKDAYS_LONG[d.getDay()],
      ...HABITS.map((h) => yn(e[h.key])),
      `${HABITS.filter((h) => e[h.key] === true).length}/${HABITS.length}`,
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 12 }, { wch: 11 }, ...HABITS.map(() => ({ wch: 20 })), { wch: 11 }];
  ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(rows[0].length - 1)}${rows.length}` };
  XLSX.utils.book_append_sheet(wb, ws, 'Registros');

  // Hoja 2: resumen por mes
  const months = [...new Set(keys.map((k) => k.slice(0, 7)))];
  const sum = [['Mes', 'Días', ...HABITS.flatMap((h) => [`${h.label} Sí`, `${h.label} No`, `${h.label} %`])]];
  months.forEach((ym) => {
    const mk = keys.filter((k) => k.startsWith(ym));
    const [y, m] = ym.split('-').map(Number);
    sum.push([
      `${MONTHS[m - 1]} ${y}`,
      mk.length,
      ...HABITS.flatMap((h) => {
        const c = countHabit(data, mk, h.key);
        return [c.si, c.no, `${pct(c.si, elapsedCount(mk))}%`];
      }),
    ]);
  });
  const ws2 = XLSX.utils.aoa_to_sheet(sum);
  ws2['!cols'] = [{ wch: 16 }, { wch: 6 }, ...HABITS.flatMap(() => [{ wch: 14 }, { wch: 14 }, { wch: 12 }])];
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen mensual');

  return wb;
}

export function workbookFile(data, keys) {
  const wb = buildWorkbook(data, keys);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const name = `habitos_${toKey(new Date())}.xlsx`;
  const type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return new File([buf], name, { type });
}

export function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Texto de resumen para WhatsApp */
export function summaryText(data, keys) {
  if (!keys.length) return 'Sin registros todavía.';
  const a = fromKey(keys[0]);
  const b = fromKey(keys[keys.length - 1]);
  const f = (d) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const lines = [`*Resumen de hábitos* 📅 ${f(a)} – ${f(b)}`, ''];
  HABITS.forEach((h) => {
    const c = countHabit(data, keys, h.key);
    lines.push(`${h.icon} *${h.label}:* ${c.si} sí / ${c.no} no (${pct(c.si, elapsedCount(keys))}%)`);
  });
  const perfect = keys.filter((k) => HABITS.every((h) => data[k]?.[h.key] === true)).length;
  lines.push('', `🏆 Días perfectos: ${perfect} de ${elapsedCount(keys)}`);
  return lines.join('\n');
}
