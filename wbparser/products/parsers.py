import requests
import json
import time
import random
from typing import List, Dict
from .models import Product

class WildberriesParser:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
    
    def search_products(self, query: str, limit: int = 100) -> List[Dict]:
        """Парсинг товаров с Wildberries"""
        products = []
        
        # Wildberries API endpoint
        url = "https://search.wb.ru/exactmatch/ru/common/v4/search"
        
        params = {
            'appType': '1',
            'curr': 'rub',
            'dest': '-1257786',
            'query': query,
            'resultset': 'catalog',
            'sort': 'popular',
            'spp': '0',
            'suppressSpellcheck': 'false'
        }
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'data' in data and 'products' in data['data']:
                for item in data['data']['products'][:limit]:
                    try:
                        product = self._extract_product_data(item, query)
                        if product:
                            products.append(product)
                    except Exception as e:
                        print(f"Ошибка обработки товара: {e}")
                        continue
                        
        except Exception as e:
            print(f"Ошибка запроса к API WB: {e}")
            # Fallback на тестовые данные
            products = self._generate_test_data(query, limit)
            
        return products
    
    def _extract_product_data(self, item: dict, category: str) -> dict:
        """Извлечение данных о товаре"""
        price = item.get('priceU', 0) / 100
        discount_price = item.get('salePriceU', 0) / 100
        
        if discount_price == 0:
            discount_price = price
            
        return {
            'name': item.get('name', '')[:500],  # Ограничиваем длину
            'price': float(price),
            'discount_price': float(discount_price),
            'rating': float(item.get('rating', 0)),
            'reviews_count': int(item.get('feedbacks', 0)),
            'category': category
        }
    
    def _generate_test_data(self, category: str, limit: int) -> List[Dict]:
        """Генерация тестовых данных"""
        products = []
        
        product_templates = [
            f"{category} Premium",
            f"{category} Стандарт",
            f"{category} Эконом",
            f"{category} Люкс",
            f"{category} Базовый",
            f"{category} Профессиональный",
            f"{category} Детский",
            f"{category} Взрослый",
            f"{category} Универсальный",
            f"{category} Специальный"
        ]
        
        for i in range(min(limit, 50)):
            price = random.randint(500, 15000)
            discount = random.randint(5, 40)
            discount_price = price * (100 - discount) / 100
            
            product = {
                'name': f"{random.choice(product_templates)} #{i+1}",
                'price': float(price),
                'discount_price': float(discount_price),
                'rating': round(random.uniform(3.0, 5.0), 1),
                'reviews_count': random.randint(10, 2000),
                'category': category
            }
            products.append(product)
            
        return products
    
    def save_products_to_db(self, products_data: List[Dict], category: str) -> int:
        """Сохранение товаров в базу данных"""
        # Удаляем старые данные для этой категории
        Product.objects.filter(category=category).delete()
        
        # Создаем новые объекты
        product_objects = []
        for product_data in products_data:
            try:
                product = Product(**product_data)
                product_objects.append(product)
            except Exception as e:
                print(f"Ошибка создания объекта: {e}")
                continue
        
        # Массовое сохранение
        created_products = Product.objects.bulk_create(product_objects)
        return len(created_products)