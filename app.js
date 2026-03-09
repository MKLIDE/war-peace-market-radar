// ===========================
// ThinkingZaka v1 - Live Dashboard
// ===========================

const ALPHA_API_KEY = "75IQNS7TVU6Z7WR6"; // replace with your key

const assets = {
  btc: "bitcoin",
  sol: "solana",
  pltr: "PLTR",
  qqq: "QQQ",
  gold: "XAUUSD"
};

const entryZones = {
  btc: [63000, 65000],
  sol: [78, 81],
  pltr: [142, 148],
  qqq: [595, 603],
  gold: [4805, 5000]
};

// Utility for fetching JSON
async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

// ---------------- Crypto via CoinGecko
async function getCryptoPrice(id) {
  const data = await fetchJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
  return data[id]?.usd || 0;
}

// ---------------- Stocks/Gold via Alpha Vantage
async function getStockPrice(symbol) {
  let func = symbol === "XAUUSD" ? "CURRENCY_EXCHANGE_RATE" : "GLOBAL_QUOTE";
  let url = func === "GLOBAL_QUOTE" ?
    `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${ALPHA_API_KEY}` :
    `https://www.alphavantage.co/query?function=${func}&from_currency=XAU&to_currency=USD&apikey=${ALPHA_API_KEY}`;
  
  const data = await fetchJSON(url);

  if(func === "GLOBAL_QUOTE") {
    return parseFloat(data["Global Quote"]["05. price"]) || 0;
  } else {
    return parseFloat(data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]) || 0;
  }
}

// ---------------- Update Cards & Alerts
function updateCard(id,name,price){
  const card = document.getElementById(id);
  if(!card) return;
  let arrow = priceChange[id] ? (price > priceChange[id] ? "↑" : "↓") : "";
  priceChange[id] = price;
  card.innerHTML = `<h3>${name}</h3>
    <div class="price">$${price.toLocaleString()} ${arrow}</div>
    Last update: ${new Date().toLocaleTimeString()}`;
}

// Check entry zones
function checkEntryZone(id,price){
  const zone = entryZones[id];
  if(!zone) return;
  if(price >= zone[0] && price <= zone[1]){
    createAlert(`${id.toUpperCase()} entered ENTRY ZONE: ${zone[0]}–${zone[1]}`);
    notifyUser(`${id.toUpperCase()} ALERT`, `Price at ${price}`);
  }
}

// ---------------- Alerts
function createAlert(text){
  const list = document.getElementById("alertList");
  const li = document.createElement("li");
  li.textContent = text;
  list.prepend(li);
}

// ---------------- Notifications
function notifyUser(title,text){
  if(!("Notification" in window)) return;
  if(Notification.permission === "granted"){
    new Notification(title, { body: text });
  } else if(Notification.permission !== "denied"){
    Notification.requestPermission().then(p => {
      if(p === "granted") new Notification(title,{body:text});
    });
  }
}

// ---------------- Macro Regime
function updateMacro(){
  const btcPrice = priceChange.btc || 0;
  const pltrPrice = priceChange.pltr || 0;
  const score = (btcPrice > 65000 ? -1 : 1) + (pltrPrice > 150 ? -1 : 1);
  document.getElementById("macroStatus").innerText = score > 0 ? "WAR BIAS" : "PEACE BIAS";
}

// ---------------- Main Update
const priceChange = {};

async function updateMarket(){
  // Crypto
  const btcPrice = await getCryptoPrice("bitcoin");
  updateCard("btc","BTC",btcPrice);
  checkEntryZone("btc",btcPrice);

  const solPrice = await getCryptoPrice("solana");
  updateCard("sol","SOL",solPrice);
  checkEntryZone("sol",solPrice);

  // Stocks
  const pltrPrice = await getStockPrice("PLTR");
  updateCard("pltr","PLTR",pltrPrice);
  checkEntryZone("pltr",pltrPrice);

  const qqqPrice = await getStockPrice("QQQ");
  updateCard("qqq","QQQ",qqqPrice);
  checkEntryZone("qqq",qqqPrice);

  // Gold
  const goldPrice = await getStockPrice("XAUUSD");
  updateCard("gold","GOLD",goldPrice.toFixed(2));
  checkEntryZone("gold",goldPrice);

  updateMacro();
}

// Refresh every 30s
updateMarket();
setInterval(updateMarket,30000);
