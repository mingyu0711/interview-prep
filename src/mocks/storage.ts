export const MOCK_DB_KEY = 'interview-prep-mock-db-v1'

export interface MockStorage {
  read: () => string | null
  write: (value: string) => void
}

export function createBrowserStorage(): MockStorage {
  return {
    read: () => localStorage.getItem(MOCK_DB_KEY),
    write: value => localStorage.setItem(MOCK_DB_KEY, value),
  }
}

export function createMemoryStorage(): MockStorage {
  let value: string | null = null
  return {
    read: () => value,
    write: next => { value = next },
  }
}
