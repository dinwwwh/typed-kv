import { TypedKV } from '@typed-kv/typed-kv'
import { WorkerEntrypoint } from 'cloudflare:workers'

interface Env {
  TEST_KV: KVNamespace
}

type TestKValue = {
  name?: string
  age?: number
}

export default class TestWorker extends WorkerEntrypoint<Env> {
  constructor(ctx: ExecutionContext, env: Env) {
    super(ctx, env)
  }

  async fetch(request: Request) {
    const testKV = new TypedKV<{ value: TestKValue }>({
      kvNamespace: this.env.TEST_KV,
    })

    const binaryKV = new TypedKV<{ value: ArrayBuffer }>({
      kvNamespace: this.env.TEST_KV,
      type: 'arrayBuffer',
    })

    const a = await binaryKV.get('a')

    return new Response('Hello, world!')
  }
}
