# DNS_SETUP.md — Registros DNS para `streamish.mx`

Configuración exacta para apuntar el dominio del primer tenant **Streamish** a Vercel
(proyecto `streaming-li25`) y que obtenga TLS automático.

---

## Estado actual

- El dominio `streamish.mx` ya está **agregado al proyecto Vercel** `streaming-li25`
  (visible en Project → Settings → Domains).
- **Falta configurar el DNS en el registrador** (donde se compró el dominio): Vercel no puede
  emitir el certificado TLS hasta que los registros existan.
- Nota de Vercel al inspeccionar el dominio:
  > Set the following record on your DNS provider: `A streamish.mx 76.76.21.21` [recommended]

---

## Opción A (recomendada): solo registro A en el registrador actual

Vercel recomienda **no mover los nameservers** y simplemente agregar un registro A.

1. Entra al panel del registrador (donde está registrado `streamish.mx`).
2. Crea un registro **A**:

   | Type | Host / Name | Value / Points to | TTL |
   |---|---|---|---|
   | A | `@` (raíz, `streamish.mx`) | `76.76.21.21` | 300 (o el mínimo) |

3. Guarda. La propagación DNS típicamente toma de minutos a 24 h.

> Los subdominios de tenant (p. ej. `sugerencia.streamish.mx`) **no requieren registros extra**:
> Vercel maneja `*.streamish.mx` automáticamente una vez que la raíz apunta a él. El multi-tenant
> se resuelve en el middleware por header `x-tenant-slug`, no por subdominios DNS separados.

---

## Opción B: mover los nameservers a Vercel

Si prefieres que Vercel gestione todo el DNS del dominio:

| Type | Host / Name | Value |
|---|---|---|
| NS | `streamish.mx` | `ns1.vercel-dns.com` |
| NS | `streamish.mx` | `ns2.vercel-dns.com` |

Estos son los nameservers que Vercel muestra como "Intended Nameservers".

---

## Verificación

Después de propagar el DNS, verifica con:

```bash
# Debe resolver a la IP de Vercel
dig streamish.mx A

# Vercel comenzará la emisión del certificado automáticamente
# Estado visible en: https://vercel.com/jorge-dlp-s-projects/streaming-li25/settings/domains
```

**TLS automático:** Vercel emite y renueva automáticamente el certificado para `streamish.mx`
(y `*.streamish.mx`) una vez que el registro A responde. Recibirás un email de confirmación.

---

## Notas

- `streamingos.mx` (dominio raíz del núcleo) y `superadmin.streamingos.mx` requieren el mismo
  procedimiento si se usan en producción. `superadmin.streamingos.mx` se configura como
  `SUPERADMIN_DOMAIN` (ver `VERCEL_SETUP.md`).
- Mientras el DNS no esté configurado, la validación manual en producción puede hacerse usando el
  URL efímero del deployment de Vercel, pero el `custom_domain` del tenant debe re-apuntarse en
  cada deploy hasta que `streamish.mx` esté operativo.