let removeMode = false;

function updateTime() {
  document.getElementById("time").innerText = new Date().toLocaleTimeString();
}

function updateDate() {
  document.getElementById("date").innerText = new Date().toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
}

function addNewLink() {
  chrome.action?.openPopup?.().catch(() => {});
}

function removeLink() {
  removeMode = !removeMode;
  document.body.classList.toggle("remove-mode", removeMode);
}

function getWeatherLabel(code, isNight) {
  const map = {
    0: "Clear",
    1: "Mostly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime Fog",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    80: "Rain Showers",
    95: "Thunderstorm",
  };

  const base = map[code] || "Weather";
  return isNight ? `${base} Night` : base;
}

async function fetchCity(latitude, longitude) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
    );

    const data = await res.json();

    return (
      data.city || data.locality || data.principalSubdivision || "Local Area"
    );
  } catch {
    return "Local Area";
  }
}

async function fetchWeather() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    const { latitude, longitude } = coords;
    const cityEl = document.querySelector(".weather-header .city");
    cityEl.textContent = "Locating";

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", latitude);
    url.searchParams.set("longitude", longitude);
    url.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    );
    url.searchParams.set("timezone", "auto");

    try {
      const res = await fetch(url);
      const { current } = await res.json();

      document.querySelector(".weather-main .temp").innerHTML =
        Math.round(current.temperature_2m) + "&deg;";

      document.querySelector(".weather-main .meta").innerHTML =
        `Feels like ${Math.round(current.apparent_temperature)}&deg;`;

      document.querySelector(
        ".weather-footer .info:nth-child(1) .value",
      ).innerHTML = current.relative_humidity_2m + "&percnt;";

      document.querySelector(
        ".weather-footer .info:nth-child(2) .value",
      ).textContent = Math.round(current.wind_speed_10m) + " km/h";

      document.querySelector(".weather-header .status").textContent =
        getWeatherLabel(current.weather_code, current.is_day === 0);

      const cityEl = document.querySelector(".weather-header .city");
      cityEl.textContent = "Locating";

      const city = await fetchCity(latitude, longitude);
      cityEl.textContent = city;
    } catch {
      cityEl.textContent = "Local Area";
    }
  });
}

function renderLinks() {
  const container = document.getElementById("links");
  container.innerHTML = "";

  chrome.storage.local.get("links", ({ links = [] }) => {
    links.forEach((link, index) => {
      const li = document.createElement("li");
      li.className = "link-item";

      const img = document.createElement("img");
      const domain = new URL(link.url).hostname;

      img.src = `https://www.google.com/s2/favicons?sz=64&domain_url=${link.url}`;
      img.onerror = () => {
        img.onerror = () => (img.src = "assets/default-icon.svg");
        img.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      };
      img.className = "link-icon";

      const a = document.createElement("a");
      a.href = link.url;
      a.textContent = link.name;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "link-text";

      li.append(img, a);

      li.onclick = (e) => {
        if (!removeMode) return;
        e.preventDefault();
        chrome.storage.local.get("links", ({ links = [] }) => {
          links.splice(index, 1);
          chrome.storage.local.set({ links });
          removeMode = false;
          document.body.classList.remove("remove-mode");
        });
      };

      container.appendChild(li);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("background", ({ background }) => {
    if (background) document.getElementById("background").src = background;
  });

  const toggle = document.getElementById("themeToggle");
  chrome.storage.local.get("themeInstalled", ({ themeInstalled }) => {
    toggle.checked = !!themeInstalled;
  });

  toggle.onchange = () =>
    chrome.storage.local.set({ themeInstalled: toggle.checked });

  chrome.storage.onChanged.addListener((c, a) => {
    if (a === "local" && c.links) renderLinks();
  });

  document.getElementById("add-link").onclick = addNewLink;
  document.getElementById("remove-link").onclick = removeLink;

  setInterval(updateTime, 1000);
  updateTime();
  updateDate();
  renderLinks();
  fetchWeather();
});
