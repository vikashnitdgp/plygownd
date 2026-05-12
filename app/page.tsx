'use client';
import { useEffect, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

function NewsletterForm() {
  const { store } = useStore();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'error'>('idle');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!store||!email) return; setStatus('loading');
    try { await store.newsletter.subscribe(email); setStatus('done'); setEmail(''); } catch { setStatus('error'); }
  }
  if (status === 'done') return <p style={{color:'#4ade80'}} className="font-medium text-lg">You're in! 🎉</p>;
  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 px-5 py-3 rounded-lg focus:outline-none focus:border-white" />
      <button type="submit" disabled={status==='loading'} className="bg-white text-black px-7 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 whitespace-nowrap">{status==='loading' ? '...' : 'Subscribe'}</button>
    </form>
  );
}

export default function HomePage() {
  const { store } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  useEffect(() => {
    if (!store) return;
    store.products.list({ limit: 8, sort: 'newest' }).then((d: any) => setProducts(d.products || [])).catch(() => {}).finally(() => setLoading(false));
  }, [store]);
  return (
    <>
      <section className="relative text-white overflow-hidden" style={{background:'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #0f0f0f 100%)'}}>
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 60% 50%, #7c3aed15 0%, transparent 70%)'}}/>
        <div className="relative max-w-6xl mx-auto px-6 py-36 md:py-52 flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1 text-center md:text-left">
            
            <p className="text-xs font-light tracking-[0.3em] uppercase mb-6" style={{color:'var(--brand)'}}>Exclusive Collection</p>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6" style={{letterSpacing:'-0.02em'}}>FRESH DROPS</h1>
            <div className="w-16 h-px mb-6" style={{background:'var(--brand)'}}/>
            <p className="text-white/60 text-lg leading-relaxed mb-12 max-w-md font-light">Limited edition pieces crafted for the bold.</p>
            <Link href="/products" className="inline-block px-10 py-4 text-sm font-semibold tracking-widest uppercase hover:opacity-90 transition" style={{background:'var(--brand)', color:'white'}}>Shop Now →</Link>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 border flex items-center justify-center text-8xl relative" style={{borderColor:'var(--brand-dark)'}}>
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2" style={{borderColor:'var(--brand)'}}/>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2" style={{borderColor:'var(--brand)'}}/>
              ✦
            </div>
          </div>
        </div>
      </section>
      <div className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
          <span>🚚 Free Shipping</span>
          <span>✅ Premium Quality</span>
          <span>🔒 Secure Payments</span>
          <span>↩️ Easy Returns</span>
        </div>
      </div>
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-1">Just dropped</p>
            <h2 className="text-4xl font-black">New Arrivals</h2>
          </div>
          <Link href="/products" className="text-sm font-semibold underline hover:no-underline hidden sm:block">View all</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{[...Array(8)].map((_,i) => <div key={i} className="space-y-3"><div className="bg-gray-100 rounded-xl aspect-square animate-pulse"/><div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"/></div>)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><p className="text-4xl mb-3">🛍️</p><p>Products coming soon!</p></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{products.map(p => <ProductCard key={p._id} product={p} />)}</div>
        )}
        <div className="text-center mt-12">
          <Link href="/products" className="inline-block border-2 border-black px-10 py-3 font-semibold hover:bg-black hover:text-white transition rounded-lg">Shop Now →</Link>
        </div>
      </section>
      <section className="bg-black text-white py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Get early access to drops</h2>
          <p className="text-gray-400 mb-8">No spam. Just new merch, before it sells out.</p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
