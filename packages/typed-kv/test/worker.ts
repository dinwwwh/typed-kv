import { WorkerEntrypoint } from 'cloudflare:workers'

interface Env {
  TEST_KV: KVNamespace
}

export default class TestWorker extends WorkerEntrypoint<Env> {
  async fetch(request: Request) {
    return new Response('Hello, world!')
  }
}
