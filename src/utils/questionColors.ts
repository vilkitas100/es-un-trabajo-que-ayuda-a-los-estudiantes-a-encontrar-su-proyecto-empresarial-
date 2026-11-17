export interface ElectricQuestionColor {
  hex: string;
  glow: string;
  name: string;
}

export const ELECTRIC_QUESTION_COLORS: ElectricQuestionColor[] = [
  { hex: '#FF007F', glow: 'rgba(255, 0, 127, 0.22)', name: 'Fresa Eléctrico' },
  { hex: '#0055FF', glow: 'rgba(0, 85, 255, 0.22)', name: 'Azul Fosforescente' },
  { hex: '#00A33D', glow: 'rgba(0, 163, 61, 0.22)', name: 'Verde Fosforescente' },
  { hex: '#FF5500', glow: 'rgba(255, 85, 0, 0.22)', name: 'Naranja Neón Eléctrico' },
  { hex: '#9D00FF', glow: 'rgba(157, 0, 255, 0.22)', name: 'Púrpura Eléctrico' },
  { hex: '#00A896', glow: 'rgba(0, 168, 150, 0.24)', name: 'Turquesa Fosforescente' },
  { hex: '#008ECC', glow: 'rgba(0, 142, 204, 0.22)', name: 'Azul Turquesa Eléctrico' },
  { hex: '#CC00EE', glow: 'rgba(204, 0, 238, 0.22)', name: 'Fucsia Púrpura' },
  { hex: '#5C2808', glow: 'rgba(92, 40, 8, 0.18)', name: 'Marrón Oscuro Ejecutivo' },
  { hex: '#5500FF', glow: 'rgba(85, 0, 255, 0.20)', name: 'Índigo Eléctrico' },
];

export function getQuestionElectricColor(questionNumber: number): ElectricQuestionColor {
  const index = Math.max(0, questionNumber - 1) % ELECTRIC_QUESTION_COLORS.length;
  return ELECTRIC_QUESTION_COLORS[index];
}
