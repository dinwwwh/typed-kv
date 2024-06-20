import { TypedKV } from '@typed-kv/typed-kv'
import { env } from 'cloudflare:test'
import { it, expect, expectTypeOf } from 'vitest'

type TestKValue = {
  name?: string
  age?: number
}

type Metadata = {
  createdAt: number
}

it('types are correct for various configurations', async () => {
  // Test case with only value
  const kv1 = new TypedKV<{ value: TestKValue }>({
    kvNamespace: env.TEST_KV,
  })

  const v1 = await kv1.get('test')
  const m1 = await kv1.getWithMetadata('test')
  kv1.put('test', { name: 'test', age: 0 })
  // @ts-expect-error invalid value
  kv1.put('test', '')
  const l1 = await kv1.list('test')
  expectTypeOf(v1).toEqualTypeOf<TestKValue | null>()
  expectTypeOf(m1.value).toEqualTypeOf<TestKValue | null>()
  expectTypeOf(m1.metadata).toEqualTypeOf<unknown | null>()
  expectTypeOf({} as (typeof l1.keys)[number]['metadata']).toEqualTypeOf<unknown | undefined>()

  // Test case with value and metadata
  const kv2 = new TypedKV<{ value: TestKValue; metadata: Metadata }>({
    kvNamespace: env.TEST_KV,
  })

  const v2 = await kv2.get('test')
  const m2 = await kv2.getWithMetadata('test')
  const l2 = await kv2.list('test')
  kv2.put(
    'test',
    { name: 'test', age: 0 },
    {
      metadata: {
        createdAt: Date.now(),
      },
    },
  )
  kv2.put(
    'test',
    { name: 'test', age: 0 },
    {
      // @ts-expect-error invalid metadata
      metadata: {},
    },
  )
  expectTypeOf(v2).toEqualTypeOf<TestKValue | null>()
  expectTypeOf(m2.value).toEqualTypeOf<TestKValue | null>()
  expectTypeOf(m2.metadata).toEqualTypeOf<Metadata | null>()
  expectTypeOf({} as (typeof l2.keys)[number]['metadata']).toEqualTypeOf<Metadata | undefined>()

  // Test case with defaultValue
  const kv3 = new TypedKV<{ value: TestKValue; defaultValue: true }>({
    kvNamespace: env.TEST_KV,
    defaultValue: { name: 'default', age: 0 },
  })

  // @ts-expect-error lacking defaultValue property
  new TypedKV<{ value: TestKValue; defaultValue: true }>({
    kvNamespace: env.TEST_KV,
  })

  new TypedKV<{ value: TestKValue; defaultValue: true }>({
    kvNamespace: env.TEST_KV,
    // @ts-expect-error defaultValue is invalid
    defaultValue: '',
  })

  new TypedKV<{ value: TestKValue; defaultValue: false }>({
    kvNamespace: env.TEST_KV,
    // @ts-expect-error cannot set defaultValue without defaultValue type to be true
    defaultValue: '',
  })

  new TypedKV<{ value: TestKValue }>({
    kvNamespace: env.TEST_KV,
    // @ts-expect-error cannot set defaultValue without defaultValue type to be true
    defaultValue: '',
  })

  const v3 = await kv3.get('test')
  const m3 = await kv3.getWithMetadata('test')
  expectTypeOf(v3).toEqualTypeOf<TestKValue>()
  expectTypeOf(m3.value).toEqualTypeOf<TestKValue>()

  // Test case with value, metadata, and defaultValue
  const kv4 = new TypedKV<{ value: TestKValue; metadata: Metadata; defaultValue: true }>({
    kvNamespace: env.TEST_KV,
    defaultValue: { name: 'default', age: 0 },
  })

  const v4 = await kv4.get('test')
  const m4 = await kv4.getWithMetadata('test')
  expectTypeOf(v4).toEqualTypeOf<TestKValue>()
  expectTypeOf(m4.value).toEqualTypeOf<TestKValue>()
  expectTypeOf(m4.metadata).toEqualTypeOf<Metadata | null>()
})

it('works with simple get and put operations', async () => {
  const kv = new TypedKV<{ value: TestKValue }>({ kvNamespace: env.TEST_KV })
  const value: TestKValue = { name: 'xin chao', age: 18 }

  await kv.put('test', value)
  const result = await kv.get('test')

  expect(result).toEqual(value)
})

it('works with getWithMetadata', async () => {
  const kv = new TypedKV<{ value: TestKValue; metadata: Metadata }>({ kvNamespace: env.TEST_KV })
  const value: TestKValue = { name: 'xin chao', age: 18 }
  const now = Date.now()

  await kv.put('test', value, { metadata: { createdAt: now } })
  const { metadata, value: retrievedValue } = await kv.getWithMetadata('test')

  expect(metadata).toEqual({ createdAt: now })
  expect(retrievedValue).toEqual(value)
})

it('works with list', async () => {
  const kv = new TypedKV<{ value: TestKValue; metadata: Metadata }>({ kvNamespace: env.TEST_KV })
  const value: TestKValue = { name: 'xin chao', age: 18 }
  const now = Date.now()

  await kv.put('test1', value, { metadata: { createdAt: now } })
  await kv.put('test2', value)
  await kv.put('test3', value)

  const result = await kv.list('test')

  expect(result.keys).toEqual([
    { name: 'test1', metadata: { createdAt: now } },
    { name: 'test2' },
    { name: 'test3' },
  ])
})

it('works with delete', async () => {
  const kv = new TypedKV<{ value: TestKValue }>({ kvNamespace: env.TEST_KV })
  const value: TestKValue = { name: 'xin chao', age: 18 }

  await kv.put('test', value)
  await kv.delete('test')
  const result = await kv.get('test')

  expect(result).toBeNull()
})

it('works with memcache enabled', async () => {
  const kv = new TypedKV<{ value: TestKValue }>({ kvNamespace: env.TEST_KV, memcache: true })
  const value: TestKValue = { name: 'xin chao', age: 18 }

  await kv.put('test', value)
  const result = await kv.get('test')

  expect(result).toEqual(value)

  // Update value
  const newValue: TestKValue = { name: 'hello', age: 21 }
  await kv.put('test', newValue)
  const cachedResult = await kv.get('test')

  expect(cachedResult).toEqual(newValue)
})

it('works with getWithMetadata and memcache', async () => {
  const kv = new TypedKV<{ value: TestKValue; metadata: Metadata }>({
    kvNamespace: env.TEST_KV,
    memcache: true,
  })
  const value: TestKValue = { name: 'xin chao', age: 18 }
  const now = Date.now()

  await kv.put('test', value, { metadata: { createdAt: now } })
  const { metadata, value: retrievedValue } = await kv.getWithMetadata('test')

  expect(metadata).toEqual({ createdAt: now })
  expect(retrievedValue).toEqual(value)

  // Update metadata
  const newNow = Date.now()
  await kv.put('test', value, { metadata: { createdAt: newNow } })
  const cachedResult = await kv.getWithMetadata('test')

  expect(cachedResult.metadata).toEqual({ createdAt: newNow })
  expect(cachedResult.value).toEqual(value)
})

it('works with list and memcache', async () => {
  const kv = new TypedKV<{ value: TestKValue; metadata: Metadata }>({
    kvNamespace: env.TEST_KV,
    memcache: true,
  })
  const value: TestKValue = { name: 'xin chao', age: 18 }
  const now = Date.now()

  await kv.put('test1', value, { metadata: { createdAt: now } })
  await kv.put('test2', value)
  await kv.put('test3', value)

  await kv.delete('test2')

  const result = await kv.list('test')

  expect(result.keys).toEqual([{ name: 'test1', metadata: { createdAt: now } }, { name: 'test3' }])
})

it('works with delete and memcache', async () => {
  const kv = new TypedKV<{ value: TestKValue }>({ kvNamespace: env.TEST_KV, memcache: true })
  const value: TestKValue = { name: 'xin chao', age: 18 }

  await kv.put('test', value)
  await kv.delete('test')
  const result = await kv.get('test')

  expect(result).toBeNull()
})