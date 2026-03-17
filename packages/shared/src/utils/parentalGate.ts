export interface GateQuestion {
  question: string
  answer: number
}

export const generateGateQuestion = (): GateQuestion => {
  const useAdd = Math.random() > 0.5
  const a = randomInt(1, 9)
  const b = randomInt(1, 9)
  if (useAdd) return { question: `${a} + ${b} = ?`, answer: a + b }
  const [big, small] = a >= b ? [a, b] : [b, a]
  return { question: `${big} \u2212 ${small} = ?`, answer: big - small }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
