from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

# Create your models here.

# Поля: название товара, цена,
# цена со скидкой, рейтинг, количество отзывов.


class Product(models.Model):
    name = models.CharField(
        max_length=255,
        null=False,
        blank=False,
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        db_index=True,
        null=False,
        blank=False,
        validators=[MinValueValidator(0)]
    )
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        db_index=True,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    rating = models.DecimalField(
        null=True,
        max_digits=3,
        decimal_places=1,
        db_index=True,
        validators=[
            MinValueValidator(0),
            MaxValueValidator(5)
        ]
    )
    review_count = models.IntegerField(
        null=True,
        db_index=True,
        default=0,
        validators=[MinValueValidator(0)]
    )

    def __str__(self):
        return self.name
