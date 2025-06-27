import React, { useState, useEffect, useRef } from 'react';

const WS_URL = 'ws://localhost:8000/ws/parse/'; // Укажи корректный адрес сервера

const WBParser: React.FC = () => {
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [maxItems, setMaxItems] = useState('20');

  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<string>('disconnected');

  const socketRef = useRef<WebSocket | null>(null);

  // Подключение к WebSocket
  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('connected');
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.status === 'started') {
        setTaskId(message.task_id);
        setStatus('in_progress');
      } else if (message.status === 'SUCCESS' || message.status === 'FAILURE') {
        setResult(message.result);
        setStatus(message.status.toLowerCase());
      } else if (message.status === 'error') {
        setStatus('error');
        setResult({ error: message.message });
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
    };

    return () => {
      socket.close();
    };
  }, []);

  const handleStart = () => {
    setResult(null);
    setTaskId(null);

    const message = {
      action: 'start',
      query,
      min_price: minPrice,
      max_price: maxPrice,
      min_rating: minRating,
      max_rating: maxRating,
      max_items: maxItems,
    };

    socketRef.current?.send(JSON.stringify(message));
  };

  // Проверка статуса задачи
  useEffect(() => {
    if (taskId && status === 'in_progress') {
      const interval = setInterval(() => {
        socketRef.current?.send(
          JSON.stringify({
            action: 'check',
            task_id: taskId,
          })
        );
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [taskId, status]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Парсер Wildberries</h1>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Поисковый запрос"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Макс. товаров"
          value={maxItems}
          onChange={(e) => setMaxItems(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Мин. цена"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Макс. цена"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Мин. рейтинг"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Макс. рейтинг"
          value={maxRating}
          onChange={(e) => setMaxRating(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      <button
        onClick={handleStart}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Запустить парсинг
      </button>

      <div className="mt-4">
        <p className="text-gray-600">Статус: {status}</p>
        {result && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Результаты:</h2>
            <pre className="bg-gray-100 p-2 rounded max-h-80 overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default WBParser;
