import { useEffect, useRef, useState } from "react";
import { requestOtp, verifyOtp, fetchRestaurants } from "./api/fastorServices.js";
import "./App.css";

function extractRestaurants(response) {
  const candidates = [
    response?.data?.results,
    response?.data?.restaurants,
    response?.data?.restaurant,
    response?.data?.items,
    response?.data,
    response?.restaurants,
    response?.results,
    response,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;

    if (candidate && typeof candidate === "object") {
      for (const key of ["results", "restaurants", "restaurant", "items", "data"]) {
        if (Array.isArray(candidate[key])) return candidate[key];
      }
    }
  }

  return [];
}

function restaurantName(restaurant) {
  return restaurant.restaurant_name ||
    restaurant.restaurantName ||
    restaurant.name ||
    restaurant.title ||
    "Restaurant";
}

function restaurantImage(restaurant) {
  const image = restaurant.images?.[0] ||
    restaurant.image ||
    restaurant.image_url ||
    restaurant.restaurant_image ||
    restaurant.cover_image ||
    restaurant.logo;

  if (typeof image === "string") return image;

  if (image && typeof image === "object") {
    return image.url || image.image_url || image.src || "";
  }

  return "";
}

function restaurantAddress(restaurant) {
  return restaurant.address ||
    restaurant.location?.address ||
    restaurant.locality ||
    restaurant.city ||
    "Location not available";
}

function RestaurantPhoto({ restaurant, className = "" }) {
  const [failed, setFailed] = useState(false);
  const source = restaurantImage(restaurant);

  let imageUrl = "";

  if (typeof source === "string" && source.trim()) {
    try {
      const url = new URL(source, "https://staging.fastor.ai");
      if (url.protocol === "https:" || url.protocol === "http:") {
        imageUrl = url.href;
      }
    } catch {
      imageUrl = "";
    }
  }

  if (!imageUrl || failed) {
    return (
      <div className={`food-photo food-photo-fallback ${className}`}>
        <span className="food-photo-icon" aria-hidden="true">🍽️</span>
        <span>Fresh food, great moments</span>
      </div>
    );
  }

  return (
    <div className={`food-photo ${className}`}>
      <img
        src={imageUrl}
        alt={restaurantName(restaurant)}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function restaurantCategory(restaurant) {
  const value =
    restaurant.cuisine ||
    restaurant.cuisines ||
    restaurant.category ||
    restaurant.food_type ||
    restaurant.restaurant_type;

  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? item : item?.name
    ).filter(Boolean).join(", ") || "Restaurant";
  }

  if (typeof value === "string" && value.trim()) return value.trim();

  return "Restaurant";
}

function RestaurantList({ token, onLogout }) {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetchRestaurants(token);
        if (active) setRestaurants(extractRestaurants(response));
      } catch (err) {
        if (active) setError(err.message || "Unable to fetch restaurants.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [token]);

  async function refreshRestaurants() {
    setLoading(true);
    setError("");

    try {
      const response = await fetchRestaurants(token);
      setRestaurants(extractRestaurants(response));
    } catch (err) {
      setError(err.message || "Unable to fetch restaurants.");
    } finally {
      setLoading(false);
    }
  }

  const categories = [
    "All",
    ...new Set(
      restaurants
        .map(restaurantCategory)
        .filter((value) => value !== "Restaurant")
        .flatMap((value) => value.split(",").map((item) => item.trim()))
        .filter(Boolean)
    ),
  ].slice(0, 9);

  const visibleRestaurants = restaurants.filter((restaurant) => {
    const name = restaurantName(restaurant).toLowerCase();
    const address = String(restaurantAddress(restaurant)).toLowerCase();
    const cuisine = restaurantCategory(restaurant).toLowerCase();
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      name.includes(query) ||
      address.includes(query) ||
      cuisine.includes(query);

    const matchesCategory =
      category === "All" ||
      cuisine.includes(category.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="food-app">
      <header className="food-navbar">
        <div className="food-navbar-inner">
          <div className="brand food-brand">
            <span className="brand-mark">F</span>
            <span>fastor<span className="brand-dot">.</span></span>
          </div>
          <div className="food-navbar-actions">
            <span className="nav-location">Explore restaurants</span>
            <button
              type="button"
              className="signout-button"
              onClick={onLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {selected ? (
        <div className="food-main detail-page">
          <button
            type="button"
            className="food-back"
            onClick={() => setSelected(null)}
          >
            ← Back to restaurants
          </button>

          <RestaurantPhoto
            key={selected.id || selected.restaurant_id || restaurantName(selected)}
            restaurant={selected}
            className="detail-photo"
          />

          <div className="detail-panel">
            <span className="section-kicker">RESTAURANT DETAILS</span>
            <h1>{restaurantName(selected)}</h1>
            <p className="detail-category">
              {restaurantCategory(selected)}
            </p>
            <p className="detail-address">
              📍 {restaurantAddress(selected)}
            </p>
            {selected.description && (
              <p className="detail-description">
                {selected.description}
              </p>
            )}
            <button
              type="button"
              className="food-action-button"
              onClick={() => setSelected(null)}
            >
              Explore more restaurants
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="food-hero">
            <div className="food-hero-inner">
              <div className="hero-copy">
                <span className="hero-eyebrow">
                  DISCOVER SOMETHING DELICIOUS
                </span>
                <h1>
                  Good food.
                  <br />
                  <span>Great mood.</span>
                </h1>
                <p>
                  Find your next favorite place to eat.
                  Explore restaurants and discover new flavors.
                </p>
                <div className="hero-search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    aria-label="Search restaurants"
                    placeholder="Search restaurants, cuisines or locations"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="hero-plate">
                  <span>🍕</span>
                </div>
                <div className="hero-float hero-float-one">🍟</div>
                <div className="hero-float hero-float-two">🥗</div>
              </div>
            </div>
          </section>

          <main className="food-main">
            <div className="food-section-heading">
              <div>
                <span className="section-kicker">HANDPICK YOUR CRAVING</span>
                <h2>Explore restaurants</h2>
                <p>Find something delicious from our restaurant collection.</p>
              </div>
              {!loading && !error && (
                <span className="result-count">
                  {visibleRestaurants.length} places
                </span>
              )}
            </div>

            {categories.length > 1 && (
              <div className="category-row" aria-label="Cuisine filters">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      category === item
                        ? "category-pill category-pill-active"
                        : "category-pill"
                    }
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="food-state" role="status">
                Loading delicious places...
              </div>
            )}

            {error && (
              <div className="food-state food-state-error" role="alert">
                <h3>We couldn't load the restaurants</h3>
                <p>{error}</p>
                <button
                  type="button"
                  className="food-action-button"
                  onClick={refreshRestaurants}
                >
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && visibleRestaurants.length === 0 && (
              <div className="food-state">
                <h3>No matching restaurants</h3>
                <p>Try another search or cuisine.</p>
                <button
                  type="button"
                  className="food-action-button"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}

            {!loading && !error && visibleRestaurants.length > 0 && (
              <div className="food-grid">
                {visibleRestaurants.map((restaurant, index) => (
                  <button
                    type="button"
                    className="food-card"
                    key={
                      restaurant.id ||
                      restaurant.restaurant_id ||
                      index
                    }
                    onClick={() => setSelected(restaurant)}
                  >
                    <RestaurantPhoto
                      restaurant={restaurant}
                      className="card-photo"
                    />
                    <div className="food-card-body">
                      <span className="food-card-category">
                        {restaurantCategory(restaurant)}
                      </span>
                      <h3>{restaurantName(restaurant)}</h3>
                      <p>📍 {restaurantAddress(restaurant)}</p>
                      <span className="food-card-link">
                        View restaurant <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </main>

          <footer className="food-footer">
            <strong>fastor<span>.</span></strong>
            <p>Discover good food and great places.</p>
          </footer>
        </>
      )}
    </div>
  );
}
function OtpBoxes({ value, onChange, disabled }) {
  const inputs = useRef([]);

  function applyDigits(text, startIndex) {
    const digits = String(text).replace(/\D/g, "");
    if (!digits) return;

    const next = value.padEnd(6, " ").split("");

    for (let i = 0; i < digits.length && startIndex + i < 6; i++) {
      next[startIndex + i] = digits[i];
    }

    onChange(next.join("").trimEnd());

    const nextIndex = Math.min(startIndex + digits.length, 5);
    inputs.current[nextIndex]?.focus();
  }

  function handleKeyDown(event, index) {
    if (event.key === "Backspace") {
      event.preventDefault();

      const next = value.padEnd(6, " ").split("");
      const target = next[index] && next[index] !== " "
        ? index
        : Math.max(0, index - 1);

      next[target] = " ";
      onChange(next.join("").trimEnd());
      inputs.current[target]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="otp-boxes" role="group" aria-label="Six-digit verification code">
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(element) => { inputs.current[index] = element; }}
          className="otp-box"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`OTP digit ${index + 1}`}
          maxLength={6}
          value={value[index] || ""}
          disabled={disabled}
          onChange={(event) => applyDigits(event.target.value, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={(event) => {
            event.preventDefault();
            applyDigits(event.clipboardData.getData("text"), index);
          }}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
function App() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleRequestOtp(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      await requestOtp(phone);
      setStep("otp");
      setNotice("OTP requested successfully.");
    } catch (err) {
      setError(err.message || "Unable to request OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const result = await verifyOtp(phone, otp);
      setToken(result.token);
      setStep("restaurants");
    } catch (err) {
      setError(err.message || "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken("");
    setOtp("");
    setStep("phone");
    setError("");
    setNotice("");
  }

  return (
    <main className="app-shell">
      <section className={step === "restaurants" ? "restaurant-container" : "auth-card"}>
        {step !== "restaurants" && (
          <div className="brand">
            <span className="brand-mark">F</span>
            <span>fastor</span>
          </div>
        )}

        {step === "phone" && (
          <>
            <div className="eyebrow">WELCOME</div>
            <h1>Welcome Back!</h1>
            <p className="subtitle">
              Enter your mobile number to continue.
            </p>

            <form onSubmit={handleRequestOtp}>
              <label htmlFor="phone">Mobile Number</label>

              <div className="phone-field">
                <span className="dial-code">+91</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  required
                />
              </div>

              <button
                className="primary-button"
                type="submit"
                disabled={loading || phone.length !== 10}
              >
                {loading ? "Please wait..." : "Continue"}
              </button>
            </form>
          </>
        )}

        {step === "otp" && (
          <>
            <button
              type="button"
              className="back-button"
              onClick={() => {
                setStep("phone");
                setError("");
                setNotice("");
              }}
            >
              ← Back
            </button>

            <div className="eyebrow">VERIFICATION</div>
            <h1>OTP Verification</h1>
            <p className="subtitle">
              Enter the 6-digit code for +91 {phone}.
            </p>

            <form onSubmit={handleVerifyOtp}>
              <label htmlFor="otp">Verification Code</label>

              <OtpBoxes
                value={otp}
                onChange={(value) => {
                  setOtp(value);
                  setError("");
                }}
                disabled={loading}
              />

              <p className="otp-hint">
                Default test OTP in the supplied Postman collection: 123456
              </p>

              <button
                className="primary-button"
                type="submit"
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>

            <button
              type="button"
              className="text-button"
              disabled={loading}
              onClick={async () => {
                setError("");
                setNotice("");
                setLoading(true);
                try {
                  await requestOtp(phone);
                  setNotice("OTP requested again.");
                } catch (err) {
                  setError(err.message || "Unable to resend OTP.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Resend OTP
            </button>
          </>
        )}

        {step === "restaurants" && (
          <RestaurantList token={token} onLogout={handleLogout} />
        )}

        {error && <p role="alert" className="error-message">{error}</p>}
        {notice && <p role="status" className="notice-message">{notice}</p>}

        <p className="footer-note">
          Fastor React Development Assignment
        </p>
      </section>
    </main>
  );
}

export default App;