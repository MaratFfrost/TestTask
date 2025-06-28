export interface Product {
  id: number;
  name: string;
  current_price: number;
  old_price: number;
  rating: number;
  reviews_count: number;
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
