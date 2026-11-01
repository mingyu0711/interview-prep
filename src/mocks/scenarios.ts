import { z } from 'zod'

const scenarioSchema = z.object({
  method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']),
  path: z.string().startsWith('/api/'),
  scenario: z.enum(['normal', 'delay', 'error']),
  times: z.number().int().positive().default(1),
})

export type ScenarioOptions = z.input<typeof scenarioSchema>

export function createScenarioController() {
  const rules = new Map<string, z.output<typeof scenarioSchema>>()

  return {
    setScenario(options: ScenarioOptions) {
      const rule = scenarioSchema.parse(options)
      const key = `${rule.method} ${rule.path}`
      if (rule.scenario === 'normal') rules.delete(key)
      else rules.set(key, rule)
    },
    consume(request: Request): 'normal' | 'delay' | 'error' {
      const key = `${request.method} ${new URL(request.url).pathname}`
      const rule = rules.get(key)
      if (!rule) return 'normal'
      if (--rule.times === 0) rules.delete(key)
      return rule.scenario
    },
    reset() {
      rules.clear()
    },
  }
}

export type ScenarioController = ReturnType<typeof createScenarioController>
