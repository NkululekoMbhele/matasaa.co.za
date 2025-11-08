// API Service Layer - Integrates with Tredicik Backend

const MatasaaAPI = {
    /**
     * Calculate price based on pickup/dropoff and other parameters
     */
    async calculatePrice(bookingData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CALCULATE_PRICE}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pickup_address: bookingData.pickupAddress,
                    dropoff_address: bookingData.dropoffAddress,
                    vehicle_type: bookingData.vehicleType,
                    passengers: bookingData.passengers,
                    pickup_datetime: `${bookingData.pickupDate} ${bookingData.pickupTime}`
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error calculating price:', error);
            // Fallback to client-side calculation
            return this.calculatePriceClientSide(bookingData);
        }
    },

    /**
     * Create a new booking
     */
    async createBooking(bookingData) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer_name: bookingData.fullName,
                    customer_email: bookingData.email,
                    customer_phone: bookingData.phone,
                    pickup_address: bookingData.pickupAddress,
                    dropoff_address: bookingData.dropoffAddress,
                    pickup_datetime: `${bookingData.pickupDate} ${bookingData.pickupTime}`,
                    vehicle_type: bookingData.vehicleType,
                    passengers: bookingData.passengers,
                    estimated_price: bookingData.estimatedPrice,
                    notes: bookingData.notes || ''
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    },

    /**
     * Client-side price calculation (fallback)
     */
    calculatePriceClientSide(bookingData) {
        // Simple estimation - in production, use Google Maps Distance Matrix API
        const estimatedDistance = 10; // km (placeholder)

        let basePrice = estimatedDistance * API_CONFIG.PRICING.BASE_RATE_PER_KM;

        // Apply minimum fare
        if (basePrice < API_CONFIG.PRICING.MINIMUM_FARE) {
            basePrice = API_CONFIG.PRICING.MINIMUM_FARE;
        }

        // Apply vehicle type multiplier
        const vehicleMultiplier = API_CONFIG.PRICING.VEHICLE_MULTIPLIERS[bookingData.vehicleType] || 1.0;
        basePrice *= vehicleMultiplier;

        // Check if last-minute booking (within 2 hours)
        const pickupDateTime = new Date(`${bookingData.pickupDate}T${bookingData.pickupTime}`);
        const now = new Date();
        const hoursUntilPickup = (pickupDateTime - now) / (1000 * 60 * 60);

        if (hoursUntilPickup < 2 && hoursUntilPickup > 0) {
            basePrice *= API_CONFIG.PRICING.LAST_MINUTE_MULTIPLIER;
        }

        return {
            success: true,
            estimated_price: Math.round(basePrice * 100) / 100,
            distance_km: estimatedDistance,
            duration_minutes: estimatedDistance * 3, // Rough estimate
            breakdown: {
                base_rate: API_CONFIG.PRICING.BASE_RATE_PER_KM,
                distance: estimatedDistance,
                vehicle_multiplier: vehicleMultiplier,
                last_minute: hoursUntilPickup < 2
            }
        };
    },

    /**
     * Calculate distance using Google Maps (if API key is available)
     */
    async calculateDistance(origin, destination) {
        if (!API_CONFIG.GOOGLE_MAPS_API_KEY || API_CONFIG.GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
            return null;
        }

        try {
            const service = new google.maps.DistanceMatrixService();
            const response = await service.getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                travelMode: 'DRIVING',
                unitSystem: google.maps.UnitSystem.METRIC
            });

            if (response.rows[0].elements[0].status === 'OK') {
                return {
                    distance_km: response.rows[0].elements[0].distance.value / 1000,
                    duration_minutes: response.rows[0].elements[0].duration.value / 60
                };
            }
            return null;
        } catch (error) {
            console.error('Error calculating distance:', error);
            return null;
        }
    }
};
