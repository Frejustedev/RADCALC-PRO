# Audit complet — RadCalc Pro

> Date : 2026-06-20 · Méthode : audit multi-expert (7 dimensions) + vérification adversariale + synthèse, sur l'état **actuel** du code. Vérifs locales : `tsc` propre · **41/41 tests** · `npm audit` prod **0 vuln** · build OK.
> **Note globale : 14,3 / 20** (pondérée : dosimétrie 28 %, sécurité 22 %, archi 15 %, build 13 %, produit 12 %, UX 10 %).

**Verdict :** Bon, solide et honnête — un excellent **calculateur** dosimétrique avec une vraie couche dossier multi-utilisateurs, mais **pas encore un dispositif clinique de bout en bout**. Le moteur de calcul (juste et testé) et le RBAC serveur (très bon niveau) sont freinés par quelques défauts d'affichage médicaux internes-contradictoires (I-131), une frontière de sécurité (règles Firestore) non testée, et une incohérence de configuration de base de données.

---

## 1. Notes par dimension

| Dimension | Note | Synthèse |
|-----------|:----:|----------|
| Dosimétrie & exactitude médicale | **14,5** | Moteur pur, juste, testé (EANM A/B/C, décroissance, ×37 corrigé) ; freiné par 3 défauts d'affichage I-131. |
| Sécurité & contrôle d'accès | **15** | Règles Firestore de très bon niveau (RBAC serveur, deny-by-default, validation à sens unique) mais 0 test d'émulateur. |
| Architecture, code & données | **15** | Séparation moteur/UI exemplaire, MBq canonique ; double source patient et absence d'ErrorBoundary pèsent. |
| UX, accessibilité & design | **14** | a11y soignée (focus, reduced-motion, skip-link) mais contrastes AA partiels, modale sans focus-trap, `window.confirm`. |
| Build, config, déploiement & PWA | **12,5** | Socle propre (0 vuln, PWA offline) mais **incohérence d'ID de base Firestore**, pas de code-splitting, icônes SVG seules. |
| Produit & complétude fonctionnelle | **13,5** | Workflow cohérent mais chaîne planification→administration réelle→audit rompue. |

---

## 2. Points forts

- **Moteur de dosimétrie pur, sans effet de bord, bien typé, 41 tests verts** : décroissance et inverses corrects, demi-vies exactes, gardes sur entrées non physiques.
- **Carte pédiatrique EANM v5.7 correcte** (table A/B/C complète, activité = baseline MBq × multiple, plancher min) — évite le piège MBq/kg × multiple, verrouillé par test de régression.
- **Sécurité d'unités traitée comme invariant** : tout en MBq en interne, conversion mCi à l'affichage uniquement ; bug volume ×37 éliminé par construction et testé.
- **Règles Firestore de niveau supérieur** : RBAC réellement appliqué côté serveur, deny-by-default, auto-inscription verrouillée (rôle/inactif/email épinglés), validation d'examen strictement à sens unique avec gel des champs de dosimétrie (`hasOnly`).
- **Snapshot patient figé à l'enregistrement** de l'examen (bon pattern d'audit immuable) ; RBAC centralisé et testé.
- **Cadre « aide à la décision / valider localement » honnête et omniprésent**.
- **Hygiène build saine** : 0 vulnérabilité prod, dépendances mortes purgées, PWA hors-ligne, secrets gérés correctement.

---

## 3. Problèmes confirmés (critique / majeur)

### 🔴 C1 — Incohérence d'ID de base Firestore (critique)
`firebase.json`/`.env.example` visent `radcalc-pro` tandis que le déploiement documenté/réel utilisait la base partagée US `ai-studio-77e401c9-…`. Un `firebase deploy` publierait les règles sur une base que l'app n'interroge pas (drift silencieux), et des données de santé résidaient aux US (nam5) sans DPA/transfert.
**Fix :** une seule base, alignée partout (firebase.json `database`, `VITE_FIREBASE_DATABASE_ID` Vercel, `.env.example`, doc) ; base dédiée **en région UE** ; vérifier que les règles sont actives sur la base réellement interrogée. *(En cours de résolution via le projet Firebase dédié que tu as créé — il reste à aligner les 4 emplacements.)*

### 🟠 C2 — Dose absorbée thyroïdienne I-131 figée (majeur)
`constants.ts` thyroïde I-131 = 430 mGy/MBq **ne suit pas** le toggle « Thyroïde bloquée », alors que la dose efficace chute ~90×. Affichage interne-contradictoire qu'un clinicien pourrait croire.
**Fix :** coefficient d'organe thyroïdien dépendant de la captation (bloqué vs fonctionnel), sélectionné par le même `thyroidBlocked` ; test de régression miroir.

### 🟠 C3 — Alerte de dose neutralisée pour l'imagerie I-131 (majeur)
L'alerte est désactivée pour tout isotope `Therapy` ; or le protocole **diagnostique** I-131 (`thyroid-imaging`) calcule ~154 mSv sans avertissement.
**Fix :** piloter l'alerte par l'**intention** (protocole diagnostique vs thérapeutique), pas par `isotope.type`.

### 🟠 C4 — Règles Firestore 100 % non testées (majeur)
La frontière d'autorisation/intégrité du dossier médical n'a aucun test d'émulateur. Une régression silencieuse (suppression d'un `hasOnly`) laisserait altérer une dosimétrie validée sans test rouge.
**Fix :** suite `@firebase/rules-unit-testing` sur l'émulateur, en CI.

### 🟠 C5 — Update patients sans verrouillage de clés/types ni imputabilité (majeur)
La règle `update` de `/patients` n'impose pas `hasOnly`, ni types cliniques, ni `updatedBy`.
**Fix :** `changedKeys().hasOnly([...])`, validation de types, champ `updatedBy == request.auth.uid` imposé et écrit.

### 🟠 C6 — Politique de confidentialité incomplète (majeur)
Pas de sous-traitant/DPA, pas de résidence ni durée de conservation ; « cache chiffré par le navigateur » trompeur pour des PHI.
**Fix :** nommer Google/Firebase + DPA, divulguer la région, conservation + droits des personnes, corriger la mention de chiffrement.

---

## 4. Manques fonctionnels

- **Pas de planification d'injection** : le délai de décroissance est un curseur volatil, non rattaché à une heure programmée, jamais persisté.
- **Pas de réconciliation post-injection** : l'activité enregistrée = activité **planifiée recalculée**, jamais l'activité **mesurée** à l'activimètre, le résidu seringue, l'heure réelle, le lot/flacon → insuffisant pour la radioprotection.
- **Pas de vue par patient** : `ExamHistory` s'abonne à toute la collection, 25 lignes côté client, sans filtre ni pagination → inexploitable à l'échelle et pour le suivi multi-cycles (Lu-177/I-131).
- **Checklist de sécurité décorative** : items codés en dur « pending », non cochables/horodatés/persistés ; la validation n'exige aucune complétude.
- **Doses efficaces cumulées par patient** non calculées.
- **Catalogue de protocoles incomplet** (ventilation pulmonaire, MIBI effort, DMSA/DTPA, ganglion sentinelle, Y-90/SIRT) ; **pas de reset mot de passe**.
- **Pas de registre des déchets / journal d'activimètre**.
- **Aucun paramétrage admin** des DRL/coefficients/seuils locaux (figés dans `constants.ts`, recompilation nécessaire).

---

## 5. Feuille de route

**P0 — avant toute donnée patient réelle**
1. Résoudre l'incohérence d'ID de base + résidence des données (aligner config, base dédiée UE).
2. Corriger les 3 défauts d'affichage I-131 (dose d'organe suit le toggle ; alerte par intention ; dose efficace N/A en thérapie) + tests.
3. Tests des règles Firestore via émulateur en CI.

**P1**
4. Durcir l'update patients (`hasOnly` + types + `updatedBy`), figer la provenance flacons, protéger les examens validés de la suppression.
5. Fermer la boucle planification→administration→audit (heure programmée, saisie post-injection, vue par patient avec requête bornée).
6. ErrorBoundary racine + compléter la politique de confidentialité.
7. Checklist de sécurité réelle (cochable/horodatée/persistée, bloquant la validation).

**P2**
8. Code-splitting par route + icônes PWA PNG 192/512/maskable + `tsconfig` strict.
9. Contrastes WCAG AA + primitive Dialog accessible (focus-trap) + remplacer `window.confirm` ; citer chaque coefficient non-ICRP-128.
10. Élargir le catalogue de protocoles, doses cumulées par patient, reset mot de passe, paramétrage admin des seuils locaux.
