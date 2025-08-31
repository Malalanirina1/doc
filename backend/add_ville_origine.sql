-- Ajouter la colonne ville_origine à la table clients
ALTER TABLE clients ADD COLUMN ville_origine VARCHAR(100) DEFAULT NULL AFTER adresse;

-- Ajouter un index pour les recherches rapides
CREATE INDEX idx_clients_ville_origine ON clients(ville_origine);

-- Ajouter aussi un index composé pour les recherches globales
CREATE INDEX idx_clients_search ON clients(nom, prenom, ville_origine);
