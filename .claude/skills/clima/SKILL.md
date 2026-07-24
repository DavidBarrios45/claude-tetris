---
name: clima
description: Consulta el clima actual (o pronóstico corto) de una ciudad, o de la ubicación actual si no se especifica. Usar cuando el usuario pida clima, temperatura, pronóstico o condiciones meteorológicas.
---

# Weather

Consulta clima vía `wttr.in` (sin API key, HTTP simple).

## Uso

1. Ciudad dada por usuario -> usarla tal cual (URL-encode espacios como `+`).
2. Sin ciudad -> default `Guatemala+City` (Ciudad de Guatemala, Guatemala). No usar auto-detect por IP.

## Comandos

Reporte corto (curr + hoy/mañana, 3 líneas, ideal para consola):

```bash
curl -s "wttr.in/{CIUDAD:-Guatemala+City}?format=3"
```

Reporte visual completo (ASCII art, 3 días):

```bash
curl -s "wttr.in/{CIUDAD}"
```

Reporte JSON (para parsear datos específicos: temp, humedad, viento, presión):

```bash
curl -s "wttr.in/{CIUDAD}?format=j1"
```

Campos útiles del JSON (`current_condition[0]`):
- `temp_C` / `temp_F`
- `FeelsLikeC`
- `humidity`
- `weatherDesc[0].value`
- `windspeedKmph`
- `pressure`

Forzar idioma español en descripciones: agregar `&lang=es` a la URL.

## Notas

- Sin API key, sin registro.
- Si `curl` falla (sin red / rate limit), avisar al usuario, no reintentar en loop.
- En Windows sin `curl`, usar `Invoke-RestMethod`:

```powershell
Invoke-RestMethod "https://wttr.in/{CIUDAD}?format=j1"
```

- Para reporte legible al usuario: preferir `format=3` o el reporte visual; usar `format=j1` solo si se necesita extraer un dato puntual.
