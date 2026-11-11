# Título

feat: integrar DeepSeek para preguntas y resúmenes de notas (Integrante B)

# Descripción

Implementa POST /api/ia/preguntar con validación Zod y POST /api/notas/:id/resumen usando el servicio existente de A. Centraliza OpenAI/DeepSeek en un servicio CommonJS, devuelve texto y consumo reales y adapta errores a respuestas públicas seguras.

Documenta ambos contratos en OpenAPI, configura variables sin secretos, retira el SDK de Anthropic sin uso y añade pruebas con node:test. Conserva el CRUD y las convenciones de A; el registro del router y el manejo de errores son ajustes compartidos mínimos.

Validación: 11 pruebas aprobadas con transporte DeepSeek simulado, SDK real y servicio real de notas. Incluye regresión CRUD por HTTP y comprobación de contratos Swagger. No se ejecutaron llamadas reales ni pruebas manuales desde Swagger; capturas y tokens reales quedan pendientes.

La rama feature/ia parte de feature/notas por autorización del usuario, porque el remoto solo contiene esa base. El destino previsto es main cuando el equipo la publique; no se crea ni fusiona main automáticamente. Revisar también las alertas de dependencias heredadas indicadas en la documentación.

# Comandos pendientes

Desde la raíz del repositorio, si el push no se pudo completar:

```powershell
git push -u origin feature/ia
```

Después de que el equipo publique main, con GitHub CLI instalado y autenticado:

```powershell
gh pr create --draft --base main --head feature/ia --title 'feat: integrar DeepSeek para preguntas y resúmenes de notas (Integrante B)' --body-file backend/docs/PR-IA.md
```

La descripción de este archivo puede pegarse también en el formulario web de GitHub. El compañero debe revisar; no aprobar ni fusionar el propio PR.
