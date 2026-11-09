import { useEffect, useState } from 'react';

export const canShare = (): boolean => typeof navigator.share === 'function';

/** Opens the system share sheet. Resolves quietly if the user dismisses it. */
export const shareLink = async (url: string): Promise<void> => {
  try {
    await navigator.share({ title: 'Secret Hitler Voting', text: 'Join the table:', url });
  } catch {
    // Dismissed, or the share target failed: nothing to do.
  }
};

/** Copies text to the clipboard; `copied` stays true for a moment afterwards. */
export const useCopy = () => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };
  return { copied, copy };
};
