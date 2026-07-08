import fs from 'fs'
import path from 'path'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function makeNote(
  content: string,
  folder?: string,
  filename?: string
): Promise<{ success: boolean; output: string; filePath: string }> {
  try {
    // Determine the folder to save the note
    let targetFolder = folder || path.join(os.homedir(), 'Documents')

    // Create folder if it doesn't exist
    if (!fs.existsSync(targetFolder)) {
      try {
        fs.mkdirSync(targetFolder, { recursive: true })
      } catch (err: any) {
        // Fallback to Documents if requested folder fails
        targetFolder = path.join(os.homedir(), 'Documents')
        if (!fs.existsSync(targetFolder)) {
          fs.mkdirSync(targetFolder, { recursive: true })
        }
      }
    }

    // Determine the filename
    const targetFilename = filename || `Note_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`

    // Ensure filename has .txt extension
    const finalFilename = targetFilename.endsWith('.txt') ? targetFilename : `${targetFilename}.txt`

    const filePath = path.join(targetFolder, finalFilename)

    // Write the content to the file
    fs.writeFileSync(filePath, content, 'utf-8')

    // Open the file with notepad (Windows) or default text editor (macOS/Linux)
    let command = ''
    if (process.platform === 'win32') {
      command = `notepad "${filePath}"`
    } else if (process.platform === 'darwin') {
      command = `open -a TextEdit "${filePath}"`
    } else {
      command = `xdg-open "${filePath}"`
    }

    // Launch asynchronously without waiting for it to close
    exec(command)

    return {
      success: true,
      output: `Note saved successfully to ${filePath} and opened in text editor.`,
      filePath
    }
  } catch (err: any) {
    return {
      success: false,
      output: `Failed to create note: ${err.message}`,
      filePath: ''
    }
  }
}
