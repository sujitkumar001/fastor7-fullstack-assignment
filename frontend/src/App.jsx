import { useEffect, useRef, useState } from "react";
import { requestOtp, verifyOtp, fetchRestaurants } from "./api/fastorServices.js";
import "./App.css";

function getRestaurants(response) {
  const candidates = [response?.data?.results, response?.data?.restaurants, response?.data?.restaurant, response?.data?.items, response?.data, response?.restaurants, response?.results, response];
  for (const value of candidates) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      for (const key of ["results", "restaurants", "restaurant", "items", "data"]) {
        if (Array.isArray(value[key])) return value[key];
      }
    }
  }
  return [];
}
function nameOf(r) { return r.restaurant_name || r.restaurantName || r.name || r.title || "Restaurant"; }
function addressOf(r) { const address = r.address_complete || r.address || r.location?.address || r.locality || r.city; return address && String(address).trim().toLowerCase() !== "null" ? address : "Address not provided"; }
function categoryOf(r) {
  const value = r.cuisine || r.cuisines || r.category || r.food_type || r.restaurant_type;
  if (Array.isArray(value)) return value.map(x => typeof x === "string" ? x : x?.name).filter(Boolean).join(", ") || "Restaurant";
  return typeof value === "string" && value.trim() ? value : "Restaurant";
}
function imageOf(r) {
  const raw = r.images?.[0] || r.image || r.image_url || r.restaurant_image || r.cover_image || r.logo;
  const value = typeof raw === "string" ? raw : raw?.url || raw?.image_url || raw?.src;
  if (!value) return "";
  try { const url = new URL(value, "https://staging.fastor.ai"); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}
function FoodImage({ restaurant, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = imageOf(restaurant);
  const illustrations = ["/food-pizza.svg", "/food-burger.svg", "/food-shake.svg"];
  const id = Number(restaurant?.restaurant_id || restaurant?.id || 0);
  const fallback = illustrations[Math.abs(id) % illustrations.length];
  return <img className={`${className} food-photo`} src={src && !failed ? src : fallback} alt={src && !failed ? nameOf(restaurant) : `Illustrative food artwork for ${nameOf(restaurant)}`} loading="lazy" onError={() => setFailed(true)} />;
}
function OtpBoxes({ value, onChange, disabled }) {
  const refs = useRef([]);
  function insert(text, at) {
    const digits = String(text).replace(/\D/g, "");
    if (!digits) return;
    const next = value.padEnd(6, " ").split("");
    for (let i = 0; i < digits.length && i + at < 6; i++) next[at + i] = digits[i];
    onChange(next.join("").trimEnd());
    refs.current[Math.min(at + digits.length, 5)]?.focus();
  }
  return <div className="otp-boxes" role="group" aria-label="Six digit verification code">{Array.from({ length: 6 }, (_, i) => <input key={i} ref={el => { refs.current[i] = el; }} className="otp-box" inputMode="numeric" type="text" autoComplete={i === 0 ? "one-time-code" : "off"} aria-label={`OTP digit ${i + 1}`} value={value[i] || ""} disabled={disabled} onChange={e => insert(e.target.value, i)} onPaste={e => { e.preventDefault(); insert(e.clipboardData.getData("text"), i); }} onKeyDown={e => { if (e.key === "Backspace") { e.preventDefault(); const next = value.padEnd(6, " ").split(""); const at = next[i] !== " " ? i : Math.max(i - 1, 0); next[at] = " "; onChange(next.join("").trimEnd()); refs.current[at]?.focus(); } if (e.key === "ArrowLeft") refs.current[Math.max(i - 1, 0)]?.focus(); if (e.key === "ArrowRight") refs.current[Math.min(i + 1, 5)]?.focus(); }} />)}</div>;
}
function Restaurants({ token, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => { let active = true; fetchRestaurants(token).then(data => { if (active) setItems(getRestaurants(data)); }).catch(e => { if (active) setError(e.message || "Unable to load restaurants"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [token, reload]);
  const filtered = items.filter(r => [nameOf(r), addressOf(r), categoryOf(r)].some(v => String(v).toLowerCase().includes(search.trim().toLowerCase())));
  function open(r) { setSelected(r); setQuantity(1); setCartNotice(""); }
  return <div className="mobile-screen dining-screen">
    {selected ? <>
      <button type="button" className="detail-back" onClick={() => setSelected(null)} aria-label="Back to restaurants">‹</button>
      <FoodImage restaurant={selected} className="detail-hero" />
      <div className="detail-content">
        <div className="detail-title-row"><h1>{nameOf(selected)}</h1><div className="quantity-control"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(n => Math.max(1, n - 1))}>−</button><span>{quantity}</span><button type="button" aria-label="Increase quantity" onClick={() => setQuantity(n => Math.min(99, n + 1))}>+</button></div></div>
        <p className="orange-text">{categoryOf(selected)}</p>
        <p className="detail-copy">{selected.description || `Discover ${nameOf(selected)} and explore great food nearby.`}</p>
        <div className="detail-divider" />
        <h2>Restaurant information</h2>
        <p className="detail-copy">📍 {addressOf(selected)}</p>
        <p className="demo-disclaimer">Restaurant details are from Fastor staging. Food imagery is illustrative where API logos are unavailable. Cart is a UI-only demo; no order will be placed.</p>
      </div>
      <div className="sticky-action"><button type="button" className="orange-button" onClick={() => setCartNotice(`${quantity} item${quantity > 1 ? "s" : ""} selected for demo. No order was placed.`)}>Add to cart</button>{cartNotice && <p role="status" className="inline-notice">{cartNotice}</p>}</div>
    </> : <>
      <div className="list-top"><div><span className="top-caption">Current Locations</span><strong>Model Town, New Delhi</strong></div><button type="button" className="logout-link" onClick={onLogout}>Logout</button></div>
      <div className="search-row"><label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search restaurants" placeholder="Search food or restaurants" value={search} onChange={e => setSearch(e.target.value)} /></label><div className="mini-square" aria-hidden="true">♨</div><div className="mini-square blue-square" aria-hidden="true">▣</div></div>
      <div className="section-heading"><h2>Best Seller</h2><span>Explore</span></div>
      {loading && <p role="status" className="state-message">Loading restaurants...</p>}
      {error && <div role="alert" className="state-message"><p>{error}</p><button type="button" onClick={() => { setLoading(true); setError(""); setReload(n => n + 1); }}>Try again</button></div>}
      {!loading && !error && <>
        <div className="bestseller-strip">{filtered.slice(0, 5).map((r, i) => <button type="button" key={r.id || r.restaurant_id || i} className="bestseller-item" onClick={() => open(r)}><FoodImage restaurant={r} className="bestseller-photo" /><span>{nameOf(r)}</span></button>)}</div>
        <div className="promo-banner"><div><small>Experience our delicious new dishes</small><strong>30% OFF</strong><span>Discover restaurants</span></div><img className="promo-art" src="/food-pizza.svg" alt="" /></div>
        <div className="section-heading popular-heading"><h2>Popular Items</h2><span>{filtered.length} restaurants shown</span></div>
        {filtered.length === 0 ? <p className="state-message">No matching restaurants. Try another search.</p> : filtered.map((r, i) => <button type="button" className="popular-item" key={r.id || r.restaurant_id || i} onClick={() => open(r)}><FoodImage restaurant={r} className="popular-photo" /><div className="popular-info"><h3>{nameOf(r)}</h3><p>{categoryOf(r)}</p><small>{addressOf(r)}</small><span className="view-item">View details</span></div><span className="item-arrow" aria-hidden="true">›</span></button>)}
      </>}
    </>}
  </div>;
}
export default function App() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendAfter, setResendAfter] = useState(0);
  useEffect(() => { if (step !== "otp" || resendAfter <= 0) return; const id = setTimeout(() => setResendAfter(v => Math.max(0, v - 1)), 1000); return () => clearTimeout(id); }, [step, resendAfter]);
  async function submitPhone(e) { e.preventDefault(); setError(""); setNotice(""); setLoading(true); try { await requestOtp(phone); setStep("otp"); setResendAfter(30); setNotice("OTP request accepted by staging API. Use the test OTP supplied in the assignment collection."); } catch (err) { setError(err.message || "Could not request OTP"); } finally { setLoading(false); } }
  async function submitOtp(e) { e.preventDefault(); setError(""); setNotice(""); setLoading(true); try { const result = await verifyOtp(phone, otp); setToken(result.token); setStep("restaurants"); } catch (err) { setError(err.message || "OTP verification failed"); } finally { setLoading(false); } }
  async function resend() { setError(""); setNotice(""); setLoading(true); try { await requestOtp(phone); setResendAfter(30); setNotice("OTP requested again from staging API."); } catch (err) { setError(err.message || "Could not resend OTP"); } finally { setLoading(false); } }
  return <main className="app-viewport"><div className="device-frame">{step === "restaurants" ? <Restaurants token={token} onLogout={() => { setToken(""); setOtp(""); setStep("phone"); setError(""); setNotice(""); }} /> : <div className="mobile-screen auth-screen">
    <div className="auth-back-row"><button type="button" className="arrow-back" aria-label="Back" onClick={() => { setStep("phone"); setError(""); setNotice(""); }}>‹</button></div>
    {step === "phone" ? <><h1>Sign Up to Fastor</h1><p className="auth-description">Let us know your mobile number and we will send you an OTP for verification</p><form onSubmit={submitPhone} className="auth-form"><label className="phone-input"><span>+91</span><input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="0000000000" aria-label="Mobile number" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} required /></label><button type="submit" className="orange-button" disabled={loading || phone.length !== 10}>{loading ? "Please wait..." : "Get OTP"}</button></form><p className="terms">By clicking, I accept the Terms &amp; Conditions and Privacy Policy</p></> : <><h1>6-digit code</h1><p className="auth-description">Please enter the code we&apos;ve sent to<br /><strong>+91 {phone}</strong></p><form onSubmit={submitOtp} className="auth-form"><OtpBoxes value={otp} onChange={setOtp} disabled={loading} /><button type="submit" className="orange-button" disabled={loading || otp.length !== 6}>{loading ? "Verifying..." : "Continue"}</button></form><p className="resend-row">I didn&apos;t receive a code {resendAfter > 0 ? <span>({`00:${String(resendAfter).padStart(2, "0")}`})</span> : <button type="button" disabled={loading} onClick={resend}>Resend OTP</button>}</p><p className="test-otp">Staging test OTP: 123456</p></>}
    {error && <p className="form-message error-message" role="alert">{error}</p>}{notice && <p className="form-message notice-message" role="status">{notice}</p>}
  </div>}</div></main>;
}
