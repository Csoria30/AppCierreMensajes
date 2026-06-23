# AppCierreMensajes

## Variables de entorno

Configura estas variables en Render:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_MESSAGES_TABLE` (opcional, por defecto `messages`)
- `APP_USERNAME`
- `APP_PASSWORD`
- `REQUIRE_AUTH` (`true` para exigir login, `false` para desactivar)
- `PORT` (Render la setea automaticamente)

## Proteccion de acceso

La app usa **HTTP Basic Auth**.
Al entrar a la URL, el navegador pedira usuario y password.
Si no coinciden con `APP_USERNAME` y `APP_PASSWORD`, no deja acceder.
