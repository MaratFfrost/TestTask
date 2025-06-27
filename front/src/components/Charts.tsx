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
} from 'recharts';


interface Props {
  products: Product[];
}

const Charts: React.FC<Props> = ({ products }) => {
  const topRated = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  const mostReviewed = [...products]
    .sort((a, b) => b.review_count - a.review_count)
    .slice(0, 10);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Топ 10 по рейтингу</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topRated} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 5]} />
            <YAxis type="category" dataKey="name" width={150} />
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
            <YAxis type="category" dataKey="name" width={150} />
            <Tooltip />
            <Bar dataKey="review_count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
