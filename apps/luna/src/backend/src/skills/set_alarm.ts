import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function setAlarm(
  targetTimeIso: string,
  message: string
): Promise<{ success: boolean; output: string }> {
  try {
    const target = new Date(targetTimeIso)
    const now = new Date()
    const delay = target.getTime() - now.getTime()

    if (isNaN(target.getTime())) {
      return { success: false, output: 'Invalid time format provided.' }
    }

    if (delay <= 0) {
      return { success: false, output: 'The target time is in the past.' }
    }

    // Maximum delay for setTimeout is ~24.8 days (2^31 - 1 ms)
    if (delay > 2147483647) {
      return { success: false, output: 'Alarm time is too far in the future.' }
    }

    if (process.platform === 'win32') {
      const taskName = `LunaAlarm_${Date.now()}`
      const safeMessage = message.replace(/'/g, "''").replace(/"/g, '\\"')

      // We format the target time for the PowerShell -At parameter (local time)
      // Getting local ISO string for PS
      const pad = (n: number) => n.toString().padStart(2, '0')
      const localTimeStr = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}:${pad(target.getSeconds())}`

      const psScript = `
        $Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-WindowStyle Hidden -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show(''''${safeMessage}'''', ''''Luna Alarm'''', ''''OK'''', ''''Information'''')"';
        $Trigger = New-ScheduledTaskTrigger -Once -At '${localTimeStr}';
        Register-ScheduledTask -TaskName '${taskName}' -Action $Action -Trigger $Trigger;
      `
        .replace(/\n/g, ' ')
        .trim()

      await execAsync(`powershell -Command "${psScript}"`)
    } else {
      // Fallback for macOS / Linux
      setTimeout(async () => {
        let command = ''
        const safeMessage = message.replace(/'/g, "''").replace(/"/g, '\\"')
        if (process.platform === 'darwin') {
          command = `osascript -e 'display notification "${safeMessage}" with title "Luna Alarm" sound name "Glass"'`
        } else {
          command = `notify-send "Luna Alarm" "${safeMessage}"`
        }
        try {
          await execAsync(command)
        } catch (err) {
          console.error('Failed to trigger alarm notification', err)
        }
      }, delay)
    }

    return {
      success: true,
      output: `Alarm successfully set for ${target.toLocaleString()} with message: "${message}".`
    }
  } catch (err: any) {
    return {
      success: false,
      output: `Failed to set alarm: ${err.message}`
    }
  }
}
