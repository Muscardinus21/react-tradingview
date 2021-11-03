const baseApi = "https://api.binance.com/api/v3";

const RealPairs = new Map();
const SyntheticPairs = new Map();
const subscribeUIDs = new Map();

const Socket = new WebSocket("wss://stream.binance.com:9443/stream");

/**
 * Retrieves websocket once its connected.
 *
 * @returns {Promise}
 */
const getWS = function () {
  return new Promise((a, r) => {
    try {
      if (Socket.readyState === 1) return a(Socket);
      else {
        Socket.onopen = function (_) {
          a(Socket);
        };
      }
    } catch (e) {
      r(e);
    }
  });
};

const stackOfCallbacks = {};

Socket.onmessage = function (event) {
  const data = JSON.parse(event.data);

  if (typeof stackOfCallbacks[data.stream] !== "undefined") {
    stackOfCallbacks[data.stream](data);
  }
};

// Get all symbols
//
//
fetch(`${baseApi}/exchangeInfo`)
  .then(async (res) => {
    const decoded = await res.json();

    for (const pair of decoded.symbols) {
      // console.log(pair)
      RealPairs.set(pair.symbol, pair);
    }
  })
  .catch((err) => {
    alert("Binance error occurred. Please refresh the page.");
    // console.log(err)
  });

export default {
  onReady: (callback) => {
    // console.log('[onReady]: Method call');

    setTimeout(
      () =>
        callback({
          //supported_resolutions: ['1', '3', '15', '30', '60', '120', '240', 'D', 'W', 'M', "6M"],
          exchanges: [
            {
              // `exchange` argument for the `searchSymbols` method, if a user selects this exchange
              value: "Binance",

              // filter name
              name: "Binance",

              // full exchange name displayed in the filter popup
              desc: "Binance crypto exchange",
            },
          ],
          symbols_types: [
            {
              name: "crypto",

              // `symbolType` argument for the `searchSymbols` method, if a user selects this symbol type
              value: "crypto",
            },
            // ...
          ],
          supports_time: true,
        }),
      0
    );
  },

  getServerTime: async (callback) => {
    // console.log('server time called')
    fetch(`${baseApi}/time`).then(async (res) => {
      callback((await res.json())["serverTime"] / 1000);
    });
  },

  searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
    // console.log('[searchSymbols]: Method call');
    // console.log(userInput, exchange, symbolType, onResultReadyCallback)

    const toReturn = [];

    RealPairs.forEach((pair, _) => {
      if (pair.symbol.indexOf(userInput) !== -1)
        toReturn.push({
          symbol: pair.symbol,
          full_name: pair.symbol,
          description: pair.symbol,
          exchange: "Binance",
          ticker: pair.symbol,
          type: "crypto",
        });
    });

    setTimeout(() => onResultReadyCallback(toReturn), 0);
  },

  resolveSymbol: (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback
  ) => {
    // console.log('[resolveSymbol]: Method call', symbolName);

    const pair = RealPairs.get(symbolName);

    setTimeout(
      () =>
        onSymbolResolvedCallback({
          ticker: symbolName,
          name: symbolName,
          description: symbolName,
          type: "crypto",
          session: "24x7",
          timezone: "Etc/UTC",
          exchange: "Binance",
          minmov: 1,
          pricescale:
            typeof pair !== "undefined" &&
            parseFloat(pair.filters[0]["tickSize"]) < 0.1
              ? 10000
              : 100,
          has_intraday: true,
          has_weekly_and_monthly: true,
          supported_resolutions: [
            "1",
            "3",
            "15",
            "30",
            "60",
            "120",
            "240",
            "D",
            "W",
            "M",
            "6M",
          ],
          volume_precision: 1,
          data_status: "streaming",
        }),
      0
    );
  },

  getBars: async (
    symbolInfo,
    resolution,
    periodParams,
    onHistoryCallback,
    onErrorCallback
  ) => {
    // console.log('[getBars]: Method call', symbolInfo, resolution, periodParams);

    const { from, to, firstDataRequest } = periodParams;

    // check if it's numeric only
    if (/^\d+$/.test(resolution)) {
      if (resolution < 60) resolution = resolution + "m";
      else resolution = resolution / 60 + "h";
    }

    const baseAssetResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${
        symbolInfo.ticker
      }&interval=${resolution.toLowerCase()}&startTime=${
        from < 1501545600 ? 1501545600 : from * 1000
      }&endTime=${to * 1000}`
    );
    const baseAsset = await baseAssetResponse.json();

    if (baseAsset.length < 1) {
      onHistoryCallback([], { noData: true });
      return;
    }

    const bars = [];

    baseAsset.forEach((asset) => {
      bars.push({
        time: asset[0],
        low: parseFloat(asset[3]),
        high: parseFloat(asset[2]),
        open: parseFloat(asset[1]),
        close: parseFloat(asset[4]),
        volume: parseInt(asset[5]),
      });

      for (const key of Object.keys(bars[bars.length - 1]))
        if (typeof bars[bars.length - 1][key] !== "number") {
          console.log(bars[bars.length - 1]);
        }
    });

    console.log(bars.length);
    onHistoryCallback(bars, {
      noData: bars.length < 1,
    });
  },

  //////////////////////
  //                  //
  //  DATA STREAMING  //
  //                  //
  //////////////////////
  subscribeBars: async (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscribeUID,
    onResetCacheNeededCallback
  ) => {
    // console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID, resolution);

    // check if it's numeric only
    if (/^\d+$/.test(resolution)) {
      if (resolution < 60) resolution = resolution + "m";
      else resolution = resolution / 60 + "h";
    }

    const subscribeURI = `${symbolInfo.ticker.toLowerCase()}@kline_${resolution.toLowerCase()}`;

    (await getWS()).send(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: [subscribeURI],
        id: 1,
      })
    );

    subscribeUIDs.set(subscribeUID, subscribeURI);

    stackOfCallbacks[subscribeURI] = (data) => {
      // console.log(data.data['k']['v'] , new Date(data.data['E']))

      onRealtimeCallback({
        time: data.data["E"],
        open: parseFloat(data.data["k"]["o"]),
        high: parseFloat(data.data["k"]["h"]),
        low: parseFloat(data.data["k"]["l"]),
        close: parseFloat(data.data["k"]["c"]),
        volume: parseFloat(data.data["k"]["v"]),
      });
    };
  },

  unsubscribeBars: async (subscriberUID) => {
    // console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);

    (await getWS()).send(
      JSON.stringify({
        method: "UNSUBSCRIBE",
        params: [subscribeUIDs.get(subscriberUID)],
        id: 1,
      })
    );

    delete stackOfCallbacks[subscribeUIDs.get(subscriberUID)];
  },
};
