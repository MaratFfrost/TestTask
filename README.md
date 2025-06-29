Понял! Уберём упоминание WebSockets и уточним логику работы. Вот обновлённая версия `README.md` с акцентом на классический HTTP + Celery:  


# 🌐 Wildberries Parser & Analytics  

**Парсинг товаров с Wildberries + аналитика с фильтрацией**  
Backend на Django (Celery для фонового парсинга) + Frontend на React с интерактивными графиками.  

![Пример интерфейса](https://via.placeholder.com/800x400?text=Preview+of+WB+Parser+UI) *(можно заменить на реальный скриншот)*  

## 🔥 Особенности  
- **Фоновый парсинг** через Celery – запросы к Wildberries не блокируют API.  
- **Гибкая фильтрация** по цене, рейтингу, количеству отзывов.  
- **Аналитика**: гистограммы цен и графики скидок (Recharts).  
- **Оптимизированная БД** – данные хранятся в PostgreSQL.  
- **Docker-развёртывание** – запуск одной командой.  

## 🛠 Технологии  
| Backend               | Frontend           | Инфраструктура       |  
|-----------------------|--------------------|----------------------|  
| Python 3.11           | React 18           | Docker               |  
| Django 4.2           | TypeScript 5       | Docker-compose       |  
| Celery + Redis        | Vite               | PostgreSQL           |  
| BeautifulSoup/Requests| Tailwind CSS       | Redis                |  
|                       | Recharts           |                      |  

## 🚀 Запуск проекта  
1. **Клонировать репозиторий**:  
   ```bash  
   git clone https://github.com/your-repo/wb-parser.git  
   cd wb-parser  
   ```  

2. **Запустить бэкенд**:  
   ```bash  
   cd backend  
   docker-compose up --build  
   ```  

3. **Запустить фронтенд**:  
   ```bash  
   cd frontend  
   npm install  
   npm run dev  
   ```  

Открыть в браузере: [http://localhost:3000](http://localhost:8000).  

## 📊 Как это работает?  
1. **Парсинг**:  
   - Пользователь вводит запрос (например, "iPhone 15").
   - Создается двустороннее соединение через Django Channels
   - Django отправляет задачу в Celery, которая парсит Wildberries в фоне.
   - При готовности задачи он высылает ее.
   - Результаты сохраняются в PostgreSQL.  

2. **Фильтрация через REST API**:  
   ```http  
   GET api/products/?min_price=5&max_rating=1&max_price=50&max_rating=5
   ```  
   Поддерживаемые параметры:  
   - `min_price`, `max_price` – диапазон цен.  
   - `min_rating` – минимальный рейтинг товара.  
   - `min_reviews` – минимальное количество отзывов.  

3. **Графики (React + Recharts)**:  
   - **Гистограмма**: распределение цен товаров.  
   - **Линейный график**: связь скидки и рейтинга.  

## 📌 Примеры запросов  
```bash  
# Получить товары от 5000 до 20000 ₽ с рейтингом от 4.0 и 100+ отзывами  
curl "http://localhost:8000/api/products/?min_price=5000&max_price=20000&min_rating=4&min_reviews=100"  
```  

## 🔮 Что можно улучшить?  
- Добавить пагинацию для больших наборов данных.  
- Реализовать кэширование часто запрашиваемых товаров.  
