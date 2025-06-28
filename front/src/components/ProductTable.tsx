import React from 'react';
import type { Product } from '../types';


interface Props {
  products: Product[];
}

const ProductTable: React.FC<Props> = ({ products }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table-auto w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left">Название</th>
            <th className="px-4 py-2 text-left">Цена со скидкой</th>
            <th className="px-4 py-2 text-left">Цена без скидки</th>
            <th className="px-4 py-2 text-left">Рейтинг</th>
            <th className="px-4 py-2 text-left">Отзывы</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{product.name}</td>
              <td className="px-4 py-2">{product.current_price} ₽</td>
              <td className="px-4 py-2">{product.old_price} ₽</td>
              <td className="px-4 py-2">{product.rating}</td>
              <td className="px-4 py-2">{product.reviews_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
