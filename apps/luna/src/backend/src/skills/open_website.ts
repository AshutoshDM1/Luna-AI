import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function openWebsite(target: string): Promise<{ success: boolean; output: string }> {
  try {
    let url = target.trim()

    // If it's just a name like "google" or "youtube", append .com
    if (!url.includes('.') && !url.includes('://')) {
      url = `${url}.com`
    }

    // If it doesn't have a protocol, prepend https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }

    let command = ''
    if (process.platform === 'win32') {
      command = `start chrome "${url}"`
    } else if (process.platform === 'darwin') {
      command = `open -a "Google Chrome" "${url}"`
    } else {
      command = `google-chrome "${url}"`
    }

    // Attempt to open in Chrome
    try {
      await execAsync(command)
    } catch (err) {
      // Fallback to default browser if Chrome fails
      if (process.platform === 'win32') {
        await execAsync(`start "" "${url}"`)
      } else if (process.platform === 'darwin') {
        await execAsync(`open "${url}"`)
      } else {
        await execAsync(`xdg-open "${url}"`)
      }
    }

    return {
      success: true,
      output: `Opened website: ${url}`
    }
  } catch (err: any) {
    return {
      success: false,
      output: `Failed to open website: ${err.message}`
    }
  }
}
