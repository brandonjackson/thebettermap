import { useRef, useState, useEffect, useCallback } from 'react';
import './MaskCanvas.css';

export default function MaskCanvas({ image, onMaskChange }) {
  const overlayRef = useRef(null);
  const [brushSize, setBrushSize] = useState(40);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef(null);
  const hasStrokes = useRef(false);

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

  const scaledBrush = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return brushSize;
    const rect = canvas.getBoundingClientRect();
    return brushSize * (canvas.width / rect.width);
  }, [brushSize]);

  const exportMask = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    // Fill fully opaque white (areas to preserve)
    maskCtx.fillStyle = '#ffffff';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Read overlay pixels
    const overlayData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    // Where overlay has paint (alpha > 0), make mask transparent
    for (let i = 0; i < overlayData.data.length; i += 4) {
      if (overlayData.data[i + 3] > 0) {
        maskData.data[i] = 0;
        maskData.data[i + 1] = 0;
        maskData.data[i + 2] = 0;
        maskData.data[i + 3] = 0;
      }
    }

    maskCtx.putImageData(maskData, 0, 0);
    onMaskChange(maskCanvas.toDataURL('image/png'));
  }, [onMaskChange]);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getCoords(e);
    lastPos.current = pos;
    hasStrokes.current = true;

    const ctx = overlayRef.current.getContext('2d');
    ctx.fillStyle = '#5B7FC4';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, scaledBrush() / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [getCoords, scaledBrush]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getCoords(e);
    const ctx = overlayRef.current.getContext('2d');

    ctx.strokeStyle = '#5B7FC4';
    ctx.lineWidth = scaledBrush();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastPos.current = pos;
  }, [isDrawing, getCoords, scaledBrush]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    if (hasStrokes.current) {
      exportMask();
    }
  }, [isDrawing, exportMask]);

  const clearMask = useCallback(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    onMaskChange(null);
  }, [onMaskChange]);

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
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <button type="button" className="mask-clear-btn" onClick={clearMask}>
          Clear mask
        </button>
      </div>
    </div>
  );
}
