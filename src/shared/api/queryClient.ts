import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Mock은 오프라인에서도 응답한다. 요청을 연결 복구 시점까지 보류하지 않는다.
      queries: { networkMode: 'always' },
      mutations: { networkMode: 'always' },
    },
  })
}
