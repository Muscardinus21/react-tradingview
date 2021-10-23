import "./App.css";
import React from "react";
import Datafeed from "./api/";
import { widget as Widget } from "./charting_library";

function getLanguageFromURL() {
  const regex = new RegExp("[\\?&]lang=([^&#]*)");
  const results = regex.exec(window.location.search);
  return results === null
    ? null
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export class TVChartContainer extends React.PureComponent {
  static defaultProps = {
    symbol: "Coinbase:BTC/USD",
    interval: "15",
    containerId: "tv_chart_container",
    libraryPath: "/charting_library/",
    chartsStorageUrl: "https://saveload.tradingview.com",
    chartsStorageApiVersion: "1.1",
    clientId: "tradingview.com",
    userId: "public_user_id",
    fullscreen: true,
    autosize: true,
    studiesOverrides: {},
  };

  componentDidMount() {
    const widgetOptions = {
      debug: false,
      symbol: this.props.symbol,
      datafeed: Datafeed,
      interval: this.props.interval,
      container_id: this.props.containerId,
      library_path: this.props.libraryPath,
      locale: getLanguageFromURL() || "en",
      disabled_features: [
        "use_localstorage_for_settings",
        "header_symbol_search",
      ],
      enabled_features: ["study_templates", "items_favoriting"],
      charts_storage_url: this.props.chartsStorageUrl,
      charts_storage_api_version: this.props.chartsStorageApiVersion,
      client_id: this.props.clientId,
      user_id: this.props.userId,
      fullscreen: this.props.fullscreen,
      autosize: this.props.autosize,
      studies_overrides: this.props.studiesOverrides,
      favorites: {
        intervals: ["1", "3", "5", "15"],
        chartTypes: ["Area", "Line"],
      },
      // toolbar_bg: "#191919",
      overrides: {
        "mainSeriesProperties.showCountdown": true,
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
      const widget = new Widget(widgetOptions);

      widget.onChartReady(() => {
        console.log("Chart has loaded!");
      });
    });
  }

  render() {
    return (
      <div style={{ width: "100vw", height: "100vh" }}>
        <div id={this.props.containerId} className={"TVChartContainer"} />
      </div>
    );
  }
}

export default TVChartContainer;
