export type OcrResult = {
  text: string
  amounts: number[]
}

type DetectedText = { rawValue?: string }
type TextDetectorInstance = { detect(source: ImageBitmap): Promise<DetectedText[]> }
type TextDetectorConstructor = new () => TextDetectorInstance
type TesseractModule = {
  recognize(image: File, language: string): Promise<{ data: { text: string } }>
}

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.esm.min.js'

function extractAmounts(text: string): number[] {
  const matches = text.match(/\d[\d\s,.]*/g) ?? []
  const values = matches
    .map((match) => match.trim().replace(/\s/g, ''))
    .map((match) => {
      const normalized = match.includes(',') && match.includes('.')
        ? match.replace(/,/g, '')
        : match.replace(/,/g, '')
      return Number(normalized)
    })
    .filter((value) => Number.isFinite(value) && value > 0)

  return [...new Set(values)].sort((a, b) => b - a).slice(0, 6)
}

export function supportsNativeOcr() {
  return 'TextDetector' in window
}

export async function recognizePrice(image: File): Promise<OcrResult> {
  const Detector = (window as Window & { TextDetector?: TextDetectorConstructor }).TextDetector
  if (Detector) {
    const bitmap = await createImageBitmap(image)
    try {
      const blocks = await new Detector().detect(bitmap)
      const text = blocks.map((block) => block.rawValue ?? '').filter(Boolean).join('\n')
      return { text, amounts: extractAmounts(text) }
    } finally {
      bitmap.close()
    }
  }

  const tesseract = await import(/* @vite-ignore */ TESSERACT_URL) as TesseractModule
  const result = await tesseract.recognize(image, 'eng')
  return { text: result.data.text, amounts: extractAmounts(result.data.text) }
}
