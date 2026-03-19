# Configuration KeyAuth

## Étape 1 : Créer une application KeyAuth

1. Allez sur [keyauth.cc](https://keyauth.cc/)
2. Créez un compte ou connectez-vous
3. Créez une nouvelle application
4. Notez vos identifiants :
   - Application Name
   - Owner ID
   - Application Secret

## Étape 2 : Configurer l'application

Ouvrez `electron/keyauth.ts` et modifiez :

```typescript
export const keyAuthConfig: KeyAuthConfig = {
    name: 'VotreNomApp',           // Le nom de votre app sur KeyAuth
    ownerid: 'VotreOwnerID',       // Votre Owner ID
    secret: 'VotreSecret',         // Le secret de votre app
    version: '1.0'                 // Version de votre app
};
```

## Étape 3 : Créer des licences

Sur le dashboard KeyAuth :
1. Allez dans "Licenses"
2. Créez des licences avec durée (1 jour, 1 mois, lifetime, etc.)
3. Distribuez les clés à vos utilisateurs

## Utilisation dans l'app

### Login avec compte
```typescript
await window.electron.authLogin({
    username: 'user',
    password: 'pass',
    rememberMe: true
});
```

### Register avec licence
```typescript
await window.electron.authRegister({
    username: 'newuser',
    password: 'pass',
    license: 'XXXX-XXXX-XXXX-XXXX'
});
```

### Login avec licence uniquement
```typescript
await window.electron.authLicense({
    license: 'XXXX-XXXX-XXXX-XXXX'
});
```

### Upgrade (ajouter une licence à un compte existant)
```typescript
await window.electron.authUpgrade({
    username: 'user',
    license: 'XXXX-XXXX-XXXX-XXXX'
});
```

## Fonctionnalités KeyAuth

- ✅ Authentification par username/password
- ✅ Authentification par licence
- ✅ Enregistrement avec licence
- ✅ Upgrade de compte
- ✅ Vérification de session automatique
- ✅ HWID binding (un compte = une machine)
- ✅ Gestion des abonnements
- ✅ Remember me (sauvegarde sécurisée)

## Sécurité

- Les mots de passe sont encodés en base64 localement
- HWID binding empêche le partage de compte
- Session automatiquement vérifiée toutes les 60 secondes
- Déconnexion automatique si session invalide
