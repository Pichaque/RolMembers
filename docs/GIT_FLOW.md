# Git Flow

La rama principal del remoto se llama `Main`. No se renombra desde el repositorio local: hay que renombrarla a `main` en GitHub si la rúbrica lo exige.

## Ramas

- `Main`: lo que está publicado. No se commitea directamente.
- `develop`: integración. Cada bloque entra aquí mediante pull request.
- `feature/<bloque>`: un bloque de la entrega. Ejemplos: `feature/bloque-0`, `feature/bloque-1`.

Crear el trabajo de un bloque desde `develop`:

```bash
git checkout develop
git checkout -b feature/bloque-1
```

## Commits

Mensajes convencionales, en imperativo, centrados en el porqué:

- `feat:` función nueva
- `fix:` corrección
- `docs:` documentación
- `test:` pruebas
- `chore:` mantenimiento
- `ci:` integración continua

## Pull request hacia `develop`

Título: `feat: <bloque> <resumen corto>`

Descripción:

```markdown
## Summary
- Qué cambia y por qué.

## Test plan
- [ ] ng build --configuration production
- [ ] ng lint
- [ ] ng test
```

Los pull requests se abren en GitHub. No se reescribe el historial ni se hace force-push.
