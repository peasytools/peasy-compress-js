Output demo.gif

Set Shell zsh
Set Width 900
Set Height 550
Set FontSize 14
Set Padding 15
Set TypingSpeed 40ms

Type `node`
Enter
Sleep 1s

Type `const { gzipCompress, gzipDecompress, brotliCompress } = await import('./dist/index.js')`
Enter
Sleep 1s

Type `// Gzip roundtrip — compress and decompress`
Enter
Sleep 300ms
Type `const data = Buffer.from('Hello World! '.repeat(100))`
Enter
Sleep 500ms
Type `const compressed = gzipCompress(data)`
Enter
Sleep 500ms
Type `data.length + ' bytes -> ' + compressed.length + ' bytes'`
Enter
Sleep 1.5s

Type `// Verify roundtrip`
Enter
Sleep 300ms
Type `gzipDecompress(compressed).toString() === data.toString()`
Enter
Sleep 1.5s

Type `// Brotli — better compression ratio`
Enter
Sleep 300ms
Type `const br = brotliCompress(data)`
Enter
Sleep 500ms
Type `'Brotli: ' + data.length + ' -> ' + br.length + ' bytes'`
Enter
Sleep 2s

Type `.exit`
Enter
Sleep 500ms
