# Wildberries Parser & Analytics

Проект для парсинга товаров с Wildberries и их аналитики с помощью интерактивных диаграмм и фильтров.

## 🛠 Стек технологий

### Backend
- **Django 4.2.7** - веб-фреймворк
- **Django REST Framework** - для API
- **SQLite** - база данных
- **BeautifulSoup4** - для парсинга
- **Requests** - для HTTP запросов

### Frontend
- **React 19.1.0** - UI библиотека
- **Recharts** - для диаграмм
- **Tailwind CSS** - для стилизации
- **Lucide React** - иконки

## 📁 Структура проекта

```
wbParser/
├── wbparser/                 # Django backend
│   ├── manage.py
│   ├── wbparser/            # Настройки проекта
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── ...
│   └── products/            # Приложение для товаров
│       ├── models.py        # Модели данных
│       ├── views.py         # API эндпоинты
│       ├── parsers.py       # Парсер Wildberries
│       └── ...
├── wildberries-frontend/     # React frontend
│   ├── src/
│   │   ├── WildberriesDashboard.jsx
│   │   └── ...
│   ├── package.json
│   └── ...
├── requirements.txt         # Python зависимости
└── README.md               # Этот файл
```

## 🚀 Установка и запуск

### Предварительные требования

- **Python 3.8+**
- **Node.js 16+** 
- **npm** или **yarn**

### 1. Клонирование репозитория

```bash
git clone git@github.com:Killmonger01/wbParser.git
cd wbParser
```

### 2. Настройка Backend (Django)

#### 2.1 Создание виртуального окружения

```bash
# Создание виртуального окружения
python -m venv venv

# Активация (Windows)
venv\Scripts\activate

# Активация (macOS/Linux)
source venv/bin/activate
```

#### 2.2 Установка зависимостей

```bash
pip install -r requirements.txt
```

#### 2.3 Настройка базы данных

```bash
cd wbparser
python manage.py makemigrations
python manage.py migrate
```

#### 2.4 Создание суперпользователя (опционально)

```bash
python manage.py createsuperuser
```

### 3. Настройка Frontend (React)

#### 3.1 Установка зависимостей

```bash
cd wildberries-frontend
npm install
```

### 4. Запуск проекта

Для запуска проекта нужно **2 терминала**:

#### Терминал 1: Backend (Django)

```bash
# Переходим в папку с Django проектом
cd wbparser

# Активируем виртуальное окружение (если не активировано)
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Запускаем сервер
python manage.py runserver
```

Backend будет доступен по адресу: **http://localhost:8000**

#### Терминал 2: Frontend (React)

```bash
# Переходим в папку с React проектом
cd wildberries-frontend

# Запускаем развитие сервер
npm start
```

Frontend будет доступен по адресу: **http://localhost:3000**

## 📖 Использование

### 1. Открытие приложения
- Откройте браузер и перейдите на **http://localhost:3000**

### 2. Парсинг товаров
1. В разделе "Парсинг товаров" введите запрос (например: "смартфоны", "одежда")
2. Укажите количество товаров для парсинга (1-200)
3. Нажмите кнопку "Спарсить"
4. Подождите завершения процесса

### 3. Работа с фильтрами
- **Поиск по названию** - введите текст для поиска
- **Категория** - выберите из выпадающего списка
- **Диапазон цен** - используйте слайдеры для установки мин/макс цены
- **Минимальный рейтинг** - установите минимальный рейтинг товаров
- **Минимум отзывов** - установите минимальное количество отзывов

### 4. Сортировка таблицы
Кликните на заголовки колонок для сортировки:
- Название товара
- Категория  
- Цена / Цена со скидкой
- Рейтинг
- Количество отзывов

### 5. Просмотр аналитики
- **Распределение по ценам** - гистограмма товаров по ценовым диапазонам
- **Размер скидки vs Рейтинг** - линейный график зависимости скидки от рейтинга

## 🔧 API Endpoints

Backend предоставляет следующие API endpoints:

- `GET /api/products/` - список товаров с фильтрацией
- `GET /api/categories/` - список категорий
- `GET /api/statistics/` - общая статистика
- `GET /api/price-distribution/` - распределение по ценам
- `POST /api/parse/` - парсинг новых товаров

### Пример запроса парсинга:

```bash
curl -X POST http://localhost:8000/api/parse/ \
  -H "Content-Type: application/json" \
  -d '{"query": "смартфоны", "limit": 50}'
```

## 🐛 Решение проблем

### Backend не запускается
- Убедитесь, что виртуальное окружение активировано
- Проверьте установку всех зависимостей: `pip install -r requirements.txt`
- Выполните миграции: `python manage.py migrate`

### Frontend не запускается  
- Убедитесь, что Node.js установлен: `node --version`
- Установите зависимости: `npm install`
- Очистите кэш: `npm start -- --reset-cache`

### Ошибки CORS
- Backend настроен на разрешение запросов с localhost:3000
- Если проблема сохраняется, проверьте настройки в `wbparser/settings.py`

### Парсинг не работает
- Wildberries может блокировать запросы
- В этом случае парсер генерирует тестовые данные для демонстрации

## 📝 Дополнительная информация

### Структура данных товара
```json
{
  "id": 1,
  "name": "Название товара",
  "price": 10000.0,
  "discount_price": 8500.0,
  "rating": 4.5,
  "reviews_count": 234,
  "category": "смартфоны",
  "discount_percentage": 15,
  "created_at": "2024-01-01T12:00:00Z"
}
```

### Админ панель Django
Доступна по адресу: **http://localhost:8000/admin**
(требует создания суперпользователя)

## 🤝 Разработка

### Добавление новых фильтров
1. Обновите `ProductFilter` в `products/filters.py`
2. Добавьте соответствующие поля в React компонент

### Изменение парсера
Логика парсинга находится в `products/parsers.py` в классе `WildberriesParser`

## 📄 Лицензия

Этот проект создан в учебных целях.