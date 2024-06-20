export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext) {
    const { pathname } = new URL(request.url)

    if (pathname === '/404') {
      return new Response('Not found', { status: 404 })
    }

    return new Response('Hello World!')
  },
}
