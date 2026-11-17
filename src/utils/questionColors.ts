export interface ElectricQuestionColor {
  hex: string;
  glow: string;
  name: string;
}

export const ELECTRIC_QUESTION_COLORS: ElectricQuestionColor[] = [
  { hex: '#FF007F', glow: 'rgba(255, 0, 127, 0.22)', name: 'Rosa Neón Eléctrico' },
  { hex: '#0055FF', glow: 'rgba(0, 85, 255, 0.20)', name: 'Azul Cobalto Eléctrico' },
  { hex: '#00A33D', glow: 'rgba(0, 163, 61, 0.22)', name: 'Verde Fosforescente' },
  { hex: '#FF5500', glow: 'rgba(255, 85, 0, 0.22)', name: 'Naranja Neón Eléctrico' },
  { hex: '#9D00FF', glow: 'rgba(157, 0, 255, 0.22)', name: 'Ultravioleta Eléctrico' },
  { hex: '#FF0033', glow: 'rgba(255, 0, 51, 0.22)', name: 'Rojo Láser Neón' },
  { hex: '#008ECC', glow: 'rgba(0, 142, 204, 0.22)', name: 'Cian Eléctrico' },
  { hex: '#CC00EE', glow: 'rgba(204, 0, 238, 0.22)', name: 'Fucsia Fosforescente' },
  { hex: '#59A800', glow: 'rgba(89, 168, 0, 0.22)', name: 'Lima Fosforescente' },
  { hex: '#5500FF', glow: 'rgba(85, 0, 255, 0.20)', name: 'Índigo Eléctrico' },
];

export function getQuestionElectricColor(questionNumber: number): ElectricQuestionColor {
  const index = Math.max(0, questionNumber - 1) % ELECTRIC_QUESTION_COLORS.length;
  return ELECTRIC_QUESTION_COLORS[index];
}
