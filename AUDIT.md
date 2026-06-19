# Audit complet — RadCalc Pro v1.1.0

> Date : 2026-06-19 · Périmètre : intégralité du dépôt (src, config, dépendances, build, sécurité)
> Méthode : revue de code exhaustive + `tsc --noEmit` + `vite build` + `npm audit`
> **Note globale : 8,5 / 20** — Prototype excellent (UI, code propre), mais **non sûr cliniquement** :
> 2 bugs de calcul touchant la sécurité patient + 1 vulnérabilité critique de dépendance.

---

## 1. Synthèse exécutive

| Sévérité | Nombre | Impact |
|----------|--------|--------|
| 🔴 Bloquant | 3 | Sécurité patient (surdosage/sous-dosage), vuln critique |
| 🟠 Majeur | 6 | Exactitude scientifique, intégrité audit, surface d'attaque |
| 🟡 Mineur | 10 | Qualité, maintenance, conformité |

**Recommandation :** ne pas utiliser en production clinique avant correction des items **C1, C2, C3, M1, M2, M3**.

---

## 2. Bloquants (🔴)

### C1 — Bug de conversion mCi : volume à prélever faux (×37)
**Fichier :** `src/components/VialManager.tsx:24-32`

`requiredActivity` est **toujours en MBq** (calculé dans `App.tsx`), alors que `data.activity`
(activité du flacon) est saisie dans l'unité affichée. En mode **mCi** :

```
concentration = data.activity(mCi) / data.volume(mL)   // mCi/mL
baseVol       = requiredActivity(MBq) / concentration   // MBq ÷ (mCi/mL) → FAUX
```

Exemple : flacon 100 mCi / 10 mL, cible 370 MBq (=10 mCi)
→ appli : `370 / (100/10) = 37 mL` ; correct : **1 mL** → **erreur ×37**.
**Risque : surdosage direct du patient.**

**Correctif :** convertir `requiredActivity` et `data.activity` dans une unité interne unique
(MBq) avant tout calcul de volume ; n'appliquer la conversion d'unité **qu'à l'affichage**.

### C2 — Calcul pédiatrique EANM dimensionnellement faux (sous-dosage ~4×)
**Fichier :** `src/App.tsx:60-66`

```js
recommended = selectedProtocol.activityMBqPerKg * multiplier;
```

La carte EANM impose `Activité = Activité_de_base[MBq] × Multiple`. Ici on multiplie le
**coefficient par kg** (ex. FDG 3,5 MBq/kg) par le multiple EANM (2,0 à 10 kg) → `7 MBq`
au lieu de ~26-28 MBq. **Le poids de l'enfant n'entre pas dans le calcul.** Sous-dosage
d'un facteur ~4 → images non diagnostiques. Ce n'est pas la méthode EANM annoncée.

**Correctif :** introduire une « activité de base » par classe (A/B/C) et par radiopharmaceutique,
puis `Activité = base × multiple(poids)`. Borner par les activités minimale/maximale EANM.

### C3 — Vulnérabilités de dépendances : 1 critique, 11 hautes
**`npm audit` : 22 vulnérabilités (1 critique, 11 hautes, 8 modérées, 2 basses).**

- **critique** : `protobufjs` ← via `@google/genai` (**dépendance inutilisée**)
- **hautes** : `express`, `path-to-regexp`, `qs` (← `express`, inutilisé) ; `vite`, `rollup`,
  `esbuild`, `ws` (build/dev) ; **`react-router-dom`** (réellement utilisé)

**Correctif :** supprimer les dépendances inutilisées (cf. M4), puis `npm audit fix`
(+ `--force` à évaluer pour les majeures de build).

---

## 3. Majeurs (🟠)

### M1 — Confusion dose efficace (mSv) vs dose absorbée organe (mGy)
`src/components/ResultDisplay.tsx:150` titre « Distribution des Doses par Organe (mGy) » vs
`:208` cartes affichées en « mSv ». Les coefficients organes (`constants.ts`, ex. thyroïde
I-131 = 260, reins Tl-201 = 1,2) sont des **doses absorbées (mGy/MBq)** mais typés
`mSv/MBq` (`types.ts:19`) et affichés en mSv. Incohérence physique dans un outil dosimétrique.

### M2 — Intégrité de l'audit trail (unité)
`src/components/HistoryList.tsx:60` & `src/App.tsx:110-124` : l'activité est stockée/exportée
en **MBq** mais étiquetée avec `entry.unit` (potentiellement mCi). Journalisation faussée
(« 370 mCi » au lieu de « 370 MBq »). Problème pour un journal à visée réglementaire.

### M3 — Coefficients de dose à revalider vs ICRP 128
`src/constants.ts` :
- **Tc-99m = 0,009 mSv/MBq unique** pour tous protocoles (os, myocarde, MAG3, thyroïde,
  poumon) alors qu'ils diffèrent fortement selon le traceur.
- **I-131 = 0,22 mSv/MBq** douteux (≈24 mSv/MBq si thyroïde non bloquée).
- Les coefficients **adultes** sont appliqués aux enfants (sous-estimation de la dose efficace
  pédiatrique).

### M4 — Dépendances inutilisées + fuite potentielle de secret
Non importés dans `src/` : `express`, `better-sqlite3` (**module natif** → casse l'install
ailleurs), `@google/genai`, `dotenv`, `tsx`, `@types/express`.
`vite.config.ts:27` injecte `GEMINI_API_KEY` **dans le bundle public** → toute clé renseignée
serait exposée côté client.

**Correctif :** `npm rm express better-sqlite3 @google/genai dotenv tsx @types/express` ;
retirer le `define` GEMINI ou le déplacer côté serveur si une IA est un jour ajoutée.

### M5 — `JSON.parse(localStorage)` sans `try/catch`
`src/App.tsx:51`, `src/components/VialManager.tsx:16` : données corrompues = **écran blanc
au démarrage** sans récupération. Encapsuler dans `try/catch` + valeur de repli.

### M6 — PWA non installable
`vite.config.ts:22` `icons: []`. Le marketing (Landing) vend le « 100% hors-ligne installable »
mais sans icône le prompt d'installation ne fonctionne pas. Ajouter icônes 192/512 px + maskable.

---

## 4. Mineurs / qualité (🟡)

| # | Constat | Fichier |
|---|---------|---------|
| m1 | Seuil d'alerte dose figé `>15 mSv`, absurde en thérapie | `ResultDisplay.tsx:19` |
| m2 | Code mort (jamais importé) | `Documentation.tsx`, `HumanBody.tsx`, `QRCodeGenerator.tsx` |
| m3 | Métadonnées incohérentes : name `react-example`, v`0.0.0` vs UI « v1.1.0 » ; README = template AI Studio générique | `package.json`, `README.md` |
| m4 | Licence contradictoire : `Apache-2.0` (en-tête) vs « tous droits réservés » ; pas de fichier LICENSE | `App.tsx:3`, `LegalModal.tsx:56` |
| m5 | Bundle 833 KB monolithique (253 KB gzip), aucun code-splitting | build |
| m6 | Validation entrées faible (poids 0, âge > 140, créatinine ≤ 0 → résultats aberrants) | `PatientForm.tsx`, `constants.ts` |
| m7 | `egfr` est un ClCr Cockcroft-Gault (non normalisé /1,73 m²) mais nommé « eGFR » | `types.ts`, `PatientForm.tsx` |
| m8 | `onVolumeCalculated` appelé dans un `useMemo` = effet de bord au rendu | `VialManager.tsx:30` |
| m9 | Aucun test (calcul dosimétrique critique non couvert) | — |
| m10 | Statut dispositif médical (MDR/CE, FDA SaMD) non adressé | — |

---

## 5. Points forts ✅

- TypeScript qui compile sans erreur (`tsc --noEmit` OK), build de prod OK.
- Architecture composants claire et lisible, conventions cohérentes.
- Formules de base correctes : décroissance `A=A₀e^(−λt)`, Mosteller, Cockcroft-Gault (µmol/L),
  conversion MBq↔mCi (1 mCi = 37 MBq).
- Demi-vies exactes pour les 7 isotopes.
- UX/UI très soignée (thème clair/sombre, animations, silhouette dosimétrique, QR, exports).
- Approche « privacy local-first » cohérente et bien documentée.

---

## 6. Remédiation — v1.2.0 (2026-06-19)

Tous les bloquants et majeurs ont été traités. Les coefficients ICRP 128 et la carte
pédiatrique EANM v5.7 (2016) ont été vérifiés via recherche documentaire dédiée.

| # | Constat | Statut | Détail de la correction |
|---|---------|--------|--------------------------|
| C1 | Volume mCi ×37 | ✅ Corrigé | Moteur `lib/units.ts` (tout en MBq, conversion à l'affichage) ; `calculateDrawVolume` prend des MBq ; test de non-régression. |
| C2 | Pédiatrie EANM fausse | ✅ Corrigé | `Activité = base × multiple(poids, classe A/B/C)` + min ; table EANM v5.7 complète 3 colonnes ; baselines sourcées par protocole ; test de non-régression. |
| C3 | 22 vulnérabilités npm | ✅ Corrigé | Deps inutilisées supprimées + `npm audit fix` → **0 vulnérabilité**. |
| M1 | mSv vs mGy organes | ✅ Corrigé | Champ `coefficientMGyPerMBq` ; affichage « mGy » partout ; doses absorbées jamais injectées dans le calcul mSv. |
| M2 | Unité historique/CSV | ✅ Corrigé | Stockage canonique MBq, `formatActivity(valeur, unité)` à l'affichage et à l'export. |
| M3 | Coefficients à valider | ✅ Corrigé | Coeff. ICRP 128 par traceur (Tc-MDP 0,0049 ; MAG3 0,007 ; pertechnétate 0,013 ; Tl-201 0,14…) ; **I-131 branche thyroïde bloquée (0,24) / fonctionnelle (22)**. |
| M4 | Deps + clé GEMINI | ✅ Corrigé | `express`/`better-sqlite3`/`@google/genai`/`dotenv`/`tsx` retirés ; `define` GEMINI supprimé du bundle. |
| M5 | `JSON.parse` localStorage | ✅ Corrigé | `lib/storage.ts` (try/catch + repli). |
| M6 | PWA non installable | ✅ Corrigé | Icônes SVG (any + maskable), manifest complet, favicon/apple-touch-icon. |
| m1 | Seuil dose figé | ✅ Corrigé | `isDoseAboveAlert` désactivé pour la thérapie ; cadrage thérapie dédié. |
| m2 | Code mort | ✅ Corrigé | `Documentation.tsx`, `HumanBody.tsx`, `QRCodeGenerator.tsx` supprimés. |
| m3 | Métadonnées | ✅ Corrigé | `name: radcalc-pro`, `v1.2.0` partout ; README réécrit. |
| m4 | Licence contradictoire | ✅ Corrigé | `LICENSE` propriétaire + en-tête `App.tsx` aligné. |
| m5 | Bundle monolithique | ✅ Corrigé | `manualChunks` (react/charts/motion) ; plus d'avertissement >500 ko. |
| m6 | Validation entrées | ✅ Corrigé | `min`/`max` sur les champs + garde-fous dans le moteur. |
| m7 | eGFR mal nommé | ✅ Corrigé | Renommé `clcr` (ClCr Cockcroft-Gault). |
| m8 | Effet de bord `useMemo` | ✅ Corrigé | `onVolumeCalculated` supprimé ; calcul pur. |
| m9 | Aucun test | ✅ Corrigé | Vitest : 32 tests sur le moteur (dont régressions C1/C2). |
| m10 | Dispositif médical | ⚠️ Documenté | Avertissements renforcés ; statut réglementaire reste à traiter par l'éditeur. |

**Bonus** : refonte UI/UX (menu de navigation partagé desktop + tiroir mobile, menu de sections
scrollspy dans le calculateur, kit UI cohérent), polices auto-hébergées (système) pour un vrai
hors-ligne, DaTSCAN/thérapies en activité fixe, et accessibilité (focus-visible, aria, labels).

### Passe de revue adversariale (4 relecteurs + vérification)

Une revue multi-agents a ensuite confirmé et corrigé :
- **I-131** : `resolveEffectiveCoefficient` respecte désormais un override de protocole avant la
  bascule thyroïde fonctionnelle(22)/bloquée(0,24) ; l'affichage de repli est rendu cohérent.
- **DaTSCAN** : suppression de la dose thyroïdienne (iodure libre) erronée — doses d'organe
  désormais surchargées au niveau du protocole.
- **Pédiatrie** : un enfant ne reçoit plus l'activité fixe adulte (DaTSCAN) ; la ClCr
  Cockcroft-Gault est neutralisée en pédiatrie.
- **Robustesse** : `loadJSON` valide la forme (Array.isArray) → plus de crash si le localStorage
  contient un JSON valide mais non conforme.
- **Accessibilité (WCAG 2.1 AA)** : contraste des boutons (emerald-600) et des accents en thème
  clair (remap `:root:not(.dark)`), anneaux de focus visibles, associations label/champ,
  groupe radio « Sexe », `aria-pressed`, tiroir mobile (Échap + `aria-controls` + label dynamique),
  lien d'évitement + `<main>`, `prefers-reduced-motion`.
- **Nettoyage** : `.env.example` obsolète supprimé, `vite` en devDependencies, `tsconfig` include/exclude,
  import mort retiré, QR à horodatage stable, traçabilité I-131 dans l'export CSV.

Vérifications finales : `tsc --noEmit` ✓ · `vitest run` 34/34 ✓ · `vite build` ✓ (chunks séparés) · `npm audit` 0 ✓ · revue visuelle thèmes clair/sombre ✓.

## 6 bis. Base de données Firebase + comptes (v1.3.0)

Ajout d'une vraie base de données cloud (mono-centre : **IMeNA, Côte d'Ivoire**) :

- **Firebase Auth + Cloud Firestore** ; persistance hors-ligne (IndexedDB) conservée + `ignoreUndefinedProperties`.
- **Collections** : `users`, `patients`, `exams`, `vials` (couche `src/lib/db.ts`, abonnements live).
- **5 rôles** (`src/lib/roles.ts`) : Administrateur, Médecin nucléaire, Radiopharmacien, Manipulateur, Lecteur, avec matrice de permissions testée (Vitest).
- **Pages** : `/login` (connexion/inscription), `/patients` (dossiers + envoi au calculateur), `/admin` (gestion des comptes). Routes protégées par rôle (`ProtectedRoute`).
- **Examens** rattachés au patient, horodatés, avec **validation médicale** (médecin/radiopharmacien) ; export CSV.
- **Règles de sécurité** (`firestore.rules`) durcies après revue adversariale : self-registration verrouillée (rôle/actif/clés/email), validation d'examen en transition `draft→validated` une seule fois avec gel des champs dosimétriques, mise à jour admin contrôlée, attribution (`createdBy/performedBy`) liée à `request.auth.uid`. Voir `FIREBASE_SETUP.md`.
- **Confidentialité** : la politique a été corrigée (le stockage n'est plus « 100 % local » mais cloud sécurisé à accès restreint par rôle).

Revue adversariale Firebase (12 agents) : 1 critique + 5 majeurs corrigés (intégrité des
enregistrements médicaux et RBAC au niveau des champs). Vérifs : `tsc` ✓ · `vitest` 41/41 ✓ · `vite build` ✓.

⚠️ **Avant mise en production** : déployer `firestore.rules`, créer Firestore en mode production,
bootstrapper le premier admin (console), et idéalement ajouter une Cloud Function pour la
protection « dernier admin » et la provision atomique du profil.

## 7. Feuille de route corrective recommandée

1. **Sprint 1 (sécurité patient)** : C1, C2, M1, M2 + tests unitaires sur tous les calculs.
2. **Sprint 2 (sécurité info)** : M4 (purge deps) puis C3 (`npm audit fix`), M5.
3. **Sprint 3 (exactitude)** : M3 (revalidation ICRP 128 + coefficients pédiatriques).
4. **Sprint 4 (qualité)** : m1-m8, M6 (PWA), nettoyage code mort, README/licence.
5. **Sprint 5 (conformité)** : m10, dossier dispositif médical si usage clinique réel.
