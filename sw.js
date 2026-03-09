// ========================================
// ZAKA - WebSocket Simulation
// Real-time data simulation for GitHub Pages
// ========================================

// Simulated WebSocket connection
class ZakaWS {
    constructor() {
        this.listeners = {};
        this.connected = false;
        this.priceInterval = null;
        this.newsInterval = null;
    }
    
    // Connect to simulated WebSocket
    connect() {
        console.log('🌐 ZAKA WebSocket connecting...');
        
        setTimeout(() => {
            this.connected = true;
            this.trigger('connect', { status: 'connected', timestamp: Date.now() });
            console.log('✅ ZAKA WebSocket connected');
            
            // Start price updates
            this.startPriceUpdates();
            
            // Start news updates
            this.startNewsUpdates();
            
        }, 1000);
        
        return this;
    }
    
    // Start simulated price updates
    startPriceUpdates() {
        const assets = ['BTC', 'ETH', 'SOL', 'AAPL', 'PLTR', 'GOLD'];
        
        this.priceInterval = setInterval(() => {
            if (!this.connected) return;
            
            const updates = {};
            assets.forEach(symbol => {
                // Random price movement between -2% and +2%
                const change = (Math.random() - 0.5) * 0.04;
                const basePrice = this.getBasePrice(symbol);
                const newPrice = basePrice * (1 + change);
                
                updates[symbol] = {
                    price: newPrice,
                    change: change * 100,
                    timestamp: Date.now()
                };
            });
            
            this.trigger('price', updates);
            
            // Randomly trigger alerts
            if (Math.random() > 0.8) {
                this.generateRandomAlert();
            }
            
        }, 3000);
    }
    
    // Start simulated news updates
    startNewsUpdates() {
        const newsItems = [
            { title: 'Fed signals potential rate cuts', sentiment: 'positive', asset: 'BTC' },
            { title: 'ETF inflows reach $500M', sentiment: 'positive', asset: 'BTC' },
            { title: 'Regulatory concerns in Europe', sentiment: 'negative', asset: 'ETH' },
            { title: 'New partnership announced', sentiment: 'positive', asset: 'SOL' },
            { title: 'Earnings beat expectations', sentiment: 'positive', asset: 'AAPL' }
        ];
        
        this.newsInterval = setInterval(() => {
            if (!this.connected) return;
            
            const randomNews = newsItems[Math.floor(Math.random() * newsItems.length)];
            randomNews.timestamp = Date.now();
            
            this.trigger('news', randomNews);
            
        }, 15000); // Every 15 seconds
    }
    
    // Base prices for simulation
    getBasePrice(symbol) {
        const prices = {
            'BTC': 67890,
            'ETH': 3245,
            'SOL': 142,
            'AAPL': 175,
            'PLTR': 24,
            'GOLD': 2345
        };
        return prices[symbol] || 100;
    }
    
    // Generate random alert
    generateRandomAlert() {
        const alerts = [
            { type: 'opportunity', message: 'BTC forming bullish pattern', severity: 'high' },
            { type: 'warning', message: 'ETH resistance at $3,300', severity: 'medium' },
            { type: 'info', message: 'High volume detected', severity: 'low' },
            { type: 'opportunity', message: 'SOL oversold - RSI 28', severity: 'high' },
            { type: 'warning', message: 'Fed speech in 30 minutes', severity: 'medium' }
        ];
        
        const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
        randomAlert.timestamp = Date.now();
        
        this.trigger('alert', randomAlert);
    }
    
    // Subscribe to events
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return this;
    }
    
    // Trigger events
    trigger(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    // Disconnect
    disconnect() {
        this.connected = false;
        if (this.priceInterval) clearInterval(this.priceInterval);
        if (this.newsInterval) clearInterval(this.newsInterval);
        this.trigger('disconnect', { status: 'disconnected', timestamp: Date.now() });
        console.log('🔌 ZAKA WebSocket disconnected');
    }
}

// Create global instance
window.zakaWS = new ZakaWS();

// Auto-connect when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.zakaWS.connect();
    
    // Update connection status
    window.zakaWS.on('connect', () => {
        document.getElementById('connectionText').textContent = 'Live';
    });
    
    window.zakaWS.on('disconnect', () => {
        document.getElementById('connectionText').textContent = 'Offline';
    });
    
    // Handle price updates
    window.zakaWS.on('price', (updates) => {
        // Update footer prices
        if (updates.BTC) {
            document.getElementById('btcPrice').textContent = 
                `BTC: $${updates.BTC.price.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        }
        if (updates.ETH) {
            document.getElementById('ethPrice').textContent = 
                `ETH: $${updates.ETH.price.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        }
    });
    
    // Handle alerts
    window.zakaWS.on('alert', (alert) => {
        // Add to alerts array in app.js if available
        if (window.addAlert) {
            window.addAlert(alert);
        }
    });
});
