from rest_framework.decorators import api_view
from rest_framework.response import Response
from products.models import Product

# Create your views here.


@api_view(['GET'])
def get_products(request):
    try:
        params = {
            'min_price': request.query_params.get('min_price'),
            'max_price': request.query_params.get('max_price'),
            'min_rating': request.query_params.get('min_rating'),
            'max_rating': request.query_params.get('max_rating')
        }

        filters = {}
        for key, value in params.items():
            if value is not None:
                try:
                    filters[key] = float(value)
                except ValueError:
                    return Response(
                        {'error': f'Некорректное значение для {key}'},
                        status=400
                    )

        queryset = Product.objects.all()

        if 'min_price' in filters:
            queryset = queryset.filter(price__gte=filters['min_price'])
        if 'max_price' in filters:
            queryset = queryset.filter(price__lte=filters['max_price'])
        if 'min_rating' in filters:
            queryset = queryset.filter(rating__gte=filters['min_rating'])
        if 'max_rating' in filters:
            queryset = queryset.filter(rating__lte=filters['max_rating'])

        results = [{
            'id': product.id,
            'name': product.name,
            'price': product.price,
            'discount_price': product.discount_price,
            'rating': product.rating,
            'reviews': product.review_count,
        } for product in queryset]

        return Response({'count': len(results), 'results': results})

    except Exception as e:
        return Response({'error': str(e)}, status=500)
