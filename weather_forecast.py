import requests
import pandas as pd
from datetime import datetime, timedelta
import time

# ============================================
# KONFIGURÁCIA
# ============================================
API_KEY = "c3a7a361c9f93f47695f49882f029b3d"
BASE_URL = "https://api.openweathermap.org/data/2.5"

# Zoznam regiónov a ich miest
REGIONS = {
    # CALIFORNIA
    "Southern California": ["Los Angeles", "San Diego", "Riverside", "Anaheim", "Long Beach"],
    "Central California": ["Fresno", "Bakersfield", "Modesto", "Stockton", "Visalia"],
    "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "Fresno"],
    "San Diego": ["San Diego"],
    "Los Angeles": ["Los Angeles"],

    # TEXAS
    "Dallas Texas": ["Dallas"],
    "Austin Texas": ["Austin"],
    "Houston Texas": ["Houston"],
    "Central Texas": ["Austin", "San Antonio", "Waco", "Round Rock", "Temple"],

    # FLORIDA
    "Jacksonville": ["Jacksonville"],
    "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"],
    "South Florida": ["Miami", "Fort Lauderdale", "West Palm Beach", "Hollywood", "Hialeah"],
    "North Florida": ["Jacksonville", "Tallahassee", "Gainesville", "Pensacola", "Panama City"],

    # NEW YORK
    "New York": ["New York City", "Buffalo", "Rochester", "Syracuse", "Albany"],

    # PENNSYLVANIA
    "Pittsburgh PA": ["Pittsburgh"],
    "Western PA": ["Pittsburgh", "Erie", "Altoona", "Johnstown", "Meadville"],
    "Central PA": ["Harrisburg", "State College", "Altoona", "Williamsport", "Lancaster"],
    "Pennsylvania": ["Philadelphia", "Pittsburgh", "Harrisburg", "Allentown", "Erie"],
    "Philadelphia": ["Philadelphia"],

    # ILLINOIS
    "Illinois": ["Chicago", "Aurora", "Rockford", "Springfield", "Peoria"],
    "Chicago": ["Chicago"],

    # OHIO
    "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"],

    # NORTH CAROLINA
    "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Wilmington"],

    # MICHIGAN
    "Metro Detroit": ["Detroit", "Warren", "Sterling Heights", "Ann Arbor", "Dearborn"],

    # NEW JERSEY
    "New Jersey": ["Newark", "Jersey City", "Paterson", "Trenton", "Atlantic City"],

    # WASHINGTON
    "Washington": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
    "Washington DC": ["Washington"],

    # ARIZONA
    "Arizona": ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Flagstaff"],

    # TENNESSEE
    "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],

    # MASSACHUSETTS
    "Massachusetts": ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"],

    # INDIANA
    "Indiana": ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel"],

    # MARYLAND
    "Maryland": ["Baltimore", "Rockville", "Frederick", "Gaithersburg", "Annapolis"],

    # MISSOURI
    "Missouri": ["Kansas City", "St. Louis", "Springfield", "Columbia", "Jefferson City"],

    # WISCONSIN
    "Wisconsin": ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"],

    # COLORADO
    "Colorado": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Boulder"],

    # MINNESOTA
    "Minnesota": ["Minneapolis", "Saint Paul", "Rochester", "Duluth", "Bloomington"],

    # SOUTH CAROLINA
    "South Carolina": ["Columbia", "Charleston", "Greenville", "Myrtle Beach", "Rock Hill"],

    # ALABAMA
    "Alabama": ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"],

    # LOUISIANA
    "Louisiana": ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],

    # OREGON
    "Oregon": ["Portland", "Salem", "Eugene", "Bend", "Medford"],

    # CONNECTICUT
    "Connecticut": ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury"],

    # UTAH
    "Utah": ["Salt Lake City", "Provo", "West Valley City", "Ogden", "St. George"],
}

# Smer vetra v stupňoch na text
def get_wind_direction(degrees):
    directions = ["S", "SV", "V", "JV", "J", "JZ", "Z", "SZ"]
    index = round(degrees / 45) % 8
    return directions[index]

# Konverzia Unix timestamp na čas
def unix_to_time(timestamp, timezone_offset=0):
    dt = datetime.utcfromtimestamp(timestamp + timezone_offset)
    return dt.strftime("%H:%M")

# Konverzia Unix timestamp na dátum
def unix_to_date(timestamp, timezone_offset=0):
    dt = datetime.utcfromtimestamp(timestamp + timezone_offset)
    return dt.strftime("%Y-%m-%d")

# Získanie súradníc mesta
def get_coordinates(city_name, country="US"):
    url = f"http://api.openweathermap.org/geo/1.0/direct"
    params = {
        "q": f"{city_name},{country}",
        "limit": 1,
        "appid": API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()
    if data:
        return data[0]["lat"], data[0]["lon"]
    return None, None

# Získanie predpovede pre mesto
def get_forecast(lat, lon):
    # Použijeme One Call API 2.5 pre hodinovú predpoveď a alerts
    url = f"{BASE_URL}/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric",
        "lang": "en"
    }
    response = requests.get(url, params=params)
    return response.json()

# Získanie aktuálneho počasia (pre východ/západ slnka)
def get_current_weather(lat, lon):
    url = f"{BASE_URL}/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": API_KEY,
        "units": "metric",
        "lang": "en"
    }
    response = requests.get(url, params=params)
    return response.json()

# Hlavná funkcia na spracovanie všetkých regiónov
def process_all_regions():
    hourly_data = []
    daily_data = []

    # Získame zajtrajší dátum
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

    total_cities = sum(len(cities) for cities in REGIONS.values())
    processed = 0

    print(f"Spracovávam {total_cities} miest pre {len(REGIONS)} regiónov...")
    print(f"Predpoveď na: {tomorrow}")
    print("-" * 50)

    for region, cities in REGIONS.items():
        print(f"\n📍 {region}:")

        region_temps = []
        region_rain_probs = []
        region_snow = []
        region_wind = []

        for city in cities:
            processed += 1
            print(f"   [{processed}/{total_cities}] {city}...", end=" ")

            try:
                # Získame súradnice
                lat, lon = get_coordinates(city)
                if lat is None:
                    print("❌ Mesto nenájdené")
                    continue

                # Získame predpoveď
                forecast = get_forecast(lat, lon)
                current = get_current_weather(lat, lon)

                if "list" not in forecast:
                    print("❌ Chyba API")
                    continue

                timezone_offset = forecast.get("city", {}).get("timezone", 0)

                # Filtrovanie na zajtra
                tomorrow_forecasts = []
                for item in forecast["list"]:
                    item_date = unix_to_date(item["dt"], timezone_offset)
                    if item_date == tomorrow:
                        tomorrow_forecasts.append(item)

                if not tomorrow_forecasts:
                    print("❌ Žiadne dáta pre zajtra")
                    continue

                # Hodinové dáta
                for item in tomorrow_forecasts:
                    hour_time = unix_to_time(item["dt"], timezone_offset)

                    hourly_row = {
                        "region": region,
                        "city": city,
                        "date": tomorrow,
                        "time": hour_time,
                        "temp": round(item["main"]["temp"], 1),
                        "feels_like": round(item["main"]["feels_like"], 1),
                        "humidity": item["main"]["humidity"],
                        "pressure": item["main"]["pressure"],
                        "clouds": item["clouds"]["all"],
                        "wind_speed": round(item["wind"]["speed"] * 3.6, 1),  # m/s na km/h
                        "wind_gust": round(item["wind"].get("gust", 0) * 3.6, 1),
                        "wind_direction": item["wind"]["deg"],
                        "wind_direction_text": get_wind_direction(item["wind"]["deg"]),
                        "rain_3h": item.get("rain", {}).get("3h", 0),
                        "snow_3h": item.get("snow", {}).get("3h", 0),
                        "rain_probability": round(item.get("pop", 0) * 100),
                        "weather_main": item["weather"][0]["main"],
                        "weather_description": item["weather"][0]["description"],
                        "visibility": item.get("visibility", 10000) / 1000,  # m na km
                    }
                    hourly_data.append(hourly_row)

                # Denný súhrn
                temps = [f["main"]["temp"] for f in tomorrow_forecasts]
                feels = [f["main"]["feels_like"] for f in tomorrow_forecasts]
                winds = [f["wind"]["speed"] * 3.6 for f in tomorrow_forecasts]
                gusts = [f["wind"].get("gust", 0) * 3.6 for f in tomorrow_forecasts]
                rain_probs = [f.get("pop", 0) * 100 for f in tomorrow_forecasts]
                rain_mm = sum(f.get("rain", {}).get("3h", 0) for f in tomorrow_forecasts)
                snow_mm = sum(f.get("snow", {}).get("3h", 0) for f in tomorrow_forecasts)
                humidity = [f["main"]["humidity"] for f in tomorrow_forecasts]
                clouds = [f["clouds"]["all"] for f in tomorrow_forecasts]

                # Rozdelenie dňa na časti
                morning = [f for f in tomorrow_forecasts if 6 <= int(unix_to_time(f["dt"], timezone_offset).split(":")[0]) < 12]
                afternoon = [f for f in tomorrow_forecasts if 12 <= int(unix_to_time(f["dt"], timezone_offset).split(":")[0]) < 18]
                evening = [f for f in tomorrow_forecasts if 18 <= int(unix_to_time(f["dt"], timezone_offset).split(":")[0]) < 24]
                night = [f for f in tomorrow_forecasts if 0 <= int(unix_to_time(f["dt"], timezone_offset).split(":")[0]) < 6]

                # Detekcia búrok
                storm_alerts = []
                for item in tomorrow_forecasts:
                    weather_main = item["weather"][0]["main"].lower()
                    weather_desc = item["weather"][0]["description"].lower()
                    if any(word in weather_main or word in weather_desc for word in ["thunder", "storm", "tornado", "hurricane"]):
                        storm_alerts.append(f"{unix_to_time(item['dt'], timezone_offset)}: {item['weather'][0]['description']}")

                daily_row = {
                    "region": region,
                    "city": city,
                    "date": tomorrow,
                    "temp_min": round(min(temps), 1),
                    "temp_max": round(max(temps), 1),
                    "temp_avg": round(sum(temps) / len(temps), 1),
                    "feels_like_min": round(min(feels), 1),
                    "feels_like_max": round(max(feels), 1),
                    "temp_morning": round(sum(f["main"]["temp"] for f in morning) / len(morning), 1) if morning else None,
                    "temp_afternoon": round(sum(f["main"]["temp"] for f in afternoon) / len(afternoon), 1) if afternoon else None,
                    "temp_evening": round(sum(f["main"]["temp"] for f in evening) / len(evening), 1) if evening else None,
                    "temp_night": round(sum(f["main"]["temp"] for f in night) / len(night), 1) if night else None,
                    "humidity_avg": round(sum(humidity) / len(humidity)),
                    "clouds_avg": round(sum(clouds) / len(clouds)),
                    "wind_avg": round(sum(winds) / len(winds), 1),
                    "wind_max": round(max(winds), 1),
                    "wind_gust_max": round(max(gusts), 1),
                    "rain_probability_max": round(max(rain_probs)),
                    "rain_total_mm": round(rain_mm, 1),
                    "snow_total_mm": round(snow_mm, 1),
                    "sunrise": unix_to_time(current["sys"]["sunrise"], timezone_offset) if "sys" in current else None,
                    "sunset": unix_to_time(current["sys"]["sunset"], timezone_offset) if "sys" in current else None,
                    "weather_main": tomorrow_forecasts[len(tomorrow_forecasts)//2]["weather"][0]["main"],
                    "weather_description": tomorrow_forecasts[len(tomorrow_forecasts)//2]["weather"][0]["description"],
                    "storm_alerts": "; ".join(storm_alerts) if storm_alerts else "None",
                    "has_storms": len(storm_alerts) > 0,
                }
                daily_data.append(daily_row)

                # Pre regionálny súhrn
                region_temps.extend(temps)
                region_rain_probs.extend(rain_probs)
                region_snow.append(snow_mm)
                region_wind.extend(winds)

                print("✅")

                # Pauza medzi API volaniami (limit 60/min pre free tier)
                time.sleep(1.1)

            except Exception as e:
                print(f"❌ Chyba: {str(e)}")
                continue

    return hourly_data, daily_data

# Uloženie do Excelu - všetko v jednom liste
def save_to_excel(hourly_data, daily_data):
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    filename = f"weather_forecast_{tomorrow}.xlsx"

    df_hourly = pd.DataFrame(hourly_data)
    df_daily = pd.DataFrame(daily_data)

    # Pridáme stĺpec na rozlíšenie typu záznamu
    df_daily["record_type"] = "DAILY_SUMMARY"
    df_hourly["record_type"] = "HOURLY"

    # Spojíme všetko do jedného DataFrame
    df_combined = pd.concat([df_daily, df_hourly], ignore_index=True)

    # Zoradíme podľa regiónu, mesta a času
    df_combined = df_combined.sort_values(by=["region", "city", "record_type", "time"],
                                           ascending=[True, True, False, True],
                                           na_position='first')

    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        df_combined.to_excel(writer, sheet_name='weather_data', index=False)

    print(f"\n{'='*50}")
    print(f"✅ Súbor uložený: {filename}")
    print(f"   - {len(df_daily)} denných záznamov")
    print(f"   - {len(df_hourly)} hodinových záznamov")
    print(f"   - Všetko v jednom liste 'weather_data'")
    print(f"{'='*50}")

    return filename

# Hlavný program
if __name__ == "__main__":
    print("="*50)
    print("🌤️  WEATHER FORECAST GENERATOR")
    print("="*50)

    hourly, daily = process_all_regions()

    if daily:
        save_to_excel(hourly, daily)
    else:
        print("❌ Žiadne dáta na uloženie")
