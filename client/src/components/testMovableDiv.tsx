import React, { useEffect, useRef } from 'react';
import { Expand } from 'lucide-react';

const TestMovableDiv: React.FC = () => {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = draggableRef.current;
    const handle = handleRef.current;
    if (!el || !handle) return;

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
      handle.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging && el) {
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      if (el) el.style.cursor = 'default';
      if (handle) handle.style.cursor = 'grab';
    };

    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div
      ref={draggableRef}
      style={{
        position: 'absolute',
        width: '200px',
        height: '150px',
        background: 'red',
        cursor: 'default', // Endast ikonen har grab
        padding: '8px',
        boxSizing: 'border-box',
        zIndex: 9998
      }}
    >
      {/* Drag-handle */}
      <div
        ref={handleRef}
        style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          width: '24px',
          height: '24px',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '4px',
          zIndex: 9999
        }}
        title="Flytta"
      >
        <Expand size={16} />
      </div>

      {/* Innehåll */}
      <div style={{ marginTop: '32px', color: 'white', cursor: 'default' }}>
        Dra mig genom ikonen!
      </div>
    </div>
  );
};

export default TestMovableDiv;
