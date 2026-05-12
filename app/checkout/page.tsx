'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { useRouter } from 'next/navigation';
const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh','Chandigarh','Puducherry'];
const EMPTY = { fullName:'', address:'', city:'', state:'Maharashtra', pincode:'', phone:'' };
const API_BASE = 'https://server.epicmerch.in/api';
const API_KEY  = 'pk_live_26d210a80354c4192f9473030f6d054f';
export default function CheckoutPage() {
  const { store, user, refreshCart } = useStore(); const router = useRouter();
  const [cart, setCart] = useState<any[]>([]); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true); const [placing, setPlacing] = useState(false);
  const [method, setMethod] = useState<'razorpay'|'cod'>('razorpay');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string|null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saveAddr, setSaveAddr] = useState(false);
  const [addr, setAddr] = useState({ ...EMPTY });
  const [checkoutType, setCheckoutType] = useState<'epicmerch'|'shiprocket'>('epicmerch');
  useEffect(() => {
    // Fetch merchant checkout config
    fetch(`${API_BASE}/users/checkout-config`, { headers: { 'x-api-key': API_KEY } })
      .then(r => r.json()).then(d => { if (d.checkoutType) setCheckoutType(d.checkoutType); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!store||!user) { setLoading(false); return; }
    Promise.all([
      store.cart.get().then((d: any) => { setCart(d.cart||[]); setTotal(d.cartTotal||0); }),
      store.addresses.list().then((list: any[]) => {
        setSavedAddresses(list||[]);
        const def = (list||[]).find((a: any) => a.isDefault) || (list||[])[0];
        if (def) { setSelectedAddrId(def._id||def.id); setAddr({ fullName: def.fullName||def.name||'', address: def.address||def.street||'', city: def.city||'', state: def.state||'Maharashtra', pincode: def.pincode||def.postalCode||'', phone: def.phone||'' }); }
        else { setShowNewForm(true); }
      }).catch(() => { setShowNewForm(true); }),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [store, user]);
  function selectSaved(a: any) {
    setSelectedAddrId(a._id||a.id); setShowNewForm(false);
    setAddr({ fullName: a.fullName||a.name||'', address: a.address||a.street||'', city: a.city||'', state: a.state||'Maharashtra', pincode: a.pincode||a.postalCode||'', phone: a.phone||'' });
  }
  const change = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setAddr(a => ({...a,[k]:e.target.value}));
  async function placeOrder() {
    if (!store||!user) return;
    const missing = (['fullName','address','city','state','pincode','phone'] as const).find(k => !addr[k].trim());
    if (missing) { alert('Please fill all address fields.'); return; }
    setPlacing(true);
    try {
      if (showNewForm && saveAddr) {
        try { await store.addresses.add({ fullName: addr.fullName, address: addr.address, city: addr.city, state: addr.state, pincode: addr.pincode, phone: addr.phone, country: 'India' }); } catch {}
      }
      const idem = store.generateIdempotencyKey ? store.generateIdempotencyKey() : Date.now().toString();
      if (method === 'razorpay') {
        const order = await store.orders.create({ shippingAddress: addr, paymentMethod: 'razorpay', idempotencyKey: idem });
        const opts = { key: order.razorpayKeyId, amount: order.razorpayAmount, currency: 'INR', name: 'EpicMerch', order_id: order.razorpayOrderId,
          handler: async (resp: any) => { await store.orders.verifyPayment(order._id, resp); await refreshCart(); router.push(`/order?id=${order._id}&success=1`); },
          prefill: { name: addr.fullName, contact: addr.phone }, theme: { color: 'var(--brand)' } };
        const rz = new (window as any).Razorpay(opts); rz.open();
      } else {
        const order = await store.orders.create({ shippingAddress: addr, paymentMethod: 'cod', idempotencyKey: idem });
        await refreshCart(); router.push(`/order?id=${order._id}&success=1`);
      }
    } catch (e: any) { alert(e.message); } finally { setPlacing(false); }
  }
  if (!user) return <div className="text-center py-32"><p className="text-xl font-semibold mb-4">Please login to checkout</p><a href="/login" className="underline">Go to Login</a></div>;
  if (loading) return <div className="max-w-2xl mx-auto px-6 py-12 animate-pulse space-y-4"><div className="h-8 bg-gray-100 rounded w-1/3"/><div className="h-64 bg-gray-100 rounded-xl"/></div>;
  if (cart.length === 0) return <div className="text-center py-32"><p className="text-xl font-semibold mb-4">Your cart is empty</p><a href="/products" className="underline">Shop Now</a></div>;

  // ── Shiprocket Checkout mode ──────────────────────────────────────────────
  if (checkoutType === 'shiprocket') {
    // Build a cart summary string for SR Checkout deep-link (format varies by SR Checkout version)
    const cartSummary = cart.map((i: any) => `${i.name} x${i.qty}`).join(', ');
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <div className="text-5xl mb-6">🚀</div>
        <h1 className="text-2xl font-black mb-3">Complete Your Order</h1>
        <p className="text-gray-500 mb-2 text-sm">You'll be taken to Shiprocket Checkout to complete payment and shipping.</p>
        <p className="text-gray-400 text-xs mb-8">OTP login · Saved addresses · Secure payments</p>
        <div className="border rounded-xl p-4 mb-6 text-left text-sm space-y-1">
          {cart.map((i: any) => (
            <div key={i._id} className="flex justify-between">
              <span className="text-gray-600">{i.name} ×{i.qty}</span>
              <span>₹{(i.price*i.qty).toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t pt-2 mt-2">
            <span>Total</span><span>₹{total.toLocaleString()}</span>
          </div>
        </div>
        <a
          href={`https://checkout.shiprocket.in/?cart=${encodeURIComponent(cartSummary)}&amount=${total}`}
          className="block w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-4 rounded-xl transition text-center"
        >
          Continue to Shiprocket Checkout →
        </a>
        <p className="text-xs text-gray-400 mt-4">🔒 Secured by Shiprocket</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black mb-8">Checkout</h1>
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <div className="border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Shipping Address</h2>
            {savedAddresses.length > 0 && (
              <div className="space-y-2 mb-4">
                {savedAddresses.map((a: any) => (
                  <button key={a._id||a.id} onClick={() => selectSaved(a)} className={`w-full flex items-start gap-3 p-3 border-2 rounded-xl text-left transition ${selectedAddrId===(a._id||a.id)&&!showNewForm?'border-black bg-gray-50':'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${selectedAddrId===(a._id||a.id)&&!showNewForm?'border-black':'border-gray-300'}`}>{selectedAddrId===(a._id||a.id)&&!showNewForm&&<div className="w-2 h-2 rounded-full bg-black"/>}</div>
                    <div className="text-sm"><p className="font-medium">{a.fullName||a.name}</p><p className="text-gray-500">{a.address||a.street}, {a.city}, {a.state} {a.pincode||a.postalCode}</p>{a.phone&&<p className="text-gray-500">{a.phone}</p>}</div>
                  </button>
                ))}
                <button onClick={() => { setSelectedAddrId(null); setAddr({...EMPTY}); setShowNewForm(true); }} className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl text-left transition ${showNewForm?'border-black bg-gray-50':'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${showNewForm?'border-black':'border-gray-300'}`}>{showNewForm&&<div className="w-2 h-2 rounded-full bg-black"/>}</div>
                  <span className="text-sm font-medium">+ Add new address</span>
                </button>
              </div>
            )}
            {showNewForm && (
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                {([['fullName','Full Name'],['phone','Phone'],['address','Street Address'],['city','City'],['pincode','Pincode']] as [string,string][]).map(([k,label]) => (
                  <div key={k} className={k==='address'?'sm:col-span-2':''}>
                    <label className="block text-sm font-medium mb-1.5">{label}</label>
                    <input type={k==='phone'?'tel':'text'} value={(addr as any)[k]} onChange={change(k)} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black"/>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-1.5">State</label>
                  <select value={addr.state} onChange={change('state')} className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-black bg-white">
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="saveAddr" checked={saveAddr} onChange={e => setSaveAddr(e.target.checked)} className="w-4 h-4 accent-black"/>
                  <label htmlFor="saveAddr" className="text-sm text-gray-600 cursor-pointer">Save this address for future orders</label>
                </div>
              </div>
            )}
          </div>
          <div className="border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Payment Method</h2>
            <div className="space-y-3">
              {([['razorpay','💳 Pay Online (Razorpay)','Cards, UPI, NetBanking, Wallets'],['cod','📦 Cash on Delivery','Pay when your order arrives']] as [string,string,string][]).map(([val,label,sub]) => (
                <button key={val} onClick={() => setMethod(val as any)} className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left transition ${method===val?'border-black bg-gray-50':'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method===val?'border-black':'border-gray-300'}`}>{method===val&&<div className="w-2.5 h-2.5 rounded-full bg-black"/>}</div>
                  <div><p className="font-medium text-sm">{label}</p><p className="text-xs text-gray-400">{sub}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="border rounded-xl p-5 sticky top-24 space-y-4">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="space-y-3 max-h-48 overflow-auto">
              {cart.map((item: any) => <div key={item._id} className="flex justify-between text-sm"><span className="truncate pr-2">{item.name} ×{item.qty}</span><span className="shrink-0">&#8377;{(item.price*item.qty).toLocaleString()}</span></div>)}
            </div>
            <div className="flex justify-between text-sm border-t pt-3"><span>Shipping</span><span className="text-green-600">Free</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-3"><span>Total</span><span>&#8377;{total.toLocaleString()}</span></div>
            <button onClick={placeOrder} disabled={placing} className="w-full bg-black text-white py-4 rounded-xl font-bold hover:opacity-80 disabled:opacity-50 transition">{placing?'Placing...':'Place Order →'}</button>
            <p className="text-xs text-gray-400 text-center">🔒 Secure checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
}