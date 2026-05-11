// src/components/IslandModeToggle.jsx — Pastille "Mode Île" style iOS Control Center
//
// Placement : footer, après la section Boissons.
// Comportement (état lancement) : DÉSACTIVÉ visuellement et fonctionnellement.
// Le toggle reste visible mais grisé. Le programme membre + le -10% sont
// gelés tant que MODE_ILE_ENABLED reste false.
//
// TODO réactiver Mode Île : passer MODE_ILE_ENABLED à true.
// (Et remettre couponApplied=true dans src/App.jsx, et discount=subtotal*0.10
// dans api/create-checkout.js — voir TODO marqués dans ces fichiers.)

import React, { useState, useEffect, useRef } from 'react';
import { useIslandMode } from '../context/IslandModeContext';
import AuthModal from './AuthModal';

// ── Feature flags de lancement ────────────────────────────────────────
const MODE_ILE_ENABLED = false;
// AUTH_ENABLED gate la modale de création de compte. Sans Mode Île, aucune
// raison pour un client de se créer un compte → on cache la porte d'entrée.
const AUTH_ENABLED = false;

export default function IslandModeToggle() {
  const { islandMode, toggleIslandMode, user } = useIslandMode();
  const [showAuth,    setShowAuth]    = useState(false);
  const [successMsg,  setSuccessMsg]  = useState(false);
  const prevMode = useRef(islandMode);

  useEffect(() => {
    if (!prevMode.current && islandMode) {
      setSuccessMsg(true);
      const t = setTimeout(() => setSuccessMsg(false), 2000);
      return () => clearTimeout(t);
    }
    prevMode.current = islandMode;
  }, [islandMode]);

  const handleToggle = (e) => {
    // Phase de lancement : toggle inopérant. On stoppe net, pas de toast.
    if (!MODE_ILE_ENABLED) {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      return;
    }
    if (!user && !islandMode) {
      // Utilisateur non connecté qui veut activer → authentification requise
      setShowAuth(true);
    } else {
      toggleIslandMode();
    }
  };

  return (
    <>
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>

        {/* Tile principale style iOS Control Center */}
        <div
          onClick={handleToggle}
          role="switch"
          aria-checked={islandMode}
          aria-disabled={!MODE_ILE_ENABLED}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '20px',
            background: islandMode ? 'rgba(42,102,68,0.25)' : '#1a2e1a',
            border: `1px solid ${islandMode ? '#2a6644' : '#2a5a2a'}`,
            width: '260px',
            cursor: MODE_ILE_ENABLED ? 'pointer' : 'not-allowed',
            transition: 'background 0.3s ease, border-color 0.3s ease',
            userSelect: 'none',
            opacity: MODE_ILE_ENABLED ? 1 : 0.5,
          }}
        >
          {/* Icône palmier */}
          <span style={{ fontSize: '1.4rem', flexShrink: 0, lineHeight: 1 }}>🌴</span>

          {/* Label */}
          <span
            style={{
              fontFamily: "'Bebas Neue', Impact, 'Arial Black', sans-serif",
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              color: '#ffffff',
              flex: 1,
            }}
          >
            {MODE_ILE_ENABLED ? 'Mode Île' : 'Mode Île — Bientôt disponible'}
          </span>

          {/* Toggle switch */}
          <div
            style={{
              width: '44px',
              height: '26px',
              borderRadius: '13px',
              background: islandMode ? '#2a6644' : '#444444',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.3s ease',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '3px',
                left: islandMode ? '21px' : '3px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ffffff',
                transition: 'left 0.3s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
              }}
            />
          </div>
        </div>

        {/* Message de succès / sous-texte */}
        {!MODE_ILE_ENABLED ? (
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', paddingLeft: '4px' }}>
            Programme membre en préparation
          </span>
        ) : successMsg ? (
          <span style={{ fontSize: '0.82rem', color: '#4ade80', fontWeight: 600, paddingLeft: '4px', transition: 'opacity 0.3s' }}>
            Bienvenue dans le Mode Île 🌴
          </span>
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', paddingLeft: '4px' }}>
            Activez pour débloquer les avantages membres
          </span>
        )}
      </div>

      {AUTH_ENABLED && showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
