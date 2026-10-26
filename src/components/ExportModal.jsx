import { useEffect, useState } from 'react';
import { downloadFile, keysForRange, summaryText, workbookFile } from '../exportExcel.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';

const RANGES = [
  { key: 'semana', label: 'Últimos 7 días' },
  { key: '30', label: 'Últimos 30 días' },
  { key: 'mes', label: 'Mes actual' },
  { key: 'todo', label: 'Todo el historial' },
];

export default function ExportModal({ data, onClose }) {
  const [range, setRange] = useState('mes');
  const [msg, setMsg] = useState('');
  const keys = keysForRange(data, range);
  const text = summaryText(data, keys);
  const empty = keys.length === 0;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const openWhatsAppText = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const shareWhatsApp = async () => {
    const file = workbookFile(data, keys);
    // En el móvil: hoja de compartir nativa con el archivo (elige WhatsApp)
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Mis hábitos', text });
        setMsg('¡Listo! Archivo compartido.');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    // En escritorio: se descarga el Excel y se abre WhatsApp para adjuntarlo
    downloadFile(file);
    openWhatsAppText();
    setMsg(`Se descargó “${file.name}”. Adjúntalo en el chat de WhatsApp que se abrió (📎 → Documento).`);
  };

  const download = () => {
    const file = workbookFile(data, keys);
    downloadFile(file);
    setMsg(`Descargado “${file.name}”.`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" role="dialog" aria-modal="true" aria-labelledby="exp-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 id="exp-title">Exportar datos</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <label className="field-label">Periodo</label>
        <div className="chips">
          {RANGES.map((r) => (
            <button key={r.key} className={`chip ${range === r.key ? 'active' : ''}`} onClick={() => { setRange(r.key); setMsg(''); }}>
              {r.label}
            </button>
          ))}
        </div>

        <label className="field-label">Vista previa del mensaje</label>
        <pre className="preview">{text}</pre>

        <div className="modal-actions">
          <button className="btn btn-whatsapp" onClick={shareWhatsApp} disabled={empty}>
            <WhatsAppIcon /> Enviar Excel por WhatsApp
          </button>
          <button className="btn btn-primary" onClick={download} disabled={empty}>⬇ Descargar Excel</button>
          <button className="btn btn-ghost" onClick={openWhatsAppText} disabled={empty}>Solo enviar resumen</button>
        </div>
        {msg && <p className="toast-msg">{msg}</p>}
      </div>
    </div>
  );
}
