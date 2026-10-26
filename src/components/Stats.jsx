import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  HABITS, MONTHS, PALETTE, WEEKDAYS_SHORT, addDays, bestStreak, countHabit, currentStreak,
  daysInMonth, elapsedCount, formatShort, fromKey, pct, rangeKeys, startOfWeek, toKey,
} from '../utils.js';

const MODES = [
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Año' },
];

export default function Stats({ data, theme }) {
  const [mode, setMode] = useState('semana');
  const [anchor, setAnchor] = useState(() => new Date());
  const colors = PALETTE[theme] || PALETTE.light;

  const move = (delta) => {
    if (mode === 'semana') setAnchor(addDays(anchor, delta * 7));
    else if (mode === 'mes') setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));
    else setAnchor(new Date(anchor.getFullYear() + delta, 0, 1));
  };

  const period = useMemo(() => {
    if (mode === 'semana') {
      const start = startOfWeek(anchor);
      return { keys: rangeKeys(start, 7), title: `${formatShort(start)} – ${formatShort(addDays(start, 6))} ${addDays(start, 6).getFullYear()}` };
    }
    if (mode === 'mes') {
      const y = anchor.getFullYear();
      const m = anchor.getMonth();
      return { keys: rangeKeys(new Date(y, m, 1), daysInMonth(y, m)), title: `${MONTHS[m]} ${y}` };
    }
    const y = anchor.getFullYear();
    const start = new Date(y, 0, 1);
    const days = Math.round((new Date(y + 1, 0, 1) - start) / 864e5);
    return { keys: rangeKeys(start, days), title: `${y}` };
  }, [mode, anchor]);

  const chartData = useMemo(() => {
    if (mode === 'semana') {
      return period.keys.map((k, i) => {
        const e = data[k] || {};
        const row = { name: WEEKDAYS_SHORT[i] };
        HABITS.forEach((h) => { row[h.key] = e[h.key] === true ? 1 : 0; });
        return row;
      });
    }
    if (mode === 'mes') {
      // Agrupar por semanas (lunes a domingo) dentro del mes
      const groups = [];
      period.keys.forEach((k) => {
        const wk = toKey(startOfWeek(fromKey(k)));
        let g = groups.find((x) => x.wk === wk);
        if (!g) groups.push((g = { wk, keys: [] }));
        g.keys.push(k);
      });
      return groups.map((g, i) => {
        const row = { name: `Sem ${i + 1}` };
        HABITS.forEach((h) => { row[h.key] = pct(countHabit(data, g.keys, h.key).si, elapsedCount(g.keys)); });
        return row;
      });
    }
    const y = anchor.getFullYear();
    return MONTHS.map((mName, m) => {
      const keys = rangeKeys(new Date(y, m, 1), daysInMonth(y, m));
      const row = { name: mName.slice(0, 3) };
      HABITS.forEach((h) => { row[h.key] = pct(countHabit(data, keys, h.key).si, elapsedCount(keys)); });
      return row;
    });
  }, [mode, period, data, anchor]);

  // Línea diaria del mes: hábitos cumplidos por día
  const dailyLine = useMemo(() => {
    if (mode !== 'mes') return [];
    return period.keys.map((k) => {
      const e = data[k] || {};
      return { name: Number(k.slice(8)), total: HABITS.filter((h) => e[h.key] === true).length };
    });
  }, [mode, period, data]);

  const totals = HABITS.map((h) => ({ ...h, ...countHabit(data, period.keys, h.key) }));
  const totalSi = totals.reduce((a, t) => a + t.si, 0);
  const totalNo = totals.reduce((a, t) => a + t.no, 0);
  const possible = elapsedCount(period.keys) * HABITS.length;
  const pie = [
    { name: 'Sí', value: totalSi, color: colors.ejercicio },
    { name: 'No', value: totalNo, color: colors.no },
    { name: 'Sin registro', value: Math.max(possible - totalSi - totalNo, 0), color: colors.grid },
  ];
  const elapsed = elapsedCount(period.keys);
  const fullDays = period.keys.filter((k) => HABITS.every((h) => data[k]?.[h.key] === true)).length;

  const axis = { stroke: colors.axis, fontSize: 12, tickLine: false, axisLine: false };
  const tooltip = {
    contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', boxShadow: 'var(--shadow)' },
    cursor: { fill: colors.grid, opacity: 0.5 },
  };

  return (
    <div className="stats">
      <div className="card stats-toolbar">
        <div className="segmented">
          {MODES.map((m) => (
            <button key={m.key} className={mode === m.key ? 'active' : ''} onClick={() => setMode(m.key)}>{m.label}</button>
          ))}
        </div>
        <div className="period-nav">
          <button className="icon-btn" onClick={() => move(-1)} aria-label="Anterior">‹</button>
          <strong>{period.title}</strong>
          <button className="icon-btn" onClick={() => move(1)} aria-label="Siguiente">›</button>
        </div>
      </div>

      <div className="kpis">
        {totals.map((t) => (
          <div key={t.key} className="card kpi" style={{ '--accent': t.color }}>
            <div className="kpi-top">
              <span className="habit-icon">{t.icon}</span>
              <span>{t.label}</span>
            </div>
            <div className="kpi-value">{pct(t.si, elapsed)}<small>%</small></div>
            <div className="bar"><span style={{ width: `${pct(t.si, elapsed)}%` }} /></div>
            <div className="kpi-meta">
              <span>✓ {t.si} sí</span><span>✕ {t.no} no</span>
              <span>🔥 {currentStreak(data, t.key)} racha · máx {bestStreak(data, t.key)}</span>
            </div>
          </div>
        ))}
        <div className="card kpi" style={{ '--accent': 'var(--primary)' }}>
          <div className="kpi-top"><span className="habit-icon">🏆</span><span>Días perfectos</span></div>
          <div className="kpi-value">{fullDays}<small>/{elapsed}</small></div>
          <div className="bar"><span style={{ width: `${pct(fullDays, elapsed)}%` }} /></div>
          <div className="kpi-meta"><span>Los 3 hábitos en “Sí”</span></div>
        </div>
      </div>

      <div className="charts">
        <div className="card chart-card wide">
          <h3>
            {mode === 'semana' && 'Hábitos cumplidos por día'}
            {mode === 'mes' && 'Cumplimiento por semana (%)'}
            {mode === 'anio' && 'Cumplimiento por mes (%)'}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            {mode === 'anio' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={colors.grid} vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis domain={[0, 100]} {...axis} unit="%" />
                <Tooltip {...tooltip} formatter={(v) => `${v}%`} />
                <Legend />
                {HABITS.map((h) => (
                  <Line key={h.key} type="monotone" dataKey={h.key} name={h.short || h.label} stroke={colors[h.key]} strokeWidth={2.5} dot={{ r: 3 }} />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={colors.grid} vertical={false} />
                <XAxis dataKey="name" {...axis} />
                {mode === 'semana'
                  ? <YAxis allowDecimals={false} domain={[0, 3]} ticks={[0, 1, 2, 3]} {...axis} />
                  : <YAxis domain={[0, 100]} {...axis} unit="%" />}
                <Tooltip
                  {...tooltip}
                  formatter={(v) => (mode === 'semana' ? (v ? 'Sí' : 'No / —') : `${v}%`)}
                />
                <Legend />
                {HABITS.map((h, i) => (
                  <Bar
                    key={h.key}
                    dataKey={h.key}
                    name={h.short || h.label}
                    fill={colors[h.key]}
                    stackId={mode === 'semana' ? 'a' : undefined}
                    radius={mode === 'semana' ? (i === HABITS.length - 1 ? [6, 6, 0, 0] : 0) : [6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Distribución de respuestas</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="none">
                {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
              </Pie>
              <Tooltip {...tooltip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Sí vs No por hábito</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={totals.map((t) => ({ name: t.short || t.label, Sí: t.si, No: t.no }))} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid stroke={colors.grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axis} />
              <YAxis type="category" dataKey="name" width={80} {...axis} />
              <Tooltip {...tooltip} />
              <Legend />
              <Bar dataKey="Sí" fill={colors.ejercicio} radius={[0, 6, 6, 0]} maxBarSize={22} />
              <Bar dataKey="No" fill={colors.no} radius={[0, 6, 6, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {mode === 'mes' && (
          <div className="card chart-card wide">
            <h3>Hábitos cumplidos cada día del mes</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyLine} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={colors.grid} vertical={false} />
                <XAxis dataKey="name" {...axis} interval={1} />
                <YAxis allowDecimals={false} domain={[0, 3]} ticks={[0, 1, 2, 3]} {...axis} />
                <Tooltip {...tooltip} labelFormatter={(l) => `Día ${l}`} formatter={(v) => [`${v} de 3`, 'Cumplidos']} />
                <Line type="monotone" dataKey="total" stroke={colors.medicamento} strokeWidth={2.5} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
