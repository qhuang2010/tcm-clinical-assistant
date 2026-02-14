import React, { useCallback, useRef, useState } from 'react';

/**
 * Reusable medicine card grid component.
 * Props:
 *   medicines: [{id, name, dosage}, ...]
 *   onChange: (newMedicines) => void
 *   readOnly: boolean (optional)
 */
const MedicineInput = ({ medicines = [], onChange, readOnly = false }) => {
  const gridRef = useRef(null);
  const dragIndex = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const addMedicine = useCallback(() => {
    onChange([...medicines, { id: Date.now(), name: '', dosage: '' }]);
  }, [medicines, onChange]);

  const updateMedicine = useCallback((id, field, value) => {
    onChange(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
  }, [medicines, onChange]);

  const removeMedicine = useCallback((id) => {
    onChange(medicines.filter(m => m.id !== id));
  }, [medicines, onChange]);

  const handleDosageKeyDown = useCallback((e, index) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      if (index === medicines.length - 1) {
        e.preventDefault();
        const newMed = { id: Date.now(), name: '', dosage: '' };
        onChange([...medicines, newMed]);
        setTimeout(() => {
          if (!gridRef.current) return;
          const names = gridRef.current.querySelectorAll('.med-card-name');
          const last = names[names.length - 1];
          if (last) last.focus();
        }, 0);
      } else {
        e.preventDefault();
        if (!gridRef.current) return;
        const names = gridRef.current.querySelectorAll('.med-card-name');
        if (names[index + 1]) names[index + 1].focus();
      }
    }
  }, [medicines, onChange]);

  const handleDragStart = useCallback((e, index) => {
    dragIndex.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image slightly transparent
    requestAnimationFrame(() => {
      e.target.closest('.med-card')?.classList.add('med-card-dragging');
    });
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e, dropIdx) => {
    e.preventDefault();
    const fromIdx = dragIndex.current;
    if (fromIdx === null || fromIdx === dropIdx) {
      setDragOverIndex(null);
      return;
    }
    const reordered = [...medicines];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    onChange(reordered);
    dragIndex.current = null;
    setDragOverIndex(null);
  }, [medicines, onChange]);

  const handleDragEnd = useCallback(() => {
    dragIndex.current = null;
    setDragOverIndex(null);
    // Clean up dragging class
    if (gridRef.current) {
      gridRef.current.querySelectorAll('.med-card-dragging').forEach(el => {
        el.classList.remove('med-card-dragging');
      });
    }
  }, []);

  return (
    <div className="medicine-input-section">
      {medicines.length > 0 && (
        <div className="med-card-grid" ref={gridRef}>
          {medicines.map((m, index) => (
            <div
              key={m.id}
              className={`med-card${dragOverIndex === index ? ' med-card-dragover' : ''}`}
              onDragOver={!readOnly ? e => handleDragOver(e, index) : undefined}
              onDrop={!readOnly ? e => handleDrop(e, index) : undefined}
            >
              {!readOnly && (
                <span
                  className="med-card-handle"
                  draggable
                  onDragStart={e => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  title="拖拽排序"
                >⠿</span>
              )}
              {!readOnly && (
                <button
                  className="med-card-del"
                  onClick={() => removeMedicine(m.id)}
                  title="删除"
                  tabIndex={-1}
                >×</button>
              )}
              <div className="med-card-left">
                <input
                  className="med-card-name"
                  value={m.name || ''}
                  onChange={e => updateMedicine(m.id, 'name', e.target.value)}
                  placeholder="药名"
                  readOnly={readOnly}
                />
                <span className="med-card-sub">煎法</span>
              </div>
              <div className="med-card-right">
                <input
                  className="med-card-dosage"
                  value={m.dosage || ''}
                  onChange={e => updateMedicine(m.id, 'dosage', e.target.value)}
                  placeholder="0"
                  readOnly={readOnly}
                  onKeyDown={e => handleDosageKeyDown(e, index)}
                />
                <span className="med-card-unit">g</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {!readOnly && (
        <button className="btn-add-medicine" onClick={addMedicine}>
          + 添加药物
        </button>
      )}
    </div>
  );
};

/** Convert medicines array to text */
export function medicinesToText(medicines) {
  if (!medicines || !Array.isArray(medicines)) return '';
  return medicines
    .map(m => {
      const name = (m.name || '').trim();
      const dosage = (m.dosage || '').trim();
      if (!name) return '';
      return dosage ? `${name} ${dosage}g` : name;
    })
    .filter(Boolean)
    .join('\n');
}

/** Parse prescription text string into medicines array.
 *  Supports two formats:
 *  - Newline-separated: "山药 1g\n佩兰 1.5g"
 *  - Space-separated (legacy): "山药1g 佩兰1.5g 炙甘草1g"
 */
export function textToMedicines(text) {
  if (!text || typeof text !== 'string') return [];

  // If text contains newlines, split by newlines (original format)
  if (text.includes('\n')) {
    return text.split('\n').filter(Boolean).map((line, i) => {
      const match = line.trim().match(/^(.+?)\s+(\d+\.?\d*)g?$/);
      if (match) {
        return { id: Date.now() + i, name: match[1].trim(), dosage: match[2] };
      }
      return { id: Date.now() + i, name: line.trim(), dosage: '' };
    });
  }

  // Space-separated format: "山药1g 佩兰1.5g 炙甘草1g"
  // Each token is "药名+数量+可选g"
  const tokens = text.trim().split(/\s+/);
  return tokens.filter(Boolean).map((token, i) => {
    const match = token.match(/^(.+?)(\d+\.?\d*)g?$/);
    if (match) {
      return { id: Date.now() + i, name: match[1], dosage: match[2] };
    }
    return { id: Date.now() + i, name: token, dosage: '' };
  });
}

export default MedicineInput;
