import { useRef, useState, useEffect, useCallback } from 'react';
import './MaskCanvas.css';

export default function MaskCanvas({ image, onMaskChange }) {
  const overlayRef = useRef(null);
  const [brushSize, setBrushSize] = useState(40);
  const isDrawingRef = useRef(false);
  const lastPos = useRef(null);
  const hasStrokes = useRef(false);
  const brushSizeRef = useRef(brushSize);
  const siteImgRef = useRef(null);

  // Keep brushSizeRef in sync with state (state drives the slider UI,
  // ref is read by native event listeners that can't see React state)
  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  // Set up canvas dimensions to match image
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      const canvas = overlayRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      hasStrokes.current = false;
      siteImgRef.current = img;
    };
    img.src = image;
  }, [image]);

  const getCoords = useCallback((e) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const getScaledBrush = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return brushSizeRef.current;
    const rect = canvas.getBoundingClientRect();
    return brushSizeRef.current * (canvas.width / rect.width);
  }, []);

  const exportMask = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    // Draw the site image as the mask base (areas to preserve).
    // Falls back to white if the image hasn't loaded yet.
    if (siteImgRef.current) {
      maskCtx.drawImage(siteImgRef.current, 0, 0, maskCanvas.width, maskCanvas.height);
    } else {
      maskCtx.fillStyle = '#ffffff';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    }

    // Erase painted areas using compositing — the overlay's non-transparent
    // pixels (brush strokes) punch transparent holes in the site image.
    maskCtx.globalCompositeOperation = 'destination-out';
    maskCtx.drawImage(canvas, 0, 0);
    maskCtx.globalCompositeOperation = 'source-over';

    onMaskChange(maskCanvas.toDataURL('image/png'));
  }, [onMaskChange]);

  // --- Drawing handlers (used by both mouse + touch) ---

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getCoords(e);
    lastPos.current = pos;
    hasStrokes.current = true;

    const ctx = overlayRef.current.getContext('2d');
    ctx.fillStyle = '#5B7FC4';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, getScaledBrush() / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [getCoords, getScaledBrush]);

  const draw = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pos = getCoords(e);
    const ctx = overlayRef.current.getContext('2d');

    ctx.strokeStyle = '#5B7FC4';
    ctx.lineWidth = getScaledBrush();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
  }, [getCoords, getScaledBrush]);

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPos.current = null;
    if (hasStrokes.current) {
      exportMask();
    }
  }, [exportMask]);

  const clearMask = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    onMaskChange(null);
  }, [onMaskChange]);

  // Register touch events with { passive: false } so preventDefault works
  // (React registers touch handlers as passive by default, which prevents
  // us from blocking page scrolling while the user draws on the canvas)
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [startDrawing, draw, stopDrawing]);

  if (!image) return null;

  return (
    <div className="mask-canvas-container">
      <div className="mask-canvas-toolbar">
        <div
          className="mask-brush-preview"
          style={{
            width: Math.max(6, brushSize * 0.5),
            height: Math.max(6, brushSize * 0.5),
          }}
        />
        <input
          type="range"
          className="mask-brush-slider"
          min={5}
          max={100}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />
        <span className="mask-brush-size">{brushSize}</span>
      </div>
      <div className="mask-canvas-wrapper">
        <img src={image} alt="Site" className="mask-canvas-bg" draggable={false} />
        <canvas
          ref={overlayRef}
          className="mask-canvas-overlay"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <button type="button" className="mask-clear-btn" onClick={clearMask}>
          Clear mask
        </button>
      </div>
    </div>
  );
}
