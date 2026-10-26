import { useState } from 'react';
import { HABITS, MONTHS, WEEKDAYS_SHORT, daysInMonth, isSameDay, toKey } from '../utils.js';

export default function Calendar({ data, selected, onSelect }) {
  const [view, setView] = useState(() => ({ y: selected.getFullYear(), m: selected.getMonth() }));
  const today = new Date();

  const first = new Date(view.y, view.m, 1);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const total = daysInMonth(view.y, view.m);
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => new Date(view.y, view.m, i + 1)),
  ];

  const move = (delta) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const goToday = () => {
    setView({ y: today.getFullYear(), m: today.getMonth() });
    onSelect(today);
  };

  // Resumen del mes visible
  let fullDays = 0;
  let logged = 0;
  for (let i = 1; i <= total; i++) {
    const e = data[toKey(new Date(view.y, view.m, i))];
    if (!e) continue;
    logged++;
    if (HABITS.every((h) => e[h.key] === true)) fullDays++;
  }

  return (
    <section className="card calendar">
      <div className="cal-header">
        <button className="icon-btn" onClick={() => move(-1)} aria-label="Mes anterior">‹</button>
        <div className="cal-title">
          <h2>{MONTHS[view.m]} <span>{view.y}</span></h2>
          <small>{logged} días registrados · {fullDays} completos</small>
        </div>
        <button className="icon-btn" onClick={() => move(1)} aria-label="Mes siguiente">›</button>
      </div>
      <button className="btn btn-ghost btn-sm today-btn" onClick={goToday}>Hoy</button>

      <div className="cal-grid">
        {WEEKDAYS_SHORT.map((w) => (
          <div key={w} className="cal-weekday">{w}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="cal-cell empty" />;
          const e = data[toKey(d)] || {};
          const done = HABITS.filter((h) => e[h.key] === true).length;
          const isFuture = d > today && !isSameDay(d, today);
          const cls = [
            'cal-cell',
            isSameDay(d, today) && 'today',
            isSameDay(d, selected) && 'selected',
            done === HABITS.length && 'complete',
            isFuture && 'future',
          ].filter(Boolean).join(' ');
          return (
            <button key={toKey(d)} className={cls} onClick={() => onSelect(d)} aria-label={`Día ${d.getDate()}`}>
              <span className="cal-num">{d.getDate()}</span>
              <span className="cal-dots">
                {HABITS.map((h) => (
                  <i
                    key={h.key}
                    className={`dot ${e[h.key] === true ? 'yes' : e[h.key] === false ? 'no' : ''}`}
                    style={{ '--dot': h.color }}
                    title={`${h.label}: ${e[h.key] === true ? 'Sí' : e[h.key] === false ? 'No' : '—'}`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="legend">
        {HABITS.map((h) => (
          <span key={h.key}><i className="dot yes" style={{ '--dot': h.color }} /> {h.short || h.label}</span>
        ))}
        <span><i className="dot no" /> No</span>
      </div>
    </section>
  );
}
