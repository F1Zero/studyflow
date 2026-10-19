# StudyFlow

Tarjetas de estudio y **repaso espaciado (FSRS)** para secundaria, pensado para
**docentes y sus grupos**. Funciona **sin conexión**, en el navegador, sin instalar nada
pesado. Trae **mazos predefinidos de 1°, 2° y 3° de secundaria** (materias del programa
mexicano) y permite crear, editar e importar más.

**▶ Pruébala en vivo: https://f1zero.github.io/studyflow/**

> Estado: **MVP funcional (Fase 1)**. App real y usable, 100% local. La sincronización
> en línea docente↔grupo está planeada para una fase posterior (ver *Hoja de ruta*).

---

## Enfoque del producto

StudyFlow se diseñó para **venderse al sistema educativo** con la estrategia del
"docente al centro" (opción B):

1. El profesor usa los mazos incluidos o crea los suyos por materia y grado.
2. Comparte un mazo con su grupo (hoy, exportando/importando un archivo; mañana, por código en línea).
3. Cada alumno estudia a su ritmo y el sistema programa los repasos.

Esto convierte una demo en una venta: un profe lo prueba gratis y la escuela licencia para todo el plantel.

---

## Cómo ejecutarlo

**No necesita Node ni compilación.** Solo un navegador moderno y un servidor estático
(se usa Python, que ya está instalado). Hace falta un servidor porque la app usa
módulos de JavaScript (no basta con abrir el archivo).

```bash
cd StudyFlow
python -m http.server 5500
```

Luego abre **http://localhost:5500** en Chrome o Edge.

> También puedes usar el panel "Vista previa" del editor (configuración en `.claude/launch.json`).

### Instalarla como app (PWA)

En Chrome/Edge, con la app abierta, usa el ícono **Instalar** de la barra de direcciones.
Se instala como aplicación y funciona sin conexión. (El *service worker* que habilita el
modo sin conexión se registra en navegadores normales; dentro de algunos paneles de vista
previa embebidos puede no registrarse, pero la app funciona igual.)

---

## Funciones implementadas

- **Inicio (dashboard):** repasos pendientes, número de mazos, racha y acción "Continuar estudiando".
- **Mazos:** crear, editar, duplicar, exportar y eliminar. Agrupados por grado.
- **Tarjetas:** crear, editar y eliminar (pregunta / respuesta / etiquetas).
- **Sesión de estudio:** una tarjeta a la vez, mostrar respuesta y valorar el recuerdo
  (**Otra vez / Difícil / Bien / Fácil**), con el intervalo real que calcula FSRS en cada botón.
  - Atajos de teclado: **Espacio** para revelar, **1–4** para calificar.
  - Guardado automático tras cada calificación (no se pierde el progreso).
- **Programación con FSRS** y registro histórico de cada repaso.
- **Importar / Exportar:** mazos completos en `.json` y tarjetas en `.csv`, con **vista
  previa, validación de filas, conteo y opción de cancelar**.
- **Mazos predefinidos:** 14 mazos de secundaria (1°–3°) con ~89 tarjetas.
- **Perfil:** nombre, rol (docente/alumno), estadísticas y gestión de datos.
- **Privacidad:** todos los datos se guardan solo en el dispositivo (IndexedDB). Nada sale a servidores.
- **Accesibilidad y móvil:** navegación por teclado, roles ARIA, diseño adaptable, modo claro y oscuro.
- **Pruebas:** abre **http://localhost:5500/tests.html** (20 pruebas del motor FSRS y del CSV).

### Mazos incluidos
- **1°:** Matemáticas, Biología, Geografía, Español, Formación Cívica y Ética.
- **2°:** Matemáticas, Física, Historia de México, Español.
- **3°:** Matemáticas, Química, Historia de México, Español, Formación Cívica y Ética.

> El contenido es **orientativo**, basado en materias del programa de secundaria, y es
> **totalmente editable**: el docente puede modificar, duplicar o eliminar cualquier mazo o tarjeta.

---

## Motor de repaso (FSRS)

Se usa la librería **[ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)** (licencia **MIT**),
**vendorizada localmente** en `vendor/ts-fsrs.mjs` (versión 5.4.2) junto con su licencia. No se
reimplementa el algoritmo.

Correspondencia entre la interfaz y el motor:

| Botón      | FSRS      | Valor |
|------------|-----------|-------|
| Otra vez   | `Again`   | 1     |
| Difícil    | `Hard`    | 2     |
| Bien       | `Good`    | 3     |
| Fácil      | `Easy`    | 4     |

Retención objetivo por defecto: **0.90**. Una tarjeta solo se marca como revisada cuando su
estado y su registro se guardan correctamente.

---

## Estructura del proyecto

```
StudyFlow/
├── index.html              Shell de la app
├── tests.html              Pruebas ejecutables en el navegador
├── manifest.webmanifest    PWA
├── sw.js                   Service worker (modo sin conexión)
├── css/styles.css          Estilos (tema claro y oscuro)
├── icons/                  Íconos (SVG + PNG 192/512)
├── vendor/                 ts-fsrs (MIT) vendorizado + licencia
└── js/
    ├── main.js             Arranque
    ├── router.js           Enrutador por hash
    ├── store/
    │   ├── db.js           Envoltorio de IndexedDB
    │   └── repo.js         Lógica de dominio (mazos, tarjetas, repasos, racha)
    ├── domain/
    │   ├── scheduler.js    Programación FSRS (envuelve ts-fsrs)
    │   └── csv.js          Importar/exportar CSV y JSON
    ├── data/seed.js        Mazos predefinidos de secundaria
    ├── ui/                 dom.js, components.js
    └── views/              home, decks, deck-detail, card-editor, study, profile, transfer
```

---

## Limitaciones conocidas / pendiente

- **Sincronización en línea docente↔grupo:** aún no existe. Hoy, compartir un mazo se hace
  exportando/importando un archivo. El código de mazo que se muestra es el identificador para
  esa futura sincronización.
- **Cuentas y nube:** no hay login ni respaldo en servidor (los datos viven en el dispositivo).
- **Pruebas:** hay pruebas del motor y del CSV (`tests.html`). Faltan pruebas de extremo a
  extremo (flujo de interfaz) y de la capa de datos.
- **Service worker en paneles embebidos:** el modo sin conexión se habilita en navegadores
  normales; algunos paneles de vista previa no permiten registrar el service worker.
- **Contenido de los mazos:** orientativo y editable; conviene que un docente lo revise y amplíe.

---

## Hoja de ruta (hacia la venta)

- **Fase 2 — Grupos en línea:** backend con **Supabase** (Auth + PostgreSQL + RLS). El docente
  comparte un mazo por código y ve el avance de su grupo. Requiere credenciales del proyecto
  (no se inventan aquí) y una capa de sincronización sobre la base local.
- **Fase 3 — Plataforma institucional:** roles (alumno/docente/dirección), reportes por grupo
  y materia, licencias y panel administrativo. Es lo que se licencia a un subsistema o escuela.
- **Extras de pago futuros:** generación de tarjetas con IA (desde el servidor, nunca con clave
  secreta en el navegador), importación ampliada y analítica avanzada.

---

## Créditos y licencias

- Motor de repaso: **ts-fsrs** © Open Spaced Repetition — licencia MIT (ver `vendor/ts-fsrs.LICENSE.txt`).
- StudyFlow no usa marcas, logotipos, textos ni recursos de Anki, Lumcards u otros terceros.
