#!/usr/bin/env -S deno run --allow-write

import { png_argb } from './plll.js'

// this represents 4 pixels in a flat array
const ex1 = [
	0x55, 0x55, 0x55, 0xff,
	0xaa, 0xaa, 0xaa, 0xff,
	0xee, 0xee, 0xee, 0xff,
	0xff, 0xff, 0xff, 0xff
]

// this represents 255 * 255 pixels in a 3d array
const ex2 = new Array(255)
for (let i = 0; i < 255; ++i) {
	ex2[i] = new Array(255)
	for (let j = 0; j < 255; ++j)
		ex2[i][j] = [255, i, j, 255]
}

// write ex1 to a 1x4 picture
await Deno.writeFile('ex1-1.png', png_argb(1, 4)(ex1))

// write ex1 to 2x2 picture
await Deno.writeFile('ex1-2.png', png_argb(2, 2)(ex1))

// write ex2 to 255x255 picture
// note that it must be flattened twice b/c its a 3d array
await Deno.writeFile('ex2.png', png_argb(255, 255)(ex2.flat(2)))