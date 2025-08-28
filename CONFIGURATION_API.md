# Configuration APIs - Gestion Documents

## URLs de base
- **Backend**: `http://localhost/doc/`
- **Frontend**: `http://localhost:5173`
- **Documentation**: `http://localhost/doc/api_index.php`

## Authentification
### Login
- **URL**: `http://localhost/doc/login_simple.php`
- **Méthode**: `POST`
- **Paramètres**: `username`, `password`
- **Comptes de test**:
  - Admin: `admin` / `admin123`
  - Assistant: `assistant1` / `assistant123`

### Register (Admin uniquement)
- **URL**: `http://localhost/doc/register_simple.php`
- **Méthode**: `POST`
- **Paramètres**: `username`, `password`, `nom_complet`, `role`

## APIs de données (version test)

### Dashboard
- **URL**: `http://localhost/doc/dashboard_test.php`
- **Méthode**: `GET`
- **Description**: Statistiques du tableau de bord
- **Auth**: Non requise (données de test)

### Clients
- **Liste**: `GET http://localhost/doc/clients_simple.php`
- **Créer**: `POST http://localhost/doc/clients_simple.php`
- **Paramètres POST**: `nom`, `prenom`, `telephone`, `email`, `adresse`

### Dossiers
- **URL**: `http://localhost/doc/dossiers_test.php`
- **Méthode**: `GET`
- **Description**: Liste des dossiers avec données de test

### Types de documents
- **URL**: `http://localhost/doc/types_test.php`
- **Méthode**: `GET`
- **Description**: Types de documents disponibles (CNI, Passeport, Visa, Certificat)

### Pièces jointes
- **URL**: `http://localhost/doc/pieces_test.php`
- **Méthode**: `GET`
- **Paramètres optionnels**: `dossier_id`

### Recherche
- **URL**: `http://localhost/doc/search_test.php`
- **Méthode**: `GET`
- **Paramètres**: `q` (terme de recherche)

## Configuration CORS
- **Origin autorisé**: `http://localhost:5173`
- **Méthodes**: `GET, POST, PUT, DELETE, OPTIONS`
- **Headers**: `Content-Type, Authorization, X-Requested-With`
- **Credentials**: `true`

## Base de données
- **Host**: `localhost`
- **Database**: `gestion_doc`
- **User**: `noums`
- **Password**: `proplayer`

## Notes importantes
1. **Session**: Les APIs utilisent des sessions PHP mais incluent des données de test en fallback
2. **CORS**: Configuré pour le port 5173 (Vite React)
3. **Test mode**: Toutes les APIs `*_test.php` retournent des données de test
4. **Production**: Les APIs simples (`*_simple.php`) incluent la logique de base de données

## Test des APIs
```bash
# Test login
curl -X POST "http://localhost/doc/login_simple.php" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test dashboard
curl -X GET "http://localhost/doc/dashboard_test.php"

# Test dossiers
curl -X GET "http://localhost/doc/dossiers_test.php"

# Test recherche
curl -X GET "http://localhost/doc/search_test.php?q=Dupont"
```

## Statut actuel
✅ **Fonctionnel**: Login, Dashboard (test), Dossiers (test), Types (test), Pièces (test), Recherche (test)
⚠️ **Session**: Problème de persistance entre les requêtes CORS
🔄 **En cours**: Migration vers APIs avec base de données réelle
