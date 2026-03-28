// src/context/IslandModeContext.jsx — Contexte global Mode Île
//
// Expose à l'ensemble de l'app :
//   - islandMode        : bool — état du Mode Île (persisté dans localStorage)
//   - toggleIslandMode  : fn — bascule le mode
//   - activateIslandMode: fn — active directement (appelé après auth réussie)
//   - user              : objet Supabase User ou null
//   - userProfile       : données de la table `profiles` ou null

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const IslandModeContext = createContext(null);

// ── Lecture initiale depuis localStorage (évite le flash au chargement)
function getInitialIslandMode() {
  try {
    return localStorage.getItem('islandMode') === 'true';
  } catch {
    return false;
  }
}

export function IslandModeProvider({ children }) {
  const [islandMode,   setIslandMode]   = useState(getInitialIslandMode);
  const [user,         setUser]         = useState(null);
  const [userProfile,  setUserProfile]  = useState(null);

  // ── Charger le profil depuis la table `profiles`
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setUserProfile(data ?? null);
    } catch {
      setUserProfile(null);
    }
  }, []);

  // ── Restaurer la session Supabase au chargement
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) fetchProfile(currentUser.id);
    }).catch(() => { /* Supabase non configuré — mode dégradé */ });

    // Écouter les changements d'état d'authentification
    let subscription = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser.id);
        } else {
          setUserProfile(null);
        }
      });
      subscription = data?.subscription ?? null;
    } catch { /* Supabase non configuré — pas d'écoute auth */ }

    return () => { try { subscription?.unsubscribe(); } catch { /* ignore */ } };
  }, [fetchProfile]);

  // ── Bascule le Mode Île (connecté ou non)
  const toggleIslandMode = useCallback(() => {
    setIslandMode(prev => {
      const next = !prev;
      try { localStorage.setItem('islandMode', String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── Active directement (après connexion/inscription réussie)
  const activateIslandMode = useCallback(() => {
    setIslandMode(true);
    try { localStorage.setItem('islandMode', 'true'); } catch { /* ignore */ }
  }, []);

  return (
    <IslandModeContext.Provider
      value={{ islandMode, toggleIslandMode, activateIslandMode, user, userProfile }}
    >
      {children}
    </IslandModeContext.Provider>
  );
}

// ── Hook d'accès au contexte
export function useIslandMode() {
  const ctx = useContext(IslandModeContext);
  if (!ctx) throw new Error('useIslandMode doit être utilisé dans un IslandModeProvider');
  return ctx;
}
