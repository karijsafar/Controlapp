# CONTROLAPP

Diagnóstico financiero para pymes: subes el estado de resultados y el balance (PDF o Excel), revisas las cifras, y la app calcula los ratios con un semáforo por rubro. Claude lee los archivos y redacta el análisis; los ratios y los colores salen siempre de fórmulas fijas (`src/lib/diagnosis.ts`).

Hecho con TanStack Start, React, Tailwind, Supabase (login y base de datos) y la API de Claude. Se publica en Cloudflare Workers.

## 1. Supabase (base de datos y login)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor → New query**, pega todo el contenido de `supabase/setup.sql` y presiona **Run**. Crea las tablas y la seguridad por usuario. Se puede ejecutar más de una vez sin problema.
3. En **Project Settings → API** copia:
   - Project URL
   - Publishable key (`sb_publishable_...`)
   - Secret key (`sb_secret_...`): es secreta, no la compartas.
4. En **Authentication → URL Configuration**:
   - **Site URL**: la dirección de tu app publicada (por ejemplo `https://controlapp.TU-USUARIO.workers.dev`).
   - **Redirect URLs**: agrega `https://controlapp.TU-USUARIO.workers.dev/**` y `http://localhost:3000/**`.
5. (Opcional) Login con Google: en **Authentication → Providers → Google**, actívalo y pega el Client ID y el Secret de Google Cloud. Sin este paso, el botón "Continuar con Google" no funciona, pero el login con email sí.

## 2. Clave de Claude

Crea una clave de API en [console.anthropic.com](https://console.anthropic.com) y carga crédito. La app usa el modelo `claude-opus-5-5`.

## 3. Probar en tu computadora

```sh
npm install
cp .env.example .env   # y completa los valores
npm run dev            # abre http://localhost:3000
npm test
```

## 4. Publicar en Cloudflare

1. Crea una cuenta en [cloudflare.com](https://dash.cloudflare.com).
2. **Workers & Pages → Create → Import a repository**, y elige este repositorio de GitHub.
3. Configuración de compilación:
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
4. En **Settings → Variables and Secrets** del Worker:
   - Variables de compilación (Build variables): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Variables de ejecución: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
   - Secretos (tipo *Secret*): `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
5. Vuelve a desplegar. Cada push a `main` publica una versión nueva.

## Estructura

- `src/routes`: páginas (las privadas están en `_authenticated`).
- `src/components/controlapp`: pantallas y componentes de la app.
- `src/lib/diagnosis.ts`: ratios y semáforos (funciones puras, con tests).
- `src/lib/extraction.functions.ts`: lectura de archivos con Claude.
- `src/lib/diagnoses.functions.ts`: guardar, listar, análisis con Claude y enlaces compartidos.
- `src/lib/ai.server.ts`: cliente de Claude (solo en el servidor).
