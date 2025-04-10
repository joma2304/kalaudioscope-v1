import React, { useEffect, useRef } from "react";

interface DraggableWrapperProps {
    children: React.ReactNode;
}

const DraggableWrapper: React.FC<DraggableWrapperProps> = ({ children }) => {
    const draggableRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = draggableRef.current;
        if (!el) return;

        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
            document.body.style.cursor = "grabbing";
        };

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                el.style.left = `${e.clientX - offsetX}px`;
                el.style.top = `${e.clientY - offsetY}px`;
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            document.body.style.cursor = "default";
        };

        el.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        return () => {
            el.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    return (
        <div
            ref={draggableRef}
            style={{
                position: "absolute",
                top: "100px",
                left: "100px",
                zIndex: 9998,
                cursor: "grab",
            }}
        >
            {children}
        </div>
    );
};

export default DraggableWrapper;