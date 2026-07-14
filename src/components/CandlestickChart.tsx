import React, { useEffect, useRef, useState, memo } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, LineSeries } from 'lightweight-charts';

interface Point {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  value?: number;
}

interface CandlestickChartProps {
  data: Point[];
  type?: 'candle' | 'line';
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
    upColor?: string;
    downColor?: string;
  };
}

function CandlestickChart({ data, type = 'candle', colors }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [legend, setLegend] = useState<{ time: string; open?: number; high?: number; low?: number; close?: number; value?: number } | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Use dark theme dynamically if we want, or from props
    const isDark = document.documentElement.classList.contains('dark');
    
    const defaultColors = {
      backgroundColor: 'transparent',
      textColor: isDark ? 'rgba(161, 161, 170, 1)' : 'rgba(113, 113, 122, 1)',
      upColor: isDark ? '#22c55e' : '#16a34a',
      downColor: isDark ? '#ef4444' : '#dc2626',
      gridColor: isDark ? 'rgba(39, 39, 42, 0.5)' : 'rgba(228, 228, 231, 0.5)',
      lineColor: isDark ? '#3b82f6' : '#2563eb', // Blue for line chart
    };

    const finalColors = { ...defaultColors, ...colors };

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: finalColors.backgroundColor },
        textColor: finalColors.textColor,
      },
      grid: {
        vertLines: { color: finalColors.gridColor },
        horzLines: { color: finalColors.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: finalColors.gridColor,
      },
      timeScale: {
        borderColor: finalColors.gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (price: number) => {
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(price);
        },
      },
    });
    
    chartRef.current = chart;

    let currentSeries: any;

    if (type === 'candle') {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: finalColors.upColor,
        downColor: finalColors.downColor,
        borderVisible: false,
        wickUpColor: finalColors.upColor,
        wickDownColor: finalColors.downColor,
      });
      const processedData = data.map(d => {
        if (typeof d.time === 'number') {
          const offset = new Date().getTimezoneOffset() * 60;
          return { ...d, time: (d.time - offset) as number };
        }
        return d;
      });
      candlestickSeries.setData(processedData as any);
      currentSeries = candlestickSeries;
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: finalColors.lineColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });
      const lineData = data.map(d => {
        let time = d.time;
        if (typeof time === 'number') {
          const offset = new Date().getTimezoneOffset() * 60;
          time = (time - offset) as number;
        }
        return { time, value: d.close };
      });
      lineSeries.setData(lineData as any);
      currentSeries = lineSeries;
    }
    
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current!.clientHeight
      ) {
        setLegend(null);
      } else {
        const dataPoint = param.seriesData.get(currentSeries) as any;
        if (dataPoint) {
          let timeStr = '';
          if (typeof param.time === 'string') {
            timeStr = param.time;
          } else if (typeof param.time === 'number') {
            const offset = new Date().getTimezoneOffset() * 60;
            const originalTime = param.time + offset;
            const d = new Date(originalTime * 1000);
            timeStr = d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          }
          
          if (type === 'candle') {
            setLegend({
              time: timeStr,
              open: dataPoint.open,
              high: dataPoint.high,
              low: dataPoint.low,
              close: dataPoint.close,
            });
          } else {
            setLegend({
              time: timeStr,
              value: dataPoint.value,
            });
          }
        }
      }
    });
    
    // Auto fit
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, colors, type]);

  const formatINR = (val: number | undefined) => {
    if (val === undefined) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="relative w-full h-full min-h-[700px]">
      <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />
      {legend && (
        <div className="absolute top-4 left-4 z-10 flex gap-4 text-xs font-mono font-bold bg-[var(--surface-strong)]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[var(--line)] shadow-sm pointer-events-none">
          <div className="text-[var(--sea-ink-soft)]">{legend.time}</div>
          {type === 'candle' ? (
            <>
              <div><span className="text-[var(--sea-ink-soft)]">O</span> <span className={legend.open! > legend.close! ? "text-red-500" : "text-green-500"}>{formatINR(legend.open)}</span></div>
              <div><span className="text-[var(--sea-ink-soft)]">H</span> <span className={legend.open! > legend.close! ? "text-red-500" : "text-green-500"}>{formatINR(legend.high)}</span></div>
              <div><span className="text-[var(--sea-ink-soft)]">L</span> <span className={legend.open! > legend.close! ? "text-red-500" : "text-green-500"}>{formatINR(legend.low)}</span></div>
              <div><span className="text-[var(--sea-ink-soft)]">C</span> <span className={legend.open! > legend.close! ? "text-red-500" : "text-green-500"}>{formatINR(legend.close)}</span></div>
            </>
          ) : (
            <div><span className="text-[var(--sea-ink-soft)]">Price</span> <span className="text-[var(--sea-ink)]">{formatINR(legend.value)}</span></div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(CandlestickChart);
