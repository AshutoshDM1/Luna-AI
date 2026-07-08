import fs from 'fs'

let PDFParseClass: any = null

async function getPDFParse() {
  if (!PDFParseClass) {
    // Polyfill DOMMatrix for pdf-parse (needed in Node/Electron main process environments)
    if (typeof (global as any).DOMMatrix === 'undefined') {
      ;(global as any).DOMMatrix = class DOMMatrix {}
    }
    const pdfModule = await import('pdf-parse')
    PDFParseClass = pdfModule.PDFParse
  }
  return PDFParseClass
}

/**
 * Reads a file from the local filesystem and decodes it.
 * Supports PDF files via pdf-parse, and falls back to UTF-8 text reading for other files.
 */
export async function decodeFile(filePath: string): Promise<string> {
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') {
    const Parser = await getPDFParse()
    const dataBuffer = fs.readFileSync(filePath)
    const parser = new Parser({ data: dataBuffer })
    const result = await parser.getText()
    return result.text || ''
  } else {
    // Plain text files (.txt, .md, .csv, .json, etc.)
    return fs.readFileSync(filePath, 'utf-8')
  }
}

export async function decodeBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    const Parser = await getPDFParse()
    const parser = new Parser({ data: buffer })
    const result = await parser.getText()
    return result.text || ''
  } else {
    return buffer.toString('utf-8')
  }
}
