import { useEffect, useRef } from 'react';
import { Icon } from './icons.tsx';
import { roomUrl } from './navigation.ts';
import { QrCode } from './qr-code.tsx';
import { canShare, shareLink, useCopy } from './share.ts';

const displayUrl = (code: string) => `${location.host}/${code}`;

const CopyButton = ({ code, primary }: { code: string; primary: boolean }) => {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      className={primary ? 'btn btn-primary' : 'btn btn-ghost'}
      onClick={() => void copy(roomUrl(code))}
    >
      <Icon name={copied ? 'check' : 'copy'} />
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
};

/** The invite screen: a code you can read across the table, a QR code, and the link. */
export const InviteDialog = ({ code, onClose }: { code: string; onClose: () => void }) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  const sharable = canShare();
  return (
    <dialog ref={ref} className="fullscreen" aria-labelledby="invite-title" onClose={onClose}>
      <div className="mx-auto flex min-h-full max-w-[430px] flex-col gap-4 px-5 pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),16px)]">
        <header className="flex min-h-11 items-center justify-between">
          <h2 id="invite-title" className="font-typed text-[13px] text-muted">
            Invite to the table
          </h2>
          <button type="button" className="icon-btn w-11 p-0" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </header>
        <div className="flex flex-col gap-4 text-center">
          <p className="mr-[-0.12em] font-display text-[128px] font-black leading-[0.85] tracking-[0.12em]">
            <span className="sr-only">Room code </span>
            {code}
          </p>
          <p className="font-typed text-sm text-muted">Read it out, or point a camera at this.</p>
          <div className="mx-auto size-[218px] rounded-[10px] bg-paper p-3.5">
            <QrCode text={roomUrl(code)} />
          </div>
          <p className="break-all rounded-[10px] bg-desk px-3 py-3.5 font-typed text-sm font-bold">
            {displayUrl(code)}
          </p>
          {sharable ? (
            <div className="grid grid-cols-2 gap-2.5">
              <CopyButton code={code} primary={false} />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void shareLink(roomUrl(code))}
              >
                <Icon name="share" />
                Share
              </button>
            </div>
          ) : (
            <CopyButton code={code} primary />
          )}
        </div>
      </div>
    </dialog>
  );
};

/** Shares the room link where the system can, and copies it otherwise. */
export const ShareLinkButton = ({ code }: { code: string }) => {
  const { copied, copy } = useCopy();
  if (canShare()) {
    return (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => void shareLink(roomUrl(code))}
      >
        <Icon name="share" />
        Share the link
      </button>
    );
  }
  return (
    <button type="button" className="btn btn-primary" onClick={() => void copy(roomUrl(code))}>
      <Icon name={copied ? 'check' : 'copy'} />
      {copied ? 'Copied' : 'Copy the link'}
    </button>
  );
};

/** The invite, shrunk into the main area while you're the only one at the table. */
export const AloneCard = ({ code }: { code: string }) => {
  const [host = '', ...rest] = location.host.split('.');
  return (
    <div className="grid grid-cols-[1fr_112px] items-center gap-3.5 rounded-2xl bg-desk p-[18px]">
      <div>
        <p className="font-display text-[64px] font-black leading-[0.9] tracking-[0.1em]">{code}</p>
        <p className="mt-1.5 break-words font-typed text-[13px] text-muted">
          {host}
          {rest.length > 0 && (
            <>
              <br />.{rest.join('.')}
            </>
          )}
          /{code}
        </p>
      </div>
      <div className="size-[112px] rounded-lg bg-paper p-2">
        <QrCode text={roomUrl(code)} />
      </div>
    </div>
  );
};
