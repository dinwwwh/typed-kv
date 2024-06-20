import type { Merge } from 'type-fest'

export class TypedKV<
  T extends {
    value?: unknown
    metadata?: unknown
    default?: boolean
  },
  RawValueType = T['value'] extends ReadableStream
    ? 'stream'
    : T['value'] extends ArrayBuffer | ArrayBufferView | ReadableStream
      ? 'arrayBuffer'
      : 'text',
  RawValue = RawValueType extends 'text'
    ? string
    : RawValueType extends 'arrayBuffer'
      ? ArrayBuffer
      : ReadableStream,
  FinalValue = T['default'] extends true ? T['value'] : T['value'] | null,
  GetOptions = Omit<KVNamespaceGetOptions<RawValueType>, 'type'>,
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
        deserialize?: (value: RawValue | null) => T['value'] | null
        serialize?: (value: T['value']) => RawValue
      } & (T['default'] extends true ? { default: T['value'] } : {}) &
        (RawValueType extends 'text' ? {} : { type: RawValueType })
    >,
  ) {}

  put(key: string, value: T['value'], opt?: PutOptions) {
    if (this.c?.memcache) {
      this.caches.set(key, value)
    }

    return this.c.kvNamespace.put(this.prefix(key), this.serialize(value) as any, {
      ...this.c?.defaultPutOptions,
      ...opt,
    })
  }

  async get(key: string, opt?: GetOptions): Promise<FinalValue> {
    if (this.c?.memcache) {
      const cached = this.caches.get(key)

      if (cached !== undefined) {
        return this.default(cached)
      }
    }

    const raw = await this.c.kvNamespace.get(this.prefix(key), {
      ...this.c?.defaultGetOptions,
      ...opt,
      type: this.type as any,
    })

    const value = this.deserialize(raw as RawValue)

    if (this.c?.memcache) {
      this.caches.set(key, value)
    }

    return this.default(value)
  }

  async getWithMetadata(
    key: string,
    opt?: GetOptions,
  ): Promise<
    Merge<KVNamespaceGetWithMetadataResult<FinalValue, T['metadata']>, { value: FinalValue }>
  > {
    const r = await this.c.kvNamespace.getWithMetadata<T['metadata']>(this.prefix(key), {
      ...this.c.defaultGetOptions,
      ...opt,
      type: this.type as any,
    })

    return {
      ...r,
      value: this.default(this.deserialize(r.value as RawValue)),
    }
  }

  list(prefix: string, opt?: ListOptions): Promise<KVNamespaceListResult<T['metadata']>> {
    return this.c.kvNamespace.list<T['metadata']>({
      ...this.c?.defaultListOptions,
      ...opt,
      prefix: this.prefix(prefix),
    })
  }

  private prefix(key: string): string {
    return this.c?.prefix ? `${this.c.prefix}/${key}` : key
  }

  private default(value: T['value'] | null): FinalValue {
    if (value === null) {
      return ('default' in this.c ? this.c.default : null) as FinalValue
    }

    return value as FinalValue
  }

  private deserialize(value: RawValue | null): T['value'] | null {
    if (this.c.deserialize) {
      return this.c.deserialize(value as any)
    }

    if (value === null) return null

    if (this.type === 'text') {
      return JSON.parse(value as string) as T['value']
    }

    return value
  }

  private serialize(value: T['value']): RawValue {
    if (this.c.serialize) {
      return this.c.serialize(value)
    }

    if (this.type === 'text') {
      return JSON.stringify(value) as RawValue
    }

    return value as RawValue
  }

  get type(): RawValueType {
    return ('type' in this.c ? this.c.type : 'text') as RawValueType
  }
}
