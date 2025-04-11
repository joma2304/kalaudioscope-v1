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
            // Kontrollera om det klickade elementet är ett interaktivt element
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
                return; // Tillåt standardbeteendet för interaktiva element
            }

            e.preventDefault(); // Förhindra markering av innehåll för andra element
            isDragging = true;
            offsetX = e.clientX - el.offsetLeft;
            offsetY = e.clientY - el.offsetTop;
            el.style.cursor = "grabbing"; // Ändra till grabbing
        };

        const onMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newLeft = e.clientX - offsetX;
                const newTop = e.clientY - offsetY;

                const buffer = 10; // Marginal på 10px
                const maxLeft = window.innerWidth - el.offsetWidth - buffer;
                const maxTop = window.innerHeight - el.offsetHeight - buffer;

                el.style.left = `${Math.max(buffer, Math.min(newLeft, maxLeft))}px`;
                el.style.top = `${Math.max(buffer, Math.min(newTop, maxTop - 40))}px`;
            }
        };

        const onMouseUp = () => {
            isDragging = false;
            el.style.cursor = "grab"; // Ändra tillbaka till grab
        };

        const handleResize = () => {
            // Uppdatera positionen om fönstret ändras
            const maxLeft = window.innerWidth - el.offsetWidth;
            const maxTop = window.innerHeight - el.offsetHeight;

            const currentLeft = parseInt(el.style.left || "0", 10);
            const currentTop = parseInt(el.style.top || "0", 10);

            el.style.left = `${Math.min(currentLeft, maxLeft)}px`;
            el.style.top = `${Math.min(currentTop, maxTop)}px`;
        };

        window.addEventListener("resize", handleResize);
        el.addEventListener("mousedown", onMouseDown);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        return () => {
            window.removeEventListener("resize", handleResize);
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
                cursor: "grab", // Standard är grab
            }}
        >
            {children}
        </div>
    );
};

export default DraggableWrapper;