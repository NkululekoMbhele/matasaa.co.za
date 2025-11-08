// Main JavaScript - Matasaa Frontend

document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    init();
});

function init() {
    // Mobile menu toggle
    setupMobileMenu();

    // Smooth scrolling
    setupSmoothScrolling();

    // Booking form
    setupBookingForm();

    // Set minimum date for picker
    setMinimumDate();

    // Header scroll effect
    setupHeaderScroll();
}

// Mobile Menu
function setupMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Smooth Scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Booking Form Setup
function setupBookingForm() {
    const form = document.getElementById('bookingForm');
    const priceDisplay = document.getElementById('priceDisplay');
    const estimatedPriceEl = document.getElementById('estimatedPrice');

    // Calculate price on input change
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', debounce(calculatePrice, 500));
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleBookingSubmit();
    });
}

// Calculate Price
async function calculatePrice() {
    const pickupAddress = document.getElementById('pickupAddress').value;
    const dropoffAddress = document.getElementById('dropoffAddress').value;
    const pickupDate = document.getElementById('pickupDate').value;
    const pickupTime = document.getElementById('pickupTime').value;
    const vehicleType = document.getElementById('vehicleType').value;
    const passengers = document.getElementById('passengers').value;

    // Validate required fields
    if (!pickupAddress || !dropoffAddress || !pickupDate || !pickupTime || !vehicleType) {
        return;
    }

    try {
        const bookingData = {
            pickupAddress,
            dropoffAddress,
            pickupDate,
            pickupTime,
            vehicleType,
            passengers: parseInt(passengers)
        };

        const result = await MatasaaAPI.calculatePrice(bookingData);

        if (result && result.estimated_price) {
            const priceDisplay = document.getElementById('priceDisplay');
            const estimatedPriceEl = document.getElementById('estimatedPrice');

            estimatedPriceEl.textContent = `R${result.estimated_price.toFixed(2)}`;
            priceDisplay.style.display = 'block';

            // Store price for booking submission
            document.getElementById('bookingForm').dataset.estimatedPrice = result.estimated_price;
        }
    } catch (error) {
        console.error('Error calculating price:', error);
        showNotification('Unable to calculate price. Please try again.', 'error');
    }
}

// Handle Booking Submission
async function handleBookingSubmit() {
    const form = document.getElementById('bookingForm');
    const submitBtn = document.getElementById('bookingSubmitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Get form data
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        passengers: parseInt(document.getElementById('passengers').value),
        pickupAddress: document.getElementById('pickupAddress').value.trim(),
        dropoffAddress: document.getElementById('dropoffAddress').value.trim(),
        pickupDate: document.getElementById('pickupDate').value,
        pickupTime: document.getElementById('pickupTime').value,
        vehicleType: document.getElementById('vehicleType').value,
        estimatedPrice: parseFloat(form.dataset.estimatedPrice || '0')
    };

    // Validate
    if (!validateBookingData(formData)) {
        return;
    }

    // Show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    loadingOverlay.style.display = 'flex';

    try {
        const result = await MatasaaAPI.createBooking(formData);

        if (result && result.success) {
            // Success
            showNotification(
                `Booking confirmed! Reference: ${result.booking_id || 'N/A'}. We'll contact you shortly.`,
                'success'
            );
            form.reset();
            document.getElementById('priceDisplay').style.display = 'none';

            // Optional: Redirect to confirmation page
            // window.location.href = `/confirmation?id=${result.booking_id}`;
        } else {
            throw new Error(result.message || 'Booking failed');
        }
    } catch (error) {
        console.error('Booking error:', error);
        showNotification(
            error.message || 'Failed to create booking. Please try again or contact us directly.',
            'error'
        );
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Calculate Price & Book Now';
        loadingOverlay.style.display = 'none';
    }
}

// Validate Booking Data
function validateBookingData(data) {
    if (!data.fullName) {
        showNotification('Please enter your name', 'error');
        return false;
    }

    if (!data.email || !isValidEmail(data.email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }

    if (!data.phone) {
        showNotification('Please enter your phone number', 'error');
        return false;
    }

    if (!data.pickupAddress || !data.dropoffAddress) {
        showNotification('Please enter both pickup and dropoff addresses', 'error');
        return false;
    }

    if (!data.pickupDate || !data.pickupTime) {
        showNotification('Please select pickup date and time', 'error');
        return false;
    }

    if (!data.vehicleType) {
        showNotification('Please select a vehicle type', 'error');
        return false;
    }

    return true;
}

// Email Validation
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to body
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Set Minimum Date
function setMinimumDate() {
    const dateInput = document.getElementById('pickupDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
}

// Header Scroll Effect
function setupHeaderScroll() {
    const header = document.querySelector('.site-header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

// Utility: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
