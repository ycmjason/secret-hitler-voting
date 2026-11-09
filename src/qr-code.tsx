import { encode } from 'uqr';

/** A QR code for `text`, drawn in paper ink. Put it on paper so cameras lock on in dim light. */
export const QrCode = ({ text }: { text: string }) => {
  const { data, size } = encode(text, { ecc: 'M', border: 0 });
  const path = data
    .flatMap((row, y) => row.map((on, x) => (on ? `M${x} ${y}h1v1h-1z` : '')))
    .join('');
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="block size-full"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code for ${text}`}
    >
      <path d={path} fill="#1c1813" />
    </svg>
  );
};
