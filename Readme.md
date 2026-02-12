# Partie backend

1 Création du package.json
$ npm init -y

2 Installation express, nodemon, dotenv
$ npm i --save express nodemon dotenv
$ npm i -s body-parser

3 Création fichier server.js

4 Modifier la partie scripts dans package.json en "start": "nodemon server.js"

5 lancer le server node
$ npm start

6 Compléter server.js (express)

7 Créér un dossier config avec un .env pour les variable d'environnement

8 Installation mongoose
$ npm i -s mongoose

9 Créér un fichier db.js dans backend/config

10 Créer fichier docker-compose.yml et fichier Dockerfile

11 Créer le container docker
$ docker compose up -d backend

12 Installer cors pour donner les accès au front
$ npm i -s cors

image de coin.model
https://assets.coingecko.com/coins/images/no/standard/coinId.png

# Partie frontend

1 Installation du react frontend
$ npx create-react-app frontend

2 Installation de sass et de react-router dans le dossier frontend
$ npm i -s sass react-router-dom

3 Retirer les fichiers inutiles du dossier public
favicon.ico, logo192.png, logo512.png

4 Retirer les fichiers inutiles du dossier src
App.css, index.css, logo.svg, reportWebVitals.js, App.test.js, setupTests.js

5 Modifier le index.js
Enlever 
import './index.css'
import reportWebVitals from './reportWebVitals'
reportWebVitals();

6 Modifier docker-compose et créer fichier Dockerfile

7 Créer le container docker
$ docker compose up -d frontend

8 Créer trois dossiers dans src
styles pour intégrer le sass
pages pour les vues ("rsc" pour créer les page avec le snippet)
components pour les composants

9 Créer un dossier Routes dans components
fichier index.js contenant les routes

36min

