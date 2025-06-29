from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Avg, Count, Min, Max
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from .models import Product
from .serializers import ProductSerializer
from .filters import ProductFilter
from .parsers import WildberriesParser

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ProductFilter
    ordering_fields = ['name', 'price', 'discount_price', 'rating', 'reviews_count', 'created_at']
    ordering = ['-created_at']

@api_view(['POST'])
def parse_products(request):
    """Парсинг товаров и сохранение в БД"""
    query = request.data.get('query')
    limit = request.data.get('limit', 100)
    
    if not query:
        return Response(
            {'error': 'Параметр query обязателен'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        parser = WildberriesParser()
        products_data = parser.search_products(query, limit)
        saved_count = parser.save_products_to_db(products_data, query)
        
        return Response({
            'message': f'Успешно спарсено и сохранено {saved_count} товаров',
            'category': query,
            'count': saved_count
        })
        
    except Exception as e:
        return Response(
            {'error': f'Ошибка парсинга: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_categories(request):
    """Получение списка доступных категорий"""
    categories = Product.objects.values_list('category', flat=True).distinct()
    return Response(list(categories))

@api_view(['GET'])
def get_statistics(request):
    """Получение статистики по товарам"""
    stats = Product.objects.aggregate(
        total_products=Count('id'),
        avg_price=Avg('discount_price'),
        avg_rating=Avg('rating'),
        min_price=Min('discount_price'),
        max_price=Max('discount_price'),
        avg_reviews=Avg('reviews_count')
    )
    
    # Округляем значения
    for key, value in stats.items():
        if value is not None and isinstance(value, float):
            stats[key] = round(value, 2)
    
    return Response(stats)

@api_view(['GET'])
def get_price_distribution(request):
    """Получение распределения товаров по ценовым диапазонам"""
    from django.db.models import Q, Case, When, IntegerField
    
    distribution = Product.objects.aggregate(
        range_0_5k=Count('id', filter=Q(discount_price__lt=5000)),
        range_5k_10k=Count('id', filter=Q(discount_price__gte=5000, discount_price__lt=10000)),
        range_10k_20k=Count('id', filter=Q(discount_price__gte=10000, discount_price__lt=20000)),
        range_20k_30k=Count('id', filter=Q(discount_price__gte=20000, discount_price__lt=30000)),
        range_30k_plus=Count('id', filter=Q(discount_price__gte=30000))
    )
    
    # Преобразуем в формат для графика
    chart_data = [
        {'range': '0-5k', 'count': distribution['range_0_5k']},
        {'range': '5k-10k', 'count': distribution['range_5k_10k']},
        {'range': '10k-20k', 'count': distribution['range_10k_20k']},
        {'range': '20k-30k', 'count': distribution['range_20k_30k']},
        {'range': '30k+', 'count': distribution['range_30k_plus']},
    ]
    
    return Response(chart_data)