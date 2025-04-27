document.addEventListener('alpine:init', () => {
    Alpine.data('productCatalog', () => {
        return {
            searchQuery: '',
            selectedCategory: null,
            selectedCategorySlug: null,
            view: 'grid',
            sortBy: 'featured',
            priceRanges: [],
            showNew: false,
            showSale: false,
            inStock: false,
            mobileFiltersOpen: false,

            productData: [],
            categoryData: [],

            init() {
                this.$nextTick(() => {
                    if (typeof PRODUCTS !== 'undefined') {
                        this.productData = PRODUCTS;
                    }
                    if (typeof CATEGORIES !== 'undefined') {
                        this.categoryData = CATEGORIES;
                    }

                    const urlParams = new URLSearchParams(window.location.search);
                    const categorySlug = urlParams.get('category');

                    if (categorySlug) {
                        const category = this.categoryData.find(cat => cat.slug === categorySlug);
                        if (category) {
                            this.selectedCategory = category.id;
                            this.selectedCategorySlug = categorySlug;
                        }
                    } else {
                        const categoryId = urlParams.get('categoryId');
                        if (categoryId) {
                            this.selectedCategory = parseInt(categoryId);
                            const category = this.categoryData.find(cat => cat.id === parseInt(categoryId));
                            if (category) {
                                this.selectedCategorySlug = category.slug;
                                window.history.replaceState(
                                    {},
                                    document.title,
                                    `products.html?category=${category.slug}`
                                );
                            }
                        }
                    }

                    const filterParam = urlParams.get('filter');
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

                    const savedView = localStorage.getItem('preferredView');
                    if (savedView) {
                        this.view = savedView;
                    }
                });
            },

            selectCategoryBySlug(slug) {
                this.selectedCategorySlug = slug;
                const category = this.categoryData.find(cat => cat.slug === slug);
                this.selectedCategory = category ? category.id : null;

                const url = new URL(window.location);
                if (slug) {
                    url.searchParams.set('category', slug);
                } else {
                    url.searchParams.delete('category');
                }
                window.history.pushState({}, '', url);
            },

            getUrlParameter(name) {
                const urlParams = new URLSearchParams(window.location.search);
                return urlParams.get(name);
            },

            getCategoryName(categoryId) {
                const category = this.categoryData.find(cat => cat.id === categoryId);
                return category ? category.name : 'All Products';
            },

            saveViewPreference() {
                localStorage.setItem('preferredView', this.view);
            },

            setView(viewType) {
                this.view = viewType;
                this.saveViewPreference();
            },

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

            getFilteredProducts() {
                let categoryIdsToCheck = [];
                if (this.selectedCategory !== null) {
                    categoryIdsToCheck = [
                        this.selectedCategory,
                        ...this.getAllDescendantCategoryIds(this.selectedCategory)
                    ];
                }

                let filtered = this.productData.filter(product => {
                    const categoryMatch = this.selectedCategory === null ||
                        (Array.isArray(product.categories) &&
                            product.categories.some(catId => categoryIdsToCheck.includes(catId)));

                    const searchMatch = this.searchQuery === '' ||
                        (product.name && product.name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
                        (product.description && product.description.toLowerCase().includes(this.searchQuery.toLowerCase()));

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

                    const newMatch = !this.showNew || product.isNew;
                    const saleMatch = !this.showSale || product.isOnSale;
                    const stockMatch = !this.inStock || (product.hasVariants ? product.totalVariantStock > 0 : product.stock > 0);

                    return categoryMatch && searchMatch && priceMatch && newMatch && saleMatch && stockMatch;
                });

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

            clearFilters() {
                this.searchQuery = '';
                this.selectedCategory = null;
                this.selectedCategorySlug = null;
                this.priceRanges = [];
                this.showNew = false;
                this.showSale = false;
                this.inStock = false;

                const url = new URL(window.location);
                url.searchParams.delete('category');
                window.history.pushState({}, '', url);
            }
        };
    });
});
