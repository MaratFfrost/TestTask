from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time
import random
import re
from urllib.parse import quote
from celery import shared_task

from products.models import Product


def setup_driver():
    options = Options()
    options.add_argument("--headless")
    options.set_preference("dom.webdriver.enabled", False)
    options.set_preference("useAutomationExtension", False)
    options.set_preference("extensions.logging.enabled", False)
    options.set_preference("browser.download.folderList", 2)
    options.set_preference("browser.helperApps.neverAsk.saveToDisk", "application/octet-stream")

    options.set_preference("permissions.default.image", 0)
    options.set_preference("dom.ipc.plugins.enabled.libflashplayer.so", False)

    service = Service(executable_path='/usr/local/bin/geckodriver')

    try:
        driver = webdriver.Firefox(service=service, options=options)
        return driver
    except Exception as e:
        raise Exception(f"Failed to initialize Firefox driver: {str(e)}")


def extract_price(text):
    if not text:
        return None
    match = re.search(r'[\d\s]+₽', text)
    return match.group(0).strip() if match else text.strip()


def parse_search(query, max_items=20,):
    driver = setup_driver()
    try:
        encoded_query = quote(query)
        url = f"https://www.wildberries.ru/catalog/0/search.aspx?search={encoded_query}"

        driver.get(url)

        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((
                By.CSS_SELECTOR,
                "article[data-nm-id]"))
        )

        last_height = driver.execute_script("return document.body.scrollHeight")
        while len(driver.find_elements(By.CSS_SELECTOR, "article[data-nm-id]")) < max_items:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(random.uniform(1, 2))
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

        soup = BeautifulSoup(driver.page_source, 'html.parser')
        products = []

        for card in soup.find_all('article', attrs={'data-nm-id': True}):
            if len(products) >= max_items:
                break

            name_tag = card.select_one('.product-card__name')
            name = name_tag.get_text(strip=True) if name_tag else ''
            full_name = f"{name}".strip()

            curr = card.select_one('.price__lower-price')
            old = card.select_one('.price__old-price, del')
            current_price = extract_price(curr.get_text()) if curr else None
            old_price = extract_price(old.get_text()) if old else None

            rating = None
            reviews = None
            rating_tag = card.select_one('.address-rate-mini')
            reviews_tag = card.select_one('.product-card__count')
            if rating_tag:
                rating = rating_tag.get_text(strip=True)
            if reviews_tag:
                reviews = reviews_tag.get_text(strip=True)

            products.append({
                'name': full_name[1:],
                'current_price': float(current_price.replace('₽', '').replace(' ', '').replace('\xa0', '')),
                'old_price': float(old_price.replace('₽', '').replace(' ', '').replace('\xa0', '')),
                'rating': float(rating.replace(',', '.')) if rating else 0,
                'reviews_count': int(reviews.replace('\xa0', '').split()[0]) if reviews.replace('\xa0', '').split()[0] != 'Нет' else 0
            })

        return products

    finally:
        driver.quit()


@shared_task(bind=True)
def parse_wb_task(self, query,
                  min_price=None,
                  max_price=None,
                  min_rating=None,
                  max_items=30):
    try:
        if isinstance(query, bytes):
            query = query.decode('utf-8')
        filters = {}

        if min_price is not None:
            min_price = float(min_price)
            filters['min_price'] = min_price
        if max_price is not None:
            max_price = float(max_price)
            filters['max_price'] = max_price
        if min_rating is not None:
            min_rating = float(min_rating)
            filters['min_rating'] = min_rating

        products = parse_search(query)

        filtered_products = []
        for p in products:
            price = p['current_price']
            rating = p['rating']

            if 'min_price' in filters and price < filters['min_price']:
                continue
            if 'max_price' in filters and price > filters['max_price']:
                continue
            if 'min_rating' in filters and rating < filters['min_rating']:
                continue

            filtered_products.append(p)

        for p in filtered_products:
            Product.objects.create(
                name=p.get('name'),
                price=p.get('current_price'),
                discount_price=p.get('old_price'),
                rating=p.get('rating'),
                review_count=p.get('reviews_count')
            )

        return {
            'status': 'success',
            'items_parsed': len(filtered_products),
            'min_price': min_price,
            'max_price': max_price,
            'min_rating': min_rating,
            'max_items': max_items,
            'products': filtered_products,
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
            'query': f'{query}'
        }
