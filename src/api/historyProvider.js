var rp = require("request-promise").defaults({ json: true });

const api_root = "https://api.binance.com/api/v3/klines";
const history = {};

export default {
  history: history,

  getBars: function (symbolInfo, resolution, from, to, first, limit) {
    // var split_symbol = symbolInfo.name.split(/[:/]/);
    console.log(symbolInfo.name);
    console.log("FROM", from);
    console.log("TO", to);
    console.log("RESOLUTION", resolution);
    //example
    //https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m&startTime=1634441869000&endTime=1634489749000
    // console.log(resolution);
    // const url =
    //   resolution === "D"
    //     ? "/data/histoday"
    //     : resolution >= 60
    //     ? "/data/histohour"
    //     : "/data/histominute";
    // const qs = {
    //   e: split_symbol[0],
    //   fsym: split_symbol[1],
    //   tsym: split_symbol[2],
    //   toTs: to ? to : "",
    //   limit: limit ? limit : 2000,
    //   // aggregate: 1//resolution
    // };
    // console.log({qs})
    const queryString = `?symbol=${symbolInfo.name}&interval=15m&startTime=${
      from * 1000
    }&endTime=${to * 1000}`;

    return rp({
      uri: `${api_root}${queryString}`,
      json: true,
    }).then((data) => {
      console.log({ data });
      // if (data.Response && data.Response === "Error") {
      //   console.log("CryptoCompare API error:", data.Message);
      //   return [];
      // }
      if (data.length) {
        // console.log(
        //   `Actually returned: ${new Date(
        //     data.TimeFrom * 1000
        //   ).toISOString()} - ${new Date(data.TimeTo * 1000).toISOString()}`
        // );
        const bars = data.map((el) => {
          const [
            time,
            open,
            high,
            low,
            close,
            volume,
            closeTime,
            quotes,
            trades,
            buyBase,
            quoteBase,
            ignore,
          ] = el;
          return {
            time,
            low,
            high,
            open,
            close,
            volume,
          };
        });
        if (first) {
          var lastBar = bars[bars.length - 1];
          history[symbolInfo.name] = { lastBar: lastBar };
        }
        return bars;
      } else {
        return [];
      }
    });
  },
};
