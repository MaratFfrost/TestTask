export interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  review_count: number;
  discount_price?: number; // если где-то используется
}

export interface Filter {
  minPrice: number;
  maxPrice: number;
  minRating: number;
  maxRating: number;
  minReviews: number;
  maxReviews: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
