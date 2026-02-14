import React, { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { authFetch } from '../utils/api';

const PrescriptionRecognition = forwardRef(function PrescriptionRecognition({ onFillPrescription, onFillInfo }, ref) {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [patientInfo, setPatientInfo] = useState({});
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recognized, setRecognized] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [apiError, setApiError] = useState('');

  // Box drawing state
  const [boxes, setBoxes] = useState([]);
  // Medicine data: each box has { name, dosage }
  const [medData, setMedData] = useState({});
  const [drawing, setDrawing] = useState(null);
  const [moving, setMoving] = useState(null);
  const [resizing, setResizing] = useState(null);

  const fileInputRef = useRef(null);
  const imgContainerRef = useRef(null);

  const handleFileSelect = useCallback((file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    if (!allowed.includes(file.type)) {
      alert('仅支持 JPEG、PNG、WebP、BMP 格式');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      return;
    }
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setPatientInfo({});
    setExperience('');
    setRecognized(false);
    setIsMock(false);
    setApiError('');
    setBoxes([]);
    setMedData({});
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // --- Rotate image 90° clockwise ---
  const handleRotate = useCallback(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const rotatedFile = new File([blob], 'rotated.jpg', { type: 'image/jpeg' });
        setImageFile(rotatedFile);
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        setImageUrl(URL.createObjectURL(blob));
        setBoxes([]);
        setMedData({});
      }, 'image/jpeg', 0.92);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // --- Recognize patient info via LLM ---
  const handleRecognize = async () => {
    if (!imageFile) return;
    setLoading(true);
    setApiError('');
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      const res = await authFetch('/api/prescription/recognize', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const info = data.patient_info || {};
        setPatientInfo(info);
        setRecognized(true);
        setIsMock(!!data.mock);
        if (data.error) setApiError(`[${data.method}] ${data.error}`);
        else if (data.method) console.log('OCR method:', data.method);
      } else {
        const text = await res.text();
        setApiError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        alert('识别失败: ' + res.status);
      }
    } catch (e) {
      setApiError(e.message);
      alert('识别出错: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Box drawing on image ---
  const getPos = (e) => {
    const el = imgContainerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const findBoxAt = (px, py) => {
    // Find topmost box containing the point
    for (let i = boxes.length - 1; i >= 0; i--) {
      const b = boxes[i];
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b;
    }
    return null;
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    const pos = getPos(e);
    if (!pos) return;
    e.preventDefault();
    const hit = findBoxAt(pos.x, pos.y);
    if (hit) {
      setMoving({ id: hit.id, ox: pos.x - hit.x, oy: pos.y - hit.y });
    } else {
      setDrawing({ sx: pos.x, sy: pos.y, cx: pos.x, cy: pos.y });
    }
  };

  const handlePointerMove = (e) => {
    const pos = getPos(e);
    if (!pos) return;
    if (drawing) {
      setDrawing(prev => ({ ...prev, cx: pos.x, cy: pos.y }));
    } else if (moving) {
      setBoxes(prev => prev.map(b =>
        b.id === moving.id
          ? { ...b, x: Math.max(0, Math.min(100 - b.w, pos.x - moving.ox)),
                     y: Math.max(0, Math.min(100 - b.h, pos.y - moving.oy)) }
          : b
      ));
    }
  };

  const handlePointerUp = () => {
    if (drawing) {
      const x = Math.min(drawing.sx, drawing.cx);
      const y = Math.min(drawing.sy, drawing.cy);
      const w = Math.abs(drawing.cx - drawing.sx);
      const h = Math.abs(drawing.cy - drawing.sy);
      if (w > 1.5 && h > 1.5) {
        const id = Date.now();
        setBoxes(prev => [...prev, { id, x, y, w, h }]);
      }
      setDrawing(null);
    }
    if (moving) setMoving(null);
  };

  const deleteBox = (id) => {
    setBoxes(prev => prev.filter(b => b.id !== id));
    setMedData(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  // --- Actions ---
  const handleFillInfo = () => {
    onFillInfo({ ...patientInfo, experience });
  };

  const handleFillPrescription = () => {
    const medicines = boxes.map(b => {
      const d = medData[b.id] || {};
      return { id: b.id, name: (d.name || '').trim(), dosage: (d.dosage || '').trim() };
    }).filter(m => m.name);
    onFillPrescription(medicines);
  };

  const handleSaveAnnotation = async () => {
    if (!imageFile) return;
    setSaving(true);
    try {
      const annotations = boxes.map((b, i) => ({
        ...b, seq: i + 1, ...(medData[b.id] || {}),
      }));
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('annotations', JSON.stringify({
        patient_info: patientInfo,
        experience,
        medicine_boxes: annotations,
      }));
      const res = await authFetch('/api/prescription/save-annotation', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) return true;
    } catch (e) {
      console.error('保存标注出错:', e.message);
    } finally {
      setSaving(false);
    }
    return false;
  };

  // Expose saveAnnotation and medicine data to parent via ref
  useImperativeHandle(ref, () => ({
    saveAnnotation: handleSaveAnnotation,
    getMedicines: () => {
      return boxes.map(b => {
        const d = medData[b.id] || {};
        return { id: b.id, name: (d.name || '').trim(), dosage: (d.dosage || '').trim() };
      }).filter(m => m.name);
    },
    getPatientInfo: () => ({ ...patientInfo, experience }),
    hasData: () => boxes.length > 0 || !!patientInfo.name,
  }));

  const handleClear = () => {
    setImageFile(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setPatientInfo({});
    setExperience('');
    setRecognized(false);
    setIsMock(false);
    setApiError('');
    setBoxes([]);
    setMedData({});
  };

  // Drawing preview box
  const drawPreview = drawing ? {
    x: Math.min(drawing.sx, drawing.cx),
    y: Math.min(drawing.sy, drawing.cy),
    w: Math.abs(drawing.cx - drawing.sx),
    h: Math.abs(drawing.cy - drawing.sy),
  } : null;

  return (
    <div className="prescription-recognition">
      {!imageUrl ? (
        <div
          className="prescription-dropzone"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <div className="dropzone-icon">📷</div>
          <p>点击或拖拽上传处方图片</p>
          <p className="dropzone-hint">支持 JPEG、PNG、WebP、BMP，最大 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/bmp"
            style={{ display: 'none' }}
            onChange={e => handleFileSelect(e.target.files[0])}
          />
        </div>
      ) : (
        <>
          {/* Image with interactive box overlay */}
          <div className="prescription-preview-container">
            <div
              className="prescription-preview-wrapper"
              ref={imgContainerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: 'none', cursor: drawing ? 'crosshair' : 'crosshair' }}
            >
              <img src={imageUrl} alt="处方" className="prescription-img" draggable={false} />

              {/* Existing boxes */}
              {boxes.map((b, i) => (
                <div
                  key={b.id}
                  className="med-box"
                  style={{
                    left: b.x + '%', top: b.y + '%',
                    width: b.w + '%', height: b.h + '%',
                  }}
                >
                  <span className="med-box-num">{i + 1}</span>
                  <button
                    className="med-box-del"
                    onPointerDown={e => { e.stopPropagation(); deleteBox(b.id); }}
                  >×</button>
                </div>
              ))}

              {/* Drawing preview */}
              {drawPreview && drawPreview.w > 0.5 && (
                <div
                  className="med-box drawing"
                  style={{
                    left: drawPreview.x + '%', top: drawPreview.y + '%',
                    width: drawPreview.w + '%', height: drawPreview.h + '%',
                  }}
                />
              )}
            </div>
            <p className="box-hint">在图片上拖拽画框标记每味药物，框可拖动和删除</p>
          </div>

          {/* Action bar */}
          <div className="prescription-actions">
            <button className="btn-rotate" onClick={handleRotate} title="顺时针旋转90°">↻</button>
            <button className="btn-recognize" onClick={handleRecognize} disabled={loading}>
              {loading ? '识别中...' : '识别患者信息'}
            </button>
            <button className="btn-save-annotation" onClick={handleClear}>
              重新上传
            </button>
          </div>

          {isMock && (
            <div className="mock-notice">当前为模拟数据，请配置 LLM API 以启用真实识别</div>
          )}

          {apiError && (
            <div className="mock-notice" style={{ color: '#ff3b30', background: 'rgba(255,59,48,0.08)' }}>
              识别错误: {apiError}
            </div>
          )}

          {/* Patient info fields */}
          {recognized && (
            <div className="region-group">
              <div className="region-group-title">
                <span className="region-dot info"></span>
                患者信息
              </div>
              <div className="info-row">
                <div className="info-cell">
                  <span className="region-field-label">姓名</span>
                  <input className="region-text-input" value={patientInfo.name || ''}
                    onChange={e => setPatientInfo(p => ({ ...p, name: e.target.value }))} placeholder="姓名" />
                </div>
                <div className="info-cell info-cell-sm">
                  <span className="region-field-label">性别</span>
                  <input className="region-text-input" value={patientInfo.gender || ''}
                    onChange={e => setPatientInfo(p => ({ ...p, gender: e.target.value }))} placeholder="性别" />
                </div>
                <div className="info-cell info-cell-sm">
                  <span className="region-field-label">年龄</span>
                  <input className="region-text-input" value={patientInfo.age || ''}
                    onChange={e => setPatientInfo(p => ({ ...p, age: e.target.value }))} placeholder="年龄" />
                </div>
                <div className="info-cell">
                  <span className="region-field-label">日期</span>
                  <input className="region-text-input" value={patientInfo.date || ''}
                    onChange={e => setPatientInfo(p => ({ ...p, date: e.target.value }))} placeholder="日期" />
                </div>
              </div>
              <div className="region-item">
                <span className="region-field-label">诊断</span>
                <input className="region-text-input" value={patientInfo.diagnosis || ''}
                  onChange={e => setPatientInfo(p => ({ ...p, diagnosis: e.target.value }))} placeholder="诊断/主诉" />
              </div>
              <div className="region-item" style={{ alignItems: 'flex-start' }}>
                <span className="region-field-label" style={{ paddingTop: '6px' }}>心得</span>
                <textarea className="region-text-input experience-textarea" value={experience}
                  onChange={e => setExperience(e.target.value)} placeholder="跟诊心得体会..." rows={3} />
              </div>
            </div>
          )}

          {/* Medicine cards - two-column grid */}
          {boxes.length > 0 && (
            <div className="region-group">
              <div className="region-group-title">
                <span className="region-dot medicine"></span>
                药物标注 ({boxes.length} 味)
              </div>
              <div className="med-card-grid">
                {boxes.map((b, i) => (
                  <div key={b.id} className="med-card">
                    <button
                      className="med-card-del"
                      onClick={() => deleteBox(b.id)}
                      title="删除"
                    >×</button>
                    <div className="med-card-left">
                      <input
                        className="med-card-name"
                        value={(medData[b.id] || {}).name || ''}
                        onChange={e => setMedData(prev => ({
                          ...prev, [b.id]: { ...(prev[b.id] || {}), name: e.target.value }
                        }))}
                        placeholder="药名"
                      />
                      <span className="med-card-sub">煎法</span>
                    </div>
                    <div className="med-card-right">
                      <input
                        className="med-card-dosage"
                        value={(medData[b.id] || {}).dosage || ''}
                        onChange={e => setMedData(prev => ({
                          ...prev, [b.id]: { ...(prev[b.id] || {}), dosage: e.target.value }
                        }))}
                        placeholder="0"
                      />
                      <span className="med-card-unit">g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom actions */}
          {(recognized || boxes.length > 0) && (
            <div className="prescription-bottom-actions">
              {recognized && (
                <button className="btn-fill" onClick={handleFillInfo}>
                  填入患者信息
                </button>
              )}
              {boxes.length > 0 && (
                <button className="btn-fill" onClick={handleFillPrescription}>
                  填入用药
                </button>
              )}
              <button
                className="btn-save-annotation"
                onClick={handleSaveAnnotation}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存标注'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default PrescriptionRecognition;
