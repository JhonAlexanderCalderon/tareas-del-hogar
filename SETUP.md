# Setup: Tareas del Hogar

Código completo, probado localmente (`npm install`, `npm run build`,
`npm run dev` y `oxlint` — todo limpio). Esto es lo que falta de tu lado
para tener la app corriendo con datos reales.

## 1. Crear el proyecto de Firebase (nuevo, distinto al de gastos-pareja)

1. Ve a https://console.firebase.google.com → "Add project" / "Agregar proyecto".
2. Nómbralo como quieras (ej. "tareas-del-hogar").
3. Puedes desactivar Google Analytics si no lo necesitas.

## 2. Activar Authentication (Google)

1. En el proyecto nuevo, ve a **Build → Authentication → Get started**.
2. Pestaña "Sign-in method" → habilita **Google**.

## 3. Crear Firestore

1. **Build → Firestore Database → Create database**.
2. Modo producción (las reglas de `firestore.rules` ya están escritas y
   son las que dan los permisos correctos — no uses modo de prueba).
3. Elige la región que prefieras.

## 4. Registrar la app web y copiar credenciales

1. **Project Settings** (ícono de engranaje) → en "Your apps" click el
   ícono `</>` para agregar una app web.
2. Nómbrala, no hace falta Firebase Hosting todavía.
3. Copia los valores del `firebaseConfig` que te muestra.
4. Copia `.env.example` como `.env` en la raíz del proyecto y pega ahí
   esos valores:
   ```
   cp .env.example .env
   ```
5. Edita `.firebaserc` y reemplaza `PON_AQUI_TU_PROJECT_ID` con el
   Project ID real (lo ves en Project Settings, arriba de todo).

## 5. Desplegar las reglas de Firestore

Necesitas `firebase-tools` instalado (`npm install -g firebase-tools`
si no lo tienes ya). Desde la raíz del proyecto:

```
firebase login          # si no habías iniciado sesión antes
firebase deploy --only firestore:rules
```

Esto sube el contenido de `firestore.rules` a tu proyecto nuevo. Sin este
paso, todo el mundo (o nadie, según el default) puede leer/escribir sin
control — es un paso obligatorio, no opcional.

## 6. Probar en local

```
npm run dev
```

Abre la URL que te muestre (`http://localhost:5173/tareas-del-hogar/`).
Inicia sesión con Google, crea tu nombre, y luego **crea un hogar**
(quedas como "gestor" automáticamente). Desde Ajustes → "Agregar" crea
una tarea de prueba y confirma que aparece en "Hoy" si el día coincide.

Para probar el flujo de un segundo integrante: abre una ventana de
incógnito, inicia sesión con otra cuenta de Google, y únete con el
código de invitación que te muestra la pantalla de creación del hogar
(o Ajustes, en cualquier momento). Ese segundo usuario entra como
"miembro" — no va a poder crear/editar tareas hasta que un gestor lo
ascienda desde Ajustes.

## Sobre los colores

La paleta "vino tinto" está definida como tokens de Tailwind v4 en
`src/index.css` (bloque `@theme`, colores `wine-50` a `wine-900`). Si
quieres ajustar el tono, es ahí — no hace falta tocar ningún componente,
todos usan las clases `bg-wine-*`/`text-wine-*`.

## Pendiente para más adelante (no bloqueante)

- Los íconos del PWA (`public/icons/icon-192.png` y `icon-512.png`) son
  un placeholder simple (silueta de casa) que generé — reemplázalos
  cuando tengas un logo propio.
- No hay Firebase Hosting configurado todavía (solo Firestore) — si
  quieres publicarla en una URL real más adelante, dímelo y lo armamos
  igual que se podría hacer con gastos-pwa.
