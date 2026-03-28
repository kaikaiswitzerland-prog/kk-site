// src/components/IslandModeToggle.jsx — Pastille "Mode Île" style iOS Control Center
//
// Placement : footer, après la section Boissons.
// Comportement :
//   - Si non connecté + clic pour activer → ouvre AuthModal
//   - Si connecté → bascule immédiatement, état persisté dans localStorage

import React, { useState, useEffect, useRef } from 'react';
import { useIslandMode } from '../context/IslandModeContext';
import AuthModal from './AuthModal';

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

  const handleToggle = () => {
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '20px',
            background: islandMode ? 'rgba(42,102,68,0.25)' : '#1a2e1a',
            border: `1px solid ${islandMode ? '#2a6644' : '#2a5a2a'}`,
            width: '220px',
            cursor: 'pointer',
            transition: 'background 0.3s ease, border-color 0.3s ease',
            userSelect: 'none',
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
            Mode Île
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

        {/* Message de succès */}
        {successMsg ? (
          <span style={{ fontSize: '0.82rem', color: '#4ade80', fontWeight: 600, paddingLeft: '4px', transition: 'opacity 0.3s' }}>
            Bienvenue dans le Mode Île 🌴
          </span>
        ) : (
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', paddingLeft: '4px' }}>
            Activez pour débloquer les avantages membres
          </span>
        )}
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
