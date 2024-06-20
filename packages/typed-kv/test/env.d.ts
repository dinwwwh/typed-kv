interface Env {
  TEST_KV: KVNamespace
}

declare module 'cloudflare:test' {
  interface ProvidedEnv extends Env {}
}
