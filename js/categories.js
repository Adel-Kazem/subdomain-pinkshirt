const CATEGORIES = [
 {
    id: 1,
    name: "Beef",
    slug: "beef",
    description: "Premium beef products for all your cooking needs",
    imageUrl: "https://images.unsplash.com/photo-1551135049-8a33b5883817?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: true,
    parent_id: null,
    active: true,
    display_order: 10,
    productIds: [
      1,
      2,
      3,
      4,
      5,
      6
    ],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-04-28T20:46:20.268Z"
 },
 {
    id: 2,
    name: "Steaks",
    slug: "steaks",
    description: "Selection of premium beef steaks",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: true,
    parent_id: 1,
    active: true,
    display_order: 20,
    productIds: [
      1,
      2,
      5
    ],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-04-28T20:46:20.269Z"
 },
 {
    id: 3,
    name: "Premium Steaks",
    slug: "premium-steaks",
    description: "Our highest quality steak cuts",
    imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: true,
    parent_id: 2,
    active: true,
    display_order: 30,
    productIds: [
      1,
      2
    ],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z"
 },
 {
    id: 4,
    name: "Value Steaks",
    slug: "value-steaks",
    description: "Great quality steaks at affordable prices",
    imageUrl: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: false,
    parent_id: 2,
    active: true,
    display_order: 40,
    productIds: [
      5
    ],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-04-01T16:20:00Z"
 },
 {
    id: 5,
    name: "Roasts",
    slug: "roasts",
    description: "Tender, flavorful beef roasts for special occasions",
    imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: false,
    parent_id: 1,
    active: true,
    display_order: 50,
    productIds: [
      3
    ],
    created_at: "2025-01-05T13:45:00Z",
    updated_at: "2025-01-05T13:45:00Z"
 },
 {
    id: 6,
    name: "Ground Beef",
    slug: "ground-beef",
    description: "Premium ground beef for burgers, meatballs, and more",
    imageUrl: "https://images.unsplash.com/photo-1551135049-8a33b5883817?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    featured: false,
    parent_id: 1,
    active: true,
    display_order: 60,
    productIds: [
      6
    ],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-03-01T00:00:00Z"
 }
];