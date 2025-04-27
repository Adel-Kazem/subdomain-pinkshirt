document.addEventListener('alpine:init', () => {
    /**
     * Product Catalog Component
     * Handles product filtering, sorting, and view options
     */
    Alpine.data('productCatalog', () => {
        return {
            // State
            searchQuery: '',
            selectedCategory: null,
            view: 'grid',
            sortBy: 'featured',
            priceRanges: [],
            showNew: false,
            showSale: false,
            inStock: false,
            mobileFiltersOpen: false,

            // These will be populated in init()
            productData: [],
            categoryData: [],

            // Initialize from URL parameters and data
            init() {
                // Wait for next tick to ensure PRODUCTS and CATEGORIES are loaded
                this.$nextTick(() => {
                    // Check if PRODUCTS and CATEGORIES are defined
                    if (typeof PRODUCTS !== 'undefined') {
                        this.productData = PRODUCTS;
                    }
                    if (typeof CATEGORIES !== 'undefined') {
                        this.categoryData = CATEGORIES;
                    }

                    // Get URL parameters
                    const urlParams = new URLSearchParams(window.location.search);
                    const categoryParam = urlParams.get('category');
                    const filterParam = urlParams.get('filter');

                    if (categoryParam) {
                        this.selectedCategory = parseInt(categoryParam);
                    }

                    // Apply special filters based on URL parameter
                    if (filterParam) {
                        switch (filterParam) {
                            case 'new':
                                this.showNew = true;
                                break;
                            case 'sale':
                                this.showSale = true;
                                break;
                            case 'featured':
                                this.sortBy = 'featured';
                                break;
                        }
                    }

                    // Set view from localStorage if available
                    const savedView = localStorage.getItem('preferredView');
                    if (savedView) {
                        this.view = savedView;
                    }
                });
            },

            // Helper to get URL parameters
            getUrlParameter(name) {
                const urlParams = new URLSearchParams(window.location.search);
                return urlParams.get(name);
            },

            // Get category name by ID
            getCategoryName(categoryId) {
                const category = this.categoryData.find(cat => cat.id === categoryId);
                return category ? category.name : 'All Products';
            },

            // Save view preference
            saveViewPreference() {
                localStorage.setItem('preferredView', this.view);
            },

            // Set view with save
            setView(viewType) {
                this.view = viewType;
                this.saveViewPreference();
            },

            // Helper: Recursively get all descendant category IDs for a selected category
            getAllDescendantCategoryIds(parentId) {
                let ids = [];
                this.categoryData.forEach(cat => {
                    if (cat.parent_id === parentId) {
                        ids.push(cat.id);
                        ids = ids.concat(this.getAllDescendantCategoryIds(cat.id));
                    }
                });
                return ids;
            },

            // Filter and sort products
            getFilteredProducts() {
                let categoryIdsToCheck = [];
                if (this.selectedCategory !== null) {
                    categoryIdsToCheck = [
                        this.selectedCategory,
                        ...this.getAllDescendantCategoryIds(this.selectedCategory)
                    ];
                }

                // First filter by category and search query
                let filtered = this.productData.filter(product => {
                    // Category filter
                    const categoryMatch = this.selectedCategory === null ||
                        (Array.isArray(product.categories) &&
                            product.categories.some(catId => categoryIdsToCheck.includes(catId)));

                    // Search filter
                    const searchMatch = this.searchQuery === '' ||
                        (product.name && product.name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                        (product.description && product.description.toLowerCase().includes(this.searchQuery.toLowerCase()));

                    // Price range filter
                    let priceMatch = true;
                    if (this.priceRanges.length > 0) {
                        const price = product.salePrice || product.base_price || product.price;
                        priceMatch = this.priceRanges.some(range => {
                            if (range === '200+') {
                                return price >= 200;
                            }
                            const [min, max] = range.split('-').map(Number);
                            return price >= min && price <= max;
                        });
                    }

                    // Status filters
                    const newMatch = !this.showNew || product.isNew;
                    const saleMatch = !this.showSale || product.isOnSale;
                    const stockMatch = !this.inStock || (product.hasVariants ? product.totalVariantStock > 0 : product.stock > 0);

                    return categoryMatch && searchMatch && priceMatch && newMatch && saleMatch && stockMatch;
                });

                // Then sort
                switch (this.sortBy) {
                    case 'price-asc':
                        filtered.sort((a, b) =>
                            (a.salePrice || a.base_price || a.price) - (b.salePrice || b.base_price || b.price));
                        break;
                    case 'price-desc':
                        filtered.sort((a, b) =>
                            (b.salePrice || b.base_price || b.price) - (a.salePrice || a.base_price || a.price));
                        break;
                    case 'name':
                        filtered.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                    case 'newest':
                        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        break;
                    case 'featured':
                    default:
                        filtered.sort((a, b) => {
                            if (a.isFeatured && !b.isFeatured) return -1;
                            if (!a.isFeatured && b.isFeatured) return 1;
                            if (a.isNew && !b.isNew) return -1;
                            if (!a.isNew && b.isNew) return 1;
                            return 0;
                        });
                }

                return filtered;
            },

            // Clear all filters
            clearFilters() {
                this.searchQuery = '';
                this.selectedCategory = null;
                this.priceRanges = [];
                this.showNew = false;
                this.showSale = false;
                this.inStock = false;
            }
        };
    });
});
