import React from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({ value, size = 128 }) => {
  const grid = 21;
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinderCell = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => {
      const dr = r - br;
      const dc = c - bc;
      if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return false;
      if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
      if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
      return false;
    };
    const inQuiet = (br: number, bc: number) =>
      r >= br - 1 && r <= br + 7 && c >= bc - 1 && c <= bc + 7;

    if (inQuiet(0, 0) || inQuiet(0, grid - 7) || inQuiet(grid - 7, 0)) {
      return inBox(0, 0) || inBox(0, grid - 7) || inBox(grid - 7, 0);
    }
    return null;
  };

  const cells: React.ReactElement[] = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const finder = isFinderCell(r, c);
      let filled = false;
      if (finder !== null) {
        filled = finder;
      } else if (r === 6 || c === 6) {
        filled = (r + c) % 2 === 0;
      } else {
        const seed = Math.imul(hash ^ (r * 31 + c * 17), 2654435761) >>> 0;
        filled = seed % 11 < 5;
      }
      if (filled) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c}
            y={r}
            width={1}
            height={1}
            fill="#0B1F3A"
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-1 -1 ${grid + 2} ${grid + 2}`}
      className="rounded-lg border border-slate-200 bg-white"
      role="img"
      aria-label={`QR Code E-Ticket ${value}`}
    >
      <rect x={-1} y={-1} width={grid + 2} height={grid + 2} fill="#FFFFFF" />
      {cells}
    </svg>
  );
};
