// product-page.js - Alpine.js Components for Product Detail Page
document.addEventListener('alpine:init', () => {

    Alpine.store('productData', {
        currentProduct: null,

        init() {
            // Get the slug from URL
            const slug = new URLSearchParams(window.location.search).get('slug');
            const id = new URLSearchParams(window.location.search).get('id');

            // Try to load by slug first (preferred)
            if (slug && typeof PRODUCTS !== 'undefined') {
                this.currentProduct = PRODUCTS.find(p => p.slug === slug);
            }

            // Fallback to ID if needed (for backward compatibility)
            if (!this.currentProduct && id && typeof PRODUCTS !== 'undefined') {
                const productId = parseInt(id);
                this.currentProduct = PRODUCTS.find(p => p.id === productId);

                // If found by ID, redirect to slug URL for SEO
                if (this.currentProduct) {
                    window.history.replaceState(
                        {},
                        document.title,
                        `product.html?slug=${this.currentProduct.slug}`
                    );
                }
            }

            // Set default product if nothing found
            if (!this.currentProduct && typeof PRODUCTS !== 'undefined' && PRODUCTS.length > 0) {
                this.currentProduct = PRODUCTS[0];
            }

            // Update title and breadcrumb
            if (this.currentProduct) {
                document.title = `${this.currentProduct.name} - pinkJeans`;
            }
        }
    });

    /**
     * Product Detail Component
     * Handles product variants, options selection, pricing, and stock
     */
    Alpine.data('productDetail', (config = {}) => {
        return {
            product: config.product || {},
            selectedOptions: {},
            quantity: 1,

            init() {
                // Initialize default option selections
                if (this.product.options) {
                    Object.keys(this.product.options).forEach(optionName => {
                        if (this.product.options[optionName].length > 0) {
                            this.selectedOptions[optionName] = this.product.options[optionName][0];
                        }
                    });
                }
            },

            // Utility functions
            formatPrice(price) {
                return '$' + parseFloat(price).toFixed(2);
            },

            formatOptionName(name) {
                return name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            },

            formatFeatureKey(key) {
                return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
            },

            // Get current variant key based on selected options
            getVariantKey() {
                if (!this.product.hasVariants) return null;

                // Get option values in the order of options
                const optionKeys = Object.keys(this.product.options);
                const optionValues = optionKeys.map(key => this.selectedOptions[key]);

                // Join them with | separator
                return optionValues.join('|');
            },

            // Check if current variant is in stock
            isVariantInStock() {
                if (!this.product.hasVariants) {
                    return this.product.stock > 0;
                }

                const variantKey = this.getVariantKey();
                if (variantKey && this.product.option_variants_stock) {
                    return (this.product.option_variants_stock[variantKey] || 0) > 0;
                }

                return this.product.stock > 0;
            },

            // Get stock level for current variant
            getVariantStock() {
                if (!this.product.hasVariants) {
                    return this.product.stock;
                }

                const variantKey = this.getVariantKey();
                if (variantKey && this.product.option_variants_stock) {
                    return this.product.option_variants_stock[variantKey] || 0;
                }

                return 0;
            },

            // Get price for current variant
            getVariantPrice() {
                let price = this.product.base_price || this.product.price || 0;

                // Apply price adjustments based on selected options
                if (this.product.option_price_adjustments) {
                    Object.entries(this.selectedOptions).forEach(([optionName, optionValue]) => {
                        if (
                            this.product.option_price_adjustments[optionName] &&
                            this.product.option_price_adjustments[optionName][optionValue]
                        ) {
                            price += this.product.option_price_adjustments[optionName][optionValue];
                        }
                    });
                }

                return price;
            },

            // Get shipping cost for current variant
            getVariantShippingCost() {
                // Check if shipping is free
                if (this.product.free_shipping) {
                    return 0;
                }

                let shippingCost = this.product.base_shipping_cost || 0;

                // Apply shipping adjustments based on selected options
                if (this.product.option_shipping_adjustments) {
                    Object.entries(this.selectedOptions).forEach(([optionName, optionValue]) => {
                        if (
                            this.product.option_shipping_adjustments[optionName] &&
                            this.product.option_shipping_adjustments[optionName][optionValue] !== undefined
                        ) {
                            shippingCost += this.product.option_shipping_adjustments[optionName][optionValue];
                        }
                    });
                }

                // If an option adjustment makes shipping negative or 0, it's free
                return Math.max(0, shippingCost);
            },

            // Get product weight (with overrides)
            getProductWeight() {
                let weight = {...this.product.weight};

                if (this.product.option_dimension_overrides) {
                    Object.entries(this.selectedOptions).forEach(([optionName, optionValue]) => {
                        if (
                            this.product.option_dimension_overrides[optionName] &&
                            this.product.option_dimension_overrides[optionName][optionValue] &&
                            this.product.option_dimension_overrides[optionName][optionValue].weight
                        ) {
                            weight = this.product.option_dimension_overrides[optionName][optionValue].weight;
                        }
                    });
                }

                return weight;
            },

            // Get product dimensions (with overrides)
            getProductDimensions() {
                let dimensions = {...this.product.dimensions};

                if (this.product.option_dimension_overrides) {
                    Object.entries(this.selectedOptions).forEach(([optionName, optionValue]) => {
                        if (
                            this.product.option_dimension_overrides[optionName] &&
                            this.product.option_dimension_overrides[optionName][optionValue] &&
                            this.product.option_dimension_overrides[optionName][optionValue].dimensions
                        ) {
                            dimensions = this.product.option_dimension_overrides[optionName][optionValue].dimensions;
                        }
                    });
                }

                return dimensions;
            },

            // Update variant information
            updateVariantInfo() {
                // This triggers reactivity and updates the UI
                this.selectedOptions = {...this.selectedOptions};

                // Update the product viewer
                const productViewer = document.querySelector('[x-data*="productViewer"]');
                if (productViewer && this.product.hasVariants) {
                    const viewerData = Alpine.$data(productViewer);
                    if (viewerData) {
                        viewerData.selectedOptions = {...this.selectedOptions};
                        viewerData.selectedImage = ''; // Force image update
                    }
                }
            },

            // Check if an option value leads to available stock
            isOptionValueAvailable(optionType, optionValue) {
                if (!this.product || !this.product.hasVariants) return true;

                // Create a temporary selection with the current options
                const tempSelection = {...this.selectedOptions};
                tempSelection[optionType] = optionValue;

                // Create variant key
                const optionKeys = Object.keys(this.product.options);
                const optionValues = optionKeys.map(key => tempSelection[key]);
                const variantKey = optionValues.join('|');

                // Check if this combination has stock
                return (this.product.option_variants_stock[variantKey] || 0) > 0;
            },

            // Add to cart
            addToCart() {
                Alpine.store('cart').addItem(
                    this.product,
                    this.quantity,
                    this.selectedOptions
                );
            },

            // Increase quantity
            increaseQuantity() {
                const maxStock = this.getVariantStock();
                if (this.quantity < maxStock) {
                    this.quantity++;
                }
            },

            // Decrease quantity
            decreaseQuantity() {
                if (this.quantity > 1) {
                    this.quantity--;
                }
            }
        };
    });

    /**
     * Product Viewer Component
     * Handles product image viewing with zoom functionality
     */
    Alpine.data('productViewer', function(product) {
        return {
            product: product,
            selectedImage: '',
            selectedOptions: {},
            isScrollLeftEnd: true,
            isScrollRightEnd: false,

            // Image zoom properties
            zoomed: false,
            isTouchDevice: false,
            scale: 2,
            origin: '50% 50%',
            panX: 0,
            panY: 0,
            minPanX: 0,
            maxPanX: 0,
            minPanY: 0,
            maxPanY: 0,
            dragStartX: 0,
            dragStartY: 0,
            dragging: false,
            lastTap: 0,
            imgStyle: '',

            init() {
                if (this.product) {
                    // Initialize selected image
                    this.selectedImage = this.product.images && this.product.images.length > 0
                        ? this.product.images[0]
                        : '';

                    // Initialize selected options
                    this.selectedOptions = {};
                    if (this.product.options) {
                        for (const option in this.product.options) {
                            if (this.product.options[option] && this.product.options[option].length > 0) {
                                this.selectedOptions[option] = this.product.options[option][0];
                            }
                        }
                    }

                    // Initialize scroll position check
                    setTimeout(() => {
                        this.checkScrollPosition();
                    }, 100);

                    // Initialize zoom features
                    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                    this.imgStyle = 'transform: scale(1); transform-origin: 50% 50%;';
                }
            },

            getVariantKey() {
                if (!this.product.hasVariants) return null;

                const optionKeys = Object.keys(this.product.options);
                const optionValues = optionKeys.map(key => this.selectedOptions[key]);

                return optionValues.join('|');
            },

            hasThumbnails() {
                let count = 0;
                // Count main images
                count += this.product.images ? this.product.images.length : 0;

                // Count option images
                if (this.product.option_images) {
                    for (const optionType in this.product.option_images) {
                        for (const optionValue in this.product.option_images[optionType]) {
                            count += this.product.option_images[optionType][optionValue].length;
                        }
                    }
                }

                // Count variant images
                if (this.product.variant_images) {
                    for (const key in this.product.variant_images) {
                        if (Array.isArray(this.product.variant_images[key])) {
                            count += this.product.variant_images[key].length;
                        } else {
                            count += 1;
                        }
                    }
                }

                return count > 1;
            },

            getSelectedImage() {
                if (!this.product) return '';

                try {
                    // If an image has been manually selected, use that
                    if (this.selectedImage) {
                        return this.selectedImage;
                    }

                    // Check for variant-specific images
                    const variantKey = this.getVariantKey();
                    if (variantKey && this.product.variant_images && this.product.variant_images[variantKey]) {
                        const variantImage = this.product.variant_images[variantKey];
                        return Array.isArray(variantImage) ? variantImage[0] : variantImage;
                    }

                    // Check for option-specific images
                    if (this.product.option_images) {
                        for (const [option, value] of Object.entries(this.selectedOptions)) {
                            if (
                                this.product.option_images[option] &&
                                this.product.option_images[option][value] &&
                                this.product.option_images[option][value].length > 0
                            ) {
                                return this.product.option_images[option][value][0];
                            }
                        }
                    }

                    // Default to first product image
                    return this.product.images && this.product.images.length > 0
                        ? this.product.images[0]
                        : '';
                } catch (error) {
                    console.error("Error in getSelectedImage:", error);
                    return this.product.images && this.product.images.length > 0
                        ? this.product.images[0]
                        : '';
                }
            },

            selectImage(image) {
                this.selectedImage = image;
                this.resetZoom();
            },

            selectOption(option, value) {
                this.selectedOptions[option] = value;
                this.selectedImage = '';
                this.resetZoom();

                this.$nextTick(() => {
                    this.scrollToOptionThumbnails();
                });
            },

            // Thumbnail scrolling
            scrollThumbnails(direction) {
                const container = this.$refs.thumbnailsContainer;
                if (!container) return;

                const scrollAmount = container.clientWidth * 0.75;
                if (direction === 'left') {
                    container.scrollLeft -= scrollAmount;
                } else {
                    container.scrollLeft += scrollAmount;
                }

                setTimeout(() => {
                    this.checkScrollPosition();
                }, 100);
            },

            checkScrollPosition() {
                const container = this.$refs.thumbnailsContainer;
                if (!container) return;

                this.isScrollLeftEnd = container.scrollLeft <= 0;
                this.isScrollRightEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
            },

            scrollToOptionThumbnails() {
                const container = this.$refs.thumbnailsContainer;
                if (!container) return;

                // For now, just check scroll position
                this.checkScrollPosition();
            },

            // Image Zoom Functionality
            mouseMove(e) {
                if (!this.zoomed || this.isTouchDevice) return;

                const img = this.$refs.mainImage;
                if (!img) return;

                const rect = img.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                this.origin = `${x}% ${y}%`;
                this.updateZoomStyle();
            },

            mouseEnter(e) {
                if (this.isTouchDevice) return;
                this.zoomed = true;
                this.mouseMove(e);
            },

            mouseLeave() {
                if (this.isTouchDevice) return;
                this.zoomed = false;
                this.resetZoom();
            },

            // Mobile zoom and drag handlers
            touchStart(e) {
                if (e.touches.length > 1) return;

                const now = Date.now();
                // Double tap detection
                if (now - this.lastTap < 300) {
                    // Toggle zoom state
                    this.zoomed = !this.zoomed;
                    if (this.zoomed) {
                        // Set zoom origin to touch point
                        const img = this.$refs.mainImage;
                        if (!img) return;

                        const rect = img.getBoundingClientRect();
                        const touch = e.touches[0];
                        const x = ((touch.clientX - rect.left) / rect.width) * 100;
                        const y = ((touch.clientY - rect.top) / rect.height) * 100;

                        this.origin = `${x}% ${y}%`;
                        this.panX = 0;
                        this.panY = 0;
                        this.calculatePanLimits();
                        this.updateZoomStyle();
                    } else {
                        this.resetZoom();
                    }
                    e.preventDefault();
                } else if (this.zoomed) {
                    // Start dragging
                    this.dragging = true;
                    this.dragStartX = e.touches[0].clientX - this.panX;
                    this.dragStartY = e.touches[0].clientY - this.panY;
                }

                this.lastTap = now;
            },

            touchMove(e) {
                if (!this.zoomed || !this.dragging || e.touches.length > 1) return;

                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;

                this.panX = touchX - this.dragStartX;
                this.panY = touchY - this.dragStartY;

                // Limit panning to within image bounds
                this.panX = Math.max(this.minPanX, Math.min(this.maxPanX, this.panX));
                this.panY = Math.max(this.minPanY, Math.min(this.maxPanY, this.panY));

                this.updateZoomStyle();
                e.preventDefault();
            },

            touchEnd() {
                this.dragging = false;
            },

            // Helper functions for zoom behavior
            updateZoomStyle() {
                if (!this.zoomed) {
                    this.imgStyle = 'transform: scale(1); transform-origin: 50% 50%; transition: transform 0.3s ease;';
                    return;
                }

                if (this.isTouchDevice) {
                    const transform = `scale(${this.scale}) translate(${this.panX}px, ${this.panY}px)`;
                    this.imgStyle = `transform: ${transform}; transform-origin: ${this.origin}; transition: none;`;
                } else {
                    this.imgStyle = `transform: scale(${this.scale}); transform-origin: ${this.origin}; transition: transform-origin 0.1s ease;`;
                }
            },

            resetZoom() {
                this.zoomed = false;
                this.panX = 0;
                this.panY = 0;
                this.origin = '50% 50%';
                this.updateZoomStyle();
            },

            calculatePanLimits() {
                const img = this.$refs.mainImage;
                if (!img) return;

                const rect = img.getBoundingClientRect();
                // Calculate how much the image can be panned
                this.maxPanX = (rect.width * (this.scale - 1)) / 2;
                this.minPanX = -this.maxPanX;
                this.maxPanY = (rect.height * (this.scale - 1)) / 2;
                this.minPanY = -this.maxPanY;
            },

            handleImageError(event) {
                event.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Available";
            }
        };
    });

    /**
     * WhatsApp Product Inquiry Component
     * Handles product inquiries via WhatsApp
     */
    Alpine.data('whatsappInquiry', (config = {}) => {
        return {
            // Configuration with defaults
            phoneNumber: config.phoneNumber || Alpine.store('ui').whatsAppNumber,
            buttonText: config.buttonText || 'Ask about this product',

            // Send inquiry about current product
            inquireAboutProduct() {
                // Get product information from parent component
                const productDetail = this.$el.closest('[x-data*="productDetail"]');
                if (!productDetail) return this.sendSimpleInquiry();

                const productData = Alpine.$data(productDetail);
                if (!productData) return this.sendSimpleInquiry();

                const product = productData.product;
                const quantity = productData.quantity;
                const selectedOptions = productData.selectedOptions;

                // Create the message
                let message = `Hello, I'm interested in: ${product.name}`;

                // Add quantity if more than 1
                if (quantity > 1) {
                    message += ` (Quantity: ${quantity})`;
                }

                // Add price information
                const variantPrice = productData.getVariantPrice();
                message += `\nPrice: $${variantPrice.toFixed(2)}`;

                // Add selected options if any
                if (selectedOptions && Object.keys(selectedOptions).length > 0) {
                    message += '\nSelected options:';
                    Object.entries(selectedOptions).forEach(([option, value]) => {
                        message += `\n- ${option}: ${value}`;
                    });
                }

                // Add shipping information
                const shippingCost = productData.getVariantShippingCost();
                message += `\nShipping: ${shippingCost === 0 ? 'Free' : '$' + shippingCost.toFixed(2)}`;

                // Add stock status
                const stock = productData.getVariantStock();
                message += `\nStock status: ${stock > 0 ? `${stock} available` : 'Out of stock'}`;

                // Add product URL if available
                const currentUrl = window.location.href;
                message += `\n\nProduct link: ${currentUrl}`;

                // Add closing message
                message += '\n\nCould you provide me with more information about this product?';

                // Send the message
                this.sendWhatsAppMessage(message);
            },

            // Simple inquiry without product details
            sendSimpleInquiry(customMessage = 'Hello, I have a question about your products.') {
                this.sendWhatsAppMessage(customMessage);
            },

            // Helper method to send WhatsApp message
            sendWhatsAppMessage(message) {
                const encodedMessage = encodeURIComponent(message);
                window.open(`https://wa.me/${this.phoneNumber}?text=${encodedMessage}`, '_blank');
            }
        };
    });
});

