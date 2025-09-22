// Debug script to test chart data flow
const testData = [
  {
    "time": 1757699854,
    "open": 102.56632195086016,
    "high": 103.52389864965981,
    "low": 101.58024722516411,
    "close": 103.40612738684324,
    "volume": 801106.0
  },
  {
    "time": 1757786254,
    "open": 97.54876804365881,
    "high": 98.06174643290566,
    "low": 97.1420915562906,
    "close": 97.95439482829704,
    "volume": 805995.0
  }
];

console.log("Test data structure:");
console.log(JSON.stringify(testData, null, 2));
console.log("\nData validation:");
testData.forEach((item, index) => {
  console.log(`Item ${index}:`, {
    hasTime: typeof item.time === 'number',
    hasOpen: typeof item.open === 'number',
    hasHigh: typeof item.high === 'number',
    hasLow: typeof item.low === 'number',
    hasClose: typeof item.close === 'number',
    hasVolume: typeof item.volume === 'number',
    timeValue: item.time,
    priceValues: [item.open, item.high, item.low, item.close]
  });
});