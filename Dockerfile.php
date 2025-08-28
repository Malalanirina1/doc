# Dockerfile pour PHP avec Apache (remplace WAMP)
FROM php:8.1-apache

# Installer les extensions PHP nécessaires
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Activer les modules Apache nécessaires
RUN a2enmod rewrite headers

# Copier la configuration Apache personnalisée
COPY apache-config.conf /etc/apache2/sites-available/000-default.conf

# Définir le répertoire de travail
WORKDIR /var/www/html

# Donner les permissions appropriées
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html

# Exposer le port 80
EXPOSE 80
