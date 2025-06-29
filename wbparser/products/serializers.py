from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    discount_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'discount_price', 
            'rating', 'reviews_count', 'category', 
            'created_at', 'discount_percentage'
        ]
