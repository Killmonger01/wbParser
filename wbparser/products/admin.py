from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'discount_price', 'rating', 'reviews_count', 'created_at']
    list_filter = ['category', 'rating', 'created_at']
    search_fields = ['name', 'category']
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()