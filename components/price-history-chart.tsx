"use client";

type Point = {
  postTime: number;
  value: number;
};

function formatValue(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
  }).format(value);
}

export function PriceHistoryChart({
  points,
  quoteName,
}: {
  points: Point[];
  quoteName: string;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-56 w-full items-center justify-center rounded-md border border-neutral-800 bg-neutral-950 text-sm text-neutral-500">
        No historic prices yet
      </div>
    );
  }

  const width = 720;
  const height = 240;
  const padX = 12;
  const padY = 16;
  const values = points.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const spanV = maxV - minV || 1;
  const minT = points[0]!.postTime;
  const maxT = points[points.length - 1]!.postTime;
  const spanT = Math.max(maxT - minT, 1);

  const coords = points.map((point) => {
    const x = padX + ((point.postTime - minT) / spanT) * (width - padX * 2);
    const y =
      height - padY - ((point.value - minV) / spanV) * (height - padY * 2);
    return { x, y, point };
  });
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const latest = points[points.length - 1]!;

  return (
    <div className="w-full rounded-md border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-sm text-neutral-400">
          Price in {quoteName}
        </p>
        <p className="text-lg font-medium tabular-nums text-neutral-100">
          {formatValue(latest.value)}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        role="img"
        aria-label={`Historic price chart in ${quoteName}`}
      >
        <line
          x1={padX}
          y1={height - padY}
          x2={width - padX}
          y2={height - padY}
          className="stroke-neutral-800"
          strokeWidth={1}
        />
        <polyline
          fill="none"
          points={polyline}
          className="stroke-amber-400"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1 flex justify-between text-xs text-neutral-500">
        <span>{new Date(minT).toLocaleDateString()}</span>
        <span>
          {formatValue(minV)} – {formatValue(maxV)} {quoteName}
        </span>
        <span>{new Date(maxT).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
