import React, { useEffect, useState } from 'react';
import ProductTable from './components/ProductTable';
import Charts from './components/Charts';
import Filters from './components/Filters';
import type { Product } from './types';

interface FiltersState {
  minPrice: number;
  maxPrice: number;
  minRating: number;
  minReviews: number;
  maxReviews: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const initialFilters: FiltersState = {
  minPrice: 0,
  maxPrice: Infinity,
  minRating: 0,
  minReviews: 0,
  maxReviews: Infinity,
  sortBy: '',
  sortOrder: 'asc',
};

const App: React.FC = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Ожидание');
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Открываем WebSocket при монтировании
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/parse/`);

    ws.onopen = () => console.log('WebSocket открыт');
    ws.onclose = () => console.log('WebSocket закрыт');
    ws.onerror = (e) => console.error('WebSocket ошибка', e);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Получено:', data);

      if (data.status === 'started') {
        setTaskId(data.task_id);
        setStatus('Задача запущена: ' + data.task_id);
      } else if (data.status === 'SUCCESS') {
        setStatus('Готово');
        setProducts(data.result.products);
      } else if (data.status === 'FAILURE' || data.status === 'error') {
        setStatus('Ошибка: ' + (data.message || 'Неизвестно'));
      } else {
        setStatus('Статус: ' + data.status);
      }
    };

    setSocket(ws);

    return () => ws.close();
  }, []);

  // Интервал опроса состояния задачи по taskId
  useEffect(() => {
    if (!taskId || !socket) return;

    const interval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: 'check', task_id: taskId }));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [taskId, socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      alert('WebSocket не подключён');
      return;
    }

    if (!searchQuery.trim()) {
      alert('Введите поисковый запрос');
      return;
    }

    setProducts([]);
    setStatus('Отправка данных...');

    const payload = {
      action: 'start',
      query: searchQuery.trim(),
      min_price: filters.minPrice,
      max_price: filters.maxPrice === Infinity ? null : filters.maxPrice,
      min_rating: filters.minRating,
      max_rating: filters.maxReviews === Infinity ? null : filters.maxReviews,
      min_reviews: filters.minReviews,
      max_items: 50,
      sort_by: filters.sortBy || null,
      sort_order: filters.sortOrder,
    };

    socket.send(JSON.stringify(payload));
  };

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial' }}>
      <h1>Парсинг Wildberries</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="searchQuery" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Поисковый запрос:
          </label>
          <input
            id="searchQuery"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Введите товар для поиска"
            style={{
              padding: '0.5rem',
              width: '100%',
              maxWidth: '400px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            required
          />
        </div>

        <Filters filters={filters} setFilters={setFilters} />
        <button
          type="submit"
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Запустить парсинг
        </button>
      </form>

      <p><strong>Статус:</strong> {status}</p>

      {products.length > 0 && (
        <>
          <h2>Результаты</h2>
          <ProductTable products={products} />
          <div style={{ marginTop: '2rem' }}>
            <Charts products={products} />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
