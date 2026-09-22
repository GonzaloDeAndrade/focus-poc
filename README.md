# Focus POC — Alfajorería Artesanal

Proof of concept de una web app **offline-first** para gestión de ventas y stock,
hecho para Focus Studio (Focusq).

- **Cliente**: React + Vite + TypeScript + Tailwind CSS, con Service Worker (Workbox
  vía `vite-plugin-pwa`) y caché local en IndexedDB (`idb`).
- **Servidor**: Laravel (PHP) + SQLite, sin autenticación (API simple para el POC).
- **Login**: pantalla de acceso local en el cliente (no pega al backend). Es solo
  una puerta de entrada para la demo — ver detalle en [Login](#login-de-demostración).

## Estructura

```
fqstudio/
├── client/        # React app (Vite + TS + Tailwind + PWA)
│   └── src/
│       ├── db/          # IndexedDB (idb): productos, ventas, sync_queue
│       ├── sync/         # cola de sincronización + procesador
│       ├── api/          # llamadas a Laravel con fallback offline
│       ├── hooks/        # useNetworkStatus (online/offline + pendientes)
│       └── components/   # StatusBar, Ventas, Productos, Login
└── server/        # Laravel API
    ├── routes/api.php
    ├── app/Http/Controllers/
    └── database/migrations/
```

## 1. Instalar y correr el proyecto

### Backend (Laravel)

```bash
cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Esto levanta la API en `http://localhost:8000`. `database/database.sqlite` ya
viene creado vacío en el repo, listo para `migrate --seed`.

### Frontend (React)

En otra terminal:

```bash
cd client
npm install
npm run dev
```

Esto levanta la app en `http://localhost:5173`. Si necesitás cambiar la URL del
backend, copiá `.env.example` a `.env` (por defecto ya apunta a
`http://localhost:8000/api`, así que para desarrollo local ni hace falta).

Abrí `http://localhost:5173`, ingresá con cualquier usuario y PIN `1234`.

### Login de demostración

El POC pidió explícitamente "sin autenticación por ahora" en el backend, así que
el login es **100% local**: guarda el nombre de usuario en `localStorage` y no
valida nada contra el servidor. El PIN está fijo en `1234`. Es solo para tener
una pantalla de acceso en la demo — si más adelante se necesita autenticación
real, lo natural es sumar Laravel Sanctum y un endpoint `/api/login`.

## 2. Probar el flujo offline paso a paso

1. Con ambos servidores corriendo, abrí `http://localhost:5173` y logueate.
2. Anotá el stock de algún producto en la pestaña **Stock / Productos**.
3. Tocá el botón **"Simular sin internet"** en la barra superior (esto intercepta
   los `fetch` y fuerza error, sin que tengas que apagar el router ni el backend).
   La barra debería pasar a 🔴 **"Sin internet — 0 cambios pendientes"**.
4. Registrá una venta (pestaña **Ventas**): elegí un producto, cantidad, "Agregar"
   y "Confirmar venta". La venta va a aparecer en la lista con la etiqueta
   **"pendiente de sincronizar"**, y la barra va a mostrar
   **"Sin internet — 1 cambio pendiente"** (o más, según cuántas escrituras dispares).
5. Sumá o restá stock de un producto con los botones +/-: también queda pendiente.
6. Tocá **"Quitar simulación offline"**. La app hace ping real a `GET /api/health`
   (no confía solo en `navigator.onLine`) y, apenas detecta que respondió, dispara
   la sincronización: vas a ver 🔵 **"Sincronizando..."** y después
   ✅ **"Todo sincronizado"**, para volver a 🟢 **"En línea"**.
7. Refrescá `/api/ventas` y `/api/productos` en el backend (o mirá la pestaña de
   Network) para confirmar que la venta y el nuevo stock llegaron a Laravel/SQLite.

### Probar que sobrevive a un refresh

Repetí los pasos 3 a 5, pero **antes** de quitar la simulación, recargá la página
(F5). El estado "Sin internet — N cambios pendientes" y la venta marcada como
pendiente tienen que seguir ahí: la cola vive en IndexedDB, no en memoria.

### Probar con la red real cortada

También podés probar cortando la conexión de verdad (modo avión, o "Offline" en
DevTools → Network) en vez de usar el botón. El comportamiento es el mismo: el
ping a `/api/health` es lo que decide si hay conexión real, así que aunque el
navegador reporte `online`, si Laravel no responde la app se queda en modo offline.

## 3. Ver los datos en IndexedDB desde DevTools

1. Abrí las DevTools del navegador (F12) → pestaña **Application** (Chrome/Edge)
   o **Storage** (Firefox).
2. En el árbol de la izquierda, buscá **IndexedDB → focusDB**.
3. Vas a ver tres object stores:
   - **productos**: copia local de cada producto (`id`, `nombre`, `precio`, `stock`).
   - **ventas**: ventas registradas, con `sincronizado: false` mientras están
     pendientes y el `id` con formato `local-<timestamp>` hasta que el servidor
     confirma y le asigna un id real.
   - **sync_queue**: la cola de escrituras pendientes (`metodo`, `endpoint`,
     `payload`, `timestamp`, `intentos`). Se vacía a medida que se sincroniza.
4. También podés inspeccionar el Service Worker en **Application → Service
   Workers** para confirmar que está activo y controlando la página (necesario
   para que la app abra offline).

## Decisiones de arquitectura (por qué está armado así)

- **Lecturas**: `network-first, fallback IndexedDB` — se implementa a mano en
  `src/api/*.ts`, no con Workbox, porque necesita fusionar la respuesta con el
  caché local (no es un simple "cache o red").
- **Escrituras**: si el `fetch` falla, se guarda en IndexedDB con
  `sincronizado: false` y se agrega un item a `sync_queue`. El stock se mueve
  siempre por **delta** (`+3` / `-2`), nunca pisando el valor absoluto, tanto en
  el cliente como en `ProductoController@update` (campo `delta_stock`) — así
  varios cambios offline en el mismo producto no se pisan entre sí al sincronizar.
- **Reconexión**: se detecta con un ping real a `GET /api/health` cada 10s (y al
  evento `online` del navegador como disparador extra), no solo con
  `navigator.onLine`, que solo sabe si hay una interfaz de red activa, no si el
  backend responde.
- **Sincronización**: `sync_queue` se procesa en orden de `timestamp`. Si un item
  falla, se corta ahí (no se saltea al siguiente) para no romper el orden de las
  operaciones sobre el mismo producto.
- **Service Worker (Workbox vía `vite-plugin-pwa`)**: solo cachea el *app shell*
  (JS/CSS/HTML) para que la app abra offline. El manejo de `/api/*` es custom
  (arriba) porque involucra reglas de negocio que Workbox no puede resolver solo.

## Endpoints de Laravel

| Método | Ruta                    | Descripción                                              |
|--------|--------------------------|-----------------------------------------------------------|
| GET    | `/api/health`            | `{ ok: true }` — usado para detectar reconexión real      |
| GET    | `/api/productos`         | Lista de productos con stock                               |
| POST   | `/api/productos`         | Crear producto (`nombre`, `precio`, `stock`)               |
| PUT    | `/api/productos/{id}`    | Actualizar (acepta `delta_stock` para sumar/restar)         |
| GET    | `/api/ventas`            | Lista de ventas                                             |
| POST   | `/api/ventas`            | Registrar venta (`productos[]`, `total`, `fecha`)           |

---

🤖 Generado con [Claude Code](https://claude.com/claude-code)
