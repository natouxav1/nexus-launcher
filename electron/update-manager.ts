import { app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

export class UpdateManager {
    private versionCacheFile: string;
    private githubRepo: string = 'natouxav1/nexus-launcherc';
    private currentVersion: string;

    constructor() {
        this.versionCacheFile = path.join(app.getPath('userData'), 'version-cache.json');
        this.currentVersion = app.getVersion(); // Récupère la version depuis package.json
    }

    /**
     * Vérifie s'il y a une nouvelle version disponible sur GitHub Releases
     */
    async checkForUpdates(): Promise<any> {
        try {
            console.log('[UPDATE] Vérification des mises à jour sur GitHub...');
            
            // Récupérer la dernière release depuis GitHub API
            const apiUrl = `https://api.github.com/repos/${this.githubRepo}/releases/latest`;
            const release = await this.fetchJson(apiUrl);
            
            if (!release || !release.tag_name) {
                console.log('[UPDATE] Aucune release trouvée');
                return null;
            }

            // Extraire la version du tag (ex: "v1.2.0" -> "1.2.0")
            const latestVersion = release.tag_name.replace(/^v/, '');
            
            console.log(`[UPDATE] Version locale: ${this.currentVersion}`);
            console.log(`[UPDATE] Version GitHub: ${latestVersion}`);

            // Comparer les versions
            if (this.isNewVersion(this.currentVersion, latestVersion)) {
                console.log('[UPDATE] Nouvelle version disponible');
                
                // Trouver le fichier .exe dans les assets
                const exeAsset = release.assets?.find((asset: any) => 
                    asset.name.endsWith('.exe') && 
                    (asset.name.includes('Setup') || asset.name.includes('Installer'))
                );
                
                if (!exeAsset) {
                    console.error('[UPDATE] Aucun fichier .exe trouvé dans la release');
                    return null;
                }

                return {
                    hasUpdate: true,
                    currentVersion: this.currentVersion,
                    newVersion: latestVersion,
                    downloadUrl: exeAsset.browser_download_url,
                    changelog: release.body || 'Aucun changelog disponible',
                    releaseDate: release.published_at,
                    fileName: exeAsset.name,
                    fileSize: exeAsset.size
                };
            }

            return { hasUpdate: false };
        } catch (error) {
            console.error('[UPDATE] Erreur lors de la vérification:', error);
            return null;
        }
    }

    /**
     * Télécharge et installe la mise à jour depuis GitHub
     */
    async downloadAndInstallUpdate(downloadUrl: string, version: string, fileName: string): Promise<boolean> {
        try {
            console.log(`[UPDATE] Téléchargement de la version ${version}...`);
            
            const downloadPath = path.join(app.getPath('downloads'), fileName);
            
            // Télécharger le fichier avec progression
            await this.downloadFile(downloadUrl, downloadPath, (progress) => {
                console.log(`[UPDATE] Progression: ${progress.percent}%`);
            });
            
            console.log(`[UPDATE] Téléchargement complété: ${downloadPath}`);
            
            // Sauvegarder la nouvelle version en cache
            this.cacheVersion(version);
            
            // Afficher une dialog pour exécuter l'installateur
            const { response } = await dialog.showMessageBox({
                type: 'info',
                title: 'Mise à jour téléchargée',
                message: `Nouvelle version ${version} téléchargée avec succès`,
                detail: 'Voulez-vous installer maintenant ? L\'application va se fermer.',
                buttons: ['Installer maintenant', 'Plus tard']
            });
            
            if (response === 0) {
                // Exécuter l'installateur
                const { spawn } = require('child_process');
                spawn(downloadPath, [], { 
                    detached: true,
                    stdio: 'ignore'
                });
                
                // Fermer l'application
                app.quit();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[UPDATE] Erreur lors du téléchargement:', error);
            
            await dialog.showMessageBox({
                type: 'error',
                title: 'Erreur de mise à jour',
                message: 'Impossible de télécharger la mise à jour',
                detail: (error as Error).message
            });
            
            return false;
        }
    }

    /**
     * Affiche une notification de mise à jour disponible
     */
    async showUpdateDialog(updateInfo: any): Promise<boolean> {
        const { changelog, newVersion, fileSize } = updateInfo;
        const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
        
        const { response } = await dialog.showMessageBox({
            type: 'info',
            title: 'Mise à jour disponible',
            message: `Une nouvelle version (${newVersion}) est disponible`,
            detail: `Taille: ${fileSizeMB} MB\n\nChangelog:\n${changelog}\n\nVoulez-vous télécharger et installer ?`,
            buttons: ['Télécharger', 'Plus tard', 'Ignorer cette version'],
            defaultId: 0,
            cancelId: 1
        });

        if (response === 2) {
            // Ignorer cette version
            this.cacheVersion(newVersion);
        }

        return response === 0;
    }

    /**
     * Compare deux versions (ex: 1.0.0 vs 1.1.0)
     */
    private isNewVersion(current: string, latest: string): boolean {
        const currentParts = current.split('.').map(p => parseInt(p, 10));
        const latestParts = latest.split('.').map(p => parseInt(p, 10));

        for (let i = 0; i < 3; i++) {
            if (latestParts[i] > currentParts[i]) return true;
            if (latestParts[i] < currentParts[i]) return false;
        }

        return false;
    }

    /**
     * Récupère la version en cache
     */
    private getCachedVersion(): string {
        try {
            if (fs.existsSync(this.versionCacheFile)) {
                const data = JSON.parse(fs.readFileSync(this.versionCacheFile, 'utf8'));
                return data.version || this.currentVersion;
            }
        } catch (e) {
            console.error('[UPDATE] Erreur lecture cache:', e);
        }
        return this.currentVersion;
    }

    /**
     * Sauvegarde la version en cache
     */
    private cacheVersion(version: string): void {
        try {
            const data = {
                version,
                checkedAt: new Date().toISOString()
            };
            fs.writeFileSync(this.versionCacheFile, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('[UPDATE] Erreur sauvegarde cache:', e);
        }
    }

    /**
     * Télécharge un fichier depuis une URL avec progression
     */
    private downloadFile(
        url: string, 
        targetPath: string,
        onProgress?: (progress: { downloaded: number; total: number; percent: number }) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(targetPath);
            
            https.get(url, (response) => {
                // Gérer les redirections
                if (response.statusCode === 302 || response.statusCode === 301) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        file.close();
                        fs.unlink(targetPath, () => {});
                        return this.downloadFile(redirectUrl, targetPath, onProgress)
                            .then(resolve)
                            .catch(reject);
                    }
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlink(targetPath, () => {});
                    reject(new Error(`Échec du téléchargement: ${response.statusCode}`));
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'] || '0', 10);
                let downloadedSize = 0;

                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    if (onProgress && totalSize > 0) {
                        const percent = Math.round((downloadedSize / totalSize) * 100);
                        onProgress({ downloaded: downloadedSize, total: totalSize, percent });
                    }
                });

                response.pipe(file);
                
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(targetPath, () => {});
                reject(err);
            });
        });
    }

    /**
     * Effectue une requête JSON à l'API GitHub
     */
    private fetchJson(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            https.get(url, {
                headers: {
                    'User-Agent': 'Nexus-Launcher-Update-Checker',
                    'Accept': 'application/vnd.github.v3+json'
                }
            }, (response) => {
                let data = '';
                
                // Gérer les redirections
                if (response.statusCode === 302 || response.statusCode === 301) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        return this.fetchJson(redirectUrl).then(resolve).catch(reject);
                    }
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`Erreur HTTP: ${response.statusCode}`));
                    return;
                }

                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
    }
}

export default new UpdateManager();
