import "./App.css";
import React, { useEffect, useState, useRef } from "react";
import Datafeed from "./api/";
import { widget as Widget } from "./charting_library";

function getLanguageFromURL() {
  const regex = new RegExp("[\\?&]lang=([^&#]*)");
  const results = regex.exec(window.location.search);
  return results === null
    ? null
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export default function App() {
  const [pair, setPair] = useState("BTCUSDT");
  const widget = useRef(null);

  const defaultProps = {
    symbol: pair,
    interval: "1",
    containerId: "tv_chart_container",
    libraryPath: "/charting_library/",
    chartsStorageUrl: "https://saveload.tradingview.com",
    chartsStorageApiVersion: "1.1",
    clientId: "tradingview.com",
    userId: "public_user_id",
    fullscreen: true,
    autosize: true,
    timezone: "Asia/Seoul",
    symbolName: "btcusdt",
    studiesOverrides: {},
  };

  useEffect(() => {
    const widgetOptions = {
      debug: false,
      symbol: defaultProps.symbol,
      datafeed: Datafeed,
      interval: defaultProps.interval,
      container: defaultProps.containerId,
      library_path: defaultProps.libraryPath,
      timezone: defaultProps.timezone,
      // locale: getLanguageFromURL() || "en",
      locale: "en",
      disabled_features: [
        "use_localstorage_for_settings",
        "header_symbol_search",
      ],
      enabled_features: ["study_templates", "items_favoriting"],
      charts_storage_url: defaultProps.chartsStorageUrl,
      charts_storage_api_version: defaultProps.chartsStorageApiVersion,
      client_id: defaultProps.clientId,
      user_id: defaultProps.userId,
      fullscreen: defaultProps.fullscreen,
      // autosize: defaultProps.autosize,
      studies_overrides: defaultProps.studiesOverrides,
      favorites: {
        intervals: ["1", "3", "5", "15", "30"],
        chartTypes: ["Area", "Line"],
      },
      // toolbar_bg: "#191919",
      overrides: {
        "paneProperties.background": "#202020",
        "paneProperties.vertGridProperties.color": "#191919",
        "paneProperties.horzGridProperties.color": "#191919",
        "symbolWatermarkProperties.transparency": 90,
        "scalesProperties.textColor": "#AAA",
        // "mainSeriesProperties.barStyle.upColor": "#63be1e",
        // "mainSeriesProperties.barStyle.downColor": "#ea6464",
        // "mainSeriesProperties.candleStyle.upColor": "#63be1e",
        // "mainSeriesProperties.candleStyle.downColor": "#ea6464",
        // "mainSeriesProperties.candleStyle.borderUpColor": "#63be1e",
        // "mainSeriesProperties.candleStyle.borderDownColor": "#ea6464",
        // "mainSeriesProperties.candleStyle.wickUpColor": "#63be1e",
        // "mainSeriesProperties.candleStyle.wickDownColor": "#ea6464",
      },
    };

    Datafeed.onReady(() => {
      widget.current = new Widget(widgetOptions);

      widget.current?.onChartReady(() => {
        console.log("Chart has loaded!");
        widget
          .activeChart()
          .onIntervalChanged()
          .subscribe(null, (interval) => {
            console.log("INTERVAL CHANGE", interval);
          });
      });
    });

    return () => {
      try {
        widget.current?.onChartReady(() => {
          widget.current?.remove();
        });
      } catch (e) {
      } finally {
        widget.current = null;
      }
    };
  }, []);

  useEffect(() => {
    widget.current?.onChartReady(() => {
      widget.current?.activeChart().setSymbol(pair, () => {
        console.log("CHANGE SYMBOL", pair);
      });
    });
  }, [pair]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <button onClick={() => setPair("ETHUSDT")}>Hello</button>
      <div id={defaultProps.containerId} className={"TVChartContainer"} />
    </div>
  );
}
