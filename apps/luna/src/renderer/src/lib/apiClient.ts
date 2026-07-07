export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
  ok: boolean
}

export class ApiClient {
  private static baseUrl = 'http://localhost:3001/api'

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    try {
      const response = await fetch(url, { ...options, headers })
      const status = response.status
      const ok = response.ok

      let data: any
      let errorMsg: string | undefined

      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : {}
      } catch (e) {
        errorMsg = 'Failed to parse response JSON'
      }

      if (!ok) {
        errorMsg = data?.error || data?.message || errorMsg || `HTTP error ${status}`
        return { error: errorMsg, status, ok: false }
      }

      return { data: data as T, status, ok: true }
    } catch (e: any) {
      return {
        error: e.message || 'Network error occurred',
        status: 500,
        ok: false
      }
    }
  }

  static get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  static post<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  static put<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    })
  }

  static delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}
export default ApiClient
