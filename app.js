// ========================================
// ZAKA - Smart Trading Companion
// Main Application Logic
// ========================================

// Global State
let portfolio = [];
let alerts = [];
let transactions = [];
let prices = {};

// Asset Database
const assetDatabase = [
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', price: 67890 },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto', price: 3245 },
    { symbol: 'SOL', name: 'Solana', type: 'crypto', price: 142 },
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', price: 175 },
    { symbol: 'PLTR', name: 'Palantir', type: 'stock', price: 24 },
    { symbol: 'GOLD', name: 'Gold', type: 'commodity', price: 2345 }
];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log('ZAKA Starting...');
    
    // Load saved data
    loadFromStorage();
    
    // Initialize with demo data if empty
    if (portfolio.length === 0) {
        initializeDemoData();
    }
    
    // Update prices
    updatePrices();
    
    // Render everything
    renderPortfolio();
    renderOpportunities();
    renderAlerts();
    
    // Start real-time updates
    startPriceSimulator();
    
    // Update time
    updateTimestamp();
});

// Load from localStorage
function loadFromStorage() {
    try {
        const saved = localStorage.getItem('zaka_portfolio');
        if (saved) portfolio = JSON.parse(saved);
        
        const savedAlerts = localStorage.getItem('zaka_alerts');
        if (savedAlerts) alerts = JSON.parse(savedAlerts);
        
        const savedTx = localStorage.getItem('zaka_transactions');
        if (savedTx) transactions = JSON.parse(savedTx);
    } catch (e) {
        console.log('No saved data');
    }
}

// Save to localStorage
function saveToStorage() {
    localStorage.setItem('zaka_portfolio', JSON.stringify(portfolio));
    localStorage.setItem('zaka_alerts', JSON.stringify(alerts));
    localStorage.setItem('zaka_transactions', JSON.stringify(transactions));
}

// Initialize Demo Data
function initializeDemoData() {
    portfolio = [
        {
            symbol: 'BTC',
            name: 'Bitcoin',
            type: 'crypto',
            amount: 0.05,
            entryPrice: 67890,
            currentPrice: 67890,
            dayChange: 2.3
        },
        {
            symbol: 'ETH',
            name: 'Ethereum',
            type: 'crypto',
            amount: 0.5,
            entryPrice: 3245,
            currentPrice: 3245,
            dayChange: 1.7
        },
        {
            symbol: 'SOL',
            name: 'Solana',
            type: 'crypto',
            amount: 10,
            entryPrice: 142,
            currentPrice: 142,
            dayChange: -3.2
        },
        {
            symbol: 'PLTR',
            name: 'Palantir',
            type: 'stock',
            amount: 50,
            entryPrice: 24,
            currentPrice: 24,
            dayChange: 0.5
        }
    ];
    
    alerts = [
        { type: 'opportunity', message: 'BTC oversold - BUY signal', time: '2m ago' },
        { type: 'warning', message: 'SOL down 5% - near stop loss', time: '15m ago' },
        { type: 'info', message: 'Fed speech in 2 hours', time: '30m ago' }
    ];
    
    transactions = [
        { type: 'BUY', symbol: 'BTC', amount: 0.05, price: 67890, date: '2024-03-15' },
        { type: 'SELL', symbol: 'ETH', amount: 0.2, price: 3245, date: '2024-03-14' },
        { type: 'BUY', symbol: 'SOL', amount: 10, price: 142, date: '2024-03-13' }
    ];
    
    saveToStorage();
}

// Update Prices
function updatePrices() {
    portfolio.forEach(item => {
        const asset = assetDatabase.find(a => a.symbol === item.symbol);
        if (asset) {
            // Add some random variation
            const variation = (Math.random() - 0.5) * 0.02;
            item.currentPrice = asset.price * (1 + variation);
            item.dayChange = ((item.currentPrice - item.entryPrice) / item.entryPrice * 100).toFixed(1);
        }
    });
    
    // Update total value
    const total = portfolio.reduce((sum, item) => sum + (item.amount * item.currentPrice), 0);
    document.getElementById('totalValue').textContent = '$' + total.toLocaleString(undefined, {maximumFractionDigits: 0});
}

// Start Price Simulator
function startPriceSimulator() {
    setInterval(() => {
        updatePrices();
        renderPortfolio();
        
        // Random alerts
        if (Math.random() > 0.7) {
            generateRandomAlert();
        }
    }, 5000);
}

// Generate Random Alert
function generateRandomAlert() {
    const alertsList = [
        { type: 'opportunity', message: 'BTC forming bullish pattern' },
        { type: 'warning', message: 'ETH resistance at $3,300' },
        { type: 'info', message: 'New all-time high in volume' }
    ];
    
    const random = alertsList[Math.floor(Math.random() * alertsList.length)];
    random.time = 'just now';
    
    alerts.unshift(random);
    if (alerts.length > 5) alerts.pop();
    
    renderAlerts();
    saveToStorage();
}

// Render Portfolio Cards
function renderPortfolio() {
    const grid = document.getElementById('portfolioGrid');
    const loadingCard = document.getElementById('loadingCard');
    
    if (loadingCard) loadingCard.style.display = 'none';
    
    let html = '';
    portfolio.forEach(item => {
        const value = item.amount * item.currentPrice;
        const pnl = ((item.currentPrice - item.entryPrice) / item.entryPrice * 100).toFixed(1);
        const pnlClass = pnl >= 0 ? 'profit' : 'loss';
        const rsi = Math.floor(Math.random() * 40 + 30); // Simulated RSI
        
        html += `
            <div class="portfolio-card ${pnlClass}" onclick="showAssetDetails('${item.symbol}')">
                <div class="card-header">
                    <span class="card-symbol">${item.symbol}</span>
                    <span class="card-type ${item.type}">${item.type}</span>
                </div>
                <div class="card-price">
                    $${item.currentPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    <span class="day-change ${item.dayChange >= 0 ? 'up' : 'down'}">
                        ${item.dayChange >= 0 ? '+' : ''}${item.dayChange}%
                    </span>
                </div>
                <div class="position-details">
                    <div class="position-row">
                        <span>Amount</span>
                        <span>${item.amount} ${item.symbol}</span>
                    </div>
                    <div class="position-row">
                        <span>Value</span>
                        <span>$${value.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                    </div>
                    <div class="position-row ${pnlClass}">
                        <span>P&L</span>
                        <span>${pnl >= 0 ? '+' : ''}${pnl}%</span>
                    </div>
                    <div class="indicator-row">
                        <span class="rsi ${rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : ''}">RSI: ${rsi}</span>
                        <span class="volatility">Vol: ${Math.floor(Math.random() * 30 + 20)}%</span>
                    </div>
                </div>
                <div class="card-footer">
                    <span>Entry: $${item.entryPrice}</span>
                    <span>ZAKA: ${pnl >= 0 ? '📈 Bullish' : '📉 Bearish'}</span>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Render Opportunities
function renderOpportunities() {
    const container = document.getElementById('opportunities');
    
    const opportunities = [
        { symbol: 'BTC', signal: 'BUY', confidence: 'HIGH', desc: 'RSI 32 oversold + positive news', price: 67890 },
        { symbol: 'GOLD', signal: 'WATCH', confidence: 'MEDIUM', desc: 'Near support at $2,300', price: 2345 }
    ];
    
    let html = '';
    opportunities.forEach(opp => {
        html += `
            <div class="opportunity-card ${opp.confidence.toLowerCase()}">
                <div class="opportunity-header">
                    <span class="opportunity-title">${opp.symbol}</span>
                    <span class="confidence ${opp.confidence.toLowerCase()}">${opp.confidence}</span>
                </div>
                <div class="opportunity-desc">${opp.desc}</div>
                <div class="opportunity-footer">
                    <span>$${opp.price}</span>
                    <button class="view-btn" onclick="showAssetDetails('${opp.symbol}')">View</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Render Alerts
function renderAlerts() {
    const list = document.getElementById('alertList');
    const count = document.getElementById('alertCount');
    
    let html = '';
    alerts.forEach(alert => {
        const alertClass = alert.type === 'warning' ? 'urgent' : alert.type === 'info' ? 'info' : '';
        html += `<li class="${alertClass}"><strong>${alert.type}:</strong> ${alert.message} <span style="float:right; color:var(--text-dim)">${alert.time}</span></li>`;
    });
    
    if (alerts.length === 0) {
        html = '<li class="alert-placeholder">No new notifications</li>';
    }
    
    list.innerHTML = html;
    count.textContent = alerts.length + ' new';
}

// Clear Alerts
function clearAlerts() {
    alerts = [];
    renderAlerts();
    saveToStorage();
}

// Show Asset Details
function showAssetDetails(symbol) {
    const asset = portfolio.find(a => a.symbol === symbol) || 
                  assetDatabase.find(a => a.symbol === symbol);
    
    if (!asset) return;
    
    const modal = document.getElementById('tradeModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = `${asset.name} (${asset.symbol})`;
    
    const rsi = Math.floor(Math.random() * 40 + 30);
    const support = (asset.currentPrice * 0.95).toFixed(0);
    const resistance = (asset.currentPrice * 1.05).toFixed(0);
    
    body.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div style="font-size: 28px; color: #ffd700; margin-bottom: 10px;">
                $${asset.currentPrice.toLocaleString()}
            </div>
            
            <h3>🤖 ZAKA's Analysis</h3>
            
            <div style="background: var(--bg-card); padding: 15px; border-radius: 8px; margin: 15px 0;">
                <div style="margin-bottom: 10px;">
                    <span style="color: var(--text-muted);">Technical:</span><br>
                    • RSI: ${rsi} ${rsi < 30 ? '(OVERSOLD) → Bullish' : rsi > 70 ? '(OVERBOUGHT) → Bearish' : '(NEUTRAL)'}<br>
                    • Support: $${support} (holding strong)<br>
                    • Resistance: $${resistance}<br>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <span style="color: var(--text-muted);">News:</span><br>
                    🟢 Positive sentiment (2h ago)<br>
                    🟡 Fed speech in 2 hours<br>
                </div>
                
                <div style="color: ${rsi < 30 ? 'var(--profit-color)' : rsi > 70 ? 'var(--loss-color)' : 'var(--warning-color)'}; font-weight: 600;">
                    ZAKA's Verdict: ${rsi < 30 ? '🟢 BUY (HIGH CONFIDENCE)' : rsi > 70 ? '🔴 SELL (MEDIUM CONFIDENCE)' : '🟡 HOLD'}
                </div>
            </div>
            
            <div class="trade-form">
                <div class="trade-radio-group">
                    <label class="trade-radio">
                        <input type="radio" name="orderType" value="market" checked> Market
                    </label>
                    <label class="trade-radio">
                        <input type="radio" name="orderType" value="limit"> Limit
                    </label>
                </div>
                
                <input type="number" class="trade-input" placeholder="Amount" id="tradeAmount">
                <input type="number" class="trade-input" placeholder="Price (for limit)" id="tradePrice" disabled>
                
                <button class="trade-button" onclick="executeTrade('${symbol}', 'BUY')">
                    BUY ${symbol}
                </button>
                <button class="trade-button" style="background: var(--loss-color);" onclick="executeTrade('${symbol}', 'SELL')">
                    SELL ${symbol}
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Execute Trade
function executeTrade(symbol, type) {
    const amount = parseFloat(document.getElementById('tradeAmount').value);
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    const asset = portfolio.find(a => a.symbol === symbol);
    const price = asset ? asset.currentPrice : assetDatabase.find(a => a.symbol === symbol).price;
    
    if (type === 'SELL' && (!asset || asset.amount < amount)) {
        alert('Insufficient balance');
        return;
    }
    
    // Add transaction
    transactions.unshift({
        type: type,
        symbol: symbol,
        amount: amount,
        price: price,
        date: new Date().toLocaleDateString()
    });
    
    // Update portfolio
    if (type === 'BUY') {
        if (asset) {
            asset.amount += amount;
        } else {
            portfolio.push({
                symbol: symbol,
                name: assetDatabase.find(a => a.symbol === symbol).name,
                type: assetDatabase.find(a => a.symbol === symbol).type,
                amount: amount,
                entryPrice: price,
                currentPrice: price,
                dayChange: 0
            });
        }
    } else {
        asset.amount -= amount;
        if (asset.amount <= 0) {
            portfolio = portfolio.filter(a => a.symbol !== symbol);
        }
    }
    
    // Add alert
    alerts.unshift({
        type: 'info',
        message: `${type} ${amount} ${symbol} @ $${price}`,
        time: 'just now'
    });
    
    saveToStorage();
    renderPortfolio();
    renderAlerts();
    closeModal();
}

// Show Buy/Sell
function showBuySell(symbol) {
    showAssetDetails(symbol);
}

// Show Search
function showSearch() {
    const modal = document.getElementById('searchModal');
    modal.style.display = 'flex';
    document.getElementById('searchInput').focus();
}

// Search Assets
function searchAssets() {
    const query = document.getElementById('searchInput').value.toUpperCase();
    const results = document.getElementById('searchResults');
    
    if (query.length < 1) {
        results.innerHTML = '';
        return;
    }
    
    const matches = assetDatabase.filter(a => 
        a.symbol.includes(query) || a.name.toUpperCase().includes(query)
    );
    
    let html = '';
    matches.forEach(asset => {
        html += `
            <div class="search-result-item" onclick="selectAsset('${asset.symbol}')">
                <div>
                    <span class="search-result-symbol">${asset.symbol}</span>
                    <span style="color: var(--text-dim); margin-left: 8px;">${asset.name}</span>
                </div>
                <span class="search-result-price">$${asset.price}</span>
            </div>
        `;
    });
    
    if (matches.length === 0) {
        html = '<div style="padding: 20px; text-align: center; color: var(--text-dim);">No results found</div>';
    }
    
    results.innerHTML = html;
}

// Select Asset from Search
function selectAsset(symbol) {
    closeModal('searchModal');
    showAssetDetails(symbol);
}

// Show History
function showHistory() {
    const modal = document.getElementById('historyModal');
    const body = document.getElementById('historyBody');
    
    let html = '';
    transactions.forEach(tx => {
        html += `
            <div class="history-item ${tx.type.toLowerCase()}">
                <div>
                    <strong>${tx.type} ${tx.amount} ${tx.symbol}</strong>
                    <div class="history-date">${tx.date}</div>
                </div>
                <div>$${tx.price}</div>
            </div>
        `;
    });
    
    if (transactions.length === 0) {
        html = '<div style="padding: 20px; text-align: center; color: var(--text-dim);">No transactions yet</div>';
    }
    
    // Add stats
    const wins = transactions.filter(t => t.type === 'SELL' && t.price > 0).length;
    const total = transactions.length;
    const winRate = total > 0 ? ((wins / total) * 100).toFixed(0) : 0;
    
    html += `
        <div style="margin-top: 20px; padding: 15px; background: var(--bg-card); border-radius: 8px;">
            <h4>Performance</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                <div>Win Rate: ${winRate}%</div>
                <div>Total Trades: ${total}</div>
                <div>Avg Win: +5.2%</div>
                <div>Avg Loss: -2.1%</div>
            </div>
        </div>
    `;
    
    body.innerHTML = html;
    modal.style.display = 'flex';
}

// Show Install Modal
function showInstallModal() {
    const modal = document.getElementById('tradeModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = 'Install ZAKA';
    body.innerHTML = `
        <div style="text-align: center;">
            <p>Add ZAKA to your home screen for the best experience:</p>
            
            <h3>📱 Samsung Browser</h3>
            <p>1. Tap the menu (⋮)<br>
            2. Select "Add to home screen"</p>
            
            <h3>🌐 Chrome</h3>
            <p>1. Tap the menu (⋮)<br>
            2. Select "Add to Home screen"</p>
            
            <div class="modal-note">
                Once installed, ZAKA will open like a native app
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Close Modal
function closeModal(modalId = 'tradeModal') {
    document.getElementById(modalId).style.display = 'none';
}

// Update Timestamp
function updateTimestamp() {
    const now = new Date();
    document.getElementById('updateTime').textContent = 
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Enable/disable limit price input
document.addEventListener('click', function(e) {
    if (e.target.name === 'orderType') {
        const priceInput = document.getElementById('tradePrice');
        if (priceInput) {
            priceInput.disabled = e.target.value !== 'limit';
        }
    }
});
