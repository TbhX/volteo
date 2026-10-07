# Film conceptuel VOLTÉO

Scène originale Three.js, 1280×720, 30 images/s, durée 9 s. Le MP4 et son affiche sont déjà inclus dans public/media et dist/media. Aucun son, aucun modèle de constructeur reproduit : la voiture représente un concept générique.

intro-scene.html contient la scène et renderAt(t). Pour reproduire, servir ce fichier en HTTP et adapter son importmap vers Three.js et les addons (la version utilisée : voir package.json). render-reference.cjs illustre la capture des 270 images avec Playwright ; ses chemins sont ceux du poste de rendu et doivent être adaptés. Installer Three.js, Playwright et Chromium dans un environnement de développement séparé.

Encodage : ffmpeg -framerate 30 -i frames/%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 21 -movflags +faststart -an volteo-intro.mp4
