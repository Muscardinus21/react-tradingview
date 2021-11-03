import { resolutionGap } from "./utils";
const rp = require("request-promise").defaults({ json: true });

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

  getBars: async function (symbolInfo, resolution, from, to, first, limit) {
    //example
    //https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m&startTime=1634441869000&endTime=1634489749000

    let iterations = Math.ceil(limit / 1000);
    let startTime = from < 1501545600 ? 1501545600 : from;
    let endTime = startTime + resolutionGap(resolution) * 1000;
    let rawBars = [];
    if (to < 0) return rawBars;

    while (iterations > 0) {
      const queryString = `?symbol=${symbolInfo.name}&interval=${
        RESOLUTION_VALUE[resolution]
      }&startTime=${startTime * 1000}&endTime=${
        (endTime < to ? endTime : to) * 1000
      }&limit=1000`;
      rawBars = rawBars.concat(
        await rp({
          uri: `${api_root}${queryString}`,
          json: true,
        }).then((data) => {
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
            return bars;
          } else {
            return [];
          }
        })
      );
      startTime = endTime;
      endTime = endTime + resolutionGap(resolution) * 1000;
      iterations--;
    }
    if (first) {
      const lastBar = rawBars[rawBars.length - 1];
      history[symbolInfo.name] = { lastBar };
    }
    return rawBars;
  },
};
