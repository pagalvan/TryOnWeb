<p align="center">
  <img src="https://github.com/pagalvan/TryOnWeb/blob/main/public/logo.png" width="150" alt="Logo"/>
</p>

---

Sistema de gestión de inventario con probador virtual


Previsualizacion del Frontend
```bash
git clone https://github.com/pagalvan/TryOnWeb.git
cd TryOnWeb
npm install
npm run dev
```

## Arquitectura

- **Aplicación Next.js 16**: concentra la interfaz y la API utilizando `app/` routes. El código de negocio (autenticación, CRUD, validaciones) vive en `lib/` y se comparte entre componentes y rutas del backend serverless.
- **Supabase**: almacén de datos, autenticación primaria y funciones de recuperación de contraseña. Se conecta mediante el cliente admin (`SUPABASE_SERVICE_ROLE_KEY`).

### Endpoints principales

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Autenticación + cookie de sesión |
| `POST` | `/api/auth/register` | Alta de usuarios + perfil en Supabase |
| `POST` | `/api/auth/forgot-password` | Envía link de restablecimiento |
| `POST` | `/api/auth/reset-password` | Actualiza contraseña usando token de Supabase |
| `POST` | `/api/auth/logout` | Limpia la sesión |
| `GET` | `/api/categories` | Listado de categorías |
| `GET` | `/api/products` | Lista productos con stock y categoría |
| `POST` | `/api/products` | Crea producto + stock inicial (solo admin) |
| `PUT` | `/api/products/:id` | Actualiza producto (solo admin) |
| `DELETE` | `/api/products/:id` | Elimina producto (solo admin) |
| `PUT` | `/api/products/:id/stock` | Upsert de inventario por ubicación |
| `DELETE` | `/api/products/:id/stock/:stockId` | Borra registro de inventario |

## Configuración rápida

### Variables de entorno

Dentro de `.env.example` encontrarás las claves necesarias. Crea un archivo `.env.local` en la raíz y completa:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: claves públicas del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave de servicio (solo uso en el servidor Next.js).
- `JWT_SECRET`: secreto para firmar el token de sesión del panel.
- `NEXT_PUBLIC_SITE_URL`: URL base usada para componer el enlace de recuperación de contraseña (ej. `http://localhost:3000`).
- `NEXT_PUBLIC_API_BASE_URL`: opcional; deja vacío si la API corre en el mismo dominio.

### Ejecutar el proyecto

```bash
npm install
npm run dev
```

## Contributors
<table>
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/70029149?v=4" width="100"/><br />
      <a href="https://github.com/pagalvan">Pablo Galván</a><br />
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/202590753?v=4" width="100"/><br />
      <a href="https://github.com/AnyeCOsp23">Anyelin Ospino</a><br />
    </td>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/199418886?v=4" width="100"/><br />
      <a href="https://github.com/hx4m099">Hector Lopez</a><br />
    </td>

  </tr>
</table>

