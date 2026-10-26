export const HABITS = [
  { key: 'vitalidad', label: 'Vitalidad', icon: '⚡', color: 'var(--c-vitalidad)' },
  { key: 'medicamento', label: 'Medicamento', icon: '💊', color: 'var(--c-medicamento)' },
  { key: 'ejercicio', label: 'Ejercicio / Creatina', short: 'Ejercicio', icon: '💪', color: 'var(--c-ejercicio)' },
];

// Mismos valores que --c-* en styles.css (Recharts necesita colores literales)
export const PALETTE = {
  light: { vitalidad: '#f59e0b', medicamento: '#6366f1', ejercicio: '#10b981', grid: '#e7e9f0', axis: '#8a90a2', no: '#f43f5e' },
  dark: { vitalidad: '#fbbf24', medicamento: '#818cf8', ejercicio: '#34d399', grid: '#262a36', axis: '#7d8396', no: '#fb7185' },
};

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const WEEKDAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const pad = (n) => String(n).padStart(2, '0');

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Lunes como primer día de la semana
export const startOfWeek = (d) => addDays(d, -((d.getDay() + 6) % 7));

export const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

export const formatLong = (d) =>
  `${WEEKDAYS_LONG[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;

export const formatShort = (d) => `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}`;

export const isSameDay = (a, b) => toKey(a) === toKey(b);

/** Devuelve { si, no, total } de un hábito en un rango de keys */
export function countHabit(data, keys, habit) {
  let si = 0;
  let no = 0;
  for (const k of keys) {
    const v = data[k]?.[habit];
    if (v === true) si++;
    else if (v === false) no++;
  }
  return { si, no, total: si + no };
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

export function rangeKeys(start, count) {
  return Array.from({ length: count }, (_, i) => toKey(addDays(start, i)));
}

/** Racha actual de días consecutivos (hasta hoy o ayer) con el hábito en "sí" */
export function currentStreak(data, habit, today = new Date()) {
  let d = today;
  if (data[toKey(d)]?.[habit] !== true) d = addDays(d, -1);
  let n = 0;
  while (data[toKey(d)]?.[habit] === true) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function bestStreak(data, habit) {
  const keys = Object.keys(data).filter((k) => data[k]?.[habit] === true).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const k of keys) {
    const d = fromKey(k);
    run = prev && isSameDay(addDays(prev, 1), d) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Días del rango que ya ocurrieron (para no contar días futuros en los porcentajes) */
export const elapsedCount = (keys, today = new Date()) => {
  const t = toKey(today);
  return keys.filter((k) => k <= t).length;
};
