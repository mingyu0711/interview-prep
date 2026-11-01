import { z } from 'zod'

type ApiErrorKind = 'http' | 'network' | 'invalid-response'

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const errorResponseSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
})

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  expectedStatus?: number
}

async function request(path: string, options: RequestOptions): Promise<Response> {
  let response: Response
  try {
    response = await fetch(new URL(path, window.location.origin), {
      method: options.method ?? 'GET',
      ...(options.body === undefined ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options.body),
      }),
    })
  } catch {
    throw new ApiError('network', '서버 응답을 받지 못했습니다.')
  }

  if (!response.ok) {
    const parsed = errorResponseSchema.safeParse(await response.json().catch(() => null))
    throw new ApiError(
      'http',
      parsed.success ? parsed.data.error.message : '서버가 요청을 처리하지 못했습니다.',
      response.status,
      parsed.success ? parsed.data.error.code : undefined,
    )
  }
  if (response.status !== (options.expectedStatus ?? 200)) {
    throw new ApiError('invalid-response', '서버 응답 형식이 올바르지 않습니다.', response.status)
  }
  return response
}

export async function requestJson<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const response = await request(path, options)
  const parsed = schema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) {
    throw new ApiError('invalid-response', '서버 응답 형식이 올바르지 않습니다.', response.status)
  }
  return parsed.data
}

export async function requestNoContent(path: string): Promise<void> {
  await request(path, { method: 'DELETE', expectedStatus: 204 })
}
