"use client";

import { ReactNode, useEffect, useState } from "react";

type OverlayModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
  canExpand?: boolean;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  if (target instanceof HTMLInputElement) {
    return true;
  }

  if (target instanceof HTMLTextAreaElement) {
    return true;
  }

  if (target instanceof HTMLSelectElement) {
    return true;
  }

  return target instanceof HTMLElement && target.isContentEditable;
}

export function OverlayModal({
  isOpen,
  title,
  onClose,
  children,
  maxWidthClassName = "max-w-5xl",
  canExpand = false,
}: OverlayModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isExpanded) {
          event.preventDefault();
          setIsExpanded(false);
          return;
        }

        onClose();
        return;
      }

      if (!canExpand || isTypingTarget(event.target)) {
        return;
      }

      const isToggleShortcut =
        (event.shiftKey && (event.key === "F" || event.key === "f")) ||
        ((event.metaKey || event.ctrlKey) && event.key === "Enter");

      if (isToggleShortcut) {
        event.preventDefault();
        setIsExpanded((currentValue) => !currentValue);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canExpand, isExpanded, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const containerClassName = isExpanded
    ? "fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-2 sm:p-3"
    : "fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 sm:p-6";
  const panelClassName = isExpanded
    ? "h-[95vh] w-[97vw] max-w-none overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-2xl"
    : `max-h-[90vh] w-full ${maxWidthClassName} overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-2xl`;
  const contentClassName = isExpanded
    ? "max-h-[calc(95vh-4.5rem)] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"
    : "max-h-[calc(90vh-4.5rem)] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6";

  return (
    <div
      className={containerClassName}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={panelClassName}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 sm:px-8">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {canExpand ? (
              <>
                <p className="hidden text-xs text-zinc-500 sm:block">Shift+F</p>
                <button
                  type="button"
                  onClick={() => setIsExpanded((currentValue) => !currentValue)}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-300 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
                  aria-label={isExpanded ? "Restore modal size" : "Expand modal size"}
                >
                  {isExpanded ? "Restore" : "Expand"}
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-lg leading-none text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
              aria-label="Close modal"
            >
              X
            </button>
          </div>
        </div>
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}
