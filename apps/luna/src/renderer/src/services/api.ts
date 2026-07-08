import axios from 'axios'

/**
 * Central Axios instance for all renderer API calls.
 * Base URL points to the local Express backend on port 3001.
 * Import this `api` export everywhere instead of calling axios or fetch directly.
 */
export const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
})

/** Convenience constant — use when you need just the base URL string (e.g. EventSource) */
export const API_BASE_URL = 'http://localhost:3001/api'

export default api
