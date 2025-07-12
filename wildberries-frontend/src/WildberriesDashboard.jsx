import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, TrendingUp, BarChart3, LineChart, RefreshCw, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

const WildberriesDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [priceDistribution, setPriceDistribution] = useState([]);

  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 100000,
    minRating: 0,
    minReviews: 0,
    category: '',
    searchQuery: ''
  });

  const [sorting, setSorting] = useState({ field: 'created_at', direction: 'desc' });
  const [parseQuery, setParseQuery] = useState('');
  const [parseLimit, setParseLimit] = useState(50);

  const API_BASE = 'http://localhost:8000/api';

  // Загрузка товаров с API
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

      const response = await fetch(`${API_BASE}/products/?${params}`);
      if (!response.ok) throw new Error('Ошибка загрузки товаров');
      
      const data = await response.json();
      setProducts(data.results || data || []);
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      alert('Ошибка загрузки товаров. Убедитесь, что бэкенд запущен на localhost:8000');
      setProducts([]);
    }
    setLoading(false);
  };

  // Загрузка категорий
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories/`);
      if (!response.ok) throw new Error('Ошибка загрузки категорий');
      
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  // Загрузка статистики
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE}/statistics/`);
      if (!response.ok) throw new Error('Ошибка загрузки статистики');
      
      const data = await response.json();
      setStatistics(data || {});
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  // Загрузка распределения цен
  const fetchPriceDistribution = async () => {
    try {
      const response = await fetch(`${API_BASE}/price-distribution/`);
      if (!response.ok) throw new Error('Ошибка загрузки распределения цен');
      
      const data = await response.json();
      setPriceDistribution(data || []);
    } catch (error) {
      console.error('Ошибка загрузки распределения цен:', error);
    }
  };

  // Парсинг товаров
  const parseProducts = async () => {
    if (!parseQuery.trim()) {
      alert('Введите запрос для парсинга');
      return;
    }
    
    setParsing(true);
    try {
      const response = await fetch(`${API_BASE}/parse/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: parseQuery, 
          limit: parseLimit 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Успешно спарсено ${data.count} товаров!`);
        // Обновляем все данные
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchStatistics(),
          fetchPriceDistribution()
        ]);
      } else {
        alert(`Ошибка парсинга: ${data.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка парсинга:', error);
      alert('Ошибка парсинга товаров. Проверьте подключение к бэкенду.');
    }
    setParsing(false);
  };

  // Фильтрация товаров на фронтенде (дополнительная к серверной)
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = filters.searchQuery === '' || 
        product.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [products, filters.searchQuery]);

  // Данные для scatter-диаграммы (скидка vs рейтинг)
  const discountRatingData = useMemo(() => {
    return filteredProducts
      .filter(product => product.discount_percentage > 0)
      .map(product => ({
        rating: product.rating,
        discount: product.discount_percentage
      }));
  }, [filteredProducts]);

  // Обработчик сортировки
  const handleSort = (field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Первоначальная загрузка данных
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchStatistics(),
        fetchPriceDistribution()
      ]);
    };
    
    loadInitialData();
  }, []);

  // Обновление товаров при изменении фильтров и сортировки
  useEffect(() => {
    fetchProducts();
  }, [filters, sorting]);

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

        {/* Состояние подключения */}
        <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">📊 Состояние данных:</h3>
          <div className="text-sm text-blue-700 grid grid-cols-2 md:grid-cols-4 gap-2">
            <p>• Товаров: <strong>{products.length}</strong></p>
            <p>• Категорий: <strong>{categories.length}</strong></p>
            <p>• Отфильтровано: <strong>{filteredProducts.length}</strong></p>
            <p>• Scatter точек: <strong>{discountRatingData.length}</strong></p>
          </div>
        </div>

        {/* Парсинг товаров */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/50">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search className="w-6 h-6 text-purple-600" />
            Парсинг товаров с Wildberries
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
            <button
              onClick={() => {
                fetchProducts();
                fetchCategories();
                fetchStatistics();
                fetchPriceDistribution();
              }}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Обновить
            </button>
          </div>
        </div>

        {/* Статистика */}
        {statistics.total_products && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Всего товаров', value: statistics.total_products, icon: ShoppingCart, color: 'from-blue-500 to-blue-600' },
              { label: 'Средняя цена', value: `${Math.round(statistics.avg_price || 0).toLocaleString()} ₽`, icon: TrendingUp, color: 'from-green-500 to-green-600' },
              { label: 'Средний рейтинг', value: (statistics.avg_rating || 0).toFixed(1), icon: BarChart3, color: 'from-yellow-500 to-yellow-600' },
              { label: 'Среднее отзывов', value: Math.round(statistics.avg_reviews || 0), icon: LineChart, color: 'from-purple-500 to-purple-600' }
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
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
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="1000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  className="w-full"
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
                className="w-full"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex-1 mr-4">
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
                className="w-full"
              />
            </div>
            <button
              onClick={() => setFilters({ minPrice: 0, maxPrice: 100000, minRating: 0, minReviews: 0, category: '', searchQuery: '' })}
              className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all"
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
            {priceDistribution.length > 0 && priceDistribution.some(item => item.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priceDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                    formatter={(value) => [value, 'Количество товаров']}
                    labelFormatter={(label) => `Ценовой диапазон: ${label}`}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-lg">
                {priceDistribution.length === 0 ? 'Загрузка данных...' : 'Нет данных для отображения'}
              </div>
            )}
          </div>

          {/* Скаттер-диаграмма скидка vs рейтинг */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-green-600" />
              Скидка vs Рейтинг
            </h3>
            {discountRatingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={discountRatingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis 
                    type="number" 
                    dataKey="rating" 
                    domain={[3, 5]} 
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 text-lg">
                {products.length === 0 ? 'Загрузка данных...' : 'Нет товаров со скидками для отображения'}
              </div>
            )}
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
                      {products.length === 0 
                        ? 'Нет товаров. Спарсите товары для начала работы.' 
                        : 'Товары не найдены. Попробуйте изменить фильтры.'}
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
    </div>
  );
};

export default WildberriesDashboard;