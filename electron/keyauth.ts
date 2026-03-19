import https from 'https';
import { exec } from 'child_process';

interface KeyAuthConfig {
    name: string;
    ownerid: string;
    secret: string;
    version: string;
}

interface KeyAuthResponse {
    success: boolean;
    message: string;
    info?: {
        username: string;
        subscriptions: Array<{
            subscription: string;
            expiry: string;
            timeleft: number;
        }>;
        ip: string;
        hwid: string;
        createdate: string;
        lastlogin: string;
    };
}

export class KeyAuth {
    private config: KeyAuthConfig;
    private sessionid: string = '';
    private initialized: boolean = false;

    constructor(config: KeyAuthConfig) {
        this.config = config;
    }

    private getHWID(): Promise<string> {
        return new Promise((resolve) => {
            exec('wmic csproduct get UUID /VALUE', (err, stdout) => {
                const match = stdout.match(/UUID=(.+)/i);
                resolve(match ? match[1].trim() : 'unknown');
            });
        });
    }

    private async request(endpoint: string, data: any): Promise<KeyAuthResponse> {
        return new Promise((resolve, reject) => {
            const postData = new URLSearchParams({
                type: endpoint,
                ...data,
                name: this.config.name,
                ownerid: this.config.ownerid,
                sessionid: this.sessionid
            }).toString();

            const options = {
                hostname: 'keyauth.win',
                port: 443,
                path: '/api/1.2/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'KeyAuth'
                }
            };

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid response from KeyAuth'));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    async init(): Promise<boolean> {
        try {
            const hwid = await this.getHWID();
            const response = await this.request('init', {
                ver: this.config.version,
                hash: this.config.secret,
                hwid
            });

            if (response.success) {
                this.sessionid = response.message;
                this.initialized = true;
                return true;
            }

            console.error('[KeyAuth] Init failed:', response.message);
            return false;
        } catch (e) {
            console.error('[KeyAuth] Init error:', e);
            return false;
        }
    }

    async login(username: string, password: string): Promise<KeyAuthResponse> {
        if (!this.initialized) {
            await this.init();
        }

        try {
            const hwid = await this.getHWID();
            const response = await this.request('login', {
                username,
                pass: password,
                hwid
            });

            return response;
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message
            };
        }
    }

    async register(username: string, password: string, license: string): Promise<KeyAuthResponse> {
        if (!this.initialized) {
            await this.init();
        }

        try {
            const hwid = await this.getHWID();
            const response = await this.request('register', {
                username,
                pass: password,
                key: license,
                hwid
            });

            return response;
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message
            };
        }
    }

    async license(key: string): Promise<KeyAuthResponse> {
        if (!this.initialized) {
            await this.init();
        }

        try {
            const hwid = await this.getHWID();
            const response = await this.request('license', {
                key,
                hwid
            });

            return response;
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message
            };
        }
    }

    async upgrade(username: string, license: string): Promise<KeyAuthResponse> {
        if (!this.initialized) {
            await this.init();
        }

        try {
            const response = await this.request('upgrade', {
                username,
                key: license
            });

            return response;
        } catch (e) {
            return {
                success: false,
                message: (e as Error).message
            };
        }
    }

    async check(): Promise<boolean> {
        if (!this.initialized || !this.sessionid) {
            return false;
        }

        try {
            const response = await this.request('check', {});
            return response.success;
        } catch (e) {
            return false;
        }
    }

    logout(): void {
        this.sessionid = '';
        this.initialized = false;
    }
}

// Configuration KeyAuth - À MODIFIER avec vos propres valeurs
export const keyAuthConfig: KeyAuthConfig = {
    name: 'YourAppName',        // Nom de votre application sur KeyAuth
    ownerid: 'YourOwnerID',     // Votre Owner ID depuis KeyAuth dashboard
    secret: 'YourAppSecret',    // Secret de votre application
    version: '1.0'              // Version de votre application
};

export default new KeyAuth(keyAuthConfig);
