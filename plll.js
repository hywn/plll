/*******************************/
/** encoding stuff into bytes **/
/*******************************/
const as_unicode =
	str => str.split('').map(c => c.charCodeAt(0) & 0xff)

const as_unsigned_BE =
	size => (...ints) =>
		ints.flatMap(int => new Array(size).fill()
			.map((_, i) => (int >> 8 * i) & 0xff).reverse())

const as_u4 = as_unsigned_BE(4)
const as_u2 = as_unsigned_BE(2)
const as_u1 = as_unsigned_BE(1)

/***************/
/** checksums **/
/***************/
const crc32_lookup = new Uint32Array(256).map((_, crc) => {
	for (let i = 0; i < 8; ++i)
		crc = crc & 1
			? (crc >> 1) & 0x7fffffff ^ 0xedb88320
			: (crc >> 1) & 0x7fffffff
	return crc
})
const crc32 =
	bytes => as_u4(~bytes.reduce(
		(crc, byte) => (crc >> 8) & 0x00ffffff ^ crc32_lookup[(crc ^ byte) & 0xff]
	, 0xffffffff))

const adler32 =
	data => {
		let a = 1
		let b = 0
		for (const byte of data) {
			a += byte
			b += a
		}
		a %= 0xFFF1
		b %= 0xFFF1

		return as_u4((b << 16) + a)
	}

/**********************/
/** zlib compression **/
/**********************/
const to_2byte_terms =
	number => {
		const terms = []
		while ((number -= 0xffff) > 0)
			terms.push(0xffff)
		terms.push(number + 0xffff)
		return terms
	}

// need to break up data into max 0xffff-length blocks
// because len/nlen are max 2 bytes (RFC 1951 3.2.4)
const as_zlib_uncompressed_blocks =
	data => {
		const terms = to_2byte_terms(data.length)

		return terms.flatMap((len, i) => [
			i === terms.length - 1 ? 1 : 0,
			...as_u2(len).reverse(),
			...as_u2(~len).reverse(),
			...data.slice(i * 0xffff, i * 0xffff + len)
		])
	}

const as_zlib_uncompressed_stream =
	data => new Uint8Array([
		0x78, 0xda,
		...as_zlib_uncompressed_blocks(data)
	])

/***********************/
/** actual PNG layout **/
/***********************/
const signature = as_unicode('\x89PNG\r\n\x1a\n')

const chunk =
	(name, data=[]) =>
		new Uint8Array([
			...as_u4(data.length),
			...as_unicode(name),
			...data,
			...crc32([...as_unicode(name), ...data])
		])

const ihdr =
	(width, height, bit_depth, t_color, m_compression=0, m_filter=0, m_interlace=0) =>
		chunk('IHDR', [
			...as_u4(width, height),
			...as_u1(bit_depth, t_color, m_compression, m_filter, m_interlace)
		])

const idat =
	data =>
		chunk('IDAT', as_zlib_uncompressed_stream(data))

const iend = chunk('IEND')

const png_argb =
	(width_pix, height_pix, bit_depth=8) => data => {

		// in terms of bytes
		const width  = 4 * width_pix
		const height = height_pix

		if (data.length !== width * height)
			throw 'data does not have expected length!'

		// add 'filter byte' in front of each scanline?
		const scanned = new Uint8Array((width + 1) * height)
		data.forEach((byte, i) =>
			scanned[Math.floor(i / width) * (width + 1) + (i % width + 1)] = byte)

		return new Uint8Array([
			...signature,
			...ihdr(width_pix, height_pix, bit_depth, 6),
			...idat(scanned),
			...iend
		])
	}

export { png_argb }