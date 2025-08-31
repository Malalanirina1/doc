-- Ajouter des villes d'origine aléatoires pour tous les clients existants
UPDATE clients SET ville_origine = CASE 
    WHEN id % 10 = 0 THEN 'Antananarivo'
    WHEN id % 10 = 1 THEN 'Fianarantsoa'
    WHEN id % 10 = 2 THEN 'Toamasina'
    WHEN id % 10 = 3 THEN 'Mahajanga'
    WHEN id % 10 = 4 THEN 'Toliara'
    WHEN id % 10 = 5 THEN 'Antsiranana'
    WHEN id % 10 = 6 THEN 'Moramanga'
    WHEN id % 10 = 7 THEN 'Antsirabe'
    WHEN id % 10 = 8 THEN 'Morondava'
    ELSE 'Sambava'
END
WHERE ville_origine IS NULL;

-- Vérifier le résultat
SELECT ville_origine, COUNT(*) as nombre_clients 
FROM clients 
GROUP BY ville_origine 
ORDER BY nombre_clients DESC;
