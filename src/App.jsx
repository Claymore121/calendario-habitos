import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage.js';
import { toKey } from './utils.js';
import Calendar from './components/Calendar.jsx';
import DayPanel from './components/DayPanel.jsx';
import Stats from './components/Stats.jsx';
import ExportModal from './components/ExportModal.jsx';
import WhatsAppIcon from './components/WhatsAppIcon.jsx';

export default function App() {
  const [data, setData] = useLocalStorage('habitos:data', {});
  const [theme, setTheme] = useLocalStorage('habitos:theme', 'light');
  const [tab, setTab] = useState('calendario');
  const [selected, setSelected] = useState(() => new Date());
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f1117' : '#f6f7fb');
  }, [theme]);

  // value: true (sí), false (no) o null (sin registrar)
  const setHabit = (date, habit, value) => {
    const key = toKey(date);
    setData((prev) => {
      const day = { ...(prev[key] || {}) };
      if (value === null) delete day[habit];
      else day[habit] = value;
      const next = { ...prev };
      if (Object.keys(day).length) next[key] = day;
      else delete next[key];
      return next;
    });
  };

  const clearDay = (date) => {
    setData((prev) => {
      const next = { ...prev };
      delete next[toKey(date)];
      return next;
    });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">✓</span>
          <div>
            <h1>Mis Hábitos</h1>
            <p>Registro diario</p>
          </div>
        </div>

        <nav className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'calendario'} className={tab === 'calendario' ? 'active' : ''} onClick={() => setTab('calendario')}>
            📅 <span>Calendario</span>
          </button>
          <button role="tab" aria-selected={tab === 'estadisticas'} className={tab === 'estadisticas' ? 'active' : ''} onClick={() => setTab('estadisticas')}>
            📊 <span>Estadísticas</span>
          </button>
        </nav>

        <div className="actions">
          <button className="btn btn-whatsapp" onClick={() => setExportOpen(true)} title="Exportar a Excel / WhatsApp">
            <WhatsAppIcon /> <span>Exportar</span>
          </button>
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main>
        {tab === 'calendario' ? (
          <div className="calendar-layout">
            <Calendar data={data} selected={selected} onSelect={setSelected} />
            <DayPanel
              date={selected}
              entry={data[toKey(selected)] || {}}
              onChange={(habit, value) => setHabit(selected, habit, value)}
              onClear={() => clearDay(selected)}
            />
          </div>
        ) : (
          <Stats data={data} theme={theme} />
        )}
      </main>

      {exportOpen && <ExportModal data={data} onClose={() => setExportOpen(false)} />}
    </div>
  );
}
