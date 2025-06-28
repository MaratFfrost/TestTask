import React, { useEffect, useState, useMemo } from 'react';
import ProductTable from './components/ProductTable';
import Charts from './components/Charts';
import Filters from './components/Filters';
import type { Product } from './types';

interface FiltersState {
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const initialFilters: FiltersState = {
  minPrice: 0,
  maxPrice: Infinity,
  minRating: 0,
  sortBy: '',
  sortOrder: 'asc',
};

const validateFilters = (filters: FiltersState) => {
  const errors = [];

  if (filters.minPrice < 0) errors.push('Минимальная цена не может быть отрицательной');
  if (filters.maxPrice < 0) errors.push('Максимальная цена не может быть отрицательной');
  if (filters.minRating < 0) errors.push('Минимальный рейтинг не может быть отрицательным');
  if (filters.minRating > 5) errors.push('Максимальный рейтинг - 5');

  if (filters.minPrice > filters.maxPrice) {
    errors.push('Минимальная цена не может быть больше максимальной');
  }

  return errors;
};

const App: React.FC = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Ожидание');
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasSuccessfulRequest, setHasSuccessfulRequest] = useState<boolean>(false);
  const [previousQuery, setPreviousQuery] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/parse/`);

    ws.onopen = () => console.log('WebSocket открыт');
    ws.onclose = () => console.log('WebSocket закрыт');
    ws.onerror = (e) => console.error('WebSocket ошибка', e);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === 'started') {
        setTaskId(data.task_id);
        setStatus('Задача запущена');
      } else if (data.status === 'SUCCESS') {
        setStatus('Готово');
        setProducts(data.result.products);
        setHasSuccessfulRequest(true);
      } else if (data.status === 'FAILURE' || data.status === 'error') {
        setStatus('Ошибка: ' + (data.message || 'Неизвестно'));
        setHasSuccessfulRequest(false);
      } else {
        setStatus(data.status);
      }
    };

    setSocket(ws);

    return () => ws.close();
  }, []);

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

    const errors = validateFilters(filters);
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    if (hasSuccessfulRequest && products.length > 0) {
      if (searchQuery === previousQuery) {
        if (!window.confirm('Вы уже получили данные по этому запросу. Выполнить новый парсинг?')) {
          return;
        }
      }
    }

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
    setHasSuccessfulRequest(false);
    setPreviousQuery(searchQuery.trim());

    const payload = {
      action: 'start',
      query: searchQuery.trim(),
      min_price: filters.minPrice,
      max_price: filters.maxPrice === Infinity ? null : filters.maxPrice,
      min_rating: filters.minRating,
    };

    socket.send(JSON.stringify(payload));
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (filters.sortBy) {
      result.sort((a, b) => {
        const fieldA = a[filters.sortBy as keyof Product];
        const fieldB = b[filters.sortBy as keyof Product];

        if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          return filters.sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
        }

        if (typeof fieldA === 'string' && typeof fieldB === 'string') {
          return filters.sortOrder === 'asc'
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA);
        }

        return 0;
      });
    }

    return result;
  }, [products, filters]);

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial' }}>
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

        {validationErrors.length > 0 && (
          <div style={{
            margin: '1rem 0',
            padding: '0.5rem',
            border: '1px solid #ff6b6b',
            borderRadius: '4px',
            backgroundColor: '#fff5f5',
            color: '#ff6b6b'
          }}>
            <strong>Ошибки в фильтрах:</strong>
            <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button
            type="submit"
            style={{
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
        </div>
      </form>

      <p><strong>Статус:</strong> {status}</p>

      {filteredAndSortedProducts.length > 0 && (
        <>
          <ProductTable products={filteredAndSortedProducts} />
          <div style={{ marginTop: '2rem' }}>
            <Charts products={filteredAndSortedProducts} />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
