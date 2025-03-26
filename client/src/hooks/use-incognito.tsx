import { useState, useEffect } from 'react';

// Questo hook tenta di rilevare se l'utente è in modalità incognito/privata
export function useIncognitoDetection() {
  const [isIncognito, setIsIncognito] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Prima strategia: verifica se localStorage è disponibile
    const checkLocalStorage = () => {
      try {
        localStorage.setItem('incognitoTest', 'test');
        localStorage.removeItem('incognitoTest');
        return false; // localStorage funziona, probabilmente non incognito
      } catch (e) {
        return true; // localStorage non funziona, probabilmente incognito
      }
    };

    // Seconda strategia: verifica la quota di localStorage
    const checkQuota = async () => {
      if (navigator.storage && navigator.storage.estimate) {
        const { quota } = await navigator.storage.estimate();
        // Spesso in modalità incognito la quota è molto limitata (inferiore a 120MB in Chrome)
        return quota !== undefined && quota < 120 * 1024 * 1024;
      }
      return false;
    };

    // Verifica cookie persistenti
    const checkCookies = () => {
      try {
        document.cookie = "incognitoTest=test; expires=Tue, 19 Jan 2038 03:14:07 UTC";
        return document.cookie.indexOf("incognitoTest") === -1;
      } catch (e) {
        return true;
      }
    };

    // Esegui i controlli
    const runChecks = async () => {
      try {
        const results = [
          checkLocalStorage(),
          await checkQuota(),
          checkCookies()
        ];
        
        // Se almeno due test indicano incognito, consideriamo che sia effettivamente in incognito
        const trueCount = results.filter(Boolean).length;
        setIsIncognito(trueCount >= 1);
      } catch (e) {
        console.error("Errore nel rilevamento modalità incognito:", e);
        setIsIncognito(false); // In caso di errore, assumiamo non incognito
      } finally {
        setIsChecking(false);
      }
    };

    runChecks();
  }, []);

  return { isIncognito, isChecking };
}