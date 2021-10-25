var rp = require("request-promise").defaults({ json: true });

const api_root = "https://api.binance.com/api/v3/klines";
const history = {};

export const RESOLUTION_VALUE = {
  1: "1m",
  3: "3m",
  5: "5m",
  15: "15m",
  30: "30m",
  60: "1h",
  120: "2h",
  240: "4h",
  "1D": "1d",
  "1W": "1w",
  "1M": "1M",
};

export default {
  history: history,

  getBars: function (symbolInfo, resolution, from, to, first, limit) {
    console.log("FROM", from);
    console.log("TO", to);
    console.log("RESOLUTION", resolution);
    //example
    //https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m&startTime=1634441869000&endTime=1634489749000

    const queryString = `?symbol=${symbolInfo.name}&interval=${
      RESOLUTION_VALUE[resolution]
    }&limit=1000&startTime=${from * 1000}&endTime=${to * 1000}`;

    return rp({
      uri: `${api_root}${queryString}`,
      json: true,
    }).then((data) => {
      // if (data.Response && data.Response === "Error") {
      //   console.log("CryptoCompare API error:", data.Message);
      //   return [];
      // }
      if (data.length) {
        const bars = data.map((el) => {
          const [time, open, high, low, close, volume] = el;
          return {
            time: +time,
            low: +low,
            high: +high,
            open: +open,
            close: +close,
            volume: +volume,
          };
        });
        if (first) {
          const lastBar = bars[bars.length - 1];
          history[symbolInfo.name] = { lastBar: lastBar };
        }
        return bars;
      } else {
        return [];
      }
    });
  },
};
