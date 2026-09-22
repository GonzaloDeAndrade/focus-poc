# Contexto de la sesión — Focus POC

Notas de todo lo que se hizo/encontró probando este POC, para poder seguir
desde otra máquina (notebook) sin perder el hilo. El detalle técnico del
proyecto en sí está en [README.md](README.md).

## Estado actual

- Cliente y servidor funcionan end-to-end (venta registrada, stock por
  delta, cola offline, sync al reconectar — todo probado).
- Confirmado en iPhone: **funciona offline**, pero solo si la app está
  **instalada desde "Agregar a inicio"** (Safari, no Chrome-en-iOS) y se
  abre desde el ícono del home, no desde una pestaña normal de Safari.
  Safari en pestaña normal ignora el Service Worker en un reload manual
  sin conexión (limitación conocida de WebKit/iOS, no es bug nuestro).
- Se agregó un listener de `visibilitychange`/`focus`/`pageshow` en
  [useNetworkStatus.ts](client/src/hooks/useNetworkStatus.ts) para que
  sincronice apenas la app vuelve a primer plano, sin depender de
  reabrirla a mano. **Importante**: iOS Safari no implementa la
  Background Sync API, así que el techo real es "sincroniza apenas la
  mirás de nuevo", no "sincroniza sola en segundo plano" — eso no es
  posible en una PWA pura en iOS. Si en algún momento se necesita eso sí
  o sí, la única forma es empaquetar como app nativa (Capacitor).

## Cómo se probó (esta máquina)

No había PHP/Composer en PATH acá, así que se usó:
- PHP de XAMPP (`C:\xampp\php\php.exe`, v8.2.12).
- `server/composer.phar` descargado a mano (**no se sube a git**, está en
  `.gitignore`). Cada máquina nueva baja el suyo con
  `php -r "copy('https://getcomposer.org/installer','composer-setup.php');"`
  o directamente `composer.phar` desde https://getcomposer.org/composer-stable.phar.
- El bundle de certificados CA de XAMPP estaba desactualizado (de 2022) y
  además Avast estaba haciendo inspección SSL, así que `composer install`
  fallaba con errores de certificado hasta que se le pasó un CA bundle
  fresco (`curl.cainfo`/`openssl.cafile`). Si esto vuelve a pasar en otra
  máquina con antivirus similar, la señal es: `curl` funciona pero PHP/
  Composer tiran "SSL certificate problem" — no es un problema del proyecto.
- Se subió el requerimiento de Laravel de `^11.31` a `^12.0` en
  `server/composer.json` porque Composer bloqueó (por política de
  seguridad) instalar cualquier versión 11.x disponible — todas estaban
  marcadas con advisories sin parche en esa rama. Con Laravel 12 instaló
  limpio (`v12.69.2`).

## Túneles públicos (Cloudflare Quick Tunnel)

Para probar offline "posta" (no localhost, que no sirve porque cliente y
server viven en la misma PC y el loopback no se entera si cortás el
WiFi), se expusieron los dos servidores con `cloudflared tunnel --url ...`
sin cuenta, gratis, URLs tipo `*.trycloudflare.com`.

**Estas URLs son efímeras**: viven mientras estén corriendo `cloudflared`
+ `php artisan serve` + `vite preview` en la PC que las generó. Si se
reinicia la sesión o se apaga la PC, hay que regenerarlas — cada reinicio
da una URL nueva, y hay que actualizar `client/.env` (`VITE_API_URL`) y
**recompilar** (`npm run build`) porque esa URL queda embebida en el
bundle de producción, no se lee en runtime.

**Importante para probar offline**: hay que servir el **build de
producción** (`npm run build` + `npm run preview`), no `npm run dev`. El
Service Worker de Workbox solo precachea todo lo necesario en el build de
producción — en modo dev la app queda en blanco al cortar la red.

`cloudflared.exe` está en el scratchpad de esta sesión, no en el repo.

## Cómo seguir desde la notebook

1. Cloná el repo (una vez esté en GitHub, ver siguiente sección).
2. Backend: necesitás PHP 8.2+ y Composer instalados (o repetir el truco
   de `composer.phar` si no los tenés en PATH). Después:
   `cd server && composer install && cp .env.example .env && php artisan key:generate && php artisan migrate --seed && php artisan serve`
3. Frontend: `cd client && npm install && npm run dev` para desarrollo
   normal en `localhost:5173` apuntando a `localhost:8000` (default de
   `.env.example`, no hace falta tocar nada para desarrollo local).
4. Si necesitás probar offline real desde el celu de nuevo, hay que
   repetir el flujo de túneles descripto arriba desde la máquina que
   vayas a usar como servidor.

## Pendiente / no resuelto todavía

- No hay deploy real (persistente) del backend ni del frontend — todo lo
  probado hasta ahora fue con túneles temporales sobre esta PC. Si se
  necesita algo que no dependa de que esta máquina esté prendida, hay que
  armar un deploy real (Vercel/Netlify para el cliente, Railway/Render u
  otro hosting con PHP para el server) — requiere cuentas del usuario.
- Login sigue siendo un mock 100% frontend (PIN fijo `1234`, no pega al
  backend), tal como se decidió al principio porque el spec original
  pedía "sin autenticación por ahora".
