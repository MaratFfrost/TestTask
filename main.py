from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time
import random
import re
import urllib.parse


def setup_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--ignore-certificate-errors")
    options.add_argument("--ignore-ssl-errors")
    prefs = {"profile.managed_default_content_settings.images": 0}
    options.add_experimental_option("prefs", prefs)

    driver = webdriver.Chrome(options=options)
    return driver


def extract_price(text):
    if not text:
        return None
    match = re.search(r'[\d\s]+₽', text)
    return match.group(0).strip() if match else text.strip()


def parse_search(query, max_items=20):
    driver = setup_driver()
    start_time = time.time()
    try:
        encoded_query = urllib.parse.quote_plus(query)
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
        seen = set()
        products = []

        for card in soup.find_all('article', attrs={'data-nm-id': True}):
            if len(products) >= max_items:
                break
            nm_id = card['data-nm-id']
            if nm_id in seen:
                continue
            seen.add(nm_id)

            name_tag = card.select_one('.product-card__name')
            brand_tag = card.select_one('.product-card__brand')
            name = name_tag.get_text(strip=True) if name_tag else ''
            brand = brand_tag.get_text(strip=True) if brand_tag else ''
            full_name = f"{brand} {name}".strip()

            curr = card.select_one('.price__lower-price')
            old = card.select_one('.price__old-price, del')
            current_price = extract_price(curr.get_text()) if curr else None
            old_price = extract_price(old.get_text()) if old else None

            discount = None
            tip_sale = card.select_one('.product-card__tip--sale')
            pct = card.select_one('.percentage-sale')
            if tip_sale:
                discount = tip_sale.get_text(strip=True)
            elif pct:
                discount = pct.get_text(strip=True)
            elif old_price and current_price:
                try:
                    op = float(old_price.replace('₽', '').replace(' ', ''))
                    cp = float(current_price.replace('₽', '').replace(' ', ''))
                    discount = f"-{int((1 - cp/op)*100)}%"
                except Exception:
                    pass

            rating = None
            reviews = None
            rating_tag = card.select_one('.address-rate-mini')
            reviews_tag = card.select_one('.product-card__count')
            if rating_tag:
                rating = rating_tag.get_text(strip=True)
            if reviews_tag:
                reviews = reviews_tag.get_text(strip=True)

            products.append({
                'nm_id': nm_id,
                'name': full_name,
                'current_price': current_price,
                'old_price': old_price,
                'discount': discount,
                'rating': rating,
                'reviews_count': reviews
            })

        return products

    finally:
        driver.quit()
        print(f"Завершено за {time.time() - start_time:.2f} секунд")


if __name__ == "__main__":
    query = input("Что вы хотите найти на Wildberries? ")
    products = parse_search(query.strip(), max_items=20)

    if products:
        print(f"\nНайдено {len(products)} товаров по запросу: «{query}»\n")
        for i, p in enumerate(products, 1):
            print(f"{i}. {p['name']} — {p['current_price'] or 'Нет цены'} "
                  f"{'(было ' + p['old_price'] + ')' if p['old_price'] else ''} "
                  f"{p['discount'] or ''} | рейтинг: {p['rating'] or '-'} | отзывов: {p['reviews_count'] or '-'}")
    else:
        print("Не удалось найти товары по запросу.")
