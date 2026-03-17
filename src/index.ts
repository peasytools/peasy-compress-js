/**
 * peasy-compress — Archive & compression library for Node.js.
 *
 * 10 functions: ZIP archive create/extract/list/add, plus gzip, deflate,
 * and brotli compress/decompress. Uses Node.js built-in zlib and adm-zip.
 *
 * @packageDocumentation
 */

export type {
  ArchiveEntry,
  ArchiveInfo,
  CompressionLevel,
} from "./types.js";

export {
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
} from "./engine.js";

// API Client
export { PeasyCompress } from "./client.js";
export type {
  ListOptions,
  ListGuidesOptions,
  ListConversionsOptions,
  PaginatedResponse,
  Tool,
  Category,
  Format,
  Conversion,
  GlossaryTerm,
  Guide,
  UseCase,
  Site,
  SearchResult,
} from "./api-types.js";
