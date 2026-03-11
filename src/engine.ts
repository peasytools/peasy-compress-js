/**
 * peasy-compress — Archive & compression engine.
 *
 * ZIP operations use adm-zip. Gzip, deflate, and brotli use Node.js
 * built-in zlib module for zero-config compression.
 *
 * @packageDocumentation
 */

import {
  gzipSync,
  gunzipSync,
  deflateSync,
  inflateSync,
  brotliCompressSync,
  brotliDecompressSync,
  constants,
} from "node:zlib";
import AdmZip from "adm-zip";
import type { ArchiveEntry, ArchiveInfo, CompressionLevel } from "./types.js";

// ---------------------------------------------------------------------------
// ZIP operations
// ---------------------------------------------------------------------------

/**
 * Create a ZIP archive from a name-to-content mapping.
 *
 * @param files - Record where keys are filenames and values are file contents
 * @returns Buffer containing the ZIP archive
 *
 * @example
 * ```typescript
 * const zip = zipCreate({
 *   "hello.txt": Buffer.from("Hello, world!"),
 *   "data.json": Buffer.from('{"key": "value"}'),
 * });
 * ```
 */
export function zipCreate(files: Record<string, Buffer>): Buffer {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, content);
  }
  return zip.toBuffer();
}

/**
 * Extract all files from a ZIP archive.
 *
 * @param source - Buffer containing a ZIP archive
 * @returns Record where keys are filenames and values are file contents
 *
 * @example
 * ```typescript
 * const files = zipExtract(zipBuffer);
 * console.log(files["hello.txt"].toString()); // "Hello, world!"
 * ```
 */
export function zipExtract(source: Buffer): Record<string, Buffer> {
  const zip = new AdmZip(source);
  const result: Record<string, Buffer> = {};
  for (const entry of zip.getEntries()) {
    if (!entry.isDirectory) {
      result[entry.entryName] = entry.getData();
    }
  }
  return result;
}

/**
 * List the contents of a ZIP archive with metadata.
 *
 * @param source - Buffer containing a ZIP archive
 * @returns Archive information including entries, sizes, and counts
 *
 * @example
 * ```typescript
 * const info = zipList(zipBuffer);
 * console.log(info.fileCount); // 2
 * console.log(info.totalSize); // 42
 * ```
 */
export function zipList(source: Buffer): ArchiveInfo {
  const zip = new AdmZip(source);
  const entries: ArchiveEntry[] = [];
  let totalSize = 0;
  let totalCompressed = 0;
  let fileCount = 0;
  let dirCount = 0;

  for (const entry of zip.getEntries()) {
    const archiveEntry: ArchiveEntry = {
      name: entry.entryName,
      size: entry.header.size,
      compressedSize: entry.header.compressedSize,
      isDir: entry.isDirectory,
    };
    entries.push(archiveEntry);

    if (entry.isDirectory) {
      dirCount++;
    } else {
      fileCount++;
      totalSize += entry.header.size;
      totalCompressed += entry.header.compressedSize;
    }
  }

  return {
    format: "zip",
    entries,
    totalSize,
    totalCompressed,
    fileCount,
    dirCount,
  };
}

/**
 * Add files to an existing ZIP archive.
 *
 * @param source - Buffer containing an existing ZIP archive
 * @param files - Record of files to add (name to content mapping)
 * @returns New Buffer containing the updated ZIP archive
 *
 * @example
 * ```typescript
 * const updated = zipAdd(existingZip, {
 *   "new-file.txt": Buffer.from("New content"),
 * });
 * ```
 */
export function zipAdd(
  source: Buffer,
  files: Record<string, Buffer>,
): Buffer {
  const zip = new AdmZip(source);
  for (const [name, content] of Object.entries(files)) {
    zip.addFile(name, content);
  }
  return zip.toBuffer();
}

// ---------------------------------------------------------------------------
// Gzip compression (RFC 1952)
// ---------------------------------------------------------------------------

/**
 * Compress data using gzip.
 *
 * @param data - Buffer to compress
 * @param level - Compression level 1-9 (default: 6)
 * @returns Gzip-compressed Buffer
 *
 * @example
 * ```typescript
 * const compressed = gzipCompress(Buffer.from("Hello, world!"));
 * ```
 */
export function gzipCompress(
  data: Buffer,
  level?: CompressionLevel,
): Buffer {
  return gzipSync(data, { level: level ?? constants.Z_DEFAULT_COMPRESSION });
}

/**
 * Decompress gzip data.
 *
 * @param data - Gzip-compressed Buffer
 * @returns Decompressed Buffer
 *
 * @example
 * ```typescript
 * const original = gzipDecompress(compressed);
 * console.log(original.toString()); // "Hello, world!"
 * ```
 */
export function gzipDecompress(data: Buffer): Buffer {
  return gunzipSync(data);
}

// ---------------------------------------------------------------------------
// Deflate compression (RFC 1951)
// ---------------------------------------------------------------------------

/**
 * Compress data using deflate (raw DEFLATE without gzip/zlib headers).
 *
 * @param data - Buffer to compress
 * @param level - Compression level 1-9 (default: 6)
 * @returns Deflated Buffer
 *
 * @example
 * ```typescript
 * const compressed = deflateCompress(Buffer.from("Hello, world!"));
 * ```
 */
export function deflateCompress(
  data: Buffer,
  level?: CompressionLevel,
): Buffer {
  return deflateSync(data, { level: level ?? constants.Z_DEFAULT_COMPRESSION });
}

/**
 * Decompress deflate data.
 *
 * @param data - Deflated Buffer
 * @returns Decompressed Buffer
 *
 * @example
 * ```typescript
 * const original = deflateDecompress(compressed);
 * console.log(original.toString()); // "Hello, world!"
 * ```
 */
export function deflateDecompress(data: Buffer): Buffer {
  return inflateSync(data);
}

// ---------------------------------------------------------------------------
// Brotli compression (RFC 7932)
// ---------------------------------------------------------------------------

/**
 * Compress data using Brotli.
 *
 * @param data - Buffer to compress
 * @param level - Compression level 1-9 (maps to Brotli quality 1-11, default: 6)
 * @returns Brotli-compressed Buffer
 *
 * @example
 * ```typescript
 * const compressed = brotliCompress(Buffer.from("Hello, world!"));
 * ```
 */
export function brotliCompress(
  data: Buffer,
  level?: CompressionLevel,
): Buffer {
  const params: Record<number, number> = {};
  if (level !== undefined) {
    // Map 1-9 to Brotli quality 1-11 (linear scale)
    const quality = Math.round(1 + ((level - 1) / 8) * 10);
    params[constants.BROTLI_PARAM_QUALITY] = quality;
  }
  return brotliCompressSync(data, { params });
}

/**
 * Decompress Brotli data.
 *
 * @param data - Brotli-compressed Buffer
 * @returns Decompressed Buffer
 *
 * @example
 * ```typescript
 * const original = brotliDecompress(compressed);
 * console.log(original.toString()); // "Hello, world!"
 * ```
 */
export function brotliDecompress(data: Buffer): Buffer {
  return brotliDecompressSync(data);
}
