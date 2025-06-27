# backend/routing.py
from django.urls import path
from products.consumer import ParseConsumer

websocket_urlpatterns = [
    path('ws/parse/', ParseConsumer.as_asgi()),
]
