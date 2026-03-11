# peasy-compress

[![npm](https://img.shields.io/npm/v/peasy-compress)](https://www.npmjs.com/package/peasy-compress)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Archive and compression library for Node.js -- ZIP create/extract/list/add, gzip, brotli, and deflate. TypeScript-first with full type safety, built on Node.js native `zlib` and `adm-zip`.

Built from [Peasy Compress](https://peasytools.com), the developer tools platform for file processing, text analysis, and web utilities.

> **Try the interactive tools at [peasytools.com](https://peasytools.com)** -- compression, archiving, and 255 more browser-based tools

<p align="center">
  <img src="demo.gif" alt="peasy-compress demo — file compression and decompression in terminal" width="800">
</p>

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [What You Can Do](#what-you-can-do)
  - [ZIP Archives](#zip-archives)
  - [Gzip Compression](#gzip-compression)
  - [Brotli Compression](#brotli-compression)
  - [Deflate Compression](#deflate-compression)
- [TypeScript Types](#typescript-types)
- [API Reference](#api-reference)
- [Also Available for Python](#also-available-for-python)
- [Peasy Developer Tools](#peasy-developer-tools)
- [License](#license)

## Install

```bash
npm install peasy-compress
```

## Quick Start

```typescript
import {
  zipCreate,
  zipExtract,
  gzipCompress,
  gzipDecompress,
  brotliCompress,
} from "peasy-compress";

// Create a ZIP archive from files
const zip = zipCreate({
  "readme.txt": Buffer.from("Hello, world!"),
  "data.json": Buffer.from('{"version": 1}'),
});

// Extract all files from a ZIP
const files = zipExtract(zip);
console.log(files["readme.txt"]?.toString()); // "Hello, world!"

// Gzip compress and decompress
const compressed = gzipCompress(Buffer.from("Repetitive data ".repeat(100)));
const original = gzipDecompress(compressed);

// Brotli compression (great for web content)
const brotlied = brotliCompress(Buffer.from("<html>...</html>"), 9);
```

## What You Can Do

### ZIP Archives

ZIP is the most widely used archive format, combining multiple files into a single container with per-file compression. The ZIP format (PKZIP, 1989) supports file metadata, directory structures, and random access to individual entries without decompressing the entire archive.

| Operation | Function | Description |
|-----------|----------|-------------|
| Create | `zipCreate()` | Build a ZIP from a name-to-Buffer mapping |
| Extract | `zipExtract()` | Extract all files from a ZIP to a Record |
| List | `zipList()` | Inspect archive contents, sizes, and counts |
| Add | `zipAdd()` | Append files to an existing ZIP archive |

```typescript
import { zipCreate, zipExtract, zipList, zipAdd } from "peasy-compress";

// Create a ZIP archive with multiple files
const archive = zipCreate({
  "src/index.ts": Buffer.from('export const version = "1.0";'),
  "package.json": Buffer.from('{"name": "my-lib"}'),
  "LICENSE": Buffer.from("MIT License..."),
});

// Inspect archive contents without extracting
const info = zipList(archive);
console.log(info.fileCount);     // 3
console.log(info.totalSize);     // total uncompressed bytes
console.log(info.entries[0]);    // { name, size, compressedSize, isDir }

// Add more files to an existing archive
const updated = zipAdd(archive, {
  "README.md": Buffer.from("# My Library"),
});

// Extract everything
const files = zipExtract(updated);
Object.keys(files); // ["src/index.ts", "package.json", "LICENSE", "README.md"]
```

Learn more: [Peasy Tools](https://peasytools.com) · [Glossary](https://peasytools.com/glossary/)

### Gzip Compression

Gzip (RFC 1952) is the standard compression format for HTTP content encoding and Unix file compression. It wraps DEFLATE with a header containing metadata like timestamps and checksums. Virtually all web servers and browsers support gzip natively.

```typescript
import { gzipCompress, gzipDecompress } from "peasy-compress";

// Compress text content for storage or transfer
const html = Buffer.from("<html>".repeat(1000));
const compressed = gzipCompress(html);
console.log(compressed.length); // much smaller than original

// Verify gzip magic bytes (0x1f 0x8b)
console.log(compressed[0] === 0x1f); // true

// Decompress back to original
const original = gzipDecompress(compressed);
console.log(original.toString().startsWith("<html>")); // true

// Control compression level (1=fastest, 9=best compression)
const fast = gzipCompress(html, 1);
const best = gzipCompress(html, 9);
```

Learn more: [Peasy Tools](https://peasytools.com) · [Glossary](https://peasytools.com/glossary/)

### Brotli Compression

Brotli (RFC 7932) is a modern compression algorithm developed by Google, achieving 15-25% better compression ratios than gzip for web content. All modern browsers support Brotli via the `Content-Encoding: br` header. It uses a pre-defined dictionary of common web patterns for superior text compression.

```typescript
import { brotliCompress, brotliDecompress } from "peasy-compress";

// Compress web content with Brotli for best ratios
const css = Buffer.from("body { margin: 0; padding: 0; } ".repeat(500));
const compressed = brotliCompress(css, 9);

// Brotli typically outperforms gzip on text content
console.log(`${css.length} -> ${compressed.length} bytes`);

// Decompress
const original = brotliDecompress(compressed);
console.log(original.equals(css)); // true

// Fast compression for real-time use cases
const quick = brotliCompress(css, 1);
```

Learn more: [Peasy Tools](https://peasytools.com) · [Glossary](https://peasytools.com/glossary/)

### Deflate Compression

DEFLATE (RFC 1951) is the foundational compression algorithm used inside both gzip and ZIP. The raw deflate functions are useful when you need the core LZ77+Huffman compression without any framing format -- for example, inside custom binary protocols or when implementing your own container format.

```typescript
import { deflateCompress, deflateDecompress } from "peasy-compress";

// Raw DEFLATE compression (no gzip/zlib headers)
const data = Buffer.from("DEFLATE is the foundation of gzip and ZIP");
const compressed = deflateCompress(data);
const original = deflateDecompress(compressed);
console.log(original.toString()); // "DEFLATE is the foundation of gzip and ZIP"

// Compression levels work the same way
const fast = deflateCompress(data, 1);
const best = deflateCompress(data, 9);
```

Learn more: [Peasy Tools](https://peasytools.com) · [Glossary](https://peasytools.com/glossary/)

## TypeScript Types

```typescript
import type {
  ArchiveEntry,
  ArchiveInfo,
  CompressionLevel,
} from "peasy-compress";

// ArchiveEntry — metadata for a single file in an archive
const entry: ArchiveEntry = {
  name: "hello.txt",
  size: 13,
  compressedSize: 11,
  isDir: false,
};

// ArchiveInfo — summary of an archive's contents
const info: ArchiveInfo = {
  format: "zip",
  entries: [entry],
  totalSize: 13,
  totalCompressed: 11,
  fileCount: 1,
  dirCount: 0,
};

// CompressionLevel — 1 (fastest) to 9 (best compression)
const level: CompressionLevel = 6;
```

## API Reference

| Function | Description |
|----------|-------------|
| `zipCreate(files)` | Create ZIP archive from `Record<string, Buffer>` |
| `zipExtract(source)` | Extract all files from ZIP to `Record<string, Buffer>` |
| `zipList(source)` | List ZIP contents with metadata (`ArchiveInfo`) |
| `zipAdd(source, files)` | Add files to existing ZIP archive |
| `gzipCompress(data, level?)` | Gzip compress a Buffer |
| `gzipDecompress(data)` | Gzip decompress a Buffer |
| `deflateCompress(data, level?)` | DEFLATE compress a Buffer |
| `deflateDecompress(data)` | DEFLATE decompress (inflate) a Buffer |
| `brotliCompress(data, level?)` | Brotli compress a Buffer |
| `brotliDecompress(data)` | Brotli decompress a Buffer |

## Also Available for Python

```bash
pip install peasy-compress
```

The Python package provides ZIP, tar, and gzip operations with CLI, MCP server, and REST API client. See [peasy-compress on PyPI](https://pypi.org/project/peasy-compress/).

## Peasy Developer Tools

| Package | PyPI | npm | Description |
|---------|------|-----|-------------|
| peasytext | [PyPI](https://pypi.org/project/peasytext/) | [npm](https://www.npmjs.com/package/peasytext) | Text analysis -- readability, sentiment, keywords |
| peasy-pdf | [PyPI](https://pypi.org/project/peasy-pdf/) | -- | PDF processing -- extract, merge, split, metadata |
| peasy-image | [PyPI](https://pypi.org/project/peasy-image/) | -- | Image ops -- resize, crop, filter, watermark |
| peasy-css | [PyPI](https://pypi.org/project/peasy-css/) | [npm](https://www.npmjs.com/package/peasy-css) | CSS generation -- gradients, shadows, flexbox, grid |
| **peasy-compress** | [PyPI](https://pypi.org/project/peasy-compress/) | **[npm](https://www.npmjs.com/package/peasy-compress)** | **Archive & compression -- ZIP, gzip, brotli, deflate** |

Part of the [Peasy](https://peasytools.com) developer tools ecosystem.

## License

MIT
