import { describe, it, expect } from "vitest";
import {
  zipCreate,
  zipExtract,
  zipList,
  zipAdd,
  gzipCompress,
  gzipDecompress,
  deflateCompress,
  deflateDecompress,
  brotliCompress,
  brotliDecompress,
} from "../src/engine.js";
import type { ArchiveInfo } from "../src/types.js";

// ---------------------------------------------------------------------------
// ZIP operations
// ---------------------------------------------------------------------------

describe("zipCreate", () => {
  it("creates a valid ZIP buffer from files", () => {
    const zip = zipCreate({
      "hello.txt": Buffer.from("Hello, world!"),
    });
    expect(Buffer.isBuffer(zip)).toBe(true);
    // ZIP magic number: PK\x03\x04
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
  });

  it("creates a ZIP with multiple files", () => {
    const zip = zipCreate({
      "a.txt": Buffer.from("aaa"),
      "b.txt": Buffer.from("bbb"),
      "c.txt": Buffer.from("ccc"),
    });
    const info = zipList(zip);
    expect(info.fileCount).toBe(3);
  });

  it("handles empty files mapping", () => {
    const zip = zipCreate({});
    const info = zipList(zip);
    expect(info.fileCount).toBe(0);
    expect(info.dirCount).toBe(0);
  });

  it("handles binary content", () => {
    const binary = Buffer.from([0x00, 0xff, 0x80, 0x7f, 0x01, 0xfe]);
    const zip = zipCreate({ "binary.bin": binary });
    const extracted = zipExtract(zip);
    expect(extracted["binary.bin"]).toEqual(binary);
  });
});

describe("zipExtract", () => {
  it("roundtrips text files through create/extract", () => {
    const original = {
      "readme.txt": Buffer.from("Read me"),
      "data.json": Buffer.from('{"key": "value"}'),
    };
    const zip = zipCreate(original);
    const extracted = zipExtract(zip);

    expect(extracted["readme.txt"]?.toString()).toBe("Read me");
    expect(extracted["data.json"]?.toString()).toBe('{"key": "value"}');
  });

  it("extracts files but not directories", () => {
    const zip = zipCreate({
      "file.txt": Buffer.from("content"),
    });
    const extracted = zipExtract(zip);
    // Should only have file entries, no directory entries
    expect(Object.keys(extracted)).toEqual(["file.txt"]);
  });

  it("preserves exact binary content through roundtrip", () => {
    const data = Buffer.alloc(256);
    for (let i = 0; i < 256; i++) {
      data[i] = i;
    }
    const zip = zipCreate({ "bytes.bin": data });
    const extracted = zipExtract(zip);
    expect(extracted["bytes.bin"]).toEqual(data);
  });
});

describe("zipList", () => {
  it("returns correct file count and sizes", () => {
    const content = Buffer.from("Hello, world!");
    const zip = zipCreate({ "hello.txt": content });
    const info: ArchiveInfo = zipList(zip);

    expect(info.format).toBe("zip");
    expect(info.fileCount).toBe(1);
    expect(info.dirCount).toBe(0);
    expect(info.totalSize).toBe(content.length);
    expect(info.entries).toHaveLength(1);
    expect(info.entries[0]!.name).toBe("hello.txt");
    expect(info.entries[0]!.size).toBe(content.length);
    expect(info.entries[0]!.isDir).toBe(false);
  });

  it("reports correct counts for multiple files", () => {
    const zip = zipCreate({
      "a.txt": Buffer.from("aaa"),
      "b.txt": Buffer.from("bbbbbb"),
    });
    const info = zipList(zip);

    expect(info.fileCount).toBe(2);
    expect(info.totalSize).toBe(9); // 3 + 6
  });

  it("returns zero totals for empty archive", () => {
    const zip = zipCreate({});
    const info = zipList(zip);

    expect(info.fileCount).toBe(0);
    expect(info.dirCount).toBe(0);
    expect(info.totalSize).toBe(0);
    expect(info.totalCompressed).toBe(0);
    expect(info.entries).toHaveLength(0);
  });
});

describe("zipAdd", () => {
  it("adds files to an existing archive", () => {
    const original = zipCreate({ "a.txt": Buffer.from("aaa") });
    const updated = zipAdd(original, { "b.txt": Buffer.from("bbb") });
    const extracted = zipExtract(updated);

    expect(Object.keys(extracted).sort()).toEqual(["a.txt", "b.txt"]);
    expect(extracted["a.txt"]?.toString()).toBe("aaa");
    expect(extracted["b.txt"]?.toString()).toBe("bbb");
  });

  it("adds multiple files at once", () => {
    const original = zipCreate({ "first.txt": Buffer.from("1") });
    const updated = zipAdd(original, {
      "second.txt": Buffer.from("2"),
      "third.txt": Buffer.from("3"),
    });
    const info = zipList(updated);
    expect(info.fileCount).toBe(3);
  });

  it("preserves original files when adding new ones", () => {
    const content = Buffer.from("original content that should be preserved");
    const original = zipCreate({ "keep.txt": content });
    const updated = zipAdd(original, { "new.txt": Buffer.from("new") });
    const extracted = zipExtract(updated);
    expect(extracted["keep.txt"]).toEqual(content);
  });
});

// ---------------------------------------------------------------------------
// Gzip compression
// ---------------------------------------------------------------------------

describe("gzipCompress / gzipDecompress", () => {
  it("roundtrips text data", () => {
    const original = Buffer.from("Hello, world! This is a test of gzip compression.");
    const compressed = gzipCompress(original);
    const decompressed = gzipDecompress(compressed);
    expect(decompressed).toEqual(original);
  });

  it("produces valid gzip output (magic number 1f 8b)", () => {
    const compressed = gzipCompress(Buffer.from("test"));
    expect(compressed[0]).toBe(0x1f);
    expect(compressed[1]).toBe(0x8b);
  });

  it("compresses with different levels", () => {
    const data = Buffer.from("a".repeat(10000));
    const fast = gzipCompress(data, 1);
    const best = gzipCompress(data, 9);

    // Both should roundtrip correctly
    expect(gzipDecompress(fast)).toEqual(data);
    expect(gzipDecompress(best)).toEqual(data);

    // Best compression should produce smaller (or equal) output
    expect(best.length).toBeLessThanOrEqual(fast.length);
  });

  it("handles empty buffer", () => {
    const empty = Buffer.alloc(0);
    const compressed = gzipCompress(empty);
    const decompressed = gzipDecompress(compressed);
    expect(decompressed).toEqual(empty);
  });

  it("compresses large data", () => {
    const large = Buffer.alloc(100_000, "x");
    const compressed = gzipCompress(large);
    const decompressed = gzipDecompress(compressed);
    expect(decompressed).toEqual(large);
    // Repetitive data should compress well
    expect(compressed.length).toBeLessThan(large.length);
  });

  it("handles binary data with all byte values", () => {
    const data = Buffer.alloc(256);
    for (let i = 0; i < 256; i++) {
      data[i] = i;
    }
    const compressed = gzipCompress(data);
    const decompressed = gzipDecompress(compressed);
    expect(decompressed).toEqual(data);
  });
});

// ---------------------------------------------------------------------------
// Deflate compression
// ---------------------------------------------------------------------------

describe("deflateCompress / deflateDecompress", () => {
  it("roundtrips text data", () => {
    const original = Buffer.from("Deflate compression test data");
    const compressed = deflateCompress(original);
    const decompressed = deflateDecompress(compressed);
    expect(decompressed).toEqual(original);
  });

  it("compresses with different levels", () => {
    const data = Buffer.from("b".repeat(5000));
    const fast = deflateCompress(data, 1);
    const best = deflateCompress(data, 9);

    expect(deflateDecompress(fast)).toEqual(data);
    expect(deflateDecompress(best)).toEqual(data);
    expect(best.length).toBeLessThanOrEqual(fast.length);
  });

  it("handles empty buffer", () => {
    const empty = Buffer.alloc(0);
    const compressed = deflateCompress(empty);
    const decompressed = deflateDecompress(compressed);
    expect(decompressed).toEqual(empty);
  });

  it("produces smaller output than input for compressible data", () => {
    const data = Buffer.from("repeated text ".repeat(500));
    const compressed = deflateCompress(data);
    expect(compressed.length).toBeLessThan(data.length);
  });
});

// ---------------------------------------------------------------------------
// Brotli compression
// ---------------------------------------------------------------------------

describe("brotliCompress / brotliDecompress", () => {
  it("roundtrips text data", () => {
    const original = Buffer.from("Brotli compression is great for web content!");
    const compressed = brotliCompress(original);
    const decompressed = brotliDecompress(compressed);
    expect(decompressed).toEqual(original);
  });

  it("compresses with different levels", () => {
    const data = Buffer.from("c".repeat(5000));
    const fast = brotliCompress(data, 1);
    const best = brotliCompress(data, 9);

    expect(brotliDecompress(fast)).toEqual(data);
    expect(brotliDecompress(best)).toEqual(data);
    expect(best.length).toBeLessThanOrEqual(fast.length);
  });

  it("handles empty buffer", () => {
    const empty = Buffer.alloc(0);
    const compressed = brotliCompress(empty);
    const decompressed = brotliDecompress(compressed);
    expect(decompressed).toEqual(empty);
  });

  it("handles large data", () => {
    const large = Buffer.alloc(50_000, "z");
    const compressed = brotliCompress(large);
    const decompressed = brotliDecompress(compressed);
    expect(decompressed).toEqual(large);
    expect(compressed.length).toBeLessThan(large.length);
  });

  it("handles binary data", () => {
    const data = Buffer.alloc(1024);
    for (let i = 0; i < 1024; i++) {
      data[i] = i % 256;
    }
    const compressed = brotliCompress(data);
    const decompressed = brotliDecompress(compressed);
    expect(decompressed).toEqual(data);
  });
});

// ---------------------------------------------------------------------------
// Cross-format verification
// ---------------------------------------------------------------------------

describe("cross-format verification", () => {
  it("all compression formats reduce size of compressible data", () => {
    const data = Buffer.from("The quick brown fox jumps over the lazy dog. ".repeat(100));

    const gzipped = gzipCompress(data);
    const deflated = deflateCompress(data);
    const brotlied = brotliCompress(data);

    expect(gzipped.length).toBeLessThan(data.length);
    expect(deflated.length).toBeLessThan(data.length);
    expect(brotlied.length).toBeLessThan(data.length);
  });

  it("compressed data from different formats are not interchangeable", () => {
    const data = Buffer.from("test data");
    const gzipped = gzipCompress(data);

    // Gzip data should not be decompressible as deflate or brotli
    expect(() => brotliDecompress(gzipped)).toThrow();
  });

  it("all formats handle unicode text correctly", () => {
    const unicode = Buffer.from("Hello \u{1F600} World \u{1F30D} \u{2764}\u{FE0F} \u4F60\u597D");

    expect(gzipDecompress(gzipCompress(unicode))).toEqual(unicode);
    expect(deflateDecompress(deflateCompress(unicode))).toEqual(unicode);
    expect(brotliDecompress(brotliCompress(unicode))).toEqual(unicode);
  });

  it("ZIP roundtrip preserves multiple files with mixed content", () => {
    const files = {
      "text.txt": Buffer.from("Plain text content"),
      "unicode.txt": Buffer.from("\u4F60\u597D\u4E16\u754C \u{1F600}"),
      "binary.bin": Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]),
      "empty.txt": Buffer.alloc(0),
    };
    const zip = zipCreate(files);
    const extracted = zipExtract(zip);

    expect(extracted["text.txt"]).toEqual(files["text.txt"]);
    expect(extracted["unicode.txt"]).toEqual(files["unicode.txt"]);
    expect(extracted["binary.bin"]).toEqual(files["binary.bin"]);
    expect(extracted["empty.txt"]).toEqual(files["empty.txt"]);
  });
});
