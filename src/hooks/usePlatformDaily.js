// Saisies manuelles Uber Eats / Just Eat (app_settings.platform_daily),
// lues par le bandeau Objectif et les cartes Pilotage de l'admin.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export function usePlatformDaily() {
  const [data, setData] = useState({});
  const reload = useCallback(async () => {
    const { data: row } = await supabase.from('app_settings').select('value').eq('key', 'platform_daily').maybeSingle();
    setData(row?.value && typeof row.value === 'object' ? row.value : {});
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return [data, setData, reload];
}

