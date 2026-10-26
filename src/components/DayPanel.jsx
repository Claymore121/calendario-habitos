import { HABITS, formatLong, isSameDay } from '../utils.js';

export default function DayPanel({ date, entry, onChange, onClear }) {
  const done = HABITS.filter((h) => entry[h.key] === true).length;
  const isToday = isSameDay(date, new Date());

  return (
    <section className="card day-panel">
      <div className="day-head">
        <div>
          <span className="eyebrow">{isToday ? 'Hoy' : 'Día seleccionado'}</span>
          <h3>{formatLong(date)}</h3>
        </div>
        <div className="ring" style={{ '--p': (done / HABITS.length) * 100 }}>
          <span>{done}/{HABITS.length}</span>
        </div>
      </div>

      <div className="habit-list">
        {HABITS.map((h) => {
          const v = entry[h.key];
          return (
            <div key={h.key} className="habit-row" style={{ '--accent': h.color }}>
              <div className="habit-info">
                <span className="habit-icon">{h.icon}</span>
                <span className="habit-name">{h.label}</span>
              </div>
              <div className="yesno">
                <button
                  className={`yn yes ${v === true ? 'on' : ''}`}
                  onClick={() => onChange(h.key, v === true ? null : true)}
                  aria-pressed={v === true}
                >
                  ✓ Sí
                </button>
                <button
                  className={`yn no ${v === false ? 'on' : ''}`}
                  onClick={() => onChange(h.key, v === false ? null : false)}
                  aria-pressed={v === false}
                >
                  ✕ No
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="day-foot">
        <button className="btn btn-ghost btn-sm" onClick={() => HABITS.forEach((h) => onChange(h.key, true))}>
          Marcar todo Sí
        </button>
        {Object.keys(entry).length > 0 && (
          <button className="btn btn-ghost btn-sm danger" onClick={onClear}>Limpiar día</button>
        )}
      </div>
      <p className="hint">Toca de nuevo una opción para desmarcarla. Se guarda automáticamente.</p>
    </section>
  );
}
