/**
 * peasy-compress — Archive & compression types.
 *
 * @packageDocumentation
 */

/** Metadata for a single entry inside an archive. */
export interface ArchiveEntry {
  /** File or directory name (relative path within the archive). */
  name: string;
  /** Uncompressed size in bytes. */
  size: number;
  /** Compressed size in bytes. */
  compressedSize: number;
  /** Whether this entry is a directory. */
  isDir: boolean;
}

/** Summary information about an archive. */
export interface ArchiveInfo {
  /** Archive format identifier (e.g. "zip"). */
  format: string;
  /** List of all entries in the archive. */
  entries: ArchiveEntry[];
  /** Total uncompressed size in bytes. */
  totalSize: number;
  /** Total compressed size in bytes. */
  totalCompressed: number;
  /** Number of file entries. */
  fileCount: number;
  /** Number of directory entries. */
  dirCount: number;
}

/** Compression level from 1 (fastest) to 9 (best compression). */
export type CompressionLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
