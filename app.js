// ===========================
// ThinkingZaka v3.0 - Complete War/Peace Strategy
// PWA Ready - Works with Samsung Web Download
// ===========================

// API Configuration
const ALPHA_API_KEY = "75IQNS7TVU6Z7WR6";

// Complete Asset List with Strategy Categories
const assets = {
    // WAR PORTFOLIO - Defense, Safe Haven
    btc: { 
        id: "bitcoin", 
        symbol: "BTC",
        name: "Bitcoin", 
        category: "war",
        type: "crypto",
        source: "coingecko",
        priority: 1,
        entryZone: [63000, 65000],
        support: 60000,
        target: 73000,
        stopLoss: 0.10,
        allocation: 0.10 // Max 10% of portfolio
    },
    pltr: { 
        id: "PLTR", 
        symbol: "PLTR",
        name: "Palantir", 
        category: "war",
        type: "stock",
        source: "alphavantage",
        priority: 2,
        entryZone: [142, 148],
        support: 136,
        target: 186,
        stopLoss: 0.10,
        allocation: 0.15
    },
    gold: { 
        id: "XAUUSD", 
        symbol: "GOLD",
        name: "Gold", 
        category: "war",
        type: "forex",
        source: "alphavantage",
        priority: 2,
        entryZone: [4805, 5000],
        support: 4780,
        target: 6000,
        stopLoss: 0.05,
        allocation: 0.15
    },
    
    // PEACE PORTFOLIO - Growth, Risk-On
    qqq: { 
        id: "QQQ", 
        symbol: "QQQ",
        name: "Nasdaq (QQQ)", 
        category: "peace",
        type: "stock",
        source: "alphavantage",
        priority: 2,
        entryZone: [595, 603],
        support: 585,
        target: 616,
        stopLoss: 0.08,
        allocation: 0.15
    },
    sol: { 
        id: "solana", 
        symbol: "SOL",
        name: "Solana", 
        category: "peace",
        type: "crypto",
        source: "coingecko",
        priority: 1,
        entryZone: [78, 81],
        support: 76,
        target: 101,
        stopLoss: 0.15,
        allocation: 0.05
    },
    
    // South African Peace Portfolio
    capitec: { 
        id: "CPI.JO", 
        symbol: "CPI",
        name: "Capitec", 
        category: "peace",
        type: "sa_stock",
        source: "alphavantage",
        priority: 3,
        entryZone: [4155, 4170],
        support: 4170,
        target: 4779,
        stopLoss: 0.10,
        fallbackPrice: 4210,
        allocation: 0.10
    },
    standardbank: { 
        id: "SBK.JO", 
        symbol: "SBK",
        name: "Standard Bank", 
        category: "peace",
        type: "sa_stock",
        source: "alphavantage",
        priority: 3,
        entryZone: [290, 303],
        support: 285,
        target: 350,
        stopLoss: 0.10,
        fallbackPrice: 296,
        allocation: 0.10
    },
    firstrand: { 
        id: "FSR.JO", 
        symbol: "FSR",
        name: "FirstRand", 
        category: "peace",
        type: "sa_stock",
        source: "alphavantage",
        priority: 3,
        entryZone: [86, 87],
        support: 84,
        target: 102,
        stopLoss: 0.10,
        fallbackPrice: 86,
        allocation: 0.10
    },
    shoprite: { 
        id: "SHP.JO", 
        symbol: "SHP",
        name: "Shoprite", 
        category: "peace",
        type: "sa_stock",
        source: "alphavantage",
        priority: 3,
        entryZone: [260, 261],
        support: 255,
        target: 285,
        stopLoss: 0.10,
        fallbackPrice: 260,
        allocation: 0.10
    }
};

// ===========================
// STATE MANAGEMENT
// ===========================

const state = {
    prices: JSON.parse(localStorage.getItem('thinkingzaka_prices') || '{}'),
    history: JSON.parse(localStorage.getItem('thinkingzaka_history') || '{}'),
    entries: JSON.parse(localStorage.getItem('thinkingzaka_entries') || '{}'),
    lastFetch: JSON.parse(localStorage.getItem('thinkingzaka_fetch') || '{}'),
    alphaCalls: parseInt(localStorage.getItem('thinkingzaka_alphacalls') || '0'),
    lastReset: localStorage.getItem('thinkingzaka_reset') || new Date().toDateString(),
    cycleCount: parseInt(localStorage.getItem('thinkingzaka_cycle') || '0'),
    portfolio: JSON.parse(localStorage.getItem('thinkingzaka_portfolio') || '{"war":0,"peace":0,"cash":100000}')
};

// Initialize history arrays
Object.keys(assets).forEach(key => {
    if (!state.history[key]) state.history[key] = [];
});

// ===========================
// PWA NOTIFICATION SETUP
// ===========================

async function setupNotifications() {
    if (!('Notification' in window) || !navigator.serviceWorker) {
        console.log('Notifications not fully supported');
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        
        if (Notification.permission === 'granted') {
            return true;
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
    } catch (error) {
        console.log('Notification setup error:', error);
    }
    return false;
}

// Use ServiceWorker for notifications (fixes your error)
async function sendNotification(title, body) {
    if (!('serviceWorker' in navigator)) {
        // Fallback to alert
        createAlert(`🔔 ${title}: ${body}`);
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            body: body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            vibrate: [200, 100, 200],
            data: { timestamp: Date.now() }
        });
    } catch (error) {
        console.log('Notification error:', error);
        createAlert(`🔔 ${title}: ${body}`); // Fallback
    }
}

// ===========================
// API LIMIT MANAGEMENT
// ===========================

function checkAlphaLimit() {
    const today = new Date().toDateString();
    if (today !== state.lastReset) {
        state.alphaCalls = 0;
        state.lastReset = today;
        localStorage.setItem('thinkingzaka_reset', today);
    }
    
    const apiEl = document.getElementById("apiUsage");
    if (apiEl) {
        apiEl.textContent = `Alpha Vantage: ${state.alphaCalls}/25 today`;
        if (state.alphaCalls > 20) apiEl.className = "api-status warning";
        else if (state.alphaCalls > 23) apiEl.className = "api-status error";
        else apiEl.className = "api-status";
    }
    
    localStorage.setItem('thinkingzaka_alphacalls', state.alphaCalls.toString());
    return state.alphaCalls < 23;
}

// ===========================
// PRICE FETCHING
// ===========================

async function fetchJSON(url, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        }
    }
}

async function getUSDZARRate() {
    try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=ZAR&apikey=${ALPHA_API_KEY}`;
        state.alphaCalls++;
        const data = await fetchJSON(url);
        return parseFloat(data["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"] || 18.5);
    } catch {
        return 18.5;
    }
}

async function getPrice(assetKey, asset) {
    const now = Date.now();
    
    // Check cache
    const cacheTime = asset.priority === 1 ? 120000 : 300000;
    if (state.lastFetch[assetKey] && now - state.lastFetch[assetKey] < cacheTime) {
        return state.prices[assetKey];
    }
    
    // Stagger low priority assets
    if (asset.priority === 3 && state.cycleCount % 3 !== 0) {
        return state.prices[assetKey] || asset.fallbackPrice || 0;
    }
    
    try {
        let price = 0;
        let usdPrice = 0;
        
        if (asset.type === "crypto") {
            const data = await fetchJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${asset.id}&vs_currencies=usd`);
            price = data[asset.id]?.usd || 0;
            usdPrice = price;
        } 
        else if (asset.type === "sa_stock") {
            if (!checkAlphaLimit()) return state.prices[assetKey] || asset.fallbackPrice || 0;
            
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.id}&apikey=${ALPHA_API_KEY}`;
            state.alphaCalls++;
            const data = await fetchJSON(url);
            
            const zarPrice = parseFloat(data["Global Quote"]?.["05. price"] || 0);
            if (zarPrice > 0) {
                const usdZar = await getUSDZARRate();
                price = zarPrice;
                usdPrice = zarPrice / usdZar;
            }
        }
        else if (asset.type === "forex") {
            if (!checkAlphaLimit()) return state.prices[assetKey] || 0;
            
            const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${ALPHA_API_KEY}`;
            state.alphaCalls++;
            const data = await fetchJSON(url);
            price = parseFloat(data["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"] || 0);
            usdPrice = price;
        }
        else {
            if (!checkAlphaLimit()) return state.prices[assetKey] || 0;
            
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.id}&apikey=${ALPHA_API_KEY}`;
            state.alphaCalls++;
            const data = await fetchJSON(url);
            price = parseFloat(data["Global Quote"]?.["05. price"] || 0);
            usdPrice = price;
        }
        
        if (price > 0) {
            state.prices[assetKey] = usdPrice || price;
            state.lastFetch[assetKey] = now;
            
            state.history[assetKey].push(usdPrice || price);
            if (state.history[assetKey].length > 20) {
                state.history[assetKey].shift();
            }
            
            // Persist to localStorage
            localStorage.setItem('thinkingzaka_prices', JSON.stringify(state.prices));
            localStorage.setItem('thinkingzaka_history', JSON.stringify(state.history));
            localStorage.setItem('thinkingzaka_fetch', JSON.stringify(state.lastFetch));
        }
        
        return state.prices[assetKey] || asset.fallbackPrice || 0;
        
    } catch (error) {
        console.error(`Error fetching ${assetKey}:`, error);
        createAlert(`⚠️ ${asset.name} data error - using cached`);
        return state.prices[assetKey] || asset.fallbackPrice || 0;
    }
}

// ===========================
// TECHNICAL ANALYSIS
// ===========================

function calculateRSI(assetKey, currentPrice) {
    const history = state.history[assetKey] || [];
    if (history.length < 14) return 50;
    
    let gains = 0, losses = 0;
    for (let i = history.length - 14; i < history.length - 1; i++) {
        const change = history[i + 1] - history[i];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// ===========================
// STRATEGY: Entry Analysis
// ===========================

function analyzeEntry(assetKey, asset, price) {
    if (!price || price === 0) return null;
    
    const inZone = price >= asset.entryZone[0] && price <= asset.entryZone[1];
    const nearSupport = price <= asset.support * 1.02;
    const rsi = calculateRSI(assetKey, price);
    const isOverbought = rsi > 70;
    const isOversold = rsi < 30;
    
    // Pullback detection
    const history = state.history[assetKey] || [];
    const recentHigh = Math.max(...history.slice(-5));
    const isPullback = recentHigh > price * 1.03;
    
    // Distance to target
    const targetDistance = ((asset.target - price) / price) * 100;
    
    // Your strategy: Buy pullbacks in zones, not breakouts
    let signal = null;
    
    if (inZone && isPullback && !isOverbought) {
        signal = {
            type: 'STRONG BUY',
            reason: `Pullback in zone, RSI ${rsi.toFixed(0)}`,
            confidence: 'HIGH',
            action: 'buy'
        };
    }
    else if (inZone && !isOverbought && rsi < 60) {
        signal = {
            type: 'BUY',
            reason: `In entry zone, RSI ${rsi.toFixed(0)}`,
            confidence: 'MEDIUM',
            action: 'watch'
        };
    }
    else if (nearSupport && isOversold) {
        signal = {
            type: 'BUY',
            reason: `Near support, oversold (RSI ${rsi.toFixed(0)})`,
            confidence: 'MEDIUM',
            action: 'watch'
        };
    }
    else if (inZone && isOverbought) {
        signal = {
            type: 'WAIT',
            reason: `In zone but overbought - wait for pullback`,
            confidence: 'LOW',
            action: 'wait'
        };
    }
    
    // Stop loss check
    const entryPrice = state.entries[assetKey];
    if (entryPrice) {
        const loss = (entryPrice - price) / entryPrice;
        if (loss > asset.stopLoss) {
            signal = {
                type: 'STOP LOSS',
                reason: `${(loss*100).toFixed(1)}% loss - exit signal`,
                confidence: 'HIGH',
                action: 'exit'
            };
        }
    }
    
    return {
        price,
        inZone,
        nearSupport,
        rsi: Math.round(rsi),
        isOverbought,
        isOversold,
        isPullback,
        targetDistance: targetDistance.toFixed(1),
        signal,
        entryPrice: state.entries[assetKey]
    };
}

// ===========================
// MACRO REGIME DETECTION
// ===========================

function detectMacroRegime() {
    const btc = state.prices.btc || 0;
    const pltr = state.prices.pltr || 0;
    const qqq = state.prices.qqq || 0;
    const gold = state.prices.gold || 0;
    
    let warScore = 0;
    let peaceScore = 0;
    
    // War signals from strategy
    if (gold > assets.gold.support * 1.02) warScore += 2;
    if (btc < assets.btc.support) warScore += 1;
    if (pltr > assets.pltr.target) warScore += 2;
    
    // Peace signals from strategy
    if (qqq > assets.qqq.support * 1.03) peaceScore += 2;
    if (btc > assets.btc.entryZone[0]) peaceScore += 1;
    if (pltr < assets.pltr.entryZone[1]) peaceScore += 1;
    
    // Calculate portfolio allocation
    const totalPortfolio = state.portfolio.war + state.portfolio.peace + state.portfolio.cash;
    const warPct = ((state.portfolio.war / totalPortfolio) * 100).toFixed(1);
    const peacePct = ((state.portfolio.peace / totalPortfolio) * 100).toFixed(1);
    
    document.getElementById("allocationStatus").innerHTML = 
        `War: ${warPct}% | Peace: ${peacePct}% | Target: 40/40/20`;
    
    if (warScore > peaceScore + 1) {
        return {
            text: "⚔️ WAR BIAS - Favor defense assets",
            class: "war",
            allocation: "Increase war to 50%"
        };
    } else if (peaceScore > warScore + 1) {
        return {
            text: "🕊️ PEACE BIAS - Favor growth assets",
            class: "peace",
            allocation: "Increase peace to 50%"
        };
    } else {
        return {
            text: "⚖️ NEUTRAL - Balanced 40/40/20",
            class: "neutral",
            allocation: "Maintain equal weights"
        };
    }
}

// ===========================
// UI UPDATES
// ===========================

function createAlert(text) {
    const list = document.getElementById("alertList");
    if (!list) return;
    
    const li = document.createElement("li");
    li.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    list.prepend(li);
    
    while (list.children.length > 20) {
        list.removeChild(list.lastChild);
    }
}

function updateCard(assetKey, asset) {
    const price = state.prices[assetKey] || 0;
    if (!price) return;
    
    let card = document.getElementById(`card-${assetKey}`);
    const analysis = analyzeEntry(assetKey, asset, price);
    
    // Create card if doesn't exist
    if (!card) {
        const dashboard = document.getElementById("dashboard");
        card = document.createElement("div");
        card.id = `card-${assetKey}`;
        card.className = `card ${asset.category}`;
        dashboard.appendChild(card);
    }
    
    // Price change arrow
    const prevPrice = state.history[assetKey]?.[state.history[assetKey].length - 2] || price;
    const arrow = price > prevPrice ? "↑" : (price < prevPrice ? "↓" : "→");
    const priceClass = price > prevPrice ? "up" : (price < prevPrice ? "down" : "stable");
    
    // Generate alert for buy signals (but throttle)
    if (analysis?.signal?.type === 'STRONG BUY') {
        const lastAlert = localStorage.getItem(`alert_${assetKey}`);
        const now = Date.now();
        if (!lastAlert || now - parseInt(lastAlert) > 3600000) { // Once per hour
            sendNotification(
                `🎯 ${asset.symbol} BUY SIGNAL`,
                `${analysis.signal.reason} at $${price.toLocaleString()}`
            );
            createAlert(`🎯 ${asset.symbol}: ${analysis.signal.reason} at $${price.toLocaleString()}`);
            localStorage.setItem(`alert_${assetKey}`, now.toString());
        }
    }
    
    // Build card HTML
    card.innerHTML = `
        <h3>
            ${asset.symbol}
            <span class="category-badge ${asset.category}">${asset.category}</span>
        </h3>
        <div class="price ${priceClass}">
            $${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${arrow}
        </div>
        
        <div class="strategy-panel">
            <div class="zone-row">
                <span>Entry:</span> $${asset.entryZone[0].toLocaleString()} - $${asset.entryZone[1].toLocaleString()}
            </div>
            <div class="zone-row">
                <span>Target:</span> $${asset.target.toLocaleString()} (${analysis?.targetDistance || 0}%)
            </div>
            <div class="indicator-row">
                <span class="rsi ${analysis?.isOverbought ? 'overbought' : (analysis?.isOversold ? 'oversold' : '')}">
                    RSI: ${analysis?.rsi || 50}
                </span>
                <span>${analysis?.isPullback ? '📉 Pullback' : '📈 Trending'}</span>
            </div>
            ${analysis?.signal ? `
                <div class="signal ${analysis.signal.action === 'buy' ? 'buy-high' : 
                                      (analysis.signal.action === 'watch' ? 'buy-medium' : 'warning')}">
                    ${analysis.signal.type === 'STRONG BUY' ? '🎯 ' : ''}
                    ${analysis.signal.reason}
                </div>
            ` : ''}
            ${analysis?.entryPrice ? `
                <div style="margin-top: 5px; font-size: 11px; color: #888;">
                    Entry: $${analysis.entryPrice.toLocaleString()}
                </div>
            ` : ''}
        </div>
        
        <div class="metadata">
            <span>${asset.source}</span>
            <span>${new Date().toLocaleTimeString()}</span>
        </div>
    `;
}

// ===========================
// MAIN UPDATE LOOP
// ===========================

async function updateMarket() {
    state.cycleCount++;
    localStorage.setItem('thinkingzaka_cycle', state.cycleCount.toString());
    
    // Update API usage display
    checkAlphaLimit();
    
    // Fetch all assets
    for (const [key, asset] of Object.entries(assets)) {
        await getPrice(key, asset);
    }
    
    // Update all cards
    for (const [key, asset] of Object.entries(assets)) {
        updateCard(key, asset);
    }
    
    // Update macro regime
    const regime = detectMacroRegime();
    const macroEl = document.getElementById("macroStatus");
    if (macroEl) {
        macroEl.textContent = regime.text;
        macroEl.className = regime.class;
    }
    
    document.getElementById("lastFullUpdate").textContent = new Date().toLocaleTimeString();
    
    // Broadcast to service worker
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE',
            data: { prices: state.prices, regime: regime.text }
        });
    }
}

// ===========================
// MANUAL REFRESH
// ===========================

function manualRefresh() {
    createAlert("🔄 Manual refresh triggered");
    updateMarket();
}

// ===========================
// PORTFOLIO TRACKING
// ===========================

function recordEntry(assetKey, quantity, price) {
    const asset = assets[assetKey];
    if (!asset) return;
    
    state.entries[assetKey] = price;
    const value = price * quantity;
    state.portfolio[asset.category] += value;
    state.portfolio.cash -= value;
    
    localStorage.setItem('thinkingzaka_entries', JSON.stringify(state.entries));
    localStorage.setItem('thinkingzaka_portfolio', JSON.stringify(state.portfolio));
    
    createAlert(`📝 Recorded ${asset.symbol} entry: ${quantity} @ $${price}`);
    sendNotification('Position Recorded', `${asset.symbol}: ${quantity} shares @ $${price}`);
}

function recordExit(assetKey, quantity, price) {
    const asset = assets[assetKey];
    if (!asset || !state.entries[assetKey]) return;
    
    const entryPrice = state.entries[assetKey];
    const value = price * quantity;
    const pnl = ((price - entryPrice) / entryPrice) * 100;
    
    state.portfolio[asset.category] -= value;
    state.portfolio.cash += value;
    delete state.entries[assetKey];
    
    localStorage.setItem('thinkingzaka_entries', JSON.stringify(state.entries));
    localStorage.setItem('thinkingzaka_portfolio', JSON.stringify(state.portfolio));
    
    createAlert(`📝 Exited ${asset.symbol}: ${pnl.toFixed(1)}% P&L`);
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    // Setup notifications
    await setupNotifications();
    
    // Listen for service worker messages
    if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data.type === 'REFRESH') {
                updateMarket();
            }
        });
    }
    
    // Initial update
    await updateMarket();
    
    // Set interval (10 minutes to save API calls)
    setInterval(updateMarket, 600000);
    
    // Register for background sync if supported
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('market-update');
    }
});

// Expose to window for console access
window.thinkingzaka = {
    refresh: manualRefresh,
    recordEntry,
    recordExit,
    state,
    assets
};
