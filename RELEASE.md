# Comment créer une release

## Étapes simples

1. **Créer un tag Git**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Builder l'application**
   ```bash
   npm run build
   ```
   L'installateur sera dans `release/1.0.0/`

3. **Créer la release sur GitHub**
   - Va sur https://github.com/natouxav1/nexus-launcher/releases/new
   - Sélectionne le tag `v1.0.0`
   - Titre : `Nexus Launcher v1.0.0`
   - Upload le fichier `.exe` depuis `release/1.0.0/`
   - Publie la release

C'est tout ! Le launcher détectera automatiquement la nouvelle version.
