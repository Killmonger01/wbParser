from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=500, verbose_name='Название товара')
    price = models.FloatField(verbose_name='Цена')
    discount_price = models.FloatField(verbose_name='Цена со скидкой')
    rating = models.FloatField(verbose_name='Рейтинг')
    reviews_count = models.IntegerField(verbose_name='Количество отзывов')
    category = models.CharField(max_length=200, verbose_name='Категория')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    
    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def discount_percentage(self):
        if self.price > 0:
            return round((1 - self.discount_price / self.price) * 100, 1)
        return 0