// ============================================================
// seed.js — Mazos predefinidos de secundaria (1°, 2° y 3°).
// Contenido orientativo basado en materias del programa de
// secundaria de México. Es editable: el usuario puede modificar,
// duplicar o eliminar cualquier mazo o tarjeta.
// ============================================================

import * as db from '../store/db.js';
import { uid, shareCode } from '../store/repo.js';
import { newState } from '../domain/scheduler.js';

export const SEED_VERSION = 1;

// Cada mazo: { subject, grade, description, cards: [[pregunta, respuesta, [etiquetas]]] }
const DECKS = [
  // ---------------- 1° de secundaria ----------------
  {
    subject: 'Matemáticas', grade: 1, name: 'Matemáticas · 1°',
    description: 'Números, fracciones y proporcionalidad.',
    cards: [
      ['¿Qué es un número primo?', 'Un número natural mayor que 1 que solo es divisible entre 1 y sí mismo.', ['números']],
      ['¿Cuál es el valor absoluto de −7?', '7. Es la distancia al cero, siempre positiva o cero.', ['enteros']],
      ['¿Cómo se suman dos fracciones con el mismo denominador?', 'Se suman los numeradores y se conserva el denominador.', ['fracciones']],
      ['¿Qué es el mínimo común múltiplo (m.c.m.)?', 'El menor múltiplo distinto de cero común a dos o más números.', ['números']],
      ['¿A qué equivale 1/2 en decimal y en porcentaje?', '0.5 y 50%.', ['fracciones']],
      ['¿Qué es una razón entre dos cantidades?', 'La comparación entre dos cantidades mediante un cociente (a/b).', ['proporcionalidad']],
      ['¿Qué números forman el conjunto de los enteros?', 'Los naturales, sus negativos y el cero: …, −2, −1, 0, 1, 2, …', ['enteros']],
    ],
  },
  {
    subject: 'Biología', grade: 1, name: 'Biología · 1°',
    description: 'La célula, los ecosistemas y la vida.',
    cards: [
      ['¿Cuál es la función principal de las mitocondrias?', 'Producir energía para la célula mediante la respiración celular (ATP).', ['célula']],
      ['¿Qué estructura controla la entrada y salida de sustancias en la célula?', 'La membrana celular (membrana plasmática).', ['célula']],
      ['¿Qué diferencia a una célula vegetal de una animal?', 'La vegetal tiene pared celular y cloroplastos; la animal no.', ['célula']],
      ['¿Qué es la fotosíntesis?', 'El proceso por el que las plantas producen glucosa usando luz solar, agua y dióxido de carbono.', ['plantas']],
      ['¿Cuáles son los niveles tróficos de una cadena alimentaria?', 'Productores, consumidores y descomponedores.', ['ecología']],
      ['¿Qué es la biodiversidad?', 'La variedad de seres vivos y ecosistemas en un lugar o en el planeta.', ['ecología']],
      ['¿Cuál es la unidad básica de los seres vivos?', 'La célula.', ['célula']],
    ],
  },
  {
    subject: 'Geografía', grade: 1, name: 'Geografía · 1°',
    description: 'La Tierra, mapas y población.',
    cards: [
      ['¿Qué son las coordenadas geográficas?', 'La latitud y la longitud, que ubican cualquier punto de la Tierra.', ['mapas']],
      ['¿Qué mide la latitud?', 'La distancia en grados al norte o al sur del ecuador.', ['mapas']],
      ['¿Qué representa la escala de un mapa?', 'La relación entre la distancia en el mapa y la distancia real.', ['mapas']],
      ['¿Qué es un huso horario?', 'Cada una de las franjas en que se divide la Tierra para medir la hora.', ['tiempo']],
      ['¿Qué es la densidad de población?', 'El número de habitantes por unidad de superficie (hab/km²).', ['población']],
      ['¿Cuáles son los continentes?', 'América, Europa, Asia, África, Oceanía y Antártida.', ['continentes']],
    ],
  },
  {
    subject: 'Español', grade: 1, name: 'Español · 1°',
    description: 'Gramática y tipos de texto.',
    cards: [
      ['¿Qué es un sustantivo?', 'La palabra que nombra personas, animales, cosas o ideas.', ['gramática']],
      ['¿Qué es un sinónimo?', 'Una palabra con significado igual o muy parecido a otra.', ['vocabulario']],
      ['¿Qué partes tiene una narración?', 'Planteamiento (inicio), nudo (desarrollo) y desenlace (final).', ['textos']],
      ['¿Qué indica el sujeto en una oración?', 'Quién realiza la acción o de quién se dice algo.', ['gramática']],
      ['¿Qué es un prefijo?', 'Un morfema que se antepone a una palabra para cambiar su significado (ej. "in-" en "incompleto").', ['gramática']],
      ['¿Qué es una monografía?', 'Un texto que desarrolla un solo tema de forma documentada.', ['textos']],
    ],
  },
  {
    subject: 'Formación Cívica y Ética', grade: 1, name: 'Formación Cívica y Ética · 1°',
    description: 'Convivencia, derechos y valores.',
    cards: [
      ['¿Qué son los derechos humanos?', 'Garantías que tiene toda persona por el hecho de serlo, sin discriminación.', ['derechos']],
      ['¿Qué es la empatía?', 'La capacidad de comprender y compartir los sentimientos de otra persona.', ['valores']],
      ['¿Qué es la democracia?', 'Una forma de gobierno en la que el poder reside en el pueblo, que elige a sus representantes.', ['democracia']],
      ['¿Qué es la equidad de género?', 'Dar a mujeres y hombres las mismas oportunidades y un trato justo.', ['valores']],
      ['¿Cómo se resuelve un conflicto de forma pacífica?', 'Mediante el diálogo, la negociación y los acuerdos.', ['convivencia']],
      ['¿Qué es la interculturalidad?', 'El respeto y la convivencia entre personas de culturas distintas.', ['convivencia']],
    ],
  },

  // ---------------- 2° de secundaria ----------------
  {
    subject: 'Matemáticas', grade: 2, name: 'Matemáticas · 2°',
    description: 'Ecuaciones, geometría y probabilidad.',
    cards: [
      ['¿Qué es una ecuación de primer grado?', 'Una igualdad con una incógnita elevada a la potencia 1 (ej. 2x + 3 = 7).', ['álgebra']],
      ['En y = mx + b, ¿qué representa m?', 'La pendiente de la recta.', ['álgebra']],
      ['¿Cómo se calcula el área de un triángulo?', 'Base por altura entre dos: (b · h) / 2.', ['geometría']],
      ['¿Qué es un polígono regular?', 'Un polígono con todos sus lados y ángulos iguales.', ['geometría']],
      ['¿Cómo se calcula la probabilidad de un evento?', 'Casos favorables entre casos posibles.', ['probabilidad']],
      ['¿Cuánto suman los ángulos internos de un triángulo?', '180°.', ['geometría']],
      ['¿Qué son términos semejantes en álgebra?', 'Términos con la misma parte literal (ej. 3x y 5x).', ['álgebra']],
    ],
  },
  {
    subject: 'Física', grade: 2, name: 'Física · 2°',
    description: 'Movimiento, fuerzas y energía.',
    cards: [
      ['¿Qué es la velocidad?', 'El cambio de posición respecto al tiempo (distancia/tiempo), con una dirección.', ['movimiento']],
      ['¿Qué establece la primera ley de Newton?', 'Un cuerpo sigue en reposo o en movimiento uniforme si no actúa una fuerza neta (inercia).', ['leyes de Newton']],
      ['¿Cuál es la fórmula de la segunda ley de Newton?', 'Fuerza = masa × aceleración (F = m · a).', ['leyes de Newton']],
      ['¿Qué diferencia hay entre masa y peso?', 'La masa es la cantidad de materia; el peso es la fuerza con que la gravedad la atrae.', ['fuerzas']],
      ['¿Qué es la energía cinética?', 'La energía que tiene un cuerpo por estar en movimiento.', ['energía']],
      ['¿En qué unidad se mide la fuerza en el SI?', 'En newtons (N).', ['unidades']],
      ['¿Qué es la aceleración?', 'El cambio de la velocidad respecto al tiempo.', ['movimiento']],
    ],
  },
  {
    subject: 'Historia', grade: 2, name: 'Historia de México · 2°',
    description: 'De las culturas antiguas a la Independencia.',
    cards: [
      ['¿En qué año se consumó la Independencia de México?', 'En 1821.', ['independencia']],
      ['¿Quién inició el movimiento de Independencia en 1810?', 'Miguel Hidalgo y Costilla, con el Grito de Dolores.', ['independencia']],
      ['¿Qué ocurrió en la Conquista de México-Tenochtitlan (1521)?', 'La caída del imperio mexica ante los españoles y sus pueblos aliados.', ['conquista']],
      ['¿Qué fue el Virreinato de la Nueva España?', 'El territorio gobernado por España en América durante unos tres siglos.', ['virreinato']],
      ['¿Qué documento proclamó José María Morelos en 1813?', 'Los Sentimientos de la Nación.', ['independencia']],
      ['¿Qué es el mestizaje?', 'La mezcla cultural y biológica entre pueblos indígenas, europeos y africanos.', ['sociedad']],
    ],
  },
  {
    subject: 'Español', grade: 2, name: 'Español · 2°',
    description: 'Verbos, figuras literarias y textos.',
    cards: [
      ['¿Qué es un verbo?', 'La palabra que expresa acción, estado o proceso.', ['gramática']],
      ['¿Qué es una metáfora?', 'Una figura que identifica una cosa con otra por semejanza (ej. "sus ojos son dos luceros").', ['literatura']],
      ['¿Qué es el sujeto tácito?', 'El sujeto que no aparece escrito pero se deduce del verbo.', ['gramática']],
      ['¿Qué diferencia hay entre denotación y connotación?', 'La denotación es el significado literal; la connotación, el sugerido o figurado.', ['significado']],
      ['¿Qué preguntas responde una noticia?', 'Qué, quién, cuándo, dónde, cómo y por qué.', ['textos']],
      ['¿Qué es un argumento?', 'Una razón que se da para defender o rechazar una idea.', ['textos']],
    ],
  },

  // ---------------- 3° de secundaria ----------------
  {
    subject: 'Matemáticas', grade: 3, name: 'Matemáticas · 3°',
    description: 'Ecuaciones cuadráticas, trigonometría y funciones.',
    cards: [
      ['¿Qué es una ecuación de segundo grado?', 'Una ecuación de la forma ax² + bx + c = 0, con a ≠ 0.', ['álgebra']],
      ['¿Cuál es la fórmula general para resolver ax² + bx + c = 0?', 'x = (−b ± √(b² − 4ac)) / (2a).', ['álgebra']],
      ['¿Qué enuncia el teorema de Pitágoras?', 'En un triángulo rectángulo: a² + b² = c², donde c es la hipotenusa.', ['geometría']],
      ['¿Qué es una función lineal?', 'Una relación de la forma y = mx + b cuya gráfica es una recta.', ['funciones']],
      ['¿Qué es el seno de un ángulo en un triángulo rectángulo?', 'El cociente entre el cateto opuesto y la hipotenusa.', ['trigonometría']],
      ['¿Qué es una sucesión aritmética?', 'Una serie de números con diferencia constante entre términos consecutivos.', ['sucesiones']],
    ],
  },
  {
    subject: 'Química', grade: 3, name: 'Química · 3°',
    description: 'Átomos, enlaces y reacciones.',
    cards: [
      ['¿Qué es un átomo?', 'La unidad más pequeña de un elemento que conserva sus propiedades.', ['materia']],
      ['¿Qué partículas forman el núcleo de un átomo?', 'Protones (carga positiva) y neutrones (sin carga).', ['átomo']],
      ['¿Qué es un enlace covalente?', 'La unión de átomos que comparten electrones.', ['enlaces']],
      ['¿Qué indica el número atómico de un elemento?', 'El número de protones en su núcleo.', ['átomo']],
      ['¿Qué mide la escala de pH?', 'La acidez o alcalinidad de una disolución, de 0 a 14.', ['disoluciones']],
      ['¿Qué es una reacción química?', 'Un proceso en el que unas sustancias se transforman en otras distintas.', ['reacciones']],
      ['¿Quién propuso la organización de la tabla periódica?', 'Dmitri Mendeléiev.', ['tabla periódica']],
    ],
  },
  {
    subject: 'Historia', grade: 3, name: 'Historia de México · 3°',
    description: 'México en el siglo XX.',
    cards: [
      ['¿En qué año inició la Revolución Mexicana?', 'En 1910.', ['revolución']],
      ['¿Quién encabezó el movimiento contra la reelección de Porfirio Díaz?', 'Francisco I. Madero.', ['revolución']],
      ['¿Cuál era el lema del movimiento zapatista?', '"Tierra y Libertad".', ['revolución']],
      ['¿En qué año se promulgó la Constitución vigente de México?', 'En 1917.', ['constitución']],
      ['¿Qué fue la Expropiación Petrolera y en qué año ocurrió?', 'La nacionalización del petróleo por Lázaro Cárdenas, en 1938.', ['siglo XX']],
      ['¿En qué año obtuvieron las mujeres el derecho a votar en elecciones federales en México?', 'En 1953.', ['siglo XX']],
    ],
  },
  {
    subject: 'Español', grade: 3, name: 'Español · 3°',
    description: 'Ensayo, sintaxis y recursos del texto.',
    cards: [
      ['¿Qué es un ensayo?', 'Un texto donde el autor expone y argumenta su punto de vista sobre un tema.', ['textos']],
      ['¿Qué es una oración subordinada?', 'Una oración que depende de otra principal para tener sentido completo.', ['sintaxis']],
      ['¿Qué es la voz pasiva?', 'Una construcción donde el sujeto recibe la acción (ej. "la carta fue escrita").', ['sintaxis']],
      ['¿Qué diferencia hay entre resumen y paráfrasis?', 'El resumen abrevia; la paráfrasis reexpresa con otras palabras conservando el sentido.', ['textos']],
      ['¿Qué es un tecnicismo?', 'Una palabra propia de una ciencia, técnica o profesión.', ['vocabulario']],
      ['¿Para qué sirven los nexos o conectores?', 'Para enlazar ideas y dar cohesión al texto (ej. "sin embargo", "por lo tanto").', ['sintaxis']],
    ],
  },
  {
    subject: 'Formación Cívica y Ética', grade: 3, name: 'Formación Cívica y Ética · 3°',
    description: 'Ciudadanía, Estado y proyecto de vida.',
    cards: [
      ['¿Qué es la ciudadanía?', 'La condición de pertenecer a una comunidad política con derechos y deberes.', ['ciudadanía']],
      ['¿Qué es el Estado de derecho?', 'El principio de que todas las personas e instituciones se someten a la ley.', ['legalidad']],
      ['¿Cuáles son valores cívicos fundamentales?', 'El respeto, la justicia, la responsabilidad y la solidaridad, entre otros.', ['valores']],
      ['¿Cómo se divide el poder público en México?', 'En Ejecutivo, Legislativo y Judicial.', ['gobierno']],
      ['¿Qué es un proyecto de vida?', 'El plan personal de metas y decisiones a futuro.', ['desarrollo']],
      ['¿Por qué la corrupción afecta a la sociedad?', 'Porque es el abuso del poder para beneficio propio y daña la confianza y los recursos públicos.', ['legalidad']],
    ],
  },
];

/** Inserta los mazos predefinidos solo si aún no se han cargado. */
export async function ensureSeed() {
  const flag = await db.get('meta', 'seeded');
  if (flag && flag.value >= SEED_VERSION) return false;

  const now = new Date();
  for (const d of DECKS) {
    const nowISO = now.toISOString();
    const deck = {
      id: uid(),
      name: d.name,
      subject: d.subject,
      grade: d.grade,
      description: d.description,
      origin: 'seed',
      shareCode: shareCode(),
      createdAt: nowISO,
      updatedAt: nowISO,
      archivedAt: null,
    };
    const entries = [{ store: 'decks', value: deck }];
    for (const [front, back, tags] of d.cards) {
      const card = {
        id: uid(),
        deckId: deck.id,
        front, back,
        tags: tags || [],
        origin: 'seed',
        createdAt: nowISO,
        updatedAt: nowISO,
        archivedAt: null,
      };
      const s = newState(now);
      entries.push({ store: 'cards', value: card });
      entries.push({ store: 'states', value: { ...s, cardId: card.id, deckId: deck.id } });
    }
    await db.putMany(entries);
  }

  await db.put('meta', { key: 'seeded', value: SEED_VERSION });
  return true;
}
