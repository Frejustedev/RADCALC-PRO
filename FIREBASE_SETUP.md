# Configuration Firebase — RadCalc Pro (IMeNA, Côte d'Ivoire)

RadCalc Pro utilise **Firebase Authentication** (comptes) et **Cloud Firestore** (base de
données : patients, examens, flacons, comptes). Déploiement **mono-centre**.

---

## ✅ Déjà configuré automatiquement (déploiement actuel)

- **Projet Firebase** : `gen-lang-client-0346429614` (« RADCALC PRO »).
- **Base Firestore** : réutilise la base existante `ai-studio-77e401c9-…` (Native, `nam5`) via
  `VITE_FIREBASE_DATABASE_ID` — pas besoin d'activer la facturation.
- **Règles de sécurité** (`firestore.rules`) : **déployées**.
- **Variables d'environnement Vercel** (projet `radcalc-pro`, production) : **renseignées**.

## ⚠️ À FAIRE par toi (2 réglages console, ~2 min) — sinon la connexion échoue

Ces deux réglages d'Authentication ne sont pas scriptables sans `gcloud` :

1. **Activer la méthode de connexion** : Firebase Console → **Authentication** → *Sign-in method*
   → activer **E-mail/Mot de passe**.
2. **Autoriser les domaines** : Authentication → *Settings* → **Domaines autorisés** → ajouter
   `radcalc.nucleatlas.org` **et** `radcalc-pro.vercel.app`.

Puis crée le **premier admin** (section 4 ci-dessous).

---

## Mise en place complète (référence / nouveau déploiement)

## 1. Créer le projet Firebase

1. Aller sur https://console.firebase.google.com → **Ajouter un projet** (ex. `imena-radcalc`).
2. **Authentication** → *Get started* → onglet **Sign-in method** → activer **E-mail/Mot de passe**.
3. **Firestore Database** → *Create database* → mode **production** → région proche (ex. `eur3`).
4. **Project settings** (⚙️) → *Vos applications* → **Web** (`</>`) → enregistrer l'app et copier
   l'objet `firebaseConfig`.

## 2. Renseigner la configuration locale

Copier `.env.example` vers `.env.local` et y reporter les valeurs :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Puis : `npm install` et `npm run dev`. (`.env.local` est ignoré par git.)

## 3. Déployer les règles de sécurité ⚠️ obligatoire

Les règles (`firestore.rules`) restreignent l'accès aux seuls comptes **actifs** du centre,
selon leur rôle. À déployer impérativement :

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # sélectionner le projet
firebase deploy --only firestore:rules
```

(Ou copier-coller le contenu de `firestore.rules` dans Console → Firestore → **Règles** → Publier.)

## 4. Créer le premier administrateur (une seule fois)

L'auto-inscription crée des comptes **inactifs** avec le rôle *Manipulateur* ; un administrateur
doit les activer. Le tout premier admin se définit manuellement :

1. Dans l'app (`/login` → « Créer un compte »), inscrivez le compte de l'administrateur.
2. Console Firebase → **Firestore** → collection `users` → ouvrir le document de ce compte.
3. Mettre `role` = `admin` et `active` = `true`, puis enregistrer.
4. Recharger l'app : l'administrateur a désormais accès à **Comptes** pour activer et attribuer
   les rôles des autres membres du personnel.

## Rôles

| Rôle | Accès |
|------|-------|
| **Administrateur** | Gestion des comptes + accès complet |
| **Médecin nucléaire** | Patients, calculs, **validation** des examens |
| **Radiopharmacien** | Patients, calculs, validation, **gestion des flacons** |
| **Manipulateur (TMN)** | Patients, réalisation des calculs et examens |
| **Lecteur** | Consultation seule |

## Données

Collections Firestore : `users`, `patients`, `exams`, `vials`. Le cache hors-ligne
(IndexedDB) est activé : l'application fonctionne sans réseau et se synchronise au retour
de la connexion.
