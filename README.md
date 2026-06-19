# RadCalc Pro — IMeNA (Côte d'Ivoire)

**Calculateur dosimétrique de précision pour la médecine nucléaire**, avec base de données
patients/examens multi-utilisateurs (Firebase) pour un centre unique.
PWA installable et fonctionnelle hors-ligne, basée sur les recommandations **EANM** et **ICRP**.

> ⚠️ **Outil d'aide à la décision.** Tous les résultats (activités à injecter, dosimétrie,
> volume à prélever, clairance rénale) doivent être vérifiés et validés par un médecin
> nucléaire ou un radiopharmacien avant toute application clinique. Les coefficients par
> défaut doivent être confrontés aux publications ICRP/EANM en vigueur et aux DRL locaux.

## Fonctionnalités

- **Activité recommandée** : dosage adulte (MBq/kg) et **pédiatrique EANM** (activité de base × multiplicateur de classe A/B/C, plancher minimal appliqué).
- **Dose efficace (mSv)** par coefficient ICRP 128, spécifique au traceur (Tc-99m, I-123…) ; **branche thyroïde bloquée / fonctionnelle** pour l'I-131.
- **Dose absorbée par organe (mGy)** et cartographie anatomique interactive.
- **Décroissance radioactive** : activité résiduelle, activité à prélever (compensation du délai), courbe et gestion des déchets (ALARA).
- **Gestion du flacon** : volume à prélever avec compensation du **volume mort**, conversion d'unités MBq ⇄ mCi sûre, stock de flacons.
- **Réductions** : PET digital (−40 %), ajustement rénal (MAG3, ClCr < 30), activités fixes (DaTSCAN, thérapies).
- **Base de données (Firebase)** : patients, examens et flacons persistés dans le cloud (Firestore), partagés au sein du centre, avec **persistance hors-ligne** et synchronisation automatique.
- **Comptes & rôles** : authentification ; rôles Administrateur / Médecin nucléaire / Radiopharmacien / Manipulateur / Lecteur, avec validation médicale des examens.
- **Traçabilité** : examens horodatés (réalisé par / validé par), export CSV, QR code d'étiquette, impression.
- **PWA** installable et utilisable hors-ligne ; thème clair/sombre.

## Base de données & comptes

L'application est conçue pour un **centre unique** (IMeNA, Côte d'Ivoire) et requiert un projet
Firebase (Authentication + Firestore). Voir **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** pour :
configuration `.env.local`, déploiement des règles de sécurité (`firestore.rules`) et création
du premier administrateur. Sans configuration, l'application affiche un écran d'aide et seules
les pages publiques (accueil, documentation) sont accessibles.

## Démarrage

**Prérequis :** Node.js 18+.

```bash
npm install      # installer les dépendances
npm run dev      # serveur de dev (http://localhost:3000)
npm run build    # build de production (dossier dist/)
npm run preview  # prévisualiser le build
```

## Qualité

```bash
npm run lint       # typecheck (tsc --noEmit)
npm run test       # tests unitaires (Vitest, mode watch)
npm run test:run   # tests unitaires (une passe)
npm run coverage   # couverture du moteur de calcul
```

Le moteur dosimétrique (`src/lib/`) est **pur et entièrement testé** : conversions d'unités,
décroissance, biométrie (BSA Mosteller, ClCr Cockcroft-Gault), dosage pédiatrique EANM,
volume à prélever et dose efficace/organe. Voir [AUDIT.md](AUDIT.md) pour l'historique de
remédiation et les sources des coefficients.

## Architecture

```
src/
  lib/            moteur pur (units, dosimetry) + Firebase (firebase, AuthContext, db, roles, center)
  components/     composants UI (formulaires, résultats, navigation, auth, graphes)
  pages/          Landing, Login, Patients, Admin, Documentation
  constants.ts    données de référence (isotopes, protocoles, table EANM A/B/C)
  types.ts        types partagés
firestore.rules   règles de sécurité RBAC (à déployer)
```

## Sources

- ICRP Publication 128 — coefficients de dose efficace et doses absorbées par organe.
- EANM Paediatric Dosage Card v5.7 (2016) — dosage pédiatrique.
- Mosteller (1987) — surface corporelle. Cockcroft-Gault — clairance de la créatinine.

## Licence

Propriétaire — © 2026 Dr Fréjuste Agboton / NucleaTech Solutions. Voir [LICENSE](LICENSE).
