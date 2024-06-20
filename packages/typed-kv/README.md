# `typed-kv`

`typed-kv` is an npm package that acts as a wrapper for Cloudflare KV with first-class TypeScript support. This package aims to simplify the usage of Cloudflare KV by providing robust TypeScript types, built-in memcache, support for default values, and easy handling of get, put, and list operations with default options and prefix support.

## Features

- **Full TypeScript Support**: Type-safe operations for 100% of use cases.
- **Built-in Memcache**: Faster and more cost-effective access to frequently used data.
- **Default Values**: Specify default values for keys that might not exist.
- **Default Options**: Define default get, put, and list options to reduce redundancy.
- **Prefix Support**: Easily manage key prefixes to organize your KV namespace.

## Limitations

Currently, `typed-kv` does not support binary types like `ArrayBuffer` and `ReadableStream`, but there are plans to add support for these types in the future.

## Installation

```sh
npm install typed-kv
```

## Usage

### Basic Usage

```ts
import { TypedKV } from 'typed-kv'

type TestKValue = {
  name?: string
  age?: number
}

const kv = new TypedKV<{ value: TestKValue }>({
  kvNamespace: TEST_KV, // your KV namespace,
})

const value: TestKValue = { name: 'xin chao', age: 18 }

await kv.put('test', value)
await kv.get('test')
await kv.delete('test')
await kv.list()
await kv.getWithMetadata('test')
```

### Advanced Usage

```ts
import { TypedKV } from '@typed-kv/typed-kv'
import { env } from 'cloudflare:test'

type TestKValue = {
  name?: string
  age?: number
}

type Metadata = {
  createdAt: number
}

const kv = new TypedKV<{
  value: TestKValue
  metadata: Metadata
  defaultValue: true // default value feature
}>({
  kvNamespace: env.TEST_KV,
  prefix: 'user/', // optional prefix for keys
  memcache: true, // enable memcache
  defaultValue: { name: 'default', age: 0 }, // must be set when using default value feature
  defaultGetOptions: {
    // default get options
  },
  defaultPutOptions: {
    // default put options
  },
  defaultListOptions: {
    // default list options
  },
})
```

## Testing

You can run the tests using `vitest` to ensure that everything is working correctly:

```sh
pnpm -w test
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue if you have any suggestions or find any bugs.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
