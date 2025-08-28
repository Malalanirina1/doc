# Identifiants de Test - Application de Gestion de Documents

## Utilisateurs disponibles

### Administrateurs
- **Username:** `testadmin`
- **Mot de passe:** `password123`
- **Rôle:** admin

- **Username:** `admin`
- **Mot de passe:** `password123`
- **Rôle:** admin

- **Username:** `noums`
- **Mot de passe:** `password123`
- **Rôle:** admin

### Assistants
- **Username:** `testassistant`
- **Mot de passe:** `password123`
- **Rôle:** assistant

## Base de données peuplée

### Clients fictifs
- 10 clients avec des informations complètes (nom, prénom, téléphone, email, adresse)

### Dossiers
- 12 dossiers avec différents statuts :
  - 7 dossiers "en_cours"
  - 3 dossiers "fini"
  - 1 dossier "rejete"
  - 1 dossier en retard

### Types de documents disponibles
1. CIN (Carte d'Identité Nationale)
2. Passeport
3. Diplôme
4. Acte de naissance
5. Relevé de note
6. Permis de conduire
7. Certificat médical
8. Contrat de travail
9. Facture
10. Autre

### Types de dossiers
1. Identité (CIN, Passeport) - 75€ - 15 jours
2. Éducation (Diplômes, relevés) - 50€ - 10 jours
3. Professionnel (Contrats) - 60€ - 7 jours
4. Médical (Certificats médicaux) - 40€ - 3 jours
5. Administratif (Autres documents) - 45€ - 12 jours

## URLs de l'application

### Frontend
- **Application principale:** `http://localhost:5173`
- **Login:** `http://localhost:5173` (page d'accueil)

### Backend (APIs)
- **Base URL:** `http://localhost/doc/`
- **Login:** `http://localhost/doc/login_simple.php`
- **Liste des dossiers:** `http://localhost/doc/liste_dossiers.php`
- **Types de documents:** `http://localhost/doc/types_documents.php`
- **Modifier statut:** `http://localhost/doc/modifier_statut_dossier.php`

## Fonctionnalités implémentées

### Dashboard Admin
✅ Connexion/Déconnexion
✅ Affichage des statistiques
✅ Liste des dossiers avec pagination
✅ Recherche par nom de client ou numéro de dossier
✅ Filtrage par statut et type de document
✅ Modification du statut des dossiers
✅ Gestion des types de documents
✅ Interface responsive avec Tailwind CSS
✅ Gestion des rejets avec motifs
✅ Actions sur les dossiers (Terminer, Rejeter, Rouvrir, Réactiver)

### Base de données
✅ Structure complète avec relations
✅ Données de test peuplées
✅ Authentification sécurisée
✅ Types de documents réels
✅ Historique des modifications

## Instructions pour les tests

1. **Démarrer l'application:**
   ```bash
   cd /home/noums/projet/doc
   npm run dev
   ```

2. **Se connecter:**
   - Ouvrir `http://localhost:5173`
   - Utiliser `testadmin` / `password123`

3. **Tester les fonctionnalités:**
   - Voir les statistiques sur le dashboard
   - Naviguer dans la liste des dossiers
   - Utiliser la recherche et les filtres
   - Modifier le statut des dossiers
   - Créer de nouveaux types de documents

## Notes techniques

- **Framework Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Backend:** PHP pur
- **Base de données:** MySQL
- **Serveur:** Apache (XAMPP)
- **Sessions:** PHP sessions pour l'authentification
- **CORS:** Configuré pour permettre les requêtes cross-origin
