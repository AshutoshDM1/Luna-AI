import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function youtubeSearch(query: string): Promise<{ success: boolean; output: string }> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    let command = ''

    if (process.platform === 'win32') {
      command = `start chrome "${searchUrl}"`
    } else if (process.platform === 'darwin') {
      command = `open -a "Google Chrome" "${searchUrl}"`
    } else {
      command = `google-chrome "${searchUrl}"`
    }

    // Attempt to open in Chrome
    try {
      await execAsync(command)
    } catch (err) {
      // Fallback to default browser if Chrome fails
      if (process.platform === 'win32') {
        await execAsync(`start "" "${searchUrl}"`)
      } else if (process.platform === 'darwin') {
        await execAsync(`open "${searchUrl}"`)
      } else {
        await execAsync(`xdg-open "${searchUrl}"`)
      }
    }

    return {
      success: true,
      output: `Opened YouTube search for "${query}" in browser.`
    }
  } catch (err: any) {
    return {
      success: false,
      output: `Failed to open YouTube: ${err.message}`
    }
  }
}
