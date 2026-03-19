# Nexus Launcher

Launcher Electron pour GTA V avec système d'authentification KeyAuth et mise à jour automatique via GitHub Releases.

## 🔑 Configuration KeyAuth

1. Créez une application sur [KeyAuth Dashboard](https://keyauth.cc/)
2. Modifiez `electron/keyauth.ts` avec vos identifiants :

```typescript
export const keyAuthConfig: KeyAuthConfig = {
    name: 'YourAppName',        // Nom de votre application
    ownerid: 'YourOwnerID',     // Votre Owner ID
    secret: 'YourAppSecret',    // Secret de votre application
    version: '1.0'              // Version
};
```

## 🚀 Installation

```bash
npm install
cd installer-ui && npm install && cd ..
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 🔄 Créer une release

```powershell
.\scripts\create-release.ps1 -Version "1.0.0"
```

## 📝 Fonctionnalités

- ✅ Authentification KeyAuth (Login, Register, License)
- ✅ Mise à jour automatique via GitHub Releases
- ✅ Lancement GTA V (Steam, Epic, Rockstar)
- ✅ Injection de menu mod
- ✅ Gestion FSL
