import React from 'react';

interface Props {
  filters: {
    minPrice: number;
    maxPrice: number;
    minRating: number;
    minReviews: number;
    maxReviews: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  setFilters: (filters: any) => void;
}

const Filters: React.FC<Props> = ({ filters, setFilters }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm">Минимальная цена</label>
        <input
          type="number"
          value={filters.minPrice}
          onChange={(e) => setFilters((f: any) => ({ ...f, minPrice: Number(e.target.value) }))}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-sm">Максимальная цена</label>
        <input
          type="number"
          value={filters.maxPrice === Infinity ? '' : filters.maxPrice}
          onChange={(e) => setFilters((f: any) => ({ ...f, maxPrice: Number(e.target.value) || Infinity }))}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-sm">Минимальный рейтинг</label>
        <input
          type="number"
          step="0.1"
          max="5"
          min="0"
          value={filters.minRating}
          onChange={(e) => setFilters((f: any) => ({ ...f, minRating: Number(e.target.value) }))}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-sm">Мин. кол-во отзывов</label>
        <input
          type="number"
          value={filters.minReviews}
          onChange={(e) => setFilters((f: any) => ({ ...f, minReviews: Number(e.target.value) }))}
          className="w-full border rounded px-2 py-1"
        />
      </div>
      <div>
        <label className="block text-sm">Сортировать по</label>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters((f: any) => ({ ...f, sortBy: e.target.value }))}
          className="w-full border rounded px-2 py-1"
        >
          <option value="">Без сортировки</option>
          <option value="price">Цене</option>
          <option value="discount_price">Старой цене</option>
          <option value="rating">Рейтингу</option>
          <option value="review_count">Кол-ву отзывов</option>
          <option value="name">Названию</option>
        </select>
      </div>
      <div>
        <label className="block text-sm">Порядок сортировки</label>
        <select
          value={filters.sortOrder}
          onChange={(e) => setFilters((f: any) => ({ ...f, sortOrder: e.target.value }))}
          className="w-full border rounded px-2 py-1"
        >
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>
      </div>
    </div>
  );
};

export default Filters;
