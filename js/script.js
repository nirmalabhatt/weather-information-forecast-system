// OpenWeatherMap API Key and Endpoints
let weatherAPIkey = "401f3318ac6b60111e36cab977792676";
let weatherBaseEndPoint = "https://api.openweathermap.org/data/2.5/weather?&appid=" + weatherAPIkey + "&units=metric";
let forecastBaseEndPoint = "https://api.openweathermap.org/data/2.5/forecast?units=metric&appid=" + weatherAPIkey;
let geocodingBaseEndpoint = "https://api.openweathermap.org/geo/1.0/direct?limit=5&appid=" + weatherAPIkey + "&q=";

// DOM Elements - Preserved Selectors
let datalist = document.querySelector("#suggestions");
let searchInp = document.querySelector(".weather_search");
let city = document.querySelector(".weather_city");
let day = document.querySelector(".weather_day");
let humidity = document.querySelector(".weather_indicator--humidity>.value");
let wind = document.querySelector(".weather_indicator--wind>.value");
let pressure = document.querySelector(".weather_indicator--pressure>.value");
let temperature = document.querySelector(".weather_temperature>.value");
let image = document.querySelector(".weather_image");
let forecastBlock = document.querySelector(".weather_forecast");

// DOM Elements - Extended Functionality Selectors
let weatherCondition = document.querySelector("#weather_condition");
let locationBtn = document.querySelector("#location_btn");
let loadingSpinner = document.querySelector("#loading_spinner");
let unitCBtn = document.querySelector("#unit_c");
let unitFBtn = document.querySelector("#unit_f");
let unitSymbol = document.querySelector(".unit_symbol");
let recentContainer = document.querySelector("#recent_searches_container");
let recentTags = document.querySelector("#recent_tags");
let clearRecentBtn = document.querySelector("#clear_recent_btn");
let hourlyContainer = document.querySelector("#hourly_container");

// Detailed Cards DOM Elements
let detailFeelsLike = document.querySelector("#detail_feels_like");
let detailHumidity = document.querySelector("#detail_humidity");
let detailWind = document.querySelector("#detail_wind");
let detailPressure = document.querySelector("#detail_pressure");
let detailVisibility = document.querySelector("#detail_visibility");
let detailSunrise = document.querySelector("#detail_sunrise");
let detailSunset = document.querySelector("#detail_sunset");

// Weather Condition Image Mapping - Preserved
let weatherImages = [
  {
    url: "images/broken-clouds.png",
    ids: [803, 804]
  },
  {
    url: "images/clear-sky.png",
    ids: [800]
  },
  {
    url: "images/few-clouds.png",
    ids: [801]
  },
  {
    url: "images/mist.png",
    ids: [701, 711, 721, 731, 741, 751, 761, 762, 771, 781]
  },
  {
    url: "images/rain.png",
    ids: [500, 501, 502, 503, 504]
  },
  {
    url: "images/scattered-clouds.png",
    ids: [802]
  },
  {
    url: "images/shower-rain.png",
    ids: [520, 521, 522, 531, 300, 301, 302, 310, 311, 312, 313, 314, 321]
  },
  {
    url: "images/snow.png",
    ids: [511, 600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622]
  },
  {
    url: "images/thunderstorm.png",
    ids: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232]
  }
];

// Application State Variables
let currentUnit = 'C'; // 'C' for Celsius, 'F' for Fahrenheit
let currentWeatherData = null;
let currentForecastFull = null;
let currentDailyForecast = [];
let tempChartInstance = null;

// Common Country Name / Alias Map to ISO 2-letter Country Codes
let countryAliasMap = {
  "united kingdom": "GB",
  "uk": "GB",
  "england": "GB",
  "great britain": "GB",
  "united states": "US",
  "united states of america": "US",
  "usa": "US",
  "us": "US",
  "united arab emirates": "AE",
  "uae": "AE",
  "india": "IN",
  "japan": "JP",
  "france": "FR",
  "canada": "CA",
  "australia": "AU",
  "germany": "DE",
  "italy": "IT",
  "spain": "ES",
  "china": "CN",
  "russia": "RU",
  "brazil": "BR"
};

// Helper: Country Code to Full Country Name Resolver
let getCountryName = (code) => {
  if (!code) return "";
  try {
    let regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code) || code;
  } catch (e) {
    return code;
  }
};

// Helper: Temperature Formatting based on Unit
let formatTemp = (tempInCelsius) => {
  if (tempInCelsius === undefined || tempInCelsius === null) return "--";
  let val = tempInCelsius;
  if (currentUnit === 'F') {
    val = (tempInCelsius * 9 / 5) + 32;
  }
  let rounded = Math.round(val);
  return rounded > 0 ? "+" + rounded : "" + rounded;
};

// Helper: Local Time Formatting using target city UTC offset
let formatLocalTime = (unixSec, timezoneOffsetSec) => {
  if (!unixSec) return "--";
  let dateObj = new Date((unixSec + (timezoneOffsetSec || 0)) * 1000);
  let hours = dateObj.getUTCHours();
  let minutes = dateObj.getUTCMinutes();
  let ampm = hours >= 12 ? "PM" : "AM";
  let displayHours = hours % 12 || 12;
  let displayMinutes = minutes < 10 ? "0" + minutes : minutes;
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

// Preserved Core API Functions
let getWeatherByCityName = async (cityName) => {
  let endPoint = weatherBaseEndPoint + "&q=" + encodeURIComponent(cityName);
  let response = await fetch(endPoint);
  let weather = await response.json();
  return weather;
};

let getForecastByCityID = async (id) => {
  let endpoint = forecastBaseEndPoint + "&id=" + id;
  let result = await fetch(endpoint);
  let forecast = await result.json();
  currentForecastFull = forecast;
  let forecastList = forecast.list || [];
  let daily = [];
  forecastList.forEach((day) => {
    let date_txt = day.dt_txt;
    date_txt = date_txt.replace(" ", "t");
    let date = new Date(date_txt);
    let hours = date.getHours();
    if (hours === 12) {
      daily.push(day);
    }
  });
  return daily;
};

// Extended Geolocation & Coordinates API Functions
let getWeatherByCoords = async (lat, lon) => {
  let endpoint = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherAPIkey}`;
  let response = await fetch(endpoint);
  return await response.json();
};

let getForecastByCoords = async (lat, lon) => {
  let endpoint = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${weatherAPIkey}`;
  let response = await fetch(endpoint);
  let forecast = await response.json();
  currentForecastFull = forecast;
  let forecastList = forecast.list || [];
  let daily = [];
  forecastList.forEach((day) => {
    let date_txt = day.dt_txt;
    date_txt = date_txt.replace(" ", "t");
    let date = new Date(date_txt);
    let hours = date.getHours();
    if (hours === 12) {
      daily.push(day);
    }
  });
  return daily;
};

// Geocoding Helper: Robust worldwide city resolver with multi-tier fallbacks
let getCityGeoLocation = async (cityName) => {
  if (!cityName || !cityName.trim()) return null;
  let queryStr = cityName.trim();

  let attempts = [queryStr];

  // If query contains comma (e.g., "London, United Kingdom" or "London, GB")
  let parts = queryStr.split(",").map((p) => p.trim());
  if (parts.length > 1) {
    let lastPartLower = parts[parts.length - 1].toLowerCase();
    if (countryAliasMap[lastPartLower]) {
      let convertedQuery = parts.slice(0, parts.length - 1).join(",") + "," + countryAliasMap[lastPartLower];
      attempts.push(convertedQuery);
    }
    // Also try just the main city name segment before the first comma
    attempts.push(parts[0]);
  }

  for (let q of attempts) {
    try {
      let endpoint = geocodingBaseEndpoint + encodeURIComponent(q);
      let response = await fetch(endpoint);
      let results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        return results;
      }
    } catch (err) {
      console.error("Geocoding fetch error for query:", q, err);
    }
  }

  return null;
};

// Preserved Day of Week Function
let dayOfWeek = (dt = new Date().getTime()) => {
  let today = new Date(dt).toLocaleDateString("en-EN", { weekday: "long" });
  return today;
};

// Preserved and Extended Current Weather Update Function
let updateCurrentWeather = (data) => {
  currentWeatherData = data;

  let countryDisplay = getCountryName(data.sys && data.sys.country);
  let countryStr = countryDisplay ? `, ${countryDisplay}` : "";
  city.innerText = data.name + countryStr;
  day.innerText = dayOfWeek();

  if (weatherCondition && data.weather && data.weather[0]) {
    weatherCondition.innerText = data.weather[0].description;
  }

  humidity.innerText = data.main.humidity;
  pressure.innerText = data.main.pressure;

  let windDirection;
  let deg = data.wind.deg;
  if (deg > 45 && deg <= 135) {
    windDirection = "East";
  } else if (deg > 135 && deg <= 255) {
    windDirection = "South";
  } else if (deg > 255 && deg <= 315) {
    windDirection = "West";
  } else {
    windDirection = "North";
  }
  wind.innerText = windDirection + ", " + data.wind.speed;

  temperature.innerText = formatTemp(data.main.temp);
  if (unitSymbol) unitSymbol.innerText = currentUnit;

  let imgID = data.weather[0].id;
  weatherImages.forEach((obj) => {
    if (obj.ids.indexOf(imgID) !== -1) {
      image.src = obj.url;
    }
  });

  // Extended Weather Details Cards Update
  if (detailFeelsLike) detailFeelsLike.innerText = formatTemp(data.main.feels_like) + " °" + currentUnit;
  if (detailHumidity) detailHumidity.innerText = data.main.humidity + "%";
  if (detailWind) detailWind.innerText = windDirection + ", " + data.wind.speed + " m/s";
  if (detailPressure) detailPressure.innerText = data.main.pressure + " hPa";
  if (detailVisibility) {
    let visKm = (data.visibility / 1000).toFixed(1);
    detailVisibility.innerText = visKm + " km";
  }

  let tz = data.timezone || 0;
  if (detailSunrise && data.sys && data.sys.sunrise) {
    detailSunrise.innerText = formatLocalTime(data.sys.sunrise, tz);
  }
  if (detailSunset && data.sys && data.sys.sunset) {
    detailSunset.innerText = formatLocalTime(data.sys.sunset, tz);
  }
};

// Preserved and Extended 5-Day Forecast Update Function
let updateForecast = (forecast) => {
  currentDailyForecast = forecast;
  forecastBlock.innerHTML = "";
  let forecastItem = "";
  forecast.forEach((day) => {
    let iconUrl = "https://openweathermap.org/img/wn/" + day.weather[0].icon + "@2x.png";
    let tempStr = formatTemp(day.main.temp);
    let dayName = dayOfWeek(day.dt * 1000);
    forecastItem += `<article class="weather_forecast_item">
        <img
          src="${iconUrl}"
          alt="${day.weather[0].description}"
          class="weather_forecast_icon"
        />
        <h3 class="weather_forecast_day">${dayName}</h3>
        <p class="weather_forecast_temperature">
          <span class="value">${tempStr}</span> &deg;${currentUnit}
        </p>
      </article>`;
  });
  forecastBlock.innerHTML = forecastItem;
};

// New: Hourly Forecast Function (Next 24 Hours)
let updateHourlyForecast = () => {
  if (!hourlyContainer || !currentForecastFull || !currentForecastFull.list) return;
  let list = currentForecastFull.list.slice(0, 8); // Next 8 3-hour forecast slots (~24 hours)
  let tz = (currentForecastFull.city && currentForecastFull.city.timezone) || 0;

  let itemsHTML = "";
  list.forEach((item) => {
    let timeStr = formatLocalTime(item.dt, tz);
    let iconUrl = "https://openweathermap.org/img/wn/" + item.weather[0].icon + "@2x.png";
    let tempStr = formatTemp(item.main.temp) + "°" + currentUnit;
    let condStr = item.weather[0].main;
    let popStr = item.pop !== undefined ? Math.round(item.pop * 100) + "%" : "";

    itemsHTML += `
      <div class="hourly_item">
        <span class="hourly_time">${timeStr}</span>
        <img src="${iconUrl}" alt="${condStr}" class="hourly_icon" />
        <span class="hourly_temp">${tempStr}</span>
        <span class="hourly_cond">${condStr}</span>
        ${popStr ? `<span class="hourly_pop">💧 ${popStr}</span>` : ""}
      </div>
    `;
  });
  hourlyContainer.innerHTML = itemsHTML;
};

// New: Temperature Trend Chart Function (Chart.js)
let updateTemperatureChart = () => {
  let canvas = document.getElementById("tempTrendChart");
  if (!canvas || !currentForecastFull || !currentForecastFull.list) return;

  let list = currentForecastFull.list.slice(0, 8); // ~24 hour horizon
  let tz = (currentForecastFull.city && currentForecastFull.city.timezone) || 0;

  let labels = list.map((item) => formatLocalTime(item.dt, tz));
  let temps = list.map((item) => {
    let raw = item.main.temp;
    return currentUnit === "F" ? Math.round((raw * 9) / 5 + 32) : Math.round(raw);
  });

  // Destroy previous Chart instance properly before re-creating
  if (tempChartInstance) {
    tempChartInstance.destroy();
  }

  let ctx = canvas.getContext("2d");

  let gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(222, 250, 247, 0.4)");
  gradient.addColorStop(1, "rgba(222, 250, 247, 0.0)");

  tempChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: `Temperature (°${currentUnit})`,
          data: temps,
          borderColor: "#defaf7",
          backgroundColor: gradient,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#002fff",
          pointBorderColor: "#defaf7",
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#defaf7",
            font: { family: "Gowun Dodum", size: 14 }
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let sign = context.parsed.y > 0 ? "+" : "";
              return ` Temperature: ${sign}${context.parsed.y}°${currentUnit}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#defaf7", font: { family: "Gowun Dodum" } },
          grid: { color: "rgba(255, 255, 255, 0.1)" }
        },
        y: {
          ticks: {
            color: "#defaf7",
            font: { family: "Gowun Dodum" },
            callback: function (value) {
              return (value > 0 ? "+" : "") + value + "°" + currentUnit;
            }
          },
          grid: { color: "rgba(255, 255, 255, 0.1)" }
        }
      }
    }
  });
};

// Main Weather Controller Function for Worldwide Cities
let weatherForCity = async (cityInput) => {
  if (!cityInput || !cityInput.trim()) {
    Swal.fire({
      icon: "warning",
      title: "Please Enter City",
      text: "Please enter a city name to search weather."
    });
    return;
  }

  let cleanCity = cityInput.trim();
  showLoading();

  try {
    // 1. Resolve city query using OpenWeatherMap Direct Geocoding API (worldwide)
    let geoResults = await getCityGeoLocation(cleanCity);
    let weather = null;
    let lat = null;
    let lon = null;

    if (geoResults && geoResults.length > 0) {
      let topMatch = geoResults[0];
      lat = topMatch.lat;
      lon = topMatch.lon;
      weather = await getWeatherByCoords(lat, lon);
    }

    // 2. Fallback to direct city name API if geocoding did not return coordinates
    if (!weather || (weather.cod && weather.cod !== 200 && weather.cod !== "200")) {
      weather = await getWeatherByCityName(cleanCity);
    }

    if (weather.cod === "404" || weather.cod === 404) {
      hideLoading();
      Swal.fire({
        icon: "error",
        title: "City Not Found",
        text: "Please check the city name and try again."
      });
      return;
    }

    if (weather.cod && weather.cod !== 200 && weather.cod !== "200") {
      hideLoading();
      Swal.fire({
        icon: "error",
        title: "API Error",
        text: weather.message || "Unable to fetch weather data."
      });
      return;
    }

    updateCurrentWeather(weather);

    // Fetch forecast using coordinates or city ID
    let forecast;
    if (lat !== null && lon !== null) {
      forecast = await getForecastByCoords(lat, lon);
    } else {
      let cityID = weather.id;
      forecast = await getForecastByCityID(cityID);
    }

    updateForecast(forecast);
    updateHourlyForecast();
    updateTemperatureChart();

    let countryDisplay = getCountryName(weather.sys && weather.sys.country);
    let displayCity = weather.name + (countryDisplay ? `, ${countryDisplay}` : "");
    addRecentSearch(displayCity);
  } catch (error) {
    console.error("Fetch error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Failure",
      text: "Unable to fetch weather data. Please check your internet connection."
    });
  } finally {
    hideLoading();
  }
};

// Geolocation Weather Loader
let weatherForLocation = async (lat, lon) => {
  showLoading();
  try {
    let weather = await getWeatherByCoords(lat, lon);

    if (!weather || weather.cod !== 200) {
      hideLoading();
      Swal.fire({
        icon: "error",
        title: "Location Weather Error",
        text: "Unable to fetch weather for your location."
      });
      return;
    }

    updateCurrentWeather(weather);

    let forecast = await getForecastByCoords(lat, lon);
    updateForecast(forecast);
    updateHourlyForecast();
    updateTemperatureChart();

    if (weather.name) {
      let countryDisplay = getCountryName(weather.sys && weather.sys.country);
      let displayCity = weather.name + (countryDisplay ? `, ${countryDisplay}` : "");
      addRecentSearch(displayCity);
    }
  } catch (error) {
    console.error("Location fetch error:", error);
    Swal.fire({
      icon: "error",
      title: "Network Failure",
      text: "Unable to fetch weather data. Please check your internet connection."
    });
  } finally {
    hideLoading();
  }
};

// Geolocation Button Handler
let handleLocationClick = () => {
  if (!navigator.geolocation) {
    Swal.fire({
      icon: "error",
      title: "Unsupported Browser",
      text: "Geolocation is not supported by your browser."
    });
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    (position) => {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;
      weatherForLocation(lat, lon);
    },
    (error) => {
      hideLoading();
      let msg = "Unable to retrieve your location.";
      if (error.code === error.PERMISSION_DENIED) {
        msg = "Location permission denied. Please allow location access or search manually.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = "Location information is currently unavailable.";
      } else if (error.code === error.TIMEOUT) {
        msg = "Location request timed out.";
      }
      Swal.fire({
        icon: "error",
        title: "Location Error",
        text: msg
      });
    },
    { timeout: 10000 }
  );
};

// Recent Searches LocalStorage Manager
const RECENT_STORAGE_KEY = "weather_recent_cities_v1";

let getRecentSearches = () => {
  try {
    let raw = localStorage.getItem(RECENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

let addRecentSearch = (cityName) => {
  if (!cityName) return;
  let list = getRecentSearches();
  list = list.filter((item) => item.toLowerCase() !== cityName.toLowerCase());
  list.unshift(cityName);
  if (list.length > 5) {
    list = list.slice(0, 5);
  }
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
  renderRecentSearches();
};

let clearRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_STORAGE_KEY);
  } catch (e) {}
  renderRecentSearches();
};

let renderRecentSearches = () => {
  let list = getRecentSearches();
  if (!recentContainer) return;

  if (!list || list.length === 0) {
    recentContainer.classList.add("hidden");
    return;
  }

  recentContainer.classList.remove("hidden");
  if (recentTags) {
    recentTags.innerHTML = "";
    list.forEach((cityName) => {
      let chip = document.createElement("button");
      chip.type = "button";
      chip.className = "recent_chip";
      chip.innerText = cityName;
      chip.addEventListener("click", () => {
        searchInp.value = cityName;
        weatherForCity(cityName);
      });
      recentTags.appendChild(chip);
    });
  }
};

// UI Loading Indicator Manager
let showLoading = () => {
  if (loadingSpinner) loadingSpinner.classList.remove("hidden");
  if (searchInp) searchInp.disabled = true;
  if (locationBtn) locationBtn.disabled = true;
};

let hideLoading = () => {
  if (loadingSpinner) loadingSpinner.classList.add("hidden");
  if (searchInp) searchInp.disabled = false;
  if (locationBtn) locationBtn.disabled = false;
};

// °C / °F Unit Toggle Handler
let setUnit = (unit) => {
  if (currentUnit === unit) return;
  currentUnit = unit;

  if (unit === 'C') {
    if (unitCBtn) unitCBtn.classList.add("active");
    if (unitFBtn) unitFBtn.classList.remove("active");
  } else {
    if (unitFBtn) unitFBtn.classList.add("active");
    if (unitCBtn) unitCBtn.classList.remove("active");
  }

  // Update UI components with converted unit values instantly
  if (currentWeatherData) updateCurrentWeather(currentWeatherData);
  if (currentDailyForecast.length > 0) updateForecast(currentDailyForecast);
  updateHourlyForecast();
  updateTemperatureChart();
};

// Event Listeners & Worldwide City Geocoding Suggestions
searchInp.addEventListener("keydown", async (e) => {
  if (e.keyCode === 13) {
    weatherForCity(searchInp.value);
  }
});

searchInp.addEventListener("input", async () => {
  if (searchInp.value.length <= 2) {
    return;
  }
  try {
    let endpoint = geocodingBaseEndpoint + encodeURIComponent(searchInp.value);
    let result = await fetch(endpoint);
    result = await result.json();
    datalist.innerHTML = "";
    if (Array.isArray(result)) {
      result.forEach((cityItem) => {
        let option = document.createElement("option");
        // Datalist displays format: "London, GB", "London, CA", "London, US"
        let locationStr = `${cityItem.name}${cityItem.state ? ", " + cityItem.state : ""}, ${cityItem.country}`;
        option.value = locationStr;
        datalist.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Geocoding suggestion error:", err);
  }
});

if (locationBtn) {
  locationBtn.addEventListener("click", handleLocationClick);
}

if (unitCBtn) {
  unitCBtn.addEventListener("click", () => setUnit('C'));
}
if (unitFBtn) {
  unitFBtn.addEventListener("click", () => setUnit('F'));
}

if (clearRecentBtn) {
  clearRecentBtn.addEventListener("click", clearRecentSearches);
}

// Initial Setup on Page Load
renderRecentSearches();

// Load initial weather for default city (Noida)
weatherForCity("Noida");