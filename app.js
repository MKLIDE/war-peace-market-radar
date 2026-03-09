// ========================================
// ThinkingZaka - Complete Strategy Implementation
// FIXED: Cards loading issue resolved
// ========================================

// API Configuration
const ALPHA_API_KEY = "75IQNS7TVU6Z7WR6";

// Complete Asset Configuration
const assets = [
    // War Portfolio
    { key: 'btc', id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', category: 'war', type: 'crypto', source: 'coingecko',
      entry: [63000, 65000], support: 60000, target: 73000, stop: 0.10 },
    { key: 'pltr', id: 'PLTR', symbol: 'PLTR', name: 'Palantir', category: 'war', type: 'stock', source: 'alphavantage',
      entry: [142, 148], support: 136, target: 186, stop: 0.10 },
    { key: 'gold', id: 'XAUUSD', symbol: 'GOLD', name: 'Gold', category: 'war', type: 'forex', source: 'alphavantage',
      entry: [4805, 5000], support: 4780, target: 6000, stop: 0.05 },
    
    // Peace Portfolio - US
    { key: 'qqq', id: 'QQQ', symbol: 'QQQ', name: 'Nasdaq', category: 'peace', type: 'stock', source: 'alphavantage',
      entry: [595, 603], support: 585, target: 616, stop: 0.08 },
    { key: 'sol', id: 'solana', symbol: 'SOL', name: 'Solana', category: 'peace', type: 'crypto', source: 'coingecko',
      entry: [78, 81], support: 76, target: 101, stop: 0.15 },
    
    // South African Portfolio
    { key: 'capitec', id: 'CPI.JO', symbol: 'CPI', name: 'Capitec', category: 'peace', type: 'sa_stock', source: 'alphavantage',
      entry: [4155, 4170], support: 4170, target: 4779, stop: 0.10, fallback: 4210 },
    { key: 'standardbank', id: 'SBK.JO', symbol: 'SBK', name: 'Standard Bank', category: 'peace', type: 'sa_stock', source: 'alphavantage',
      entry: [290, 303], support: 285, target: 350, stop: 0.10, fallback: 296 },
    { key: 'firstrand', id: 'FSR.JO', symbol: 'FSR', name: 'FirstRand', category: 'peace', type: 'sa_stock', source: 'alphavantage',
      entry: [86, 87], support: 84, target: 102, stop: 0.10, fallback: 86 },
    { key: 'shoprite', id: 'SHP.JO', symbol: 'SHP', name: 'Shoprite', category: 'peace', type: 'sa_stock', source: 'alphavantage',
      entry: [260, 261], support: 255, target: 285, stop: 0.10, fallback: 260 }
];

// State Management
const state = {
    prices: {},
    history: {},
    entries: {},
    lastFetch: {},
    alphaCalls: 0,
    lastReset: new Date().toDateString(),
    cycleCount: 0,
    portfolio: { war: 0, peace: 0, cash: 100000 }
};

// Initialize history
assets.forEach(asset => { 
    state.history[asset.key] = []; 
});

// ========================================
// Utility Functions
// ========================================

function addAlert(text) {
    const list = document.getElementById('alertList');
    if (!list) return;
    
    // Remove placeholder if it exists
    if (list.children.length === 1 && list.children[0].classList.contains('alert-placeholder')) {
        list.innerHTML = '';
    }
    
    const li = document.createElement('li');
    li.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    list.prepend(li);
    
    // Keep only last 20 alerts
    while (list.children.length > 20) {
        list.removeChild(list.lastChild);
    }
}

async function fetchJSON(url, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (error) {
            console.log(`Fetch attempt ${i + 1} failed:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

function checkAlphaLimit() {
    const today = new Date().toDateString();
    if (today !== state.lastReset) {
        state.alphaCalls = 0;
        state.lastReset = today;
    }
    
    const el = document.getElementById('apiUsage');
    if (el) {
        el.textContent = `API: ${state.alphaCalls}/25`;
        if (state.alphaCalls > 20) {
            el.style.color = '#ff4d4d';
        } else {
            el.style.color = '';
        }
    }
    
    return state.alphaCalls < 23;
}

// ========================================
// Price Fetching with Fallbacks
// ========================================

async function getUSDZARRate() {
    try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=ZAR&apikey=${ALPHA_API_KEY}`;
        state.alphaCalls++;
        const data = await fetchJSON(url);
        return parseFloat(data['Realtime Currency Exchange Rate']?.['5. Exchange Rate'] || 18.5);
    } catch (error) {
        console.log('USD/ZAR fetch failed, using fallback:', error);
        return 18.5;
    }
}

async function fetchPrice(asset) {
    const now = Date.now();
    
    // Check cache (5 minutes)
    if (state.lastFetch[asset.key] && now - state.lastFetch[asset.key] < 300000) {
        console.log(`Using cached data for ${asset.key}`);
        return state.prices[asset.key];
    }
    
    console.log(`Fetching ${asset.key}...`);
    
    try {
        let price = 0;
        
        if (asset.type === 'crypto') {
            // CoinGecko - free, unlimited
            const data = await fetchJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${asset.id}&vs_currencies=usd`);
            price = data[asset.id]?.usd || 0;
            console.log(`${asset.key} price from CoinGecko:`, price);
        }
        else if (asset.type === 'sa_stock') {
            if (!checkAlphaLimit()) {
                console.log(`Alpha limit reached, using fallback for ${asset.key}`);
                return state.prices[asset.key] || asset.fallback || 0;
            }
            
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.id}&apikey=${ALPHA_API_KEY}`;
            state.alphaCalls++;
            const data = await fetchJSON(url);
            
            // Alpha Vantage returns empty object if limit reached or no data
            if (!data || Object.keys(data).length === 0) {
                console.log(`Empty response for ${asset.key}`);
                return state.prices[asset.key] || asset.fallback || 0;
            }
            
            const quote = data['Global Quote'] || {};
            const zarPrice = parseFloat(quote['05. price'] || 0);
            
            if (zarPrice > 0) {
                const usdZar = await getUSDZARRate();
                price = zarPrice / usdZar;
                console.log(`${asset.key} ZAR: ${zarPrice}, USD: ${price}, rate: ${usdZar}`);
            } else {
                console.log(`No price data for ${asset.key}, using fallback`);
                return state.prices[asset.key] || asset.fallback || 0;
            }
        }
        else if (asset.type === 'forex') {
            if (!checkAlphaLimit()) {
                return state.prices[asset.key] || 0;
            }
            
            const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${ALPHA_API_KEY}`;
            state.alphaCalls++;
            const data = await fetchJSON(url);
            
            const rateData = data['Realtime Currency Exchange Rate'] || {};
            price = parseFloat(rateData['5. Exchange Rate'] || 0);
            console.log(`${asset.key} price from Alpha:`, price);
        }
        else {
            if (!checkAlphaLimit()) {
                return state.prices[asset.key] || 0;
            }
            
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.id}&apikey=${ALPHA_API_KEY}`;
            state.alphaCalls++;
            const data = await fetchJSON(url);
            
            const quote = data['Global Quote'] || {};
            price = parseFloat(quote['05. price'] || 0);
            console.log(`${asset.key} price from Alpha:`, price);
        }
        
        if (price > 0) {
            state.prices[asset.key] = price;
            state.lastFetch[asset.key] = now;
            state.history[asset.key].push(price);
            if (state.history[asset.key].length > 20) {
                state.history[asset.key].shift();
            }
            console.log(`✅ ${asset.key} updated: $${price}`);
        } else {
            console.log(`⚠️ Zero price for ${asset.key}, keeping previous:`, state.prices[asset.key]);
            return state.prices[asset.key] || asset.fallback || 0;
        }
        
        return price;
        
    } catch (error) {
        console.error(`❌ Error fetching ${asset.key}:`, error);
        return state.prices[asset.key] || asset.fallback || 0;
    }
}

// ========================================
// Technical Analysis
// ========================================

function calculateRSI(key, currentPrice) {
    const history = state.history[key] || [];
    if (history.length < 14) {
        return 50; // Neutral until we have enough data
    }
    
    let gains = 0, losses = 0;
    // Use last 14 periods for calculation
    for (let i = history.length - 14; i < history.length - 1; i++) {
        if (i < 0 || i + 1 >= history.length) continue;
        const change = history[i + 1] - history[i];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    if (gains === 0 && losses === 0) return 50;
    
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function analyzeAsset(asset, price) {
    if (!price || price === 0) {
        return {
            price: 0,
            inZone: false,
            rsi: 50,
            isOverbought: false,
            isOversold: false,
            isPullback: false,
            targetDistance: '0',
            signal: null
        };
    }
    
    const inZone = price >= asset.entry[0] && price <= asset.entry[1];
    const nearSupport = price <= asset.support * 1.02;
    const rsi = calculateRSI(asset.key, price);
    const isOverbought = rsi > 70;
    const isOversold = rsi < 30;
    
    // Check pullback
    const history = state.history[asset.key] || [];
    let isPullback = false;
    if (history.length >= 5) {
        const recentHigh = Math.max(...history.slice(-5));
        isPullback = recentHigh > price * 1.03;
    }
    
    // Target distance
    const targetDistance = asset.target > 0 ? ((asset.target - price) / price * 100).toFixed(1) : '0';
    
    // Entry logic
    let signal = null;
    
    if (inZone && isPullback && !isOverbought) {
        signal = { type: 'BUY', reason: 'Pullback in zone', confidence: 'HIGH' };
    }
    else if (inZone && !isOverbought && rsi < 60) {
        signal = { type: 'WATCH', reason: 'In zone', confidence: 'MEDIUM' };
    }
    else if (nearSupport && isOversold) {
        signal = { type: 'WATCH', reason: 'Near support', confidence: 'MEDIUM' };
    }
    
    // Stop loss check
    if (state.entries[asset.key]) {
        const loss = (state.entries[asset.key] - price) / state.entries[asset.key];
        if (loss > asset.stop) {
            signal = { type: 'STOP', reason: `${(loss*100).toFixed(1)}% loss`, confidence: 'HIGH' };
        }
    }
    
    return {
        price,
        inZone,
        rsi: Math.round(rsi),
        isOverbought,
        isOversold,
        isPullback,
        targetDistance,
        signal
    };
}

// ========================================
// UI Rendering - FIXED VERSION
// ========================================

function renderCard(asset) {
    const price = state.prices[asset.key] || 0;
    const priceDisplay = price || asset.fallback || 0;
    
    // Get or create card container
    let card = document.getElementById(`card-${asset.key}`);
    
    // If card doesn't exist, determine which grid it belongs to
    if (!card) {
        let gridId = '';
        
        if (asset.category === 'war') {
            gridId = 'warPortfolio';
        } else if (asset.key === 'qqq' || asset.key === 'sol') {
            gridId = 'peacePortfolioUS';
        } else if (['capitec', 'standardbank', 'firstrand', 'shoprite'].includes(asset.key)) {
            gridId = 'saPortfolio';
        }
        
        const grid = document.getElementById(gridId);
        if (!grid) {
            console.error(`Grid ${gridId} not found for ${asset.key}`);
            return;
        }
        
        // Remove loading placeholder
        const loadingEl = document.getElementById(`${asset.key}-loading`);
        if (loadingEl) {
            loadingEl.remove();
        }
        
        // Create new card
        card = document.createElement('div');
        card.id = `card-${asset.key}`;
        card.className = `card ${asset.category}`;
        grid.appendChild(card);
        console.log(`Created card for ${asset.key}`);
    }
    
    // Calculate analysis
    const analysis = analyzeAsset(asset, priceDisplay);
    
    // Price change indicator
    const history = state.history[asset.key] || [];
    const prevPrice = history.length >= 2 ? history[history.length - 2] : priceDisplay;
    let arrow = '→';
    let priceClass = '';
    
    if (priceDisplay > prevPrice) {
        arrow = '↑';
        priceClass = 'up';
    } else if (priceDisplay < prevPrice) {
        arrow = '↓';
        priceClass = 'down';
    }
    
    // Generate alert for buy signals (throttled)
    if (analysis?.signal?.type === 'BUY') {
        const lastAlert = localStorage.getItem(`alert_${asset.key}`);
        const now = Date.now();
        if (!lastAlert || now - parseInt(lastAlert) > 3600000) {
            addAlert(`${asset.symbol}: ${analysis.signal.reason} at $${priceDisplay.toFixed(2)}`);
            localStorage.setItem(`alert_${asset.key}`, now.toString());
        }
    }
    
    // Format price based on value
    let formattedPrice = priceDisplay.toFixed(2);
    if (priceDisplay > 1000) formattedPrice = priceDisplay.toFixed(0);
    if (priceDisplay > 10000) formattedPrice = priceDisplay.toLocaleString();
    
    // Build HTML
    let signalHtml = '';
    if (analysis?.signal) {
        let signalClass = '';
        if (analysis.signal.type === 'BUY') signalClass = 'buy';
        else if (analysis.signal.type === 'WATCH') signalClass = 'wait';
        else if (analysis.signal.type === 'STOP') signalClass = 'stop';
        
        signalHtml = `
            <div class="signal-badge ${signalClass}">
                ${analysis.signal.reason} (${analysis.signal.confidence})
            </div>
        `;
    }
    
    let rsiClass = '';
    if (analysis?.isOverbought) rsiClass = 'overbought';
    else if (analysis?.isOversold) rsiClass = 'oversold';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-symbol">${asset.symbol}</span>
            <span class="card-category ${asset.category}">${asset.category}</span>
        </div>
        <div class="card-price ${priceClass}">
            $${formattedPrice} ${arrow}
        </div>
        <div class="strategy-panel">
            <div class="zone-row">
                <span>Entry:</span> $${asset.entry[0].toLocaleString()} - $${asset.entry[1].toLocaleString()}
            </div>
            <div class="zone-row">
                <span>Target:</span> $${asset.target.toLocaleString()} (${analysis?.targetDistance || 0}%)
            </div>
            <div class="indicator-row">
                <span class="rsi ${rsiClass}">
                    RSI: ${analysis?.rsi || 50}
                </span>
                <span>${analysis?.isPullback ? 'Pullback' : 'Trending'}</span>
            </div>
            ${signalHtml}
        </div>
        <div class="card-footer">
            <span>${asset.source}</span>
            <span>${new Date().toLocaleTimeString()}</span>
        </div>
    `;
}

// ========================================
// Macro Regime Detection
// ========================================

function detectRegime() {
    const btc = state.prices.btc || 0;
    const pltr = state.prices.pltr || 0;
    const qqq = state.prices.qqq || 0;
    const gold = state.prices.gold || 0;
    
    const btcAsset = assets.find(a => a.key === 'btc');
    const pltrAsset = assets.find(a => a.key === 'pltr');
    const qqqAsset = assets.find(a => a.key === 'qqq');
    const goldAsset = assets.find(a => a.key === 'gold');
    
    let warScore = 0;
    let peaceScore = 0;
    
    if (gold > (goldAsset?.support || 0) * 1.02) warScore += 2;
    if (btc < (btcAsset?.support || 0)) warScore += 1;
    if (pltr > (pltrAsset?.target || 0)) warScore += 2;
    
    if (qqq > (qqqAsset?.support || 0) * 1.03) peaceScore += 2;
    if (btc > (btcAsset?.entry[0] || 0)) peaceScore += 1;
    if (pltr < (pltrAsset?.entry[1] || 0)) peaceScore += 1;
    
    const total = state.portfolio.war + state.portfolio.peace + state.portfolio.cash;
    const warPct = total > 0 ? ((state.portfolio.war / total) * 100).toFixed(1) : '0';
    const peacePct = total > 0 ? ((state.portfolio.peace / total) * 100).toFixed(1) : '0';
    
    const allocationEl = document.getElementById('allocationStatus');
    if (allocationEl) {
        allocationEl.innerHTML = `${warPct}% War · ${peacePct}% Peace · 20% Cash`;
    }
    
    if (warScore > peaceScore + 1) {
        return { text: 'WAR BIAS - Favor defense', class: 'war' };
    } else if (peaceScore > warScore + 1) {
        return { text: 'PEACE BIAS - Favor growth', class: 'peace' };
    } else {
        return { text: 'NEUTRAL - Balanced', class: 'neutral' };
    }
}

// ========================================
// Main Update - FIXED with better error handling
// ========================================

async function updateMarket() {
    console.log('🔄 Updating market data...');
    state.cycleCount++;
    
    // Show loading state
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.textContent = 'Updating...';
        refreshBtn.disabled = true;
    }
    
    // Update API usage display
    checkAlphaLimit();
    
    try {
        // Fetch all prices in parallel for better performance
        const promises = assets.map(asset => fetchPrice(asset));
        await Promise.allSettled(promises);
        
        // Render all cards
        assets.forEach(asset => {
            try {
                renderCard(asset);
            } catch (error) {
                console.error(`Error rendering ${asset.key}:`, error);
            }
        });
        
        // Update regime
        const regime = detectRegime();
        const macroEl = document.getElementById('macroStatus');
        if (macroEl) {
            const regimeValue = macroEl.querySelector('.regime-value');
            if (regimeValue) {
                regimeValue.textContent = regime.text;
                regimeValue.className = `regime-value ${regime.class}`;
            }
        }
        
        // Update timestamp
        const lastUpdate = document.getElementById('lastUpdate');
        if (lastUpdate) {
            lastUpdate.textContent = new Date().toLocaleTimeString();
        }
        
        // Update connection status
        const dot = document.querySelector('.dot');
        if (dot) {
            dot.style.background = '#00ff9c';
        }
        
        console.log('✅ Update complete');
        addAlert('Market data updated');
        
    } catch (error) {
        console.error('❌ Update failed:', error);
        addAlert(`Update failed: ${error.message}`);
        
        // Show error in connection status
        const dot = document.querySelector('.dot');
        if (dot) {
            dot.style.background = '#ff4d4d';
        }
    } finally {
        // Reset button
        if (refreshBtn) {
            refreshBtn.textContent = 'Refresh';
            refreshBtn.disabled = false;
        }
    }
}

// ========================================
// Event Handlers
// ========================================

function recordEntry() {
    const asset = prompt('Enter asset symbol (BTC, PLTR, CPI, etc):');
    if (!asset) return;
    
    const assetKey = asset.toLowerCase();
    const assetData = assets.find(a => a.key === assetKey || a.symbol.toLowerCase() === assetKey);
    
    if (!assetData) {
        alert('Asset not found');
        return;
    }
    
    const price = prompt('Enter entry price:');
    if (!price) return;
    
    const quantity = prompt('Enter quantity:');
    if (!quantity) return;
    
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);
    
    if (isNaN(priceNum) || isNaN(quantityNum)) {
        alert('Invalid numbers');
        return;
    }
    
    state.entries[assetData.key] = priceNum;
    state.portfolio[assetData.category] += priceNum * quantityNum;
    state.portfolio.cash -= priceNum * quantityNum;
    
    addAlert(`Recorded ${assetData.symbol} entry: ${quantity} @ $${price}`);
}

function recordExit() {
    const asset = prompt('Enter asset symbol:');
    if (!asset) return;
    
    const assetKey = asset.toLowerCase();
    const assetData = assets.find(a => a.key === assetKey || a.symbol.toLowerCase() === assetKey);
    
    if (!assetData) {
        alert('Asset not found');
        return;
    }
    
    if (!state.entries[assetData.key]) {
        alert('No entry recorded for this asset');
        return;
    }
    
    const price = prompt('Enter exit price:');
    if (!price) return;
    
    const quantity = prompt('Enter quantity:');
    if (!quantity) return;
    
    const priceNum = parseFloat(price);
    const quantityNum = parseFloat(quantity);
    const entryPrice = state.entries[assetData.key];
    
    if (isNaN(priceNum) || isNaN(quantityNum)) {
        alert('Invalid numbers');
        return;
    }
    
    const pnl = ((priceNum - entryPrice) / entryPrice * 100).toFixed(1);
    
    state.portfolio[assetData.category] -= priceNum * quantityNum;
    state.portfolio.cash += priceNum * quantityNum;
    delete state.entries[assetData.key];
    
    addAlert(`Exited ${assetData.symbol}: ${pnl}% P&L`);
}

function exportData() {
    const data = {
        prices: state.prices,
        portfolio: state.portfolio,
        entries: state.entries,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thinkingzaka-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addAlert('Data exported successfully');
}

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ThinkingZaka initializing...');
    
    // Add test data for immediate display (prevents empty loading state)
    assets.forEach(asset => {
        state.prices[asset.key] = asset.fallback || 0;
    });
    
    // Initial render with fallback data
    assets.forEach(asset => {
        renderCard(asset);
    });
    
    // Initial update
    setTimeout(() => {
        updateMarket();
    }, 1000);
    
    // Set interval (10 minutes)
    setInterval(updateMarket, 600000);
    
    // Event listeners
    document.getElementById('refreshBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        updateMarket();
    });
    
    document.getElementById('clearAlerts')?.addEventListener('click', () => {
        document.getElementById('alertList').innerHTML = '<li class="alert-placeholder">System ready. Waiting for signals...</li>';
    });
    
    document.getElementById('recordEntryBtn')?.addEventListener('click', recordEntry);
    document.getElementById('recordExitBtn')?.addEventListener('click', recordExit);
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    
    // Strategy modal
    const modal = document.getElementById('strategyModal');
    document.getElementById('viewStrategyBtn')?.addEventListener('click', () => {
        modal.style.display = 'flex';
    });
    
    document.getElementById('closeStrategyModal')?.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    // Install PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        const installBtn = document.getElementById('installPWA');
        if (installBtn) {
            installBtn.style.display = 'inline';
            installBtn.onclick = async () => {
                e.prompt();
                const { outcome } = await e.userChoice;
                if (outcome === 'accepted') installBtn.style.display = 'none';
            };
        }
    });
    
    console.log('✅ Dashboard ready');
    addAlert('System initialized');
});

// Expose to window for debugging
window.thinkingzaka = { 
    state, 
    assets, 
    updateMarket,
    addAlert,
    fetchPrice: (key) => {
        const asset = assets.find(a => a.key === key);
        if (asset) fetchPrice(asset);
    }
};
