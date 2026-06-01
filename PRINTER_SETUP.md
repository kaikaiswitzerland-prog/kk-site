# Imprimante thermique Epson TM-m30II — prérequis (à faire UNE fois)

L'admin KaïKaï imprime ses tickets de commande directement sur l'imprimante
**Epson TM-m30II** (IP `192.168.1.103`) via son serveur ePOS-Print intégré.
Comme l'admin tourne sur **Vercel en HTTPS**, le navigateur de l'iPad refuse
par défaut tout appel `http://` vers une IP locale (règle « mixed content »).
On passe donc en **HTTPS**, ce qui implique d'enseigner à l'iPad à faire
confiance au certificat auto-signé de l'imprimante.

Ces étapes sont **manuelles** — elles ne dépendent pas du code applicatif.

---

## 1. Mettre l'iPad et l'imprimante sur le même Wi-Fi

L'iPad qui ouvre `/admin` ET la TM-m30II doivent être branchés sur le **même
réseau Wi-Fi local** (sous-réseau `192.168.1.x`). L'iPad doit pouvoir « voir »
l'imprimante à l'adresse `192.168.1.103`.

Test rapide depuis Safari sur l'iPad :
```
https://192.168.1.103/
```
→ doit afficher la page d'admin web de l'imprimante (avec un avertissement
de sécurité tant que le certificat n'a pas été installé — étape 3).

---

## 2. Activer HTTPS sur la TM-m30II + exporter son certificat

Sur un PC ou un Mac sur le même Wi-Fi :

1. Installer **Epson TM Utility** (Mac App Store / Windows) ou
   « **TM-Print Assistant** » selon l'OS.
2. Ouvrir l'app → sélectionner la TM-m30II détectée sur le réseau.
3. Aller dans **« ePOS-Print » / « Web Service » / « Communication »**.
4. Activer **HTTPS** (toggle ou case à cocher selon la version du firmware).
5. Choisir **« Génération automatique du certificat »** si proposé.
6. **Exporter le certificat racine** (bouton « Export » / « Save certificate »).
   On obtient un fichier `.cer` ou `.crt`.

> Si l'option HTTPS n'apparaît pas, mettre d'abord le firmware à jour
> (voir étape 4) puis recommencer.

---

## 3. Installer le certificat comme profil de confiance sur l'iPad

Sans cette étape, Safari refuse l'appel `https://192.168.1.103/...` et
l'admin affichera systématiquement « Imprimante injoignable ».

1. Envoyer le fichier `.cer` à l'iPad (AirDrop, e-mail, Files…).
2. Sur l'iPad, **ouvrir** le fichier → iOS propose « Installer le profil ».
3. **Réglages → Général → VPN et gestion de l'appareil** → installer le
   profil téléchargé (saisir le code de l'iPad si demandé).
4. **Réglages → Général → Informations → Réglages de confiance des
   certificats** → **activer la confiance complète** pour le certificat
   de la TM-m30II.

Test : recharger `https://192.168.1.103/` dans Safari — aucun
avertissement ne doit apparaître.

---

## 4. Mettre à jour le firmware de la TM-m30II

Les versions récentes du firmware ePOS-Print prennent en charge **CORS**, ce
qui est indispensable pour que les fetch lancés depuis le domaine Vercel
(ex. `https://kaikai-…vercel.app`) atteignent l'imprimante sans être bloqués
par la politique de même origine.

1. Dans **TM Utility** → onglet **« Firmware »** ou **« Mise à jour »**.
2. Vérifier qu'une version plus récente est disponible et lancer l'update.
3. Ne pas couper l'alimentation pendant le flash.
4. Une fois redémarrée, revérifier que HTTPS est toujours activé (étape 2).

---

## Vérification finale

1. Ouvrir `/admin` sur l'iPad (Vercel ou local).
2. Sur n'importe quelle commande, cliquer **🖨️ Imprimer**.
3. Le toast doit passer de « Impression… » à « ✅ Ticket imprimé »
   et le ticket sort de la TM-m30II.

En cas d'échec, le toast d'erreur indique le code remonté par
l'imprimante (`EPTR_COVER_OPEN`, `EPTR_REC_EMPTY`, `DeviceNotFound`, …).

---

## Configurer une autre URL imprimante

L'URL utilisée par l'admin est lue depuis la variable d'environnement
`VITE_PRINTER_URL` (cf `.env.example`). En cas de changement d'IP ou de
serveur ePOS-Print, mettre à jour cette variable :

- en local : dans `.env.local`,
- en production : `vercel env add VITE_PRINTER_URL`.

Valeur par défaut si la variable n'est pas définie :
```
https://192.168.1.103/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000
```
