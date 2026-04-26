export type MathQuestion = {
  question: string
  options: string[]
  correctIndex: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateOptions(correct: number, count = 4): { options: string[]; correctIndex: number } {
  const options = new Set<number>()
  options.add(correct)

  const range = 10
  while (options.size < count) {
    const offset = Math.floor(Math.random() * range * 2) - range
    const wrong = correct + offset
    if (wrong >= 0 && wrong !== correct) {
      options.add(wrong)
    }
  }

  const arr = shuffle([...options])
  return {
    options: arr.map(String),
    correctIndex: arr.indexOf(correct),
  }
}

export function generateMathQuestion(): MathQuestion {
  const type = Math.floor(Math.random() * 4)
  let a: number, b: number, result: number, question: string

  switch (type) {
    case 0: {
      a = Math.floor(Math.random() * 50) + 1
      b = Math.floor(Math.random() * 50) + 1
      result = a + b
      question = `${a} + ${b} = ?`
      break
    }
    case 1: {
      a = Math.floor(Math.random() * 50) + 25
      b = Math.floor(Math.random() * (a - 1)) + 1
      result = a - b
      question = `${a} - ${b} = ?`
      break
    }
    case 2: {
      a = Math.floor(Math.random() * 12) + 2
      b = Math.floor(Math.random() * 8) + 2
      result = a * b
      question = `${a} × ${b} = ?`
      break
    }
    default: {
      b = Math.floor(Math.random() * 10) + 2
      result = Math.floor(Math.random() * 10) + 2
      a = b * result
      question = `${a} ÷ ${b} = ?`
      const tmp = result
      result = a / b
      // Ensure clean division
      ;[a, b] = [b * tmp, b]
      result = tmp
      question = `${a} ÷ ${b} = ?`
      break
    }
  }

  const { options, correctIndex } = generateOptions(result)
  return { question, options, correctIndex }
}
