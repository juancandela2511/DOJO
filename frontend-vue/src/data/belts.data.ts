import type { BeltModel, LearningMilestone } from '../types/dojo';

export const INITIAL_BELTS: BeltModel[] = [
  { id: 1, name: 'Principiante', colorHex: '#64748B', secondaryColorHex: null, rankOrder: 1, description: 'Etapa inicial previa a la Faja Blanca' },
  { id: 2, name: 'Faja Blanca', colorHex: '#F5F5F4', secondaryColorHex: '#D4D4D8', rankOrder: 2, description: 'Pureza e inicio oficial en el Kung Fu Wushu' },
  { id: 3, name: 'Faja Amarilla', colorHex: '#D4A017', secondaryColorHex: null, rankOrder: 3, description: 'Posturas fundamentales (Ma Bu, Gong Bu)' },
  { id: 4, name: 'Faja Naranja', colorHex: '#C96A2B', secondaryColorHex: null, rankOrder: 4, description: 'Desplazamientos, bloqueos y coordinación' },
  { id: 5, name: 'Faja Verde Jade', colorHex: '#2E7D5B', secondaryColorHex: null, rankOrder: 5, description: 'Formas tradicionales (Taolu) y Sanda básico' },
  { id: 6, name: 'Faja Azul Imperial', colorHex: '#235A9C', secondaryColorHex: null, rankOrder: 6, description: 'Fluidez táctica y armas cortas tradicionales' },
  { id: 7, name: 'Faja Roja / Marrón', colorHex: '#7D3B24', secondaryColorHex: null, rankOrder: 7, description: 'Grado avanzado previo al maestro' },
  { id: 8, name: 'Faja Negra (1er Duan)', colorHex: '#18181B', secondaryColorHex: '#FFFFFF', rankOrder: 8, description: 'Dominio integral del Kung Fu Shaolin' },
];

export const INITIAL_BELT_LEARNING_PATHS: Record<number, LearningMilestone[]> = {
  1: [
    { id: 'b1-m1', title: 'Inducción y Normas del Dojo', description: 'Saludo Bao Quan Li, respeto al tatami y calentamiento básico.' },
    { id: 'b1-m2', title: 'Coordinación y Equilibrio Inicial', description: 'Desplazamientos básicos, guardia inicial y respiración.' },
    { id: 'b1-m3', title: 'Evaluación de Ingreso', description: 'Listo para recibir la Faja Blanca.' },
  ],
  2: [
    { id: 'b2-m1', title: 'Posturas Base (Ma Bu y Gong Bu)', description: 'Estabilidad, alineación de rodillas y equilibrio.' },
    { id: 'b2-m2', title: 'Golpes Básicos y Bloqueos', description: 'Puño recto, defensa alta y guardia cerrada.' },
    { id: 'b2-m3', title: 'Patadas Frontales Fundamentales', description: 'Zheng Ti Tui y control de respiración.' },
  ],
  3: [
    { id: 'b3-m1', title: 'Transiciones de Posturas', description: 'Cambios fluidos entre Ma Bu, Gong Bu y Pu Bu.' },
    { id: 'b3-m2', title: 'Combinaciones de Puño y Palma', description: 'Secuencias de 3 tiempos con giro de cadera.' },
    { id: 'b3-m3', title: 'Forma Básica 1 (Wu Bu Quan)', description: 'Ejecución continua con ritmo y enfoque.' },
  ],
  4: [
    { id: 'b4-m1', title: 'Desplazamientos Tácticos', description: 'Entradas en ángulo, pivote y control de distancia.' },
    { id: 'b4-m2', title: 'Patadas Circulares y Laterales', description: 'Ce Chuai Tui y control de cadera en impacto.' },
    { id: 'b4-m3', title: 'Defensa Sanda Nivel 1', description: 'Bloqueo + contraataque controlado en pareja.' },
  ],
  5: [
    { id: 'b5-m1', title: 'Taolu Changquan Intermedio', description: 'Primera y segunda sección con potencia.' },
    { id: 'b5-m2', title: 'Barridos y Caídas Seguras', description: 'Qian Sao Tang y absorción de impacto.' },
    { id: 'b5-m3', title: 'Combate Técnico Sanda', description: 'Lectura de ritmo, fintas y contragolpe.' },
  ],
  6: [
    { id: 'b6-m1', title: 'Forma Lian Huan Quan', description: 'Fluidez encadenada y explosividad en transiciones.' },
    { id: 'b6-m2', title: 'Manejo de Armas Cortas', description: 'Fundamentos de Dao (sable) y control de muñeca.' },
    { id: 'b6-m3', title: 'Patadas con Salto (Teng Kong)', description: 'Impulso, altura y aterrizaje estable.' },
    { id: 'b6-m4', title: 'Simulacro de Examen Técnico', description: 'Evaluación integral ante instructores.' },
  ],
  7: [
    { id: 'b7-m1', title: 'Taolu Avanzado con Arma', description: 'Rutina completa con velocidad y precisión.' },
    { id: 'b7-m2', title: 'Dirección de Calentamiento', description: 'Liderazgo pedagógico en el tatami.' },
    { id: 'b7-m3', title: 'Combate Libre Controlado', description: 'Estrategia, resistencia y temple marcial.' },
  ],
  8: [
    { id: 'b8-m1', title: 'Maestría Jian Shu (Espada)', description: 'Precisión milimétrica y expresión marcial.' },
    { id: 'b8-m2', title: 'Formación de Discípulos', description: 'Guía técnica de grados menores.' },
    { id: 'b8-m3', title: 'Perfeccionamiento 1er Duan', description: 'Integración cuerpo, respiración y espíritu.' },
  ],
};
