// ========================================
// ThinkingZaka - Complete Strategy Implementation
// War vs Peace Portfolio · March 2026
// Mock data first, API updates in background
// ========================================

// API Configuration
const TWELVE_DATA_KEY = "ac655a25fb294fc7b46e65acfaa3eca4";
const ALPHA_API_KEY = "75IQNS7TVU6Z7WR6";

// Complete Asset Configuration - EXPANDED
const assets = [
    // ===== WAR PORTFOLIO =====
    // Defense, Safe Haven, Commodities
    { 
        key: 'btc', id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', 
        category: 'war', type: 'crypto', source: 'coingecko',
        entry: [63000, 65000], support: 60000, target: 73000, stop: 0.10,
        mockPrice: 67800
    },
    { 
        key: 'eth', id: 'ethereum', symbol: 'ETH', name: 'Ethereum', 
        category: 'war', type: 'crypto', source: 'coingecko',
        entry: [3200, 3400], support: 3000, target: 4000, stop: 0.12,
        mockPrice: 3350
    },
    { 
        key: 'gold', id: 'XAUUSD', symbol: 'GOLD', name: 'Gold', 
        category: 'war', type: 'forex', source: 'twelve',
        entry: [4805, 5000], support: 4780, target: 6000, stop: 0.05,
        mockPrice: 4850
    },
    { 
        key: 'oil', id: 'CL', symbol: 'OIL', name: 'Crude Oil', 
        category: 'war', type: 'commodity', source: 'twelve',
        entry: [75, 78], support: 72, target: 90, stop: 0.08,
        mockPrice: 76.50
    },
    { 
        key: 'pltr', id: 'PLTR', symbol: 'PLTR', name: 'Palantir', 
        category: 'war', type: 'stock', source: 'twelve',
        entry: [142, 148], support: 136, target: 186, stop: 0.10,
        mockPrice: 145.50
    },
    
    // ===== PEACE PORTFOLIO =====
    // Growth, Technology, Risk-On
    { 
        key: 'qqq', id: 'QQQ', symbol: 'QQQ', name: 'Nasdaq', 
        category: 'peace', type: 'stock', source: 'twelve',
        entry: [595, 603], support: 585, target: 616, stop: 0.08,
        mockPrice: 599.75
    },
    { 
        key: 'sol', id: 'solana', symbol: 'SOL', name: 'Solana', 
        category: 'peace', type: 'crypto', source: 'coingecko',
        entry: [78, 81], support: 76, target: 101, stop: 0.15,
        mockPrice: 82.50
    },
    { 
        key: 'link', id: 'chainlink', symbol: 'LINK', name: 'Chainlink', 
        category: 'peace', type: 'crypto', source: 'coingecko',
        entry: [18, 20], support: 16, target: 28, stop: 0.12,
        mockPrice: 19.25
    },
    { 
        key: 'nvda', id: 'NVDA', symbol: 'NVDA', name: 'NVIDIA', 
        category: 'peace', type: 'stock', source: 'twelve',
        entry: [820, 850], support: 780, target: 1000, stop: 0.08,
        mockPrice: 835.50
    },
    { 
        key: 'msft', id: 'MSFT', symbol: 'MSFT', name: 'Microsoft', 
        category: 'peace', type: 'stock', source: 'twelve',
        entry: [410, 420], support: 395, target: 480, stop: 0.07,
        mockPrice: 415.25
    },
    { 
        key: 'goog', id: 'GOOGL', symbol: 'GOOG', name: 'Google', 
        category: 'peace', type: 'stock', source: 'twelve',
        entry: [165, 170], support: 158, target: 200, stop: 0.08,
        mockPrice: 167.80
    }
];

// ========================================
// State Management
// ========================================

const state = {
    prices: {},
    history: {},
    entries: {},
    lastFetch: {},
    alphaCalls: 0,
    lastReset: new Date().toDateString(),
    cycleCount: 0,
    portfolio: { war: 100000, peace: 100000, cash: 50000 }, // $250k total
    dataSources: { twelve: 0, coingecko: 0, alpha: 0 }
};

// Initialize history with mock data
assets.forEach(asset => { 
    state.prices[asset.key] = asset.mockPrice;
    state.history[asset.key] = [asset.mockPrice * 0.98, asset.mockPrice * 0.99, asset.mockPrice]; 
});

// ========================================
// Utility Functions
// ========================================

function addAlert(text, type = 'info') {
    const list = document.getElementById('alertList');
    if (!list) return;
    
    // Remove placeholder if it exists
    if (list.children.length === 1 && list.children[0].classList.contains('alert-placeholder')) {
        list.innerHTML = '';
    }
    
    const li = document.createElement('li');
    li.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    
    // Color code alerts
    if (type === 'buy') li.style.borderLeftColor = '#00ff9c';
    if (type === 'sell') li.style.borderLeftColor = '#ff4d4d';
    if (type === 'warning') li.style.borderLeftColor = '#ffd700';
    
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
            if (i === retries - 1) throw error;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

// ========================================
// API Fetching with Twelve Data (YOUR KEY)
// ========================================

async function fetchTwelveData(symbol) {
    try {
        state.dataSources.twelve++;
        const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVE_DATA_KEY}`;
        const data = await fetchJSON(url);
        return parseFloat(data.price) || 0;
    } catch (error) {
        console.log(`Twelve Data error for ${symbol}:`, error);
        return 0;
    }
}

async function fetchCoinGecko(id) {
    try {
        state.dataSources.coingecko++;
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
        const data = await fetchJSON(url);
        return data[id]?.usd || 0;
    } catch (error) {
        console.log(`CoinGecko error for ${id}:`, error);
        return 0;
    }
}

// ========================================
// Price Fetching - Mock First, API Updates Later
// ========================================

async function fetchPrice(asset) {
    const now = Date.now();
    
    // Check cache (5 minutes)
    if (state.lastFetch[asset.key] && now - state.lastFetch[asset.key] < 300000) {
        return state.prices[asset.key];
    }
    
    console.log(`Fetching ${asset.key}...`);
    
    try {
        let price = 0;
        
        // Try real API based on source
        if (asset.source === 'twelve') {
            price = await fetchTwelveData(asset.id);
        } else if (asset.source === 'coingecko') {
            price = await fetchCoinGecko(asset.id);
        }
        
        // If API succeeded, update
        if (price > 0) {
            state.prices[asset.key] = price;
            state.lastFetch[asset.key] = now;
            state.history[asset.key].push(price);
            if (state.history[asset.key].length > 20) {
                state.history[asset.key].shift();
            }
            console.log(`✅ ${asset.key} updated to $${price}`);
            return price;
        } else {
            // Keep mock price
            console.log(`⚠️ Using mock data for ${asset.key}`);
            return state.prices[asset.key] || asset.mockPrice;
        }
        
    } catch (error) {
        console.error(`Error fetching ${asset.key}:`, error);
        return state.prices[asset.key] || asset.mockPrice;
    }
}

// ========================================
// Technical Analysis
// ========================================

function calculateRSI(key, currentPrice) {
    const history = state.history[key] || [];
    if (history.length < 14) return 50;
    
    let gains = 0, losses = 0;
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
    if (!price) return null;
    
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
    
    const targetDistance = ((asset.target - price) / price * 100).toFixed(1);
    
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
// UI Rendering
// ========================================

function renderCard(asset) {
    const price = state.prices[asset.key] || asset.mockPrice;
    if (!price) return;
    
    let card = document.getElementById(`card-${asset.key}`);
    
    // Determine which grid this belongs to
    if (!card) {
        let gridId = '';
        if (asset.category === 'war') {
            gridId = 'warPortfolio';
        } else {
            gridId = 'peacePortfolioUS';
        }
        
        const grid = document.getElementById(gridId);
        if (!grid) return;
        
        // Remove loading placeholder
        const loadingEl = document.getElementById(`${asset.key}-loading`);
        if (loadingEl) loadingEl.remove();
        
        card = document.createElement('div');
        card.id = `card-${asset.key}`;
        card.className = `card ${asset.category}`;
        grid.appendChild(card);
    }
    
    const analysis = analyzeAsset(asset, price);
    
    // Price change indicator
    const history = state.history[asset.key] || [];
    const prevPrice = history.length >= 2 ? history[history.length - 2] : price;
    const arrow = price > prevPrice ? '↑' : (price < prevPrice ? '↓' : '→');
    const priceClass = price > prevPrice ? 'up' : (price < prevPrice ? 'down' : '');
    
    // Generate alert for buy signals (throttled)
    if (analysis?.signal?.type === 'BUY') {
        const lastAlert = localStorage.getItem(`alert_${asset.key}`);
        const now = Date.now();
        if (!lastAlert || now - parseInt(lastAlert) > 3600000) {
            addAlert(`${asset.symbol}: ${analysis.signal.reason} at $${price.toFixed(2)}`, 'buy');
            localStorage.setItem(`alert_${asset.key}`, now.toString());
        }
    }
    
    // Format price display
    let priceDisplay = '';
    if (price > 1000) {
        priceDisplay = `$${price.toFixed(0)}`;
    } else if (price > 100) {
        priceDisplay = `$${price.toFixed(2)}`;
    } else if (price > 1) {
        priceDisplay = `$${price.toFixed(2)}`;
    } else {
        priceDisplay = `$${price.toFixed(4)}`;
    }
    
    // Signal badge HTML
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
    
    // RSI class
    let rsiClass = '';
    if (analysis?.isOverbought) rsiClass = 'overbought';
    else if (analysis?.isOversold) rsiClass = 'oversold';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-symbol">${asset.symbol}</span>
            <span class="card-category ${asset.category}">${asset.category}</span>
        </div>
        <div class="card-price ${priceClass}">
            ${priceDisplay} ${arrow}
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
            <span>${state.lastFetch[asset.key] ? 'Live' : 'Mock'}</span>
            <span>${new Date().toLocaleTimeString()}</span>
        </div>
    `;
}

// ========================================
// Macro Regime Detection
// ========================================

function detectRegime() {
    const warAssets = assets.filter(a => a.category === 'war');
    const peaceAssets = assets.filter(a => a.category === 'peace');
    
    let warScore = 0;
    let peaceScore = 0;
    
    // Check war assets against targets
    warAssets.forEach(asset => {
        const price = state.prices[asset.key] || 0;
        if (price > asset.target * 0.95) warScore += 1;
        if (price < asset.support) warScore += 2; // Fear = war bias
    });
    
    // Check peace assets
    peaceAssets.forEach(asset => {
        const price = state.prices[asset.key] || 0;
        if (price > asset.target * 0.95) peaceScore += 2;
        if (price > asset.entry[1]) peaceScore += 1; // Breakout = peace bias
    });
    
    // Calculate allocations
    const totalPortfolio = state.portfolio.war + state.portfolio.peace + state.portfolio.cash;
    const warPct = ((state.portfolio.war / totalPortfolio) * 100).toFixed(1);
    const peacePct = ((state.portfolio.peace / totalPortfolio) * 100).toFixed(1);
    
    document.getElementById('allocationStatus').innerHTML = 
        `${warPct}% War · ${peacePct}% Peace · 20% Cash`;
    
    document.getElementById('warScore').textContent = warScore;
    document.getElementById('peaceScore').textContent = peaceScore;
    
    if (warScore > peaceScore + 2) {
        return { text: 'WAR BIAS - Favor defense', class: 'war' };
    } else if (peaceScore > warScore + 2) {
        return { text: 'PEACE BIAS - Favor growth', class: 'peace' };
    } else {
        return { text: 'NEUTRAL - Balanced', class: 'neutral' };
    }
}

// ========================================
// Main Update - Mock First, API Later
// ========================================

async function updateMarket() {
    console.log('🔄 Updating market data...');
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.textContent = 'Updating...';
        refreshBtn.disabled = true;
    }
    
    try {
        // First pass: Use mock data immediately (already in state)
        assets.forEach(asset => renderCard(asset));
        
        // Second pass: Fetch real data in background
        setTimeout(async () => {
            console.log('📡 Fetching live data...');
            
            // Fetch in parallel
            const promises = assets.map(asset => fetchPrice(asset));
            await Promise.allSettled(promises);
            
            // Re-render with real data
            assets.forEach(asset => renderCard(asset));
            
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
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
            
            // Update connection status
            const dot = document.querySelector('.dot');
            if (dot) dot.style.background = '#00ff9c';
            
            console.log('✅ Live data loaded');
            addAlert('Live data updated');
            
        }, 2000); // Delay to show mock first
        
    } catch (error) {
        console.error('Update error:', error);
    } finally {
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
    const asset = prompt('Enter asset symbol (BTC, NVDA, etc):');
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
    
    addAlert(`Recorded ${assetData.symbol} entry: ${quantity} @ $${price}`, 'info');
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
    
    addAlert(`Exited ${assetData.symbol}: ${pnl}% P&L`, pnl > 0 ? 'buy' : 'sell');
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
    
    // Initial render with mock data
    assets.forEach(asset => renderCard(asset));
    
    // Initial macro update
    const regime = detectRegime();
    const macroEl = document.getElementById('macroStatus');
    if (macroEl) {
        const regimeValue = macroEl.querySelector('.regime-value');
        if (regimeValue) {
            regimeValue.textContent = regime.text;
            regimeValue.className = `regime-value ${regime.class}`;
        }
    }
    
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    
    // Start live data fetch
    setTimeout(() => updateMarket(), 1000);
    
    // Set interval for updates (10 minutes)
    setInterval(() => updateMarket(), 600000);
    
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
    
    addAlert('Dashboard initialized - Mock data shown while loading live');
    console.log('✅ Dashboard ready with', assets.length, 'assets');
});

// Expose to window for debugging
window.thinkingzaka = { 
    state, 
    assets, 
    updateMarket,
    addAlert
};
