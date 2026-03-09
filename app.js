// ========================================
// ThinkingZaka - Mirror Trading Assistant v1.0
// Think → Decide → Mirror → Profit
// Clean, Modular, Scalable Architecture
// ========================================

// ========================================
// CONFIGURATION - Easy to modify
// ========================================

const CONFIG = {
    // API Keys
    APIS: {
        TWELVE_DATA: "ac655a25fb294fc7b46e65acfaa3eca4",
        ALPHA_VANTAGE: "75IQNS7TVU6Z7WR6",
        NEWS: "pub_65082ebc2f7a1939f4ed39ecc812dd180f3f6" // Free tier
    },
    
    // Update intervals (milliseconds)
    INTERVALS: {
        MARKET_DATA: 300000,     // 5 minutes
        OPPORTUNITY_SCAN: 600000, // 10 minutes
        NEWS_SCAN: 900000        // 15 minutes
    },
    
    // Alert throttling (prevent spam)
    ALERT_COOLDOWN: 3600000,      // 1 hour per type per asset
    
    // Default stop loss / take profit
    DEFAULTS: {
        STOP_LOSS: 0.10,          // 10% stop loss
        TAKE_PROFIT: 0.20         // 20% take profit
    }
};

// ========================================
// ASSETS - Your trading universe
// Easy to add/remove/modify
// ========================================

const ASSETS = [
    // ===== CRYPTOCURRENCIES =====
    {
        id: 'btc',
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'crypto',
        category: 'crypto',
        
        // API identifiers
        coingecko_id: 'bitcoin',
        twelve_symbol: 'BTC/USD',
        alpha_symbol: 'BTC',
        
        // Technical levels
        support: 60000,
        resistance: 73000,
        trend: 'bullish',
        
        // Risk parameters
        defaultStopLoss: 0.10,
        defaultTakeProfit: 0.25,
        
        // News keywords for sentiment
        news_keywords: 'bitcoin btc cryptocurrency',
        
        // Icon/color (for UI)
        color: '#f7931a'
    },
    {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        type: 'crypto',
        category: 'crypto',
        
        coingecko_id: 'ethereum',
        twelve_symbol: 'ETH/USD',
        alpha_symbol: 'ETH',
        
        support: 3000,
        resistance: 4000,
        trend: 'bullish',
        
        defaultStopLoss: 0.12,
        defaultTakeProfit: 0.30,
        
        news_keywords: 'ethereum eth crypto',
        color: '#627eea'
    },
    {
        id: 'sol',
        symbol: 'SOL',
        name: 'Solana',
        type: 'crypto',
        category: 'crypto',
        
        coingecko_id: 'solana',
        twelve_symbol: 'SOL/USD',
        alpha_symbol: 'SOL',
        
        support: 76,
        resistance: 101,
        trend: 'bullish',
        
        defaultStopLoss: 0.15,
        defaultTakeProfit: 0.40,
        
        news_keywords: 'solana sol crypto',
        color: '#00ff9c'
    },
    {
        id: 'link',
        symbol: 'LINK',
        name: 'Chainlink',
        type: 'crypto',
        category: 'crypto',
        
        coingecko_id: 'chainlink',
        twelve_symbol: 'LINK/USD',
        alpha_symbol: 'LINK',
        
        support: 16,
        resistance: 28,
        trend: 'neutral',
        
        defaultStopLoss: 0.12,
        defaultTakeProfit: 0.35,
        
        news_keywords: 'chainlink link oracle',
        color: '#2a5ada'
    },
    
    // ===== STOCKS =====
    {
        id: 'pltr',
        symbol: 'PLTR',
        name: 'Palantir',
        type: 'stock',
        category: 'stock',
        
        twelve_symbol: 'PLTR',
        alpha_symbol: 'PLTR',
        
        support: 136,
        resistance: 186,
        trend: 'bullish',
        
        defaultStopLoss: 0.10,
        defaultTakeProfit: 0.25,
        
        news_keywords: 'palantir pltr data analytics',
        color: '#ffd700'
    },
    {
        id: 'meta',
        symbol: 'META',
        name: 'Meta',
        type: 'stock',
        category: 'stock',
        
        twelve_symbol: 'META',
        alpha_symbol: 'META',
        
        support: 450,
        resistance: 550,
        trend: 'bullish',
        
        defaultStopLoss: 0.08,
        defaultTakeProfit: 0.20,
        
        news_keywords: 'meta facebook instagram',
        color: '#4267b2'
    },
    
    // ===== COMMODITIES =====
    {
        id: 'gold',
        symbol: 'GOLD',
        name: 'Gold',
        type: 'commodity',
        category: 'commodity',
        
        twelve_symbol: 'XAU/USD',
        alpha_symbol: 'XAUUSD',
        
        support: 4780,
        resistance: 6000,
        trend: 'bullish',
        
        defaultStopLoss: 0.05,
        defaultTakeProfit: 0.15,
        
        news_keywords: 'gold precious metals inflation',
        color: '#ffd700'
    },
    
    // ===== ETFs =====
    {
        id: 'qqq',
        symbol: 'QQQ',
        name: 'Nasdaq ETF',
        type: 'etf',
        category: 'etf',
        
        twelve_symbol: 'QQQ',
        alpha_symbol: 'QQQ',
        
        support: 585,
        resistance: 630,
        trend: 'bullish',
        
        defaultStopLoss: 0.08,
        defaultTakeProfit: 0.15,
        
        news_keywords: 'nasdaq qqq tech stocks',
        color: '#00ff9c'
    }
];

// ========================================
// STATE MANAGEMENT - Single source of truth
// ========================================

const State = {
    // Market data
    prices: {},
    priceHistory: {},
    technicals: {},
    
    // Your demo portfolio
    positions: {},          // Open positions
    tradeHistory: [],       // Closed trades
    portfolioStats: {
        totalValue: 0,
        totalCost: 0,
        totalPnL: 0,
        winRate: 0,
        totalTrades: 0
    },
    
    // Opportunities and alerts
    opportunities: [],
    alerts: [],
    
    // API tracking
    apiStats: {
        twelve: { success: 0, fail: 0 },
        coingecko: { success: 0, fail: 0 },
        alpha: { success: 0, fail: 0 }
    },
    
    // Timestamps
    lastUpdate: null,
    lastOpportunityScan: null,
    
    // Initialize
    init() {
        ASSETS.forEach(asset => {
            this.priceHistory[asset.id] = [];
            this.technicals[asset.id] = {
                rsi: 50,
                ma50: null,
                ma200: null,
                volatility: 0
            };
        });
        this.loadFromStorage();
    },
    
    // Persist to localStorage
    saveToStorage() {
        localStorage.setItem('zaka_positions', JSON.stringify(this.positions));
        localStorage.setItem('zaka_history', JSON.stringify(this.tradeHistory));
        localStorage.setItem('zaka_portfolio', JSON.stringify(this.portfolioStats));
    },
    
    loadFromStorage() {
        const positions = localStorage.getItem('zaka_positions');
        const history = localStorage.getItem('zaka_history');
        const portfolio = localStorage.getItem('zaka_portfolio');
        
        if (positions) this.positions = JSON.parse(positions);
        if (history) this.tradeHistory = JSON.parse(history);
        if (portfolio) this.portfolioStats = JSON.parse(portfolio);
    }
};

// ========================================
// API MANAGER - Smart fallback system
// Tries multiple APIs until one works
// ========================================

const APIManager = {
    async fetchWithTimeout(url, timeout = 8000) {
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
    },
    
    async fetchTwelveData(symbol) {
        try {
            const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${CONFIG.APIS.TWELVE_DATA}&dp=2`;
            const response = await this.fetchWithTimeout(url);
            const data = await response.json();
            
            if (data.price && parseFloat(data.price) > 0) {
                State.apiStats.twelve.success++;
                return parseFloat(data.price);
            }
        } catch (e) {
            console.log('Twelve Data failed:', e.message);
        }
        State.apiStats.twelve.fail++;
        return null;
    },
    
    async fetchCoinGecko(asset) {
        if (asset.type !== 'crypto') return null;
        
        try {
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${asset.coingecko_id}&vs_currencies=usd`;
            const response = await this.fetchWithTimeout(url);
            const data = await response.json();
            
            if (data[asset.coingecko_id]?.usd) {
                State.apiStats.coingecko.success++;
                return data[asset.coingecko_id].usd;
            }
        } catch (e) {
            console.log('CoinGecko failed:', e.message);
        }
        State.apiStats.coingecko.fail++;
        return null;
    },
    
    async fetchAlphaVantage(symbol) {
        try {
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${CONFIG.APIS.ALPHA_VANTAGE}`;
            const response = await this.fetchWithTimeout(url);
            const data = await response.json();
            
            if (data['Global Quote']?.['05. price']) {
                State.apiStats.alpha.success++;
                return parseFloat(data['Global Quote']['05. price']);
            }
        } catch (e) {
            console.log('Alpha Vantage failed:', e.message);
        }
        State.apiStats.alpha.fail++;
        return null;
    },
    
    async getPrice(asset) {
        // Try Twelve Data first (fastest)
        let price = await this.fetchTwelveData(asset.twelve_symbol);
        if (price) return price;
        
        // Try CoinGecko for crypto
        if (asset.type === 'crypto') {
            price = await this.fetchCoinGecko(asset);
            if (price) return price;
        }
        
        // Try Alpha Vantage as last resort
        price = await this.fetchAlphaVantage(asset.alpha_symbol || asset.symbol);
        if (price) return price;
        
        // Return last known price or null
        return State.prices[asset.id] || null;
    },
    
    async fetchNews(asset) {
        try {
            const url = `https://newsdata.io/api/1/news?apikey=${CONFIG.APIS.NEWS}&q=${encodeURIComponent(asset.news_keywords)}&language=en&size=5`;
            const response = await this.fetchWithTimeout(url, 4000);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                return data.results.map(article => ({
                    title: article.title,
                    source: article.source_id,
                    description: article.description,
                    url: article.link,
                    sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || ''))
                }));
            }
        } catch (e) {
            console.log(`News fetch failed for ${asset.symbol}:`, e.message);
        }
        return [];
    },
    
    analyzeSentiment(text) {
        const positiveWords = ['surge', 'rally', 'gain', 'bull', 'upgrade', 'buy', 'growth', 'profit', 'beat', 'launch', 'partnership'];
        const negativeWords = ['plunge', 'crash', 'loss', 'bear', 'downgrade', 'sell', 'risk', 'warning', 'miss', 'hack', 'ban'];
        
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
};

// ========================================
// TECHNICAL ANALYZER - Chart patterns & indicators
// ========================================

const TechnicalAnalyzer = {
    calculateRSI(assetId, period = 14) {
        const history = State.priceHistory[assetId] || [];
        if (history.length < period) return 50;
        
        let gains = 0, losses = 0;
        for (let i = history.length - period; i < history.length - 1; i++) {
            if (i < 0 || i + 1 >= history.length) continue;
            const change = history[i + 1] - history[i];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        if (gains === 0 && losses === 0) return 50;
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    },
    
    calculateMovingAverage(assetId, period) {
        const history = State.priceHistory[assetId] || [];
        if (history.length < period) return null;
        
        const slice = history.slice(-period);
        return slice.reduce((a, b) => a + b, 0) / period;
    },
    
    calculateVolatility(assetId) {
        const history = State.priceHistory[assetId] || [];
        if (history.length < 10) return 0;
        
        const returns = [];
        for (let i = 1; i < history.length; i++) {
            returns.push((history[i] - history[i-1]) / history[i-1]);
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        return Math.sqrt(variance) * 100;
    },
    
    analyze(asset, currentPrice) {
        if (!currentPrice) return null;
        
        // Update history
        if (!State.priceHistory[asset.id]) State.priceHistory[asset.id] = [];
        State.priceHistory[asset.id].push(currentPrice);
        if (State.priceHistory[asset.id].length > 100) {
            State.priceHistory[asset.id].shift();
        }
        
        // Calculate indicators
        const rsi = this.calculateRSI(asset.id);
        const ma50 = this.calculateMovingAverage(asset.id, 50);
        const ma200 = this.calculateMovingAverage(asset.id, 200);
        const volatility = this.calculateVolatility(asset.id);
        
        // Determine trend
        let trend = 'neutral';
        if (ma50 && ma200) {
            if (ma50 > ma200 && currentPrice > ma50) trend = 'bullish';
            else if (ma50 < ma200 && currentPrice < ma50) trend = 'bearish';
        }
        
        // Check support/resistance
        const nearSupport = currentPrice <= asset.support * 1.02;
        const nearResistance = currentPrice >= asset.resistance * 0.98;
        const breakoutAbove = currentPrice > asset.resistance;
        const breakdownBelow = currentPrice < asset.support;
        
        // Store
        State.technicals[asset.id] = {
            rsi: Math.round(rsi),
            ma50: ma50 ? Math.round(ma50) : null,
            ma200: ma200 ? Math.round(ma200) : null,
            volatility: volatility.toFixed(1),
            trend,
            nearSupport,
            nearResistance,
            breakoutAbove,
            breakdownBelow
        };
        
        return State.technicals[asset.id];
    }
};

// ========================================
// OPPORTUNITY DETECTOR - The brain that generates advice
// ========================================

const OpportunityDetector = {
    async scan(asset, currentPrice) {
        const tech = State.technicals[asset.id];
        if (!tech) return null;
        
        // Get news
        const news = await APIManager.fetchNews(asset);
        const positiveNews = news.filter(n => n.sentiment === 'positive').length;
        const negativeNews = news.filter(n => n.sentiment === 'negative').length;
        
        // Build signal factors
        const factors = [];
        let buyScore = 0;
        let sellScore = 0;
        let totalWeight = 0;
        
        // === BUY SIGNALS ===
        
        // RSI oversold
        if (tech.rsi < 30) {
            factors.push({
                type: 'bullish',
                text: `RSI ${tech.rsi} - Oversold, potential bounce`,
                weight: 2
            });
            buyScore += 2;
            totalWeight += 2;
        }
        
        // At support
        if (tech.nearSupport) {
            factors.push({
                type: 'bullish',
                text: `At support level $${asset.support.toLocaleString()}`,
                weight: 2
            });
            buyScore += 2;
            totalWeight += 2;
        }
        
        // Bullish trend
        if (tech.trend === 'bullish') {
            factors.push({
                type: 'bullish',
                text: 'Trading above key moving averages (bullish trend)',
                weight: 1
            });
            buyScore += 1;
            totalWeight += 1;
        }
        
        // Positive news
        if (positiveNews > negativeNews) {
            factors.push({
                type: 'bullish',
                text: `Positive news sentiment (${positiveNews} positive articles)`,
                weight: 2
            });
            buyScore += 2;
            totalWeight += 2;
        }
        
        // === SELL SIGNALS ===
        
        // RSI overbought
        if (tech.rsi > 70) {
            factors.push({
                type: 'bearish',
                text: `RSI ${tech.rsi} - Overbought, potential pullback`,
                weight: 2
            });
            sellScore += 2;
            totalWeight += 2;
        }
        
        // At resistance
        if (tech.nearResistance) {
            factors.push({
                type: 'bearish',
                text: `At resistance level $${asset.resistance.toLocaleString()}`,
                weight: 2
            });
            sellScore += 2;
            totalWeight += 2;
        }
        
        // Bearish trend
        if (tech.trend === 'bearish') {
            factors.push({
                type: 'bearish',
                text: 'Trading below key moving averages (bearish trend)',
                weight: 1
            });
            sellScore += 1;
            totalWeight += 1;
        }
        
        // Negative news
        if (negativeNews > positiveNews) {
            factors.push({
                type: 'bearish',
                text: `Negative news sentiment (${negativeNews} negative articles)`,
                weight: 2
            });
            sellScore += 2;
            totalWeight += 2;
        }
        
        // Breakout/breakdown
        if (tech.breakoutAbove) {
            factors.push({
                type: 'bullish',
                text: `Breaking above resistance! Bullish breakout`,
                weight: 3
            });
            buyScore += 3;
            totalWeight += 3;
        }
        
        if (tech.breakdownBelow) {
            factors.push({
                type: 'bearish',
                text: `Breaking below support! Bearish breakdown`,
                weight: 3
            });
            sellScore += 3;
            totalWeight += 3;
        }
        
        // Determine signal
        let signal = null;
        let confidence = 'LOW';
        let action = 'HOLD';
        
        if (buyScore > sellScore + 1) {
            action = 'BUY';
            const score = (buyScore / totalWeight) * 100;
            if (score > 60) confidence = 'HIGH';
            else if (score > 40) confidence = 'MEDIUM';
            
            signal = {
                action: 'BUY',
                confidence,
                reasons: factors.filter(f => f.type === 'bullish').map(f => f.text),
                entry: currentPrice,
                suggestedStop: currentPrice * (1 - (asset.defaultStopLoss || CONFIG.DEFAULTS.STOP_LOSS)),
                suggestedTarget: currentPrice * (1 + (asset.defaultTakeProfit || CONFIG.DEFAULTS.TAKE_PROFIT))
            };
        }
        else if (sellScore > buyScore + 1) {
            action = 'SELL';
            const score = (sellScore / totalWeight) * 100;
            if (score > 60) confidence = 'HIGH';
            else if (score > 40) confidence = 'MEDIUM';
            
            signal = {
                action: 'SELL',
                confidence,
                reasons: factors.filter(f => f.type === 'bearish').map(f => f.text),
                currentPrice
            };
        }
        
        return {
            asset: asset.symbol,
            name: asset.name,
            price: currentPrice,
            signal,
            factors,
            news: news.slice(0, 3), // Top 3 news
            timestamp: Date.now()
        };
    }
};

// ========================================
// PORTFOLIO MANAGER - Track your demo trades
// ========================================

const PortfolioManager = {
    // Buy asset (execute Zaka's advice)
    buy(asset, quantity, price, reason, signal) {
        const positionId = `${asset.id}_${Date.now()}`;
        
        State.positions[positionId] = {
            id: positionId,
            assetId: asset.id,
            symbol: asset.symbol,
            name: asset.name,
            quantity: quantity,
            entryPrice: price,
            entryDate: Date.now(),
            currentPrice: price,
            reason: reason,
            signal: signal,
            stopLoss: price * (1 - (asset.defaultStopLoss || CONFIG.DEFAULTS.STOP_LOSS)),
            takeProfit: price * (1 + (asset.defaultTakeProfit || CONFIG.DEFAULTS.TAKE_PROFIT))
        };
        
        this.updatePortfolioStats();
        State.saveToStorage();
        
        UI.addAlert(`💰 Bought ${quantity} ${asset.symbol} at $${price.toFixed(2)}`, 'trade');
        return positionId;
    },
    
    // Sell asset (close position)
    sell(positionId, exitPrice, reason) {
        const position = State.positions[positionId];
        if (!position) return null;
        
        const pnl = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
        const pnlAmount = (exitPrice - position.entryPrice) * position.quantity;
        
        // Record in history
        State.tradeHistory.unshift({
            asset: position.symbol,
            name: position.name,
            entryPrice: position.entryPrice,
            exitPrice: exitPrice,
            quantity: position.quantity,
            entryDate: position.entryDate,
            exitDate: Date.now(),
            pnl: pnl,
            pnlAmount: pnlAmount,
            reason: reason,
            entryReason: position.reason
        });
        
        // Remove position
        delete State.positions[positionId];
        
        this.updatePortfolioStats();
        State.saveToStorage();
        
        UI.addAlert(`💸 Sold ${position.symbol} at $${exitPrice.toFixed(2)} (${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%)`, pnl > 0 ? 'profit' : 'loss');
        
        return { pnl, pnlAmount };
    },
    
    // Update all positions with current prices
    updatePositions() {
        let totalValue = 0;
        let totalCost = 0;
        
        Object.keys(State.positions).forEach(id => {
            const position = State.positions[id];
            const currentPrice = State.prices[position.assetId] || position.entryPrice;
            
            position.currentPrice = currentPrice;
            position.currentValue = currentPrice * position.quantity;
            position.pnl = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
            position.pnlAmount = (currentPrice - position.entryPrice) * position.quantity;
            
            totalValue += position.currentValue;
            totalCost += position.entryPrice * position.quantity;
            
            // Check stop loss
            if (currentPrice <= position.stopLoss) {
                UI.addAlert(`🚨 STOP LOSS: ${position.symbol} hit $${currentPrice.toFixed(2)}`, 'risk');
            }
            
            // Check take profit
            if (currentPrice >= position.takeProfit) {
                UI.addAlert(`🎯 TAKE PROFIT: ${position.symbol} at $${currentPrice.toFixed(2)}`, 'opportunity');
            }
        });
        
        State.portfolioStats.totalValue = totalValue;
        State.portfolioStats.totalCost = totalCost;
        State.portfolioStats.totalPnL = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
        
        // Calculate win rate
        if (State.tradeHistory.length > 0) {
            const wins = State.tradeHistory.filter(t => t.pnl > 0).length;
            State.portfolioStats.winRate = (wins / State.tradeHistory.length) * 100;
            State.portfolioStats.totalTrades = State.tradeHistory.length;
        }
    },
    
    updatePortfolioStats() {
        this.updatePositions();
        State.saveToStorage();
    }
};

// ========================================
// UI MANAGER - All DOM updates
// ========================================

const UI = {
    addAlert(text, type = 'info') {
        const list = document.getElementById('alertList');
        if (!list) return;
        
        // Remove placeholder
        if (list.children.length === 1 && list.children[0].classList.contains('alert-placeholder')) {
            list.innerHTML = '';
        }
        
        const li = document.createElement('li');
        li.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
        
        // Style by type
        if (type === 'risk') li.style.borderLeftColor = '#ff4d4d';
        else if (type === 'opportunity') li.style.borderLeftColor = '#00ff9c';
        else if (type === 'trade') li.style.borderLeftColor = '#ffd700';
        else if (type === 'profit') li.style.borderLeftColor = '#00ff9c';
        else if (type === 'loss') li.style.borderLeftColor = '#ff4d4d';
        
        list.prepend(li);
        
        // Keep last 50
        while (list.children.length > 50) {
            list.removeChild(list.lastChild);
        }
        
        // Update count
        document.getElementById('alertCount').textContent = list.children.length;
    },
    
    renderOpportunities() {
        const grid = document.getElementById('opportunitiesGrid');
        if (!grid) return;
        
        if (State.opportunities.length === 0) {
            grid.innerHTML = '<div class="loading-placeholder">Analyzing markets for opportunities...</div>';
            return;
        }
        
        grid.innerHTML = State.opportunities
            .filter(opp => opp.signal && opp.signal.action !== 'HOLD')
            .slice(0, 3) // Show top 3
            .map(opp => {
                const signal = opp.signal;
                const confidenceClass = signal.confidence.toLowerCase();
                
                return `
                    <div class="opportunity-card ${signal.action.toLowerCase()}">
                        <div class="opp-header">
                            <span class="opp-symbol">${opp.asset}</span>
                            <span class="opp-name">${opp.name}</span>
                            <span class="opp-confidence ${confidenceClass}">${signal.confidence}</span>
                        </div>
                        <div class="opp-action ${signal.action.toLowerCase()}">
                            ${signal.action} at $${opp.price.toFixed(2)}
                        </div>
                        <div class="opp-reasons">
                            ${signal.reasons.map(r => `<div class="reason">• ${r}</div>`).join('')}
                        </div>
                        ${signal.action === 'BUY' ? `
                            <div class="opp-levels">
                                <span>Stop: $${signal.suggestedStop.toFixed(2)}</span>
                                <span>Target: $${signal.suggestedTarget.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <button class="opp-action-btn" onclick="UI.handleOpportunity('${opp.asset}')">
                            ${signal.action === 'BUY' ? '💰 Execute Buy' : '👀 View'}
                        </button>
                    </div>
                `;
            }).join('');
    },
    
    renderPositions() {
        const grid = document.getElementById('positionsGrid');
        if (!grid) return;
        
        const positions = Object.values(State.positions);
        
        if (positions.length === 0) {
            grid.innerHTML = '<div class="empty-state">No open positions. Take a trade from Zaka\'s advice above!</div>';
            return;
        }
        
        grid.innerHTML = positions.map(pos => {
            const pnlClass = pos.pnl >= 0 ? 'positive' : 'negative';
            
            return `
                <div class="position-card ${pnlClass}">
                    <div class="pos-header">
                        <span class="pos-symbol">${pos.symbol}</span>
                        <span class="pos-quantity">${pos.quantity} shares</span>
                    </div>
                    <div class="pos-details">
                        <div class="pos-row">
                            <span>Entry:</span>
                            <span>$${pos.entryPrice.toFixed(2)}</span>
                        </div>
                        <div class="pos-row">
                            <span>Current:</span>
                            <span>$${pos.currentPrice.toFixed(2)}</span>
                        </div>
                        <div class="pos-row ${pnlClass}">
                            <span>P&L:</span>
                            <span>${pos.pnl > 0 ? '+' : ''}${pos.pnl.toFixed(2)}% ($${pos.pnlAmount.toFixed(2)})</span>
                        </div>
                        <div class="pos-row">
                            <span>Stop:</span>
                            <span>$${pos.stopLoss.toFixed(2)}</span>
                        </div>
                        <div class="pos-row">
                            <span>Target:</span>
                            <span>$${pos.takeProfit.toFixed(2)}</span>
                        </div>
                        <div class="pos-reason">
                            <small>Reason: ${pos.reason}</small>
                        </div>
                    </div>
                    <button class="sell-btn" onclick="UI.openSellModal('${pos.id}')">
                        💸 Sell Position
                    </button>
                </div>
            `;
        }).join('');
    },
    
    renderHistory() {
        const tbody = document.getElementById('historyBody');
        if (!tbody) return;
        
        if (State.tradeHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-history">No trade history yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = State.tradeHistory.slice(0, 10).map(trade => {
            const pnlClass = trade.pnl >= 0 ? 'positive' : 'negative';
            const entryDate = new Date(trade.entryDate).toLocaleDateString();
            const exitDate = new Date(trade.exitDate).toLocaleDateString();
            
            return `
                <tr>
                    <td>${exitDate}</td>
                    <td>${trade.asset}</td>
                    <td class="${pnlClass}">${trade.pnl > 0 ? 'BUY→SELL' : 'SELL'}</td>
                    <td>$${trade.entryPrice.toFixed(2)}</td>
                    <td>$${trade.exitPrice.toFixed(2)}</td>
                    <td class="${pnlClass}">${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}%</td>
                    <td><small>${trade.reason || trade.entryReason}</small></td>
                </tr>
            `;
        }).join('');
    },
    
    renderPortfolioSummary() {
        document.getElementById('portfolioSummary').querySelector('.portfolio-value').textContent = 
            `$${State.portfolioStats.totalValue.toFixed(2)}`;
        
        const pnlEl = document.getElementById('pnlSummary').querySelector('.portfolio-pnl');
        const pnl = State.portfolioStats.totalPnL;
        pnlEl.textContent = `$${(State.portfolioStats.totalValue - State.portfolioStats.totalCost).toFixed(2)} (${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%)`;
        pnlEl.className = `portfolio-pnl ${pnl >= 0 ? 'positive' : 'negative'}`;
        
        document.getElementById('positionsSummary').querySelector('.positions-count').textContent = 
            Object.keys(State.positions).length;
        
        document.getElementById('winsSummary').querySelector('.win-rate').textContent = 
            `${State.portfolioStats.winRate.toFixed(1)}%`;
    },
    
    openBuyModal(asset, opportunity) {
        const modal = document.getElementById('buyModal');
        const body = document.getElementById('buyModalBody');
        
        body.innerHTML = `
            <h3>Buy ${opportunity.name} (${opportunity.asset})</h3>
            <p class="modal-price">Current Price: $${opportunity.price.toFixed(2)}</p>
            
            <div class="modal-reasons">
                <strong>Zaka's Reasons:</strong>
                ${opportunity.signal.reasons.map(r => `<div>• ${r}</div>`).join('')}
            </div>
            
            <div class="modal-levels">
                <div>Suggested Stop: $${opportunity.signal.suggestedStop.toFixed(2)}</div>
                <div>Suggested Target: $${opportunity.signal.suggestedTarget.toFixed(2)}</div>
            </div>
            
            <div class="modal-input-group">
                <label>Quantity to buy:</label>
                <input type="number" id="buyQuantity" step="any" min="0.001" value="1">
            </div>
            
            <div class="modal-buttons">
                <button class="modal-btn cancel" onclick="UI.closeModal('buy')">Cancel</button>
                <button class="modal-btn confirm" onclick="UI.confirmBuy('${asset}', ${opportunity.price})">Confirm Buy</button>
            </div>
        `;
        
        modal.style.display = 'flex';
    },
    
    openSellModal(positionId) {
        const position = State.positions[positionId];
        if (!position) return;
        
        const modal = document.getElementById('sellModal');
        const body = document.getElementById('sellModalBody');
        
        body.innerHTML = `
            <h3>Sell ${position.symbol}</h3>
            <p>Position: ${position.quantity} shares @ $${position.entryPrice.toFixed(2)}</p>
            <p>Current Price: $${position.currentPrice.toFixed(2)}</p>
            <p class="${position.pnl >= 0 ? 'positive' : 'negative'}">
                Current P&L: ${position.pnl > 0 ? '+' : ''}${position.pnl.toFixed(2)}% ($${position.pnlAmount.toFixed(2)})
            </p>
            
            <div class="modal-input-group">
                <label>Exit price (optional - defaults to current):</label>
                <input type="number" id="exitPrice" step="any" value="${position.currentPrice.toFixed(2)}">
            </div>
            
            <div class="modal-input-group">
                <label>Reason for selling:</label>
                <input type="text" id="exitReason" placeholder="e.g., Taking profits, Stop loss, Zaka signal">
            </div>
            
            <div class="modal-buttons">
                <button class="modal-btn cancel" onclick="UI.closeModal('sell')">Cancel</button>
                <button class="modal-btn confirm" onclick="UI.confirmSell('${positionId}')">Confirm Sell</button>
            </div>
        `;
        
        modal.style.display = 'flex';
    },
    
    handleOpportunity(assetSymbol) {
        const asset = ASSETS.find(a => a.symbol === assetSymbol);
        const opportunity = State.opportunities.find(o => o.asset === assetSymbol);
        
        if (asset && opportunity) {
            this.openBuyModal(assetSymbol, opportunity);
        }
    },
    
    confirmBuy(assetSymbol, price) {
        const quantity = parseFloat(document.getElementById('buyQuantity').value);
        if (!quantity || quantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }
        
        const asset = ASSETS.find(a => a.symbol === assetSymbol);
        const opportunity = State.opportunities.find(o => o.asset === assetSymbol);
        
        if (asset && opportunity) {
            PortfolioManager.buy(
                asset, 
                quantity, 
                price, 
                opportunity.signal.reasons.join('; '),
                opportunity.signal.confidence
            );
            
            this.closeModal('buy');
            this.refreshAll();
        }
    },
    
    confirmSell(positionId) {
        const exitPrice = parseFloat(document.getElementById('exitPrice').value);
        const reason = document.getElementById('exitReason').value || 'Manual sell';
        
        if (!exitPrice || exitPrice <= 0) {
            alert('Please enter a valid exit price');
            return;
        }
        
        PortfolioManager.sell(positionId, exitPrice, reason);
        this.closeModal('sell');
        this.refreshAll();
    },
    
    closeModal(type) {
        document.getElementById(`${type}Modal`).style.display = 'none';
    },
    
    refreshAll() {
        this.renderOpportunities();
        this.renderPositions();
        this.renderHistory();
        this.renderPortfolioSummary();
        
        // Update API stats
        const total = Object.values(State.apiStats).reduce((acc, api) => acc + api.success + api.fail, 0);
        const success = Object.values(State.apiStats).reduce((acc, api) => acc + api.success, 0);
        document.getElementById('apiStats').textContent = `API: ${success}/${total}`;
        
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
    }
};

// ========================================
// MAIN LOOP - The heartbeat
// ========================================

async function mainLoop() {
    console.log('🔄 Zaka is thinking...');
    
    // Update all prices
    for (const asset of ASSETS) {
        const price = await APIManager.getPrice(asset);
        if (price) {
            State.prices[asset.id] = price;
            TechnicalAnalyzer.analyze(asset, price);
        }
    }
    
    // Update positions with new prices
    PortfolioManager.updatePositions();
    
    // Scan for opportunities
    State.opportunities = [];
    for (const asset of ASSETS) {
        const price = State.prices[asset.id];
        if (price) {
            const opportunity = await OpportunityDetector.scan(asset, price);
            if (opportunity) {
                State.opportunities.push(opportunity);
                
                // Generate alert for HIGH confidence signals
                if (opportunity.signal && opportunity.signal.confidence === 'HIGH') {
                    const alertKey = `${asset.id}_${opportunity.signal.action}_${Date.now()}`;
                    const lastAlert = localStorage.getItem(alertKey);
                    
                    if (!lastAlert || Date.now() - parseInt(lastAlert) > CONFIG.ALERT_COOLDOWN) {
                        UI.addAlert(
                            `🔥 HIGH CONFIDENCE: ${opportunity.signal.action} ${asset.symbol} at $${price.toFixed(2)}`,
                            opportunity.signal.action === 'BUY' ? 'opportunity' : 'risk'
                        );
                        localStorage.setItem(alertKey, Date.now().toString());
                    }
                }
            }
        }
    }
    
    // Update UI
    UI.refreshAll();
    
    // Schedule next run
    setTimeout(mainLoop, CONFIG.INTERVALS.MARKET_DATA);
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 ThinkingZaka Mirror Trading Assistant starting...');
    
    // Initialize state
    State.init();
    
    // Check notifications
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // Set up event listeners
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        UI.addAlert('Manual refresh triggered', 'info');
        mainLoop();
    });
    
    document.getElementById('clearAlerts')?.addEventListener('click', () => {
        document.getElementById('alertList').innerHTML = '<li class="alert-placeholder">No new alerts</li>';
        document.getElementById('alertCount').textContent = '0';
    });
    
    document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
        if (confirm('Clear all trade history?')) {
            State.tradeHistory = [];
            State.saveToStorage();
            UI.renderHistory();
            UI.addAlert('Trade history cleared', 'info');
        }
    });
    
    document.getElementById('manualBuyBtn')?.addEventListener('click', () => {
        const symbols = ASSETS.map(a => a.symbol).join(', ');
        alert(`Manual buy not yet implemented. Use Zaka's opportunities above.\nAvailable: ${symbols}`);
    });
    
    document.getElementById('manualSellBtn')?.addEventListener('click', () => {
        alert('To sell, click the "Sell Position" button on any open position card above.');
    });
    
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
        const data = {
            portfolio: State.portfolioStats,
            positions: State.positions,
            history: State.tradeHistory,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zaka-portfolio-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        UI.addAlert('Data exported successfully', 'info');
    });
    
    // Modals
    document.getElementById('viewStrategyBtn')?.addEventListener('click', () => {
        document.getElementById('strategyModal').style.display = 'flex';
    });
    
    document.getElementById('closeStrategyModal')?.addEventListener('click', () => {
        document.getElementById('strategyModal').style.display = 'none';
    });
    
    document.getElementById('closeBuyModal')?.addEventListener('click', () => {
        UI.closeModal('buy');
    });
    
    document.getElementById('closeSellModal')?.addEventListener('click', () => {
        UI.closeModal('sell');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // PWA install
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        const installBtn = document.getElementById('installPWA');
        installBtn.style.display = 'inline';
        installBtn.onclick = async () => {
            e.prompt();
            const { outcome } = await e.userChoice;
            if (outcome === 'accepted') installBtn.style.display = 'none';
        };
    });
    
    // Initial render with placeholder data
    UI.refreshAll();
    
    // Start the main loop
    setTimeout(mainLoop, 1000);
    
    UI.addAlert('Zaka is online and analyzing markets...', 'info');
});

// Expose for debugging
window.Zaka = {
    State,
    ASSETS,
    PortfolioManager,
    UI,
    forceScan: mainLoop
};
