import React from 'react';
import type { Product } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from 'recharts';

interface Props {
  products: Product[];
}

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="#666"
      fontSize={12}
    >
      {payload.value.length > 25
        ? payload.value.slice(0, 25) + '...'
        : payload.value}
    </text>
  );
};

const Charts: React.FC<Props> = ({ products }) => {
  const topRated = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  const mostReviewed = [...products]
    .sort((a, b) => b.reviews_count - a.reviews_count)
    .slice(0, 10);

  const maxPrice = Math.max(...products.map(p => p.current_price), 0);
  const step = Math.ceil(maxPrice / 10);

  const priceRanges = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * step}-${(i + 1) * step} руб.`,
    min: i * step,
    max: (i + 1) * step,
  }));

  const priceHistogram = priceRanges.map(({ range, min, max }) => ({
    range,
    count: products.filter(p => p.current_price >= min && p.current_price < max).length,
  }));

  const discountRatingData = products.map(p => ({
    discount: p.old_price ? Math.max(p.old_price - p.current_price, 0) : 0,
    rating: p.rating,
  }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Топ 10 по рейтингу</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topRated} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 5]} />
            <YAxis
              type="category"
              dataKey="name"
              width={220}
              tick={<CustomYAxisTick />}
            />
            <Tooltip />
            <Bar dataKey="rating" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Топ 10 по отзывам</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mostReviewed} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              width={220}
              tick={<CustomYAxisTick />}
            />
            <Tooltip />
            <Bar dataKey="reviews_count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Распределение цен</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priceHistogram}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Скидка vs Рейтинг</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="discount" name="Скидка" unit="₽" />
            <YAxis dataKey="rating" name="Рейтинг" domain={[0, 5]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Товары" data={discountRatingData} fill="#ff7300" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
