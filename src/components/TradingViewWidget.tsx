import React, { useEffect, memo } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

function formatTVSymbol(sym: string) {
  if (!sym) return "NASDAQ:AAPL";
  if (sym.endsWith('.NS')) return `NSE:${sym.replace('.NS', '')}`;
  if (sym.endsWith('.BO')) return `BSE:${sym.replace('.BO', '')}`;
  if (sym.endsWith('.L')) return `LSE:${sym.replace('.L', '')}`;
  if (sym.endsWith('.TO')) return `TSX:${sym.replace('.TO', '')}`;
  if (sym.endsWith('.AX')) return `ASX:${sym.replace('.AX', '')}`;
  if (sym.endsWith('.DE')) return `XETR:${sym.replace('.DE', '')}`;
  if (sym.endsWith('-USD')) return `CRYPTO:${sym.replace('-USD', 'USD')}`;
  return sym;
}

function TradingViewWidget({ symbol }: { symbol: string }) {
  const tvSymbol = formatTVSymbol(symbol);
  const containerId = `tv_chart_${tvSymbol.replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    let tvWidget: any = null;

    const createWidget = () => {
      if (document.getElementById(containerId) && 'TradingView' in window) {
        tvWidget = new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: "D",
          timezone: "Etc/UTC",
          theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
          style: "1",
          locale: "en",
          enable_publishing: false,
          backgroundColor: "transparent",
          gridColor: "rgba(161, 161, 170, 0.1)",
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerId,
        });
      }
    };

    if (typeof window.TradingView === 'undefined') {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-loading-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.onload = createWidget;
      document.head.appendChild(script);
    } else {
      createWidget();
    }

    return () => {
      if (tvWidget && typeof tvWidget.remove === 'function') {
        try {
          tvWidget.remove();
        } catch (e) {}
      }
    };
  }, [symbol, containerId]);

  return (
    <div className="w-full h-full relative z-0">
      <div id={containerId} className="w-full h-[500px] min-h-[400px]" />
    </div>
  );
}

export default memo(TradingViewWidget);
