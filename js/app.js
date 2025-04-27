// app.js - Shared Alpine.js Components for E-commerce
document.addEventListener('alpine:init', () => {
    /**
     * UI Utilities Store
     * Handles common UI interactions across all pages
     */
    Alpine.store('ui', {
        // WhatsApp business phone number
        whatsAppNumber: '96170608543',

        // Menu state
        isMenuOpen: false,

        // Cart notification state
        cartNotificationVisible: false,

        // Toggle mobile menu
        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
        },

        // Close mobile menu
        closeMenu() {
            this.isMenuOpen = false;
        },

        // Show cart notification
        showCartNotification() {
            this.cartNotificationVisible = true;
            setTimeout(() => {
                this.cartNotificationVisible = false;
            }, 3000);
        },

        // Scroll to top
        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        // Enhanced WhatsApp opening function with customizable message
        openWhatsApp(message = 'Hello, I have a question about your products.') {
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${this.whatsAppNumber}?text=${encodedMessage}`, '_blank');
        }
    });

    /**
     * Shopping Cart Store
     * Handles cart functionality across all pages
     */
    Alpine.store('cart', {
        items: [],

        init() {
            // Load cart from localStorage if available
            const savedCart = localStorage.getItem('cartItems');
            if (savedCart) {
                try {
                    this.items = JSON.parse(savedCart);
                } catch (e) {
                    console.error('Failed to parse saved cart:', e);
                    this.items = [];
                }
            }
        },

        saveCart() {
            localStorage.setItem('cartItems', JSON.stringify(this.items));
        },

        addItem(product, quantity = 1, options = {}) {
            // Check if product with the same options already exists
            const existingItemIndex = this.items.findIndex(item =>
                item.id === product.id &&
                JSON.stringify(item.options) === JSON.stringify(options)
            );

            if (existingItemIndex >= 0) {
                // Update quantity of existing item
                this.items[existingItemIndex].quantity += quantity;
            } else {
                // Add new item
                this.items.push({
                    id: product.id,
                    name: product.name,
                    price: product.salePrice || product.base_price || product.price,
                    image: Array.isArray(product.images) ? product.images[0] : product.images,
                    quantity: quantity,
                    options: options
                });
            }

            this.saveCart();
            Alpine.store('ui').showCartNotification();
        },

        updateItemQuantity(index, quantity) {
            if (index >= 0 && index < this.items.length) {
                if (quantity <= 0) {
                    this.removeItem(index);
                } else {
                    this.items[index].quantity = quantity;
                    this.saveCart();
                }
            }
        },

        removeItem(index) {
            if (index >= 0 && index < this.items.length) {
                this.items.splice(index, 1);
                this.saveCart();
            }
        },

        clearCart() {
            this.items = [];
            this.saveCart();
        },

        getTotalItems() {
            return this.items.reduce((total, item) => total + item.quantity, 0);
        },

        getTotalPrice() {
            return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },

        getFormattedTotal() {
            return '$' + this.getTotalPrice().toFixed(2);
        }
    });

    /**
     * Utility functions for formatting
     */
    Alpine.data('utilities', () => {
        return {
            formatPrice(price) {
                return '$' + parseFloat(price).toFixed(2);
            },

            formatOptionName(name) {
                return name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            },

            formatFeatureKey(key) {
                return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            },

            // Get variant stock for products page
            getVariantStock(product) {
                if (!product) return 0;

                // If product has variants, sum up all variants stock
                if (product.option_variants_stock) {
                    return Object.values(product.option_variants_stock).reduce((sum, stock) => sum + stock, 0);
                }

                // Otherwise return product stock
                return product.stock || 0;
            },

            // Check if option value is available (for products page)
            isOptionValueAvailable(product, optionType, optionValue) {
                if (!product || !product.hasVariants) return true;

                // If product has option_variants_stock, check availability
                if (product.option_variants_stock) {
                    // For simplicity, if a variant exists with stock, it's available
                    for (const [key, stock] of Object.entries(product.option_variants_stock)) {
                        if (key.includes(optionValue) && stock > 0) {
                            return true;
                        }
                    }
                    return false;
                }

                return true;
            }
        };
    });

    Alpine.store('urlUtils', {
        // Find a product by slug
        findProductBySlug(slug) {
            return PRODUCTS.find(product => product.slug === slug);
        },

        // Find a category by slug
        findCategoryBySlug(slug) {
            return CATEGORIES.find(category => category.slug === slug);
        },

        // Get URL parameter
        getUrlParam(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name);
        },

        // Update URL with slug without page reload
        updateUrlParameter(key, value) {
            const url = new URL(window.location);
            if (value) {
                url.searchParams.set(key, value);
            } else {
                url.searchParams.delete(key);
            }
            window.history.pushState({}, '', url);
        }
    });
});