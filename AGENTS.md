# Instrucciones de Agentes

## Alcance

- Seguir `OPENCODE_INSTRUCTIONS.md` y la documentación de `streamvault-docs/`.
- Implementar únicamente la sesión indicada por el roadmap.
- No mezclar cambios de sesiones anteriores con la sesión activa.

## Calidad

- TypeScript estricto; no usar `any`.
- Validar entradas con Zod antes de tocar Supabase.
- Mantener RLS activo en todas las tablas.
- La lógica crítica de negocio debe vivir en RPC SQL.
- No exponer claves privadas, tokens ni secretos.

## Flujo de entrega

- Una rama por fase: `feat/<fase>` o `fix/<nombre>`.
- Cada incremento debe pasar lint, typecheck, tests y build.
- No hacer push, PR ni merge sin una instrucción explícita para esa sesión.
