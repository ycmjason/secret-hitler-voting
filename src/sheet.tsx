import { type ReactNode, useEffect, useId, useRef } from 'react';

/**
 * A modal bottom sheet, built on <dialog> for focus trapping and Escape. Render it only while
 * it's open; tapping outside it or pressing Escape calls `onClose`.
 */
export const Sheet = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the backdrop tap mirrors Escape, which <dialog> handles
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet-panel max-h-[92dvh] overflow-y-auto">
        <button
          type="button"
          className="mx-auto mb-2 flex h-6 w-16 items-start justify-center"
          aria-label="Close"
          onClick={onClose}
        >
          <span className="mt-0 block h-[5px] w-10 rounded-[3px] bg-[#4a4338]" />
        </button>
        <h2
          id={titleId}
          className="mb-1.5 font-display text-4xl font-black uppercase leading-none tracking-[0.02em]"
        >
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
};
