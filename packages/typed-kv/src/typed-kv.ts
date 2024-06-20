import type { Merge } from 'type-fest'

export class TypedKV<
  T extends {
    value?: unknown
    metadata?: Record<string, unknown>
    defaultValue?: boolean
  },
  FinalValue = T['defaultValue'] extends true ? T['value'] : T['value'] | null,
  GetOptions = Omit<KVNamespaceGetOptions<'text'>, 'type'>,
  PutOptions = Merge<KVNamespacePutOptions, { metadata?: T['metadata'] }>,
  ListOptions = Omit<KVNamespaceListOptions, 'prefix'>,
> {
  private readonly caches = new Map<string, T['value'] | null>()

  constructor(
    private readonly c: NoInfer<
      {
        kvNamespace: KVNamespace
        prefix?: string
        memcache?: boolean
        defaultPutOptions?: PutOptions
        defaultGetOptions?: GetOptions
        defaultListOptions?: ListOptions
        deserializeValue?: (value: string | null) => T['value'] | null
        serializeValue?: (value: T['value']) => string
      } & (T['defaultValue'] extends true ? { defaultValue: T['value'] } : {})
    >,
  ) {}

  put(key: string, value: T['value'], opt?: PutOptions): Promise<void> {
    if (this.c?.memcache) {
      this.caches.set(key, value)
    }

    return this.c.kvNamespace.put(this.handlePrefix(key), this.serializeValue(value), {
      ...this.c?.defaultPutOptions,
      ...opt,
    })
  }

  async get(key: string, opt?: GetOptions): Promise<FinalValue> {
    if (this.c?.memcache) {
      const cached = this.caches.get(key)

      if (cached !== undefined) {
        return this.handleDefaultValue(cached)
      }
    }

    const raw = await this.c.kvNamespace.get(this.handlePrefix(key), {
      ...this.c?.defaultGetOptions,
      ...opt,
      type: 'text',
    })

    const value = this.deserializeValue(raw)

    if (this.c?.memcache) {
      this.caches.set(key, value)
    }

    return this.handleDefaultValue(value)
  }

  async getWithMetadata(
    key: string,
    opt?: GetOptions,
  ): Promise<
    Merge<KVNamespaceGetWithMetadataResult<FinalValue, T['metadata']>, { value: FinalValue }>
  > {
    const r = await this.c.kvNamespace.getWithMetadata<T['metadata']>(this.handlePrefix(key), {
      ...this.c.defaultGetOptions,
      ...opt,
      type: 'text',
    })

    return {
      ...r,
      value: this.handleDefaultValue(this.deserializeValue(r.value)),
    }
  }

  delete(key: string): Promise<void> {
    if (this.c?.memcache) {
      this.caches.delete(key)
    }

    return this.c.kvNamespace.delete(this.handlePrefix(key))
  }

  async list(prefix: string, opt?: ListOptions): Promise<KVNamespaceListResult<T['metadata']>> {
    const r = await this.c.kvNamespace.list<T['metadata']>({
      ...this.c?.defaultListOptions,
      ...opt,
      prefix: this.handlePrefix(prefix),
    })

    r.keys = r.keys.map((k) => ({
      ...k,
      name: this.reversePrefix(k.name),
    }))

    return r
  }

  private handlePrefix(key: string): string {
    return this.c?.prefix ? `${this.c.prefix}${key}` : key
  }

  private reversePrefix(key: string): string {
    return this.c?.prefix ? key.replace(this.c.prefix, '') : key
  }

  private handleDefaultValue(value: T['value'] | null): FinalValue {
    if (value === null && 'defaultValue' in this.c) {
      return this.c.defaultValue as FinalValue
    }

    return value as FinalValue
  }

  private deserializeValue(value: string | null): T['value'] | null {
    if (this.c.deserializeValue) {
      return this.c.deserializeValue(value)
    }

    if (value === null) return null

    return JSON.parse(value)
  }

  private serializeValue(value: T['value']): string {
    if (this.c.serializeValue) {
      return this.c.serializeValue(value)
    }

    return JSON.stringify(value)
  }
}
