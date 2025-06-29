from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('parse/', views.parse_products, name='parse-products'),
    path('categories/', views.get_categories, name='get-categories'),
    path('statistics/', views.get_statistics, name='get-statistics'),
    path('price-distribution/', views.get_price_distribution, name='price-distribution'),
]