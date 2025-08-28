-- Création de la table pour les pièces communes réutilisables
CREATE TABLE IF NOT EXISTS pieces_communes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_piece VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    obligatoire_par_defaut BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertion de quelques pièces communes par défaut
INSERT IGNORE INTO pieces_communes (nom_piece, description, obligatoire_par_defaut) VALUES
('Carte d\'identité nationale', 'Carte d\'identité nationale en cours de validité', 1),
('Acte de naissance', 'Acte de naissance original ou copie certifiée', 1),
('Justificatif de domicile', 'Facture d\'électricité, d\'eau ou téléphone de moins de 3 mois', 1),
('Photo d\'identité récente', 'Photo d\'identité couleur récente (moins de 6 mois)', 1),
('Certificat de résidence', 'Certificat de résidence délivré par la commune', 0),
('Extrait de casier judiciaire', 'Bulletin n°3 du casier judiciaire', 0),
('Certificat médical', 'Certificat médical délivré par un médecin agréé', 0),
('Diplôme ou certificat', 'Copie certifiée du diplôme ou certificat requis', 0),
('Passeport', 'Passeport en cours de validité', 0),
('Permis de conduire', 'Permis de conduire en cours de validité', 0);
