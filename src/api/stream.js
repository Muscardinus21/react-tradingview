// api/stream.js

import { RESOLUTION_VALUE } from "./historyProvider.js";
const socket_url = "wss://stream.binance.com:9443/ws";
const binanceWS = new WebSocket(socket_url);

let prevSymbol;
let prevResolution;

export default {
  subscribeBars: async function (
    symbolInfo,
    resolution,
    updateCb,
    uid,
    resetCache
  ) {
    binanceWS.send(
      JSON.stringify({
        method: "UNSUBSCRIBE",
        params: [`${prevSymbol}@kline_${RESOLUTION_VALUE[prevResolution]}`],
        id: 1,
      })
    );
    const symbolName = symbolInfo.name.toLowerCase();
    prevSymbol = symbolName;
    prevResolution = resolution;

    binanceWS.send(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: [`${symbolName}@kline_${RESOLUTION_VALUE[resolution]}`],
        id: 1,
      })
    );
    binanceWS.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.e) {
        updateCb({
          time: data.k.t,
          close: data.k.c,
          open: data.k.o,
          high: data.k.h,
          low: data.k.l,
          volume: data.k.v,
        });
      }
    };
  },
  unsubscribeBars: function (uid) {
    console.log("DD");
  },
};

binanceWS.onopen = () => {
  console.log("===Socket connected");
};
