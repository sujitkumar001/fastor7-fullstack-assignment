import { useEffect, useRef, useState } from 'react';
import { requestOtp, verifyOtp, fetchRestaurants } from './api/fastorServices.js';
import './App.css';

const demoFoods = [
  { id: 'shake', name: 'Strawberry Shake', price: 20, image: '/food-shake.svg', caption: '2 items', note: 'Fresh strawberry shake', options: ['Regular', 'Large'] },
  { id: 'burger', name: 'Chicken Burger', price: 20, image: '/food-burger.svg', caption: '1 item', note: 'Juicy chicken burger', options: ['Regular', 'Large'] },
  { id: 'pizza', name: 'Italian Pizza', price: 14, image: '/food-pizza.svg', caption: '4 sizes', note: 'Freshly baked pizza with a delicious topping', options: ['Personal (4 Slices)', 'Medium (6 Slices)', 'Familiar (8 Slices)', 'Jumbo (12 Slices)'] },
];
const money = (amount) => `₹${Number(amount).toFixed(2)}`;
const getItems = (response) => Array.isArray(response?.data?.results) ? response.data.results : [];
const validAddress = (value) => value && value !== 'null' ? value : 'Address unavailable';

function FoodPhoto({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <img className={className} src={failed || !src ? '/food-pizza.svg' : src} alt={alt} onError={() => setFailed(true)} loading="lazy" />;
}
function PhoneKeyboard({ onDigit, onDelete }) {
  return <div className="phone-keyboard" aria-label="On-screen numeric keypad">
    {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, i) => key ? <button type="button" key={i} onClick={() => key === '⌫' ? onDelete() : onDigit(key)}>{key}<small>{({2:'ABC',3:'DEF',4:'GHI',5:'JKL',6:'MNO',7:'PQRS',8:'TUV',9:'WXYZ'})[key] || ''}</small></button> : <span key={i} />)}
  </div>;
}
function OtpInput({ value, onChange, disabled }) {
  const refs = useRef([]);
  const setDigit = (input, index) => {
    const digits = String(input).replace(/\D/g, '');
    const arr = Array.from({length:6}, (_, i) => value[i] || '');
    for (let j=0; j<digits.length && index+j<6; j++) arr[index+j] = digits[j];
    onChange(arr.join(''));
    refs.current[Math.min(5, index+digits.length)]?.focus();
  };
  return <div className="otp-inputs" role="group" aria-label="Six-digit OTP">
    {Array.from({length:6}, (_, i) => <input key={i} ref={el => { refs.current[i]=el; }} type="text" inputMode="numeric" maxLength={6} value={value[i] || ''} disabled={disabled} aria-label={`Digit ${i+1}`} onChange={e => setDigit(e.target.value, i)} onPaste={e => {e.preventDefault(); setDigit(e.clipboardData.getData('text'), i);}} onKeyDown={e => { if(e.key==='Backspace'){e.preventDefault(); const arr=Array.from({length:6},(_,j)=>value[j]||''); const at=arr[i]?i:Math.max(0,i-1); arr[at]=''; onChange(arr.join('')); refs.current[at]?.focus();} }} />)}
  </div>;
}
function Auth({ onAuthenticated }) {
  const [screen, setScreen] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [seconds, setSeconds] = useState(0);
  useEffect(() => { if(screen !== 'otp' || seconds <= 0) return; const id=setTimeout(()=>setSeconds(s=>s-1),1000); return ()=>clearTimeout(id); },[screen,seconds]);
  async function submitPhone(e) {e.preventDefault();setLoading(true);setError('');setNotice('');try {await requestOtp(phone);setScreen('otp');setSeconds(30);setNotice('Registration accepted. Use the test OTP from the Postman collection.');}catch(err){setError(err.message);}finally{setLoading(false);}}
  async function submitOtp(e) {e.preventDefault();setLoading(true);setError('');try{const result=await verifyOtp(phone,otp);onAuthenticated(result.token);}catch(err){setError(err.message);}finally{setLoading(false);}}
  async function resend(){setLoading(true);setError('');try{await requestOtp(phone);setSeconds(30);setNotice('OTP request sent to the staging API.');}catch(err){setError(err.message);}finally{setLoading(false);}}
  return <div className="app-screen auth-screen">
    <div className="ios-status"><span>9:41</span><span>▰ ▰ ▰ ▰ ▰</span></div>
    <div className="auth-body">
      <button type="button" className="back-button" aria-label="Back" onClick={()=>{setScreen('phone');setError('');}}>←</button>
      {screen==='phone' ? <><h1>Sign Up to Fastor</h1><p className="auth-intro">Let us know your mobile number and we will send you an OTP for verification</p>
        <form id="auth-form" onSubmit={submitPhone}>
          <label className="phone-field"><span>+91</span><span className="phone-separator" /><input aria-label="Mobile number" type="tel" inputMode="numeric" placeholder="0000000000" maxLength={10} value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}/></label>
        </form></> : <><h1>6-digit code</h1><p className="auth-intro">Please enter the code we've sent to<br/><strong>+91 {phone}</strong></p>
        <form id="auth-form" onSubmit={submitOtp}><OtpInput value={otp} onChange={setOtp} disabled={loading}/></form>
        <p className="resend-text">I didn't receive a code {seconds ? <span>({`00:${String(seconds).padStart(2,'0')}`})</span> : <button type="button" onClick={resend} disabled={loading}>Resend</button>}</p>
      </>}
      {(error || notice) && <p className={`auth-message ${error?'error':''}`} role={error?'alert':'status'}>{error || notice}</p>}
    </div>
    <div className="auth-bottom"><button className="primary-button" type="submit" form="auth-form" disabled={loading || (screen==='phone'?phone.length!==10:otp.length!==6)}>{loading?'Please wait…':screen==='phone'?'Get OTP':'Continue'}</button>{screen==='phone' && <p>By clicking, I accept the Terms &amp; Conditions and Privacy Policy</p>}</div>
    <PhoneKeyboard onDigit={digit=>screen==='phone'?setPhone(v=>(v+digit).slice(0,10)):setOtp(v=>(v+digit).slice(0,6))} onDelete={()=>screen==='phone'?setPhone(v=>v.slice(0,-1)):setOtp(v=>v.slice(0,-1))}/>
  </div>;
}
function Detail({ item, onBack }) {
  const [qty, setQty] = useState(3);
  const [size, setSize] = useState(0);
  const [message, setMessage] = useState('');
  const price = item.price + size * 6;
  return <div className="app-screen detail-screen"><div className="ios-status"><span>9:41</span><span>▰ ▰ ▰ ▰ ▰</span></div><button className="detail-back" type="button" onClick={onBack} aria-label="Back to restaurant listing">←</button>
    <FoodPhoto className="detail-image" src={item.image} alt={item.name}/>
    <div className="detail-price-row"><strong>{money(price)}</strong><div className="qty-control"><button type="button" aria-label="Decrease quantity" onClick={()=>setQty(q=>Math.max(1,q-1))}>−</button><span>{qty}</span><button type="button" aria-label="Increase quantity" onClick={()=>setQty(q=>Math.min(99,q+1))}>+</button></div></div>
    <h1 className="detail-title">{item.name}</h1><p className="detail-desc">{item.note}. Prepared fresh for you.</p>
    <h2 className="portion-heading">Personal portion</h2><div className="portion-list">{item.options.map((option,i)=><button key={option} type="button" className={size===i?'active':''} onClick={()=>setSize(i)}><span>{option}</span><span>{money(item.price+i*6)} <span className="portion-circle">{size===i?'✓':'+'}</span></span></button>)}</div>
    <div className="detail-bottom"><button className="primary-button" type="button" onClick={()=>setMessage(`${qty} demo item${qty===1?'':'s'} selected. Checkout is not provided by the assignment API.`)}>Add to cart</button>{message && <p role="status" className="cart-message">{message}</p>}</div>
  </div>;
}
function Discover({ token, onLogout }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(()=>{let active=true;fetchRestaurants(token).then(data=>{if(active)setRestaurants(getItems(data));}).catch(err=>{if(active)setError(err.message||'Could not load restaurants');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[token,refresh]);
  const matches = restaurants.filter(r=>[r.restaurant_name,r.address_complete].some(x=>String(x||'').toLowerCase().includes(query.toLowerCase())));
  if(selected) return <Detail item={selected} onBack={()=>setSelected(null)}/>;
  return <div className="app-screen discover-screen"><div className="ios-status"><span>9:41</span><span>▰ ▰ ▰ ▰ ▰</span></div>
    <div className="location-head"><div><small>Current Locations</small><strong>Model Town, New Delhi</strong></div><button type="button" onClick={onLogout}>Logout</button></div>
    <div className="search-tools"><label className="search-box"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search restaurants" placeholder="Karan" /></label><button type="button" className="tool-square orange" aria-label="Food categories">🍴</button><button type="button" className="tool-square blue" aria-label="Restaurant view">▣</button></div>
    <div className="section-head"><h2>Best Seller</h2><span>Explore</span></div>
    <div className="best-seller-row">{demoFoods.concat(demoFoods.slice(0,1)).map((food,i)=><button type="button" key={`${food.id}-${i}`} onClick={()=>setSelected(food)}><FoodPhoto src={food.image} alt={food.name}/><span className="seller-price">{money(food.price)}</span></button>)}</div>
    <button type="button" className="offer-banner" onClick={()=>setSelected(demoFoods[2])}><div><small>Experience our<br/>delicious new dishes</small><strong>30% OFF</strong></div><FoodPhoto src="/food-pizza.svg" alt="Pizza promotion"/></button>
    <div className="offer-dots">● <span>● ● ●</span></div>
    <div className="section-head popular-head"><h2>Popular Items</h2><span>{loading?'Loading…':`${matches.length} restaurants`}</span></div>
    <div className="food-items">{demoFoods.map(food=><article className="food-row" key={food.id}><button type="button" className="food-thumb" onClick={()=>setSelected(food)}><FoodPhoto src={food.image} alt={food.name}/></button><div className="food-info"><div className="food-name-line"><strong>{food.name}</strong><span>{money(food.price)}</span></div><small>{food.caption} · {food.note}</small><div className="food-actions"><button type="button" onClick={()=>setSelected(food)}>Cancel Order</button><button type="button" onClick={()=>setSelected(food)}>Track Driver</button></div></div></article>)}</div>
    <div className="live-restaurants"><div className="section-head"><h2>Restaurants from Fastor</h2><span>Live API</span></div>{error && <p role="alert">{error} <button type="button" onClick={()=>{setLoading(true);setError('');setRefresh(n=>n+1);}}>Retry</button></p>}{!loading && !error && (matches.length?matches.map(r=><div className="restaurant-row" key={r.restaurant_id}><FoodPhoto src={r.logo} alt={r.restaurant_name}/><div><strong>{r.restaurant_name}</strong><small>{validAddress(r.address_complete)}</small></div></div>):<p>No matching restaurants.</p>)}</div>
    <p className="data-note">Food cards, prices and cart are Figma demonstrations. Restaurant records below are fetched from Fastor's staging API.</p>
  </div>;
}
export default function App(){const [token,setToken]=useState('');return <main className="page-background"><div className="phone-shell">{token?<Discover token={token} onLogout={()=>setToken('')}/>:<Auth onAuthenticated={setToken}/>}</div></main>;}
