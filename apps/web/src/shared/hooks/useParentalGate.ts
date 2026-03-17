import { useState } from 'react'
import { generateGateQuestion, type GateQuestion } from '@ckd/shared/utils/parentalGate'

interface UseParentalGateReturn {
  isVisible: boolean
  currentQuestion: GateQuestion
  showGate: () => void
  hideGate: () => void
  checkAnswer: (input: string) => boolean
}

export function useParentalGate(): UseParentalGateReturn {
  const [isVisible, setIsVisible] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<GateQuestion>(generateGateQuestion)

  function showGate() {
    setCurrentQuestion(generateGateQuestion())
    setIsVisible(true)
  }

  function hideGate() {
    setIsVisible(false)
  }

  function checkAnswer(input: string): boolean {
    const parsed = parseInt(input, 10)
    if (isNaN(parsed)) {
      regenerateQuestion()
      return false
    }
    if (parsed === currentQuestion.answer) {
      return true
    }
    regenerateQuestion()
    return false
  }

  function regenerateQuestion() {
    const oldQuestion = currentQuestion.question
    let next = generateGateQuestion()
    let retries = 0
    while (next.question === oldQuestion && retries < 10) {
      next = generateGateQuestion()
      retries++
    }
    setCurrentQuestion(next)
  }

  return { isVisible, currentQuestion, showGate, hideGate, checkAnswer }
}
