import { useEffect } from 'react';

export function useDraggable(
  draggableRef: React.RefObject<HTMLElement>,
  handleRef?: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    const el = draggableRef.current;
    const handle = handleRef?.current || el;
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
      if (isDragging) {
        el.style.left = `${e.clientX - offsetX}px`;
        el.style.top = `${e.clientY - offsetY}px`;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      el.style.cursor = 'default';
      handle.style.cursor = 'grab';
    };

    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [draggableRef, handleRef]);
}
