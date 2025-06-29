import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, TrendingUp, BarChart3, LineChart, RefreshCw, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line, Scatter, ScatterChart } from 'recharts';

const WildberriesDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState({});
  
  // Фильтры
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    minReviews: 0,
    category: '',
    searchQuery: ''
  });
  
  // Сортировка
  const [sorting, setSorting] = useState({ field: 'created_at', direction: 'desc' });
  
  // Парсинг товаров
  const [parseQuery, setParseQuery] = useState('');
  const [parseLimit, setParseLimit] = useState(50);

  // Загрузка данных
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.minPrice > 0) params.append('min_price', filters.minPrice);
      if (filters.maxPrice < 100000) params.append('max_price', filters.maxPrice);
      if (filters.minRating > 0) params.append('min_rating', filters.minRating);
      if (filters.minReviews > 0) params.append('min_reviews', filters.minReviews);
      if (filters.category) params.append('category', filters.category);
      params.append('ordering', `${sorting.direction === 'desc' ? '-' : ''}${sorting.field}`);
      
      const response = await fetch(`http://localhost:8000/api/products/?${params}`);
      const data = await response.json();
      setProducts(data.results || []);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      // Генерируем тестовые данные
      setProducts(generateTestData());
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/categories/');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
      setCategories(['смартфоны', 'одежда', 'обувь', 'электроника', 'книги']);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/statistics/');
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  // Парсинг новых товаров
  const parseProducts = async () => {
    if (!parseQuery.trim()) return;
    
    setParsing(true);
    try {
      const response = await fetch('http://localhost:8000/api/parse/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: parseQuery, limit: parseLimit })
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`Успешно спарсено ${data.count} товаров!`);
        fetchProducts();
        fetchCategories();
        fetchStatistics();
      } else {
        alert(`Ошибка: ${data.error}`);
      }
    } catch (error) {
      console.error('Ошибка парсинга:', error);
      alert('Ошибка парсинга товаров');
    }
    setParsing(false);
  };

  // Генерация тестовых данных
  const generateTestData = () => {
    const categories = ['Смартфоны', 'Ноутбуки', 'Одежда', 'Обувь', 'Косметика'];
    const data = [];
    
    for (let i = 0; i < 100; i++) {
      const price = Math.floor(Math.random() * 50000) + 1000;
      const discount = Math.floor(Math.random() * 40) + 5;
      const discountPrice = price * (100 - discount) / 100;
      
      data.push({
        id: i + 1,
        name: `Товар ${categories[Math.floor(Math.random() * categories.length)]} #${i + 1}`,
        price: price,
        discount_price: Math.floor(discountPrice),
        rating: +(Math.random() * 2 + 3).toFixed(1),
        reviews_count: Math.floor(Math.random() * 2000) + 10,
        category: categories[Math.floor(Math.random() * categories.length)],
        discount_percentage: Math.floor((1 - discountPrice / price) * 100)
      });
    }
    
    return data;
  };

  // Фильтрация товаров
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      return product.discount_price >= filters.minPrice &&
             product.discount_price <= filters.maxPrice &&
             product.rating >= filters.minRating &&
             product.reviews_count >= filters.minReviews &&
             (filters.category === '' || product.category.toLowerCase().includes(filters.category.toLowerCase())) &&
             (filters.searchQuery === '' || product.name.toLowerCase().includes(filters.searchQuery.toLowerCase()));
    });
  }, [products, filters]);

  // Данные для гистограммы цен
  const priceDistributionData = useMemo(() => {
    const ranges = [
      { label: '0-5k', min: 0, max: 5000 },
      { label: '5k-10k', min: 5000, max: 10000 },
      { label: '10k-20k', min: 10000, max: 20000 },
      { label: '20k-30k', min: 20000, max: 30000 },
      { label: '30k+', min: 30000, max: 999999 }
    ];
    
    return ranges.map(range => ({
      range: range.label,
      count: filteredProducts.filter(p => p.discount_price >= range.min && p.discount_price < range.max).length
    }));
  }, [filteredProducts]);

  // Данные для линейного графика (скидка vs рейтинг)
  const discountRatingData = useMemo(() => {
    return filteredProducts.map(product => ({
      rating: product.rating,
      discount: product.discount_percentage || 0,
      name: product.name
    })).filter(item => item.discount > 0);
  }, [filteredProducts]);

  useEffect(() => {
    if (products.length === 0) {
      setProducts(generateTestData());
    }
    fetchCategories();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters, sorting]);

  const handleSort = (field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Wildberries Analytics
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Аналитика товаров с интерактивными фильтрами и диаграммами</p>
        </div>

        {/* Парсинг товаров */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/50">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search className="w-6 h-6 text-purple-600" />
            Парсинг товаров
          </h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">Запрос для поиска</label>
              <input
                type="text"
                value={parseQuery}
                onChange={(e) => setParseQuery(e.target.value)}
                placeholder="Например: смартфоны, одежда, обувь"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Количество</label>
              <input
                type="number"
                value={parseLimit}
                onChange={(e) => setParseLimit(Number(e.target.value))}
                min="1"
                max="200"
                className="w-24 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={parseProducts}
              disabled={parsing || !parseQuery.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2 font-medium shadow-lg"
            >
              {parsing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {parsing ? 'Парсинг...' : 'Спарсить'}
            </button>
          </div>
        </div>

        {/* Статистика */}
        {statistics.total_products && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Всего товаров', value: statistics.total_products, icon: ShoppingCart, color: 'from-blue-500 to-blue-600' },
              { label: 'Средняя цена', value: `${statistics.avg_price?.toLocaleString()} ₽`, icon: TrendingUp, color: 'from-green-500 to-green-600' },
              { label: 'Средний рейтинг', value: statistics.avg_rating?.toFixed(1), icon: BarChart3, color: 'from-yellow-500 to-yellow-600' },
              { label: 'Среднее отзывов', value: Math.round(statistics.avg_reviews), icon: LineChart, color: 'from-purple-500 to-purple-600' }
            ].map((stat, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Фильтры */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/50">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="w-6 h-6 text-purple-600" />
            Фильтры
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Поиск по названию</label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Название товара"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">Все категории</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цена: {filters.minPrice.toLocaleString()} - {filters.maxPrice.toLocaleString()} ₽
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="1000"
                  value={filters.minPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="1000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Минимальный рейтинг: {filters.minRating}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Минимум отзывов: {filters.minReviews}
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={filters.minReviews}
                onChange={(e) => setFilters(prev => ({ ...prev, minReviews: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <button
              onClick={() => setFilters({ minPrice: 0, maxPrice: 100000, minRating: 0, minReviews: 0, category: '', searchQuery: '' })}
              className="ml-4 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>

        {/* Диаграммы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Гистограмма цен */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Распределение по ценам
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priceDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="range" tick={{ fill: '#6b7280' }} />
                <YAxis tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }} 
                />
                <Bar dataKey="count" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Скаттер-диаграмма скидка vs рейтинг */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-green-600" />
              Скидка vs Рейтинг
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={discountRatingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis 
                  type="number" 
                  dataKey="rating" 
                  domain={[0, 5]} 
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Рейтинг', position: 'insideBottom', offset: -5, style: { fill: '#6b7280' } }}
                />
                <YAxis 
                  type="number" 
                  dataKey="discount" 
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Скидка (%)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => [
                    name === 'discount' ? `${value}%` : value,
                    name === 'discount' ? 'Скидка' : 'Рейтинг'
                  ]}
                />
                <Scatter dataKey="discount" fill="#10b981" fillOpacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
              Товары ({filteredProducts.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  {[
                    { key: 'name', label: 'Название' },
                    { key: 'category', label: 'Категория' },
                    { key: 'price', label: 'Цена' },
                    { key: 'discount_price', label: 'Цена со скидкой' },
                    { key: 'rating', label: 'Рейтинг' },
                    { key: 'reviews_count', label: 'Отзывы' }
                  ].map(column => (
                    <th 
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {sorting.field === column.key && (
                          <span className="text-purple-600">
                            {sorting.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                        <span className="text-gray-600">Загрузка товаров...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Товары не найдены. Попробуйте изменить фильтры или спарсить новые товары.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.slice(0, 50).map(product => (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 max-w-xs truncate" title={product.name}>
                          {product.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className={product.price !== product.discount_price ? 'line-through text-gray-500' : ''}>
                          {product.price?.toLocaleString()} ₽
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {product.discount_price?.toLocaleString()} ₽
                        {product.discount_percentage > 0 && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            -{product.discount_percentage}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{product.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.reviews_count?.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length > 50 && (
            <div className="p-4 bg-gray-50/50 text-center text-sm text-gray-600">
              Показано первые 50 товаров из {filteredProducts.length}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #3b82f6);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #3b82f6);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  );
};

export default WildberriesDashboard;