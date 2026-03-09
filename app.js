// ========================================
// ThinkingZaka - Smart Portfolio Manager v4.0
// Multi-API with fallbacks · Intelligent Alerts · Risk Management
// ========================================

// API Keys
const TWELVE_DATA_KEY = "ac655a25fb294fc7b46e65acfaa3eca4";
const ALPHA_API_KEY = "75IQNS7TVU6Z7WR6";
const NEWS_API_KEY = "pub_65082ebc2f7a1939f4ed39ecc812dd180f3f6"; // Free tier from NewsData.io

// ========================================
// YOUR PORTFOLIO - Easy to add/remove
// Just modify this array
// ========================================

const portfolio = [
    // ===== CRYPTOCURRENCIES =====
    {
        id: 'btc',
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'crypto',
        coingecko_id: 'bitcoin',
        twelve_symbol: 'BTC/USD',
        quantity: 0.5,        // Your holdings
        avgEntry: 64500,       // Your average entry
        stopLoss: 0.10,        // 10% stop loss
        takeProfit: 0.25,      // 25% take profit
        priority: 1,           // Higher priority = more frequent updates
        news_keywords: 'bitcoin btc cryptocurrency'
    },
    {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'crypto',
        coingecko_id: 'ethereum',
        twelve_symbol: 'ETH/USD',
        quantity: 5,
        avgEntry: 3200,
        stopLoss: 0.12,
        takeProfit: 0.30,
        priority: 1,
        news_keywords: 'ethereum eth crypto'
    },
    {
        id: 'sol',
        symbol: 'SOL',
        name: 'Solana',
        type: 'crypto',
        coingecko_id: 'solana',
        twelve_symbol: 'SOL/USD',
        quantity: 100,
        avgEntry: 80,
        stopLoss: 0.15,
        takeProfit: 0.40,
        priority: 1,
        news_keywords: 'solana sol crypto'
    },
    {
        id: 'link',
        symbol: 'LINK',
        name: 'Chainlink',
        type: 'crypto',
        coingecko_id: 'chainlink',
        twelve_symbol: 'LINK/USD',
        quantity: 500,
        avgEntry: 18.50,
        stopLoss: 0.12,
        takeProfit: 0.35,
        priority: 2,
        news_keywords: 'chainlink link oracle'
    },

    // ===== US STOCKS =====
    {
        id: 'nvda',
        symbol: 'NVDA',
        name: 'NVIDIA',
        type: 'stock',
        twelve_symbol: 'NVDA',
        alpha_symbol: 'NVDA',
        quantity: 10,
        avgEntry: 825,
        stopLoss: 0.08,
        takeProfit: 0.20,
        priority: 1,
        news_keywords: 'nvidia nvda ai semiconductor'
    },
    {
        id: 'msft',
        symbol: 'MSFT',
        name: 'Microsoft',
        type: 'stock',
        twelve_symbol: 'MSFT',
        alpha_symbol: 'MSFT',
        quantity: 15,
        avgEntry: 410,
        stopLoss: 0.07,
        takeProfit: 0.15,
        priority: 2,
        news_keywords: 'microsoft msft azure ai'
    },
    {
        id: 'goog',
        symbol: 'GOOGL',
        name: 'Google',
        type: 'stock',
        twelve_symbol: 'GOOGL',
        alpha_symbol: 'GOOGL',
        quantity: 20,
        avgEntry: 165,
        stopLoss: 0.08,
        takeProfit: 0.18,
        priority: 2,
        news_keywords: 'google alphabet ai'
    },
    {
        id: 'pltr',
        symbol: 'PLTR',
        name: 'Palantir',
        type: 'stock',
        twelve_symbol: 'PLTR',
        alpha_symbol: 'PLTR',
        quantity: 100,
        avgEntry: 145,
        stopLoss: 0.10,
        takeProfit: 0.25,
        priority: 2,
        news_keywords: 'palantir pltr data analytics'
    },
    {
        id: 'qqq',
        symbol: 'QQQ',
        name: 'Nasdaq ETF',
        type: 'etf',
        twelve_symbol: 'QQQ',
        alpha_symbol: 'QQQ',
        quantity: 50,
        avgEntry: 595,
        stopLoss: 0.08,
        takeProfit: 0.12,
        priority: 3,
        news_keywords: 'nasdaq qqq tech stocks'
    },

    // ===== COMMODITIES =====
    {
        id: 'gold',
        symbol: 'GOLD',
        name: 'Gold',
        type: 'commodity',
        twelve_symbol: 'XAU/USD',
        alpha_symbol: 'XAUUSD',
        quantity: 10, // ounces
        avgEntry: 2350,
        stopLoss: 0.05,
        takeProfit: 0.15,
        priority: 2,
        news_keywords: 'gold precious metals inflation'
    },
    {
        id: 'oil',
        symbol: 'OIL',
        name: 'Crude Oil',
        type: 'commodity',
        twelve_symbol: 'CL',
        alpha_symbol: 'CL',
        quantity: 100, // barrels
        avgEntry: 75,
        stopLoss: 0.08,
        takeProfit: 0.20,
        priority: 3,
        news_keywords: 'oil crude energy wti'
    }
];

// ========================================
// Core State Management
// ========================================

const state = {
    prices: {},           // Current prices
    changes: {},          // 24h changes
    history: {},          // Price history for RSI
    positions: {},        // Current position values
    alerts: [],           // Active alerts
    lastFetch: {},        // Last fetch timestamps
    apiStats: {           // Track which APIs work
        twelve: { success: 0, fail: 0 },
        coingecko: { success: 0, fail: 0 },
        alpha: { success: 0, fail: 0 }
    },
    portfolio: {
        totalValue: 0,
        totalCost: 0,
        totalPnL: 0,
        dailyPnL: 0,
        biggestWinner: null,
        biggestLoser: null
    }
};

// Initialize history arrays
portfolio.forEach(asset => { 
    state.history[asset.id] = []; 
    // Pre-fill with mock data for immediate display
    for (let i = 0; i < 20; i++) {
        state.history[asset.id].push(asset.avgEntry * (0.95 + (Math.random() * 0.1)));
    }
});

// ========================================
// Multi-API Fetcher - Tries everything until success
// ========================================

async function fetchWithFallback(asset) {
    const errors = [];
    
    // Try Twelve Data first (fastest, most reliable)
    try {
        const url = `https://api.twelvedata.com/price?symbol=${asset.twelve_symbol}&apikey=${TWELVE_DATA_KEY}&dp=2`;
        const response = await fetchWithTimeout(url, 5000);
        const data = await response.json();
        
        if (data.price && parseFloat(data.price) > 0) {
            state.apiStats.twelve.success++;
            return parseFloat(data.price);
        } else {
            state.apiStats.twelve.fail++;
            errors.push('Twelve Data: no price');
        }
    } catch (e) {
        state.apiStats.twelve.fail++;
        errors.push(`Twelve Data: ${e.message}`);
    }
    
    // Try CoinGecko for crypto
    if (asset.type === 'crypto') {
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${asset.coingecko_id}&vs_currencies=usd`;
            const response = await fetchWithTimeout(url, 5000);
            const data = await response.json();
            
            if (data[asset.coingecko_id]?.usd) {
                state.apiStats.coingecko.success++;
                return data[asset.coingecko_id].usd;
            } else {
                state.apiStats.coingecko.fail++;
                errors.push('CoinGecko: no price');
            }
        } catch (e) {
            state.apiStats.coingecko.fail++;
            errors.push(`CoinGecko: ${e.message}`);
        }
    }
    
    // Try Alpha Vantage as last resort
    try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.alpha_symbol || asset.symbol}&apikey=${ALPHA_API_KEY}`;
        const response = await fetchWithTimeout(url, 5000);
        const data = await response.json();
        
        if (data['Global Quote']?.['05. price']) {
            state.apiStats.alpha.success++;
            return parseFloat(data['Global Quote']['05. price']);
        } else {
            state.apiStats.alpha.fail++;
            errors.push('Alpha: no price');
        }
    } catch (e) {
        state.apiStats.alpha.fail++;
        errors.push(`Alpha: ${e.message}`);
    }
    
    // If all APIs fail, return null
    console.warn(`All APIs failed for ${asset.symbol}:`, errors);
    return null;
}

// Fetch with timeout
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// ========================================
// News Fetching - For sentiment analysis
// ========================================

async function fetchNews(asset) {
    if (!asset.news_keywords) return [];
    
    try {
        // Using NewsData.io free tier
        const url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(asset.news_keywords)}&language=en&size=3`;
        const response = await fetchWithTimeout(url, 4000);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results.map(article => ({
                title: article.title,
                source: article.source_id,
                sentiment: analyzeSentiment(article.title + ' ' + (article.description || '')),
                url: article.link
            }));
        }
    } catch (e) {
        console.log(`News fetch failed for ${asset.symbol}:`, e.message);
    }
    return [];
}

// Simple sentiment analysis (can be enhanced)
function analyzeSentiment(text) {
    const positiveWords = ['surge', 'rally', 'gain', 'bull', 'upgrade', 'buy', 'growth', 'profit', 'beat'];
    const negativeWords = ['plunge', 'crash', 'loss', 'bear', 'downgrade', 'sell', 'risk', 'warning', 'miss'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
        if (lowerText.includes(word)) score += 1;
    });
    
    negativeWords.forEach(word => {
        if (lowerText.includes(word)) score -= 1;
    });
    
    if (score > 2) return 'positive';
    if (score < -2) return 'negative';
    return 'neutral';
}

// ========================================
// Technical Analysis
// ========================================

function calculateRSI(assetId, currentPrice) {
    const history = state.history[assetId] || [];
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

function calculateVolatility(assetId) {
    const history = state.history[assetId] || [];
    if (history.length < 10) return 0;
    
    const returns = [];
    for (let i = 1; i < history.length; i++) {
        returns.push((history[i] - history[i-1]) / history[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100; // Daily volatility as percentage
}

// ========================================
// Risk & Opportunity Detection
// ========================================

async function analyzeAsset(asset, currentPrice) {
    if (!currentPrice || currentPrice <= 0) return null;
    
    const analysis = {
        asset: asset.symbol,
        price: currentPrice,
        timestamp: Date.now(),
        risks: [],
        opportunities: [],
        alerts: []
    };
    
    // Update history
    state.history[asset.id].push(currentPrice);
    if (state.history[asset.id].length > 50) {
        state.history[asset.id].shift();
    }
    
    // Calculate metrics
    const rsi = calculateRSI(asset.id, currentPrice);
    const volatility = calculateVolatility(asset.id);
    const dayChange = state.history[asset.id].length > 1 
        ? ((currentPrice - state.history[asset.id][state.history[asset.id].length - 2]) / state.history[asset.id][state.history[asset.id].length - 2] * 100).toFixed(2)
        : 0;
    
    // Position P&L
    const positionValue = currentPrice * asset.quantity;
    const costBasis = asset.avgEntry * asset.quantity;
    const pnl = ((currentPrice - asset.avgEntry) / asset.avgEntry * 100).toFixed(2);
    const pnlAbsolute = (currentPrice - asset.avgEntry) * asset.quantity;
    
    // Update portfolio totals
    state.portfolio.totalValue += positionValue;
    state.portfolio.totalCost += costBasis;
    
    // ===== RISK DETECTION =====
    
    // 1. Stop Loss Check
    if (asset.avgEntry && currentPrice < asset.avgEntry * (1 - asset.stopLoss)) {
        analysis.risks.push({
            type: 'STOP_LOSS',
            severity: 'HIGH',
            message: `${asset.symbol} hit stop loss: ${((asset.avgEntry - currentPrice) / asset.avgEntry * 100).toFixed(1)}% down from entry`,
            value: currentPrice,
            threshold: asset.avgEntry * (1 - asset.stopLoss)
        });
    }
    
    // 2. Overbought/Oversold
    if (rsi > 75) {
        analysis.risks.push({
            type: 'OVERBOUGHT',
            severity: 'MEDIUM',
            message: `${asset.symbol} overbought (RSI ${rsi.toFixed(0)}) - potential pullback`,
            value: rsi,
            threshold: 75
        });
    } else if (rsi < 25) {
        analysis.opportunities.push({
            type: 'OVERSOLD',
            confidence: 'HIGH',
            message: `${asset.symbol} oversold (RSI ${rsi.toFixed(0)}) - potential bounce`,
            value: rsi,
            threshold: 25
        });
    }
    
    // 3. High Volatility
    if (volatility > 5) {
        analysis.risks.push({
            type: 'HIGH_VOLATILITY',
            severity: 'MEDIUM',
            message: `${asset.symbol} volatility at ${volatility.toFixed(1)}% - higher risk`,
            value: volatility,
            threshold: 5
        });
    }
    
    // 4. Large Daily Drop
    if (dayChange < -5) {
        analysis.risks.push({
            type: 'SHARP_DROP',
            severity: 'HIGH',
            message: `${asset.symbol} dropped ${dayChange}% today`,
            value: dayChange,
            threshold: -5
        });
    }
    
    // ===== OPPORTUNITY DETECTION =====
    
    // 1. Take Profit
    if (asset.avgEntry && currentPrice > asset.avgEntry * (1 + asset.takeProfit)) {
        analysis.opportunities.push({
            type: 'TAKE_PROFIT',
            confidence: 'HIGH',
            message: `${asset.symbol} hit take profit target: +${pnl}%`,
            value: currentPrice,
            threshold: asset.avgEntry * (1 + asset.takeProfit)
        });
    }
    
    // 2. Golden Cross (simplified - 50 day above 200 day)
    if (state.history[asset.id].length > 50) {
        const ma50 = state.history[asset.id].slice(-50).reduce((a, b) => a + b, 0) / 50;
        if (currentPrice > ma50 * 1.1) {
            analysis.opportunities.push({
                type: 'STRONG_TREND',
                confidence: 'MEDIUM',
                message: `${asset.symbol} trading 10% above 50-day MA - strong uptrend`,
                value: ((currentPrice / ma50 - 1) * 100).toFixed(1),
                threshold: 10
            });
        }
    }
    
    // 3. RSI Reversal
    if (rsi < 30 && dayChange > 2) {
        analysis.opportunities.push({
            type: 'RSI_REVERSAL',
            confidence: 'HIGH',
            message: `${asset.symbol} showing reversal from oversold: +${dayChange}% today`,
            value: rsi,
            threshold: 30
        });
    }
    
    // Store position data
    state.positions[asset.id] = {
        price: currentPrice,
        pnl: parseFloat(pnl),
        pnlAbsolute: pnlAbsolute,
        value: positionValue,
        rsi: rsi,
        volatility: volatility,
        dayChange: dayChange
    };
    
    return analysis;
}

// ========================================
// Alert Generation
// ========================================

function generateAlerts(analysis) {
    if (!analysis) return;
    
    // Check for new risks (not alerted recently)
    analysis.risks.forEach(risk => {
        const alertKey = `${analysis.asset}_${risk.type}_${Date.now()}`;
        const lastAlert = localStorage.getItem(`alert_${analysis.asset}_${risk.type}`);
        
        if (!lastAlert || Date.now() - parseInt(lastAlert) > 3600000) { // Once per hour
            addAlert(`⚠️ RISK: ${risk.message}`, 'risk');
            localStorage.setItem(`alert_${analysis.asset}_${risk.type}`, Date.now().toString());
            
            // Send notification for high severity
            if (risk.severity === 'HIGH' && Notification.permission === 'granted') {
                new Notification(`🚨 Risk Alert: ${analysis.asset}`, {
                    body: risk.message,
                    icon: '/icons/icon-192.png'
                });
            }
        }
    });
    
    // Check for opportunities
    analysis.opportunities.forEach(opp => {
        const alertKey = `${analysis.asset}_${opp.type}_${Date.now()}`;
        const lastAlert = localStorage.getItem(`opp_${analysis.asset}_${opp.type}`);
        
        if (!lastAlert || Date.now() - parseInt(lastAlert) > 7200000) { // Once per 2 hours
            addAlert(`🎯 OPPORTUNITY: ${opp.message}`, 'opportunity');
            localStorage.setItem(`opp_${analysis.asset}_${opp.type}`, Date.now().toString());
            
            // Send notification for high confidence
            if (opp.confidence === 'HIGH' && Notification.permission === 'granted') {
                new Notification(`💎 Opportunity: ${analysis.asset}`, {
                    body: opp.message,
                    icon: '/icons/icon-192.png'
                });
            }
        }
    });
}

// ========================================
// UI Rendering
// ========================================

function renderPortfolio() {
    // Calculate totals
    state.portfolio.totalValue = 0;
    state.portfolio.totalCost = 0;
    
    portfolio.forEach(asset => {
        const price = state.prices[asset.id] || asset.avgEntry;
        state.portfolio.totalValue += price * asset.quantity;
        state.portfolio.totalCost += asset.avgEntry * asset.quantity;
    });
    
    state.portfolio.totalPnL = ((state.portfolio.totalValue - state.portfolio.totalCost) / state.portfolio.totalCost * 100).toFixed(2);
    state.portfolio.dailyPnL = 0; // Would need yesterday's close
    
    // Update portfolio summary
    const summaryEl = document.getElementById('portfolioSummary');
    if (summaryEl) {
        const pnlClass = state.portfolio.totalPnL >= 0 ? 'positive' : 'negative';
        summaryEl.innerHTML = `
            <div class="portfolio-value">$${state.portfolio.totalValue.toFixed(2)}</div>
            <div class="portfolio-pnl ${pnlClass}">${state.portfolio.totalPnL}% overall</div>
        `;
    }
    
    // Render each asset card
    portfolio.forEach(asset => renderCard(asset));
}

function renderCard(asset) {
    const price = state.prices[asset.id] || asset.avgEntry;
    const position = state.positions[asset.id] || {
        pnl: 0,
        pnlAbsolute: 0,
        value: price * asset.quantity,
        rsi: 50,
        dayChange: 0
    };
    
    let card = document.getElementById(`card-${asset.id}`);
    
    if (!card) {
        const grid = document.getElementById('portfolioGrid');
        if (!grid) return;
        
        card = document.createElement('div');
        card.id = `card-${asset.id}`;
        card.className = `portfolio-card`;
        grid.appendChild(card);
    }
    
    // Determine card color based on P&L
    const pnlClass = position.pnl >= 0 ? 'profit' : 'loss';
    
    // Format price
    let priceDisplay = price > 1000 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
    
    // RSI class
    let rsiClass = '';
    if (position.rsi > 70) rsiClass = 'overbought';
    else if (position.rsi < 30) rsiClass = 'oversold';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-symbol">${asset.symbol}</span>
            <span class="card-type ${asset.type}">${asset.type}</span>
        </div>
        <div class="card-price">
            ${priceDisplay}
            <span class="day-change ${position.dayChange >= 0 ? 'up' : 'down'}">
                ${position.dayChange > 0 ? '+' : ''}${position.dayChange}%
            </span>
        </div>
        <div class="position-details">
            <div class="position-row">
                <span>Position:</span>
                <span>${asset.quantity} @ $${asset.avgEntry}</span>
            </div>
            <div class="position-row">
                <span>Value:</span>
                <span>$${position.value.toFixed(2)}</span>
            </div>
            <div class="position-row ${pnlClass}">
                <span>P&L:</span>
                <span>${position.pnl > 0 ? '+' : ''}${position.pnl}% ($${position.pnlAbsolute.toFixed(2)})</span>
            </div>
            <div class="indicator-row">
                <span class="rsi ${rsiClass}">RSI: ${position.rsi.toFixed(0)}</span>
                <span class="volatility">Vol: ${position.volatility?.toFixed(1) || 0}%</span>
            </div>
        </div>
        <div class="card-footer">
            <span>${state.lastFetch[asset.id] ? 'Live' : 'Estimate'}</span>
            <span>${new Date().toLocaleTimeString()}</span>
        </div>
    `;
}

// ========================================
// Main Update Loop
// ========================================

async function updatePortfolio() {
    console.log('🔄 Updating portfolio...');
    
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.textContent = 'Updating...';
        refreshBtn.disabled = true;
    }
    
    // Reset portfolio totals
    state.portfolio.totalValue = 0;
    state.portfolio.totalCost = 0;
    
    // Update each asset based on priority
    for (const asset of portfolio) {
        // Fetch current price
        const price = await fetchWithFallback(asset);
        
        if (price && price > 0) {
            state.prices[asset.id] = price;
            state.lastFetch[asset.id] = Date.now();
            
            // Analyze for risks/opportunities
            const analysis = await analyzeAsset(asset, price);
            
            // Generate alerts
            generateAlerts(analysis);
            
            // Fetch news in background (don't await)
            fetchNews(asset).then(news => {
                if (news.length > 0) {
                    const sentiment = news[0].sentiment;
                    if (sentiment === 'positive' && !state.positions[asset.id]?.lastNewsAlert) {
                        addAlert(`📰 Positive news for ${asset.symbol}: ${news[0].title}`, 'info');
                        state.positions[asset.id] = state.positions[asset.id] || {};
                        state.positions[asset.id].lastNewsAlert = Date.now();
                    }
                }
            });
        }
        
        // Update display
        renderCard(asset);
    }
    
    // Update portfolio summary
    renderPortfolio();
    
    // Update timestamp
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    
    // Update API stats
    updateApiStats();
    
    if (refreshBtn) {
        refreshBtn.textContent = 'Refresh';
        refreshBtn.disabled = false;
    }
    
    addAlert('Portfolio updated', 'info');
}

function updateApiStats() {
    const statsEl = document.getElementById('apiStats');
    if (!statsEl) return;
    
    const total = state.apiStats.twelve.success + state.apiStats.twelve.fail +
                  state.apiStats.coingecko.success + state.apiStats.coingecko.fail +
                  state.apiStats.alpha.success + state.apiStats.alpha.fail;
    
    const success = state.apiStats.twelve.success + state.apiStats.coingecko.success + state.apiStats.alpha.success;
    
    statsEl.innerHTML = `API: ${success}/${total} successful`;
}

// ========================================
// Alert Display
// ========================================

function addAlert(text, type = 'info') {
    const list = document.getElementById('alertList');
    if (!list) return;
    
    // Remove placeholder if exists
    if (list.children.length === 1 && list.children[0].classList.contains('alert-placeholder')) {
        list.innerHTML = '';
    }
    
    const li = document.createElement('li');
    li.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    
    // Style based on type
    if (type === 'risk') li.style.borderLeftColor = '#ff4d4d';
    else if (type === 'opportunity') li.style.borderLeftColor = '#00ff9c';
    else li.style.borderLeftColor = '#ffd700';
    
    list.prepend(li);
    
    // Keep last 30 alerts
    while (list.children.length > 30) {
        list.removeChild(list.lastChild);
    }
    
    // Store in state
    state.alerts.unshift({ text, type, timestamp: Date.now() });
    if (state.alerts.length > 30) state.alerts.pop();
}

// ========================================
// Manual Actions
// ========================================

function addPosition() {
    const symbol = prompt('Enter symbol:');
    if (!symbol) return;
    
    const asset = portfolio.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
    if (!asset) {
        alert('Asset not in portfolio');
        return;
    }
    
    const quantity = prompt('Enter quantity:');
    if (!quantity) return;
    
    const price = prompt('Enter entry price:');
    if (!price) return;
    
    asset.quantity += parseFloat(quantity);
    // Update avg entry (weighted average)
    const totalCost = (asset.avgEntry * asset.quantity) + (parseFloat(price) * parseFloat(quantity));
    asset.quantity += parseFloat(quantity);
    asset.avgEntry = totalCost / asset.quantity;
    
    addAlert(`Added ${quantity} ${asset.symbol} @ $${price}`, 'info');
    renderPortfolio();
}

function removePosition() {
    const symbol = prompt('Enter symbol to sell:');
    if (!symbol) return;
    
    const asset = portfolio.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
    if (!asset) {
        alert('Asset not in portfolio');
        return;
    }
    
    const quantity = prompt('Enter quantity to sell:');
    if (!quantity) return;
    
    const price = prompt('Enter sale price:');
    if (!price) return;
    
    if (parseFloat(quantity) > asset.quantity) {
        alert('Not enough shares');
        return;
    }
    
    const pnl = ((parseFloat(price) - asset.avgEntry) / asset.avgEntry * 100).toFixed(2);
    asset.quantity -= parseFloat(quantity);
    
    addAlert(`Sold ${quantity} ${asset.symbol} @ $${price} (${pnl}% P&L)`, pnl > 0 ? 'opportunity' : 'risk');
    
    if (asset.quantity === 0) {
        // Option to remove from portfolio
        if (confirm('Position closed. Remove from portfolio?')) {
            const index = portfolio.indexOf(asset);
            portfolio.splice(index, 1);
            document.getElementById(`card-${asset.id}`)?.remove();
        }
    }
    
    renderPortfolio();
}

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ThinkingZaka Portfolio Manager initializing...');
    
    // Check notification permission
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // Initial render with estimated prices
    renderPortfolio();
    
    // First update
    setTimeout(() => updatePortfolio(), 1000);
    
    // Regular updates (every 5 minutes for high priority, 15 for others)
    setInterval(() => updatePortfolio(), 300000);
    
    // Event listeners
    document.getElementById('refreshBtn')?.addEventListener('click', updatePortfolio);
    document.getElementById('clearAlerts')?.addEventListener('click', () => {
        document.getElementById('alertList').innerHTML = '<li class="alert-placeholder">No active alerts</li>';
        state.alerts = [];
    });
    
    document.getElementById('addPositionBtn')?.addEventListener('click', addPosition);
    document.getElementById('sellPositionBtn')?.addEventListener('click', removePosition);
    
    // Add API stats element if not exists
    if (!document.getElementById('apiStats')) {
        const statusBar = document.querySelector('.status-bar');
        if (statusBar) {
            const statsEl = document.createElement('div');
            statsEl.id = 'apiStats';
            statsEl.className = 'api-stats';
            statusBar.appendChild(statsEl);
        }
    }
    
    addAlert('Portfolio Manager initialized', 'info');
});

// Expose for debugging
window.thinkingzaka = {
    portfolio,
    state,
    updatePortfolio,
    addAlert
};
