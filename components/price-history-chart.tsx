"use client";

import { useRef, useState } from "react";

type Point = {
  postTime: number;
  value: number;
};

type Hovered = {
  index: number;
  x: number;
  y: number;
  point: Point;
};

function formatValue(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 4,
  }).format(value);
}

function formatHoverDate(postTime: number) {
  return new Date(postTime).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PriceHistoryChart({
  points,
  quoteName,
}: {
  points: Point[];
  quoteName: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<Hovered | null>(null);

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

  function svgXFromClient(clientX: number) {
    const svg = svgRef.current;
    if (!svg) {
      return null;
    }
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) {
      return null;
    }
    return ((clientX - rect.left) / rect.width) * width;
  }

  function nearestAt(clientX: number): Hovered | null {
    const svgX = svgXFromClient(clientX);
    if (svgX === null) {
      return null;
    }
    let best = coords[0]!;
    let bestIndex = 0;
    let bestDist = Math.abs(best.x - svgX);
    for (let i = 1; i < coords.length; i++) {
      const candidate = coords[i]!;
      const dist = Math.abs(candidate.x - svgX);
      if (dist < bestDist) {
        best = candidate;
        bestIndex = i;
        bestDist = dist;
      }
    }
    return { index: bestIndex, x: best.x, y: best.y, point: best.point };
  }

  const display = hovered?.point ?? latest;
  const tooltipLeftPct = hovered
    ? Math.min(92, Math.max(8, (hovered.x / width) * 100))
    : 0;

  return (
    <div className="w-full rounded-md border border-neutral-800 bg-neutral-950 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-sm text-neutral-400">Price in {quoteName}</p>
        <p className="text-lg font-medium tabular-nums text-neutral-100">
          {formatValue(display.value)}
        </p>
      </div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-56 w-full touch-none"
          role="img"
          aria-label={`Historic price chart in ${quoteName}`}
          onPointerMove={(event) => {
            setHovered(nearestAt(event.clientX));
          }}
          onPointerLeave={() => {
            setHovered(null);
          }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setHovered(nearestAt(event.clientX));
          }}
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
          {hovered && (
            <>
              <line
                x1={hovered.x}
                y1={padY}
                x2={hovered.x}
                y2={height - padY}
                className="stroke-neutral-500"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <circle
                cx={hovered.x}
                cy={hovered.y}
                r={4}
                className="fill-amber-400 stroke-neutral-950"
                strokeWidth={2}
              />
            </>
          )}
        </svg>
        {hovered && (
          <div
            className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-md border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: `${tooltipLeftPct}%`,
            }}
          >
            <p className="whitespace-nowrap text-neutral-400">
              {formatHoverDate(hovered.point.postTime)}
            </p>
            <p className="whitespace-nowrap tabular-nums text-neutral-100">
              {formatValue(hovered.point.value)} {quoteName}
            </p>
          </div>
        )}
      </div>
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
