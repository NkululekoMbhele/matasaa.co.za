// API Configuration
const API_CONFIG = {
    // Update these URLs to match your Tredicik backend
    BASE_URL: 'https://api.tredicik.com', // Production API
    // BASE_URL: 'http://localhost:8080', // Development API

    ENDPOINTS: {
        BOOKINGS: '/api/v1/bookings',
        CALCULATE_PRICE: '/api/v1/bookings/calculate-price',
        DRIVERS: '/api/v1/drivers',
        AUTH: '/api/v1/auth'
    },

    // Pricing configuration (matches matasaa.co.za rates)
    PRICING: {
        BASE_RATE_PER_KM: 6.48,
        MINIMUM_FARE: 32.00,
        MINIMUM_DISTANCE_KM: 5,

        // Multipliers
        LAST_MINUTE_MULTIPLIER: 1.15,  // Within 2 hours
        HIGH_DEMAND_MULTIPLIER: 1.3,

        // Priority levels
        PRIORITY_MULTIPLIERS: {
            0: 1.0,    // Standard
            1: 1.15,
            2: 1.3,
            3: 1.45,
            4: 1.6,
            5: 1.75,
            6: 2.0     // Maximum
        },

        // Vehicle types
        VEHICLE_MULTIPLIERS: {
            'standard': 1.0,  // 1-3 passengers
            'xl': 1.3         // 4-6 passengers
        }
    },

    // Google Maps API (if needed for distance calculation)
    GOOGLE_MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',

    // Contact information
    CONTACT: {
        PHONE_PRIMARY: '+27699362645',
        PHONE_SECONDARY: '+27737038007',
        EMAIL: 'info@matasaa.co.za',
        WHATSAPP: '+27699362645'
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
