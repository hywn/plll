# plll
create uncompressed/unfiltered RGBA PNGs in javascript

## description
`plll.js` exports a single function `png_argb :: (width: int, height: int) => (data: [int]) => png: Uint8Array` where
- `width` is image pixel width
- `height` is image pixel height
- `data` is packed RGBA values
- `png` is png data you can write to a file

## examples
see `./examples.js`

## notes
- all in vanilla JS (though examples use `Deno.writeFile` to write to file)
- not particularly useful due to lack of filtering+compression

## future
- I want to make deflate library
- then I can filter+compress
- maybe compile to WASM

## stuff I referenced to make plll
- http://www.libpng.org/pub/png/book/chapter08.html
- http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
- https://deno.land/x/dpng/lib/Image.ts