"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import "@/styles/globals.css";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to register");
      setLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  };

  return (
    <main className="container landing-container">
      <div className="form-card" style={{ maxWidth: '400px', margin: '0 auto', marginTop: '10vh' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', textAlign: 'center' }}>Create Account</h1>
        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
          <span style={{ padding: '0 10px', color: '#888', fontSize: '0.9rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
        </div>

        <button 
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="btn-secondary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'white', color: '#333', border: '1px solid #ddd' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.91 2.26c1.7-1.57 2.68-3.88 2.68-6.61z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.85.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7L1.04 13.04c1.48 2.94 4.5 4.96 8.01 4.96z" fill="#34A853"/><path d="M3.97 10.72c-.18-.54-.28-1.12-.28-1.72s.1-1.18.28-1.72L1.04 4.96C.38 6.28 0 7.77 0 9.3c0 1.53.38 3.02 1.04 4.34l2.93-2.92z" fill="#FBBC05"/><path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.48 0 2.46 2.02.98 4.96L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Sign in</Link>
        </p>
      </div>
    </main>
  );
}
