// src/components/AuthModal.jsx — Modale Inscription / Connexion Mode Île
//
// Design :
//   - Overlay sombre semi-transparent
//   - Carte centrée max-width 420px, fond #111, bordure verte
//   - Logo KaïKaï en haut (Bebas Neue, #C9A96E)
//   - Deux onglets : "Créer un compte" / "Se connecter"
//   - Champs email + mot de passe (+ nom complet pour inscription)
//   - Message d'erreur rouge si échec
//
// Logique :
//   - Inscription : supabase.auth.signUp() + upsert dans `profiles`
//   - Connexion   : supabase.auth.signInWithPassword()
//   - Après succès : ferme la modale + active Mode Île

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useIslandMode } from '../context/IslandModeContext';

export default function AuthModal({ onClose }) {
  const { activateIslandMode } = useIslandMode();

  const [tab,      setTab]      = useState('signup'); // 'signup' | 'login'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // ── Bloquer le scroll pendant que la modale est ouverte
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.overflow  = 'hidden';
    document.body.style.position  = 'fixed';
    document.body.style.top       = `-${scrollY}px`;
    document.body.style.width     = '100%';
    return () => {
      document.body.style.overflow  = '';
      document.body.style.position  = '';
      document.body.style.top       = '';
      document.body.style.width     = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // ── Réinitialiser l'erreur lors du changement d'onglet
  const handleTabChange = (newTab) => {
    setTab(newTab);
    setError('');
  };

  // ── Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'signup') {
        // ── Inscription
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: 'https://kaikaifood.com' },
        });

        if (signUpError) throw signUpError;

        // Créer le profil dans la table `profiles`
        if (data.user) {
          await supabase.from('profiles').upsert({
            id:        data.user.id,
            email:     email,
            full_name: fullName,
            points:    0,
          });
        }

      } else {
        // ── Connexion
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      // ── Succès : activer Mode Île et fermer
      activateIslandMode();
      onClose();

    } catch (err) {
      // Traduction des erreurs Supabase communes
      const msg = err?.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else if (msg.includes('User already registered')) {
        setError('Cet email est déjà utilisé. Connectez-vous à la place.');
      } else if (msg.includes('Password should be')) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
      } else {
        setError(msg || 'Une erreur est survenue. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Styles partagés pour les champs
  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      {/* Carte */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          margin: '16px',
          background: '#111111',
          border: '1px solid #2a5a2a',
          borderRadius: '16px',
          padding: '28px 24px 24px',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Croix de fermeture */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
          }}
        >
          <X size={14} />
        </button>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              fontFamily: "'Bebas Neue', Impact, 'Arial Black', sans-serif",
              fontSize: '2rem',
              letterSpacing: '0.12em',
              color: '#C9A96E',
              lineHeight: 1,
            }}
          >
            KaïKaï
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.18em',
              marginTop: '4px',
              textTransform: 'uppercase',
            }}
          >
            Mode Île
          </div>
        </div>

        {/* Onglets */}
        <div
          style={{
            display: 'flex',
            marginBottom: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {[
            { id: 'signup', label: 'Créer un compte' },
            { id: 'login',  label: 'Se connecter'    },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                flex: 1,
                padding: '10px 8px',
                background: 'none',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid #C9A96E' : '2px solid transparent',
                color: tab === t.id ? '#C9A96E' : 'rgba(255,255,255,0.4)',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'color 0.2s, border-color 0.2s',
                marginBottom: '-1px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {tab === 'signup' && (
            <input
              type="text"
              placeholder="Nom complet"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
              style={inputStyle}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
            style={inputStyle}
          />

          {/* Message d'erreur */}
          {error && (
            <div
              style={{
                color: '#ff8080',
                fontSize: '0.82rem',
                padding: '8px 12px',
                background: 'rgba(255,80,80,0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(255,80,80,0.2)',
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          {/* Bouton principal */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading ? '#1a4a2a' : '#2a6644',
              color: '#ffffff',
              border: 'none',
              borderRadius: '999px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
              marginTop: '4px',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3a8054'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2a6644'; }}
          >
            {loading
              ? 'Chargement…'
              : tab === 'signup'
                ? 'Créer mon compte'
                : 'Se connecter'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
