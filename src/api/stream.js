// api/stream.js
import historyProvider from "./historyProvider";
import { RESOLUTION_VALUE } from "./historyProvider";
const socket_url = "wss://stream.binance.com:9443/ws";
const binanceWS = new WebSocket(socket_url);
const _subs = [];

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
    if (prevSymbol && prevResolution) {
      binanceWS.send(
        JSON.stringify({
          method: "UNSUBSCRIBE",
          params: [`${prevSymbol}@kline_${RESOLUTION_VALUE[prevResolution]}`],
          id: 1,
        })
      );
    }
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

    const newSub = {
      channelString: `${symbolName}@kline_${RESOLUTION_VALUE[resolution]}`,
      uid,
      resolution,
      symbolInfo,
      lastBar: historyProvider.history[symbolInfo.name].lastBar,
      listener: updateCb,
    };
    _subs.push(newSub);
  },
  unsubscribeBars: function (uid) {
    const subIndex = _subs.findIndex((e) => e.uid === uid);
    if (subIndex === -1) {
      console.log("No subscription found for ", uid);
      return;
    }
    const sub = _subs[subIndex];

    binanceWS.send(
      JSON.stringify({
        method: "UNSUBSCRIBE",
        params: [sub.channelString],
        id: 1,
      })
    );
    _subs.splice(subIndex, 1);
  },
};

binanceWS.onopen = () => {
  console.log("===Socket connected");
};

binanceWS.onclose = (e) => {
  console.log("===Socket disconnected:", e);
};

binanceWS.onerror = (e) => {
  console.log("====socket error", e);
};

const updateBar = (data, sub) => {
  const lastBar = sub.lastBar;
  let resolution = sub.resolution;
  if (resolution.includes("d")) {
    // 1 day in minutes === 1440
    resolution = 1440;
  } else if (resolution.includes("w")) {
    // 1 week in minutes === 10080
    resolution = 10080;
  }
  const coeff = resolution * 60 * 1000;
  const rounded = Math.floor(data.ts / coeff) * coeff;
  const lastBarSec = lastBar.time;
  let _lastBar;

  if (rounded > lastBarSec) {
    // create a new candle, use last close as open **PERSONAL CHOICE**
    _lastBar = {
      time: rounded,
      open: lastBar.close,
      high: lastBar.close,
      low: lastBar.close,
      close: data.close,
      volume: 0,
    };
  } else {
    // update lastBar candle!
    if (data.low < lastBar.low) {
      lastBar.low = data.low;
    } else if (data.high > lastBar.high) {
      lastBar.high = data.high;
    }
    lastBar.volume = data.volume;
    lastBar.close = data.close;
    _lastBar = lastBar;
  }
  return _lastBar;
};

binanceWS.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.e) {
    const channelString = `${data.k.s.toLowerCase()}@kline_${data.k.i}`;
    const sub = _subs.find((e) => e.channelString === channelString);

    if (sub) {
      if (data.E < sub.lastBar.time) {
        console.log("LASTBAR TIME", data.k.t, sub.lastBar.time);
        return;
      }

      const updateData = {
        ts: +data.E,
        volume: +data.k.v,
        // price: +data.k.c,
        low: +data.k.l,
        high: +data.k.h,
        close: +data.k.c,
      };

      const _lastBar = updateBar(updateData, sub);
      sub.listener(_lastBar);
      sub.lastBar = _lastBar;
    }
  }
  // if (data.e) {
  //   updateCb({
  //     time: data.k.t,
  //     close: data.k.c,
  //     open: data.k.o,
  //     high: data.k.h,
  //     low: data.k.l,
  //     volume: data.k.v,
  //   });
  // }
};
