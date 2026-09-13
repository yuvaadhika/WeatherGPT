const fs = require('fs');
const zlib = require('zlib');

function unfilterScanline(filterType, scanline, prevScanline, bpp) {
  const line = Buffer.from(scanline);
  for (let i = 0; i < line.length; i++) {
    const a = i >= bpp ? line[i - bpp] : 0;
    const b = prevScanline ? prevScanline[i] : 0;
    const c = prevScanline && i >= bpp ? prevScanline[i - bpp] : 0;

    switch (filterType) {
      case 0: // None
        break;
      case 1: // Sub
        line[i] = (line[i] + a) & 0xff;
        break;
      case 2: // Up
        line[i] = (line[i] + b) & 0xff;
        break;
      case 3: // Average
        line[i] = (line[i] + Math.floor((a + b) / 2)) & 0xff;
        break;
      case 4: // Paeth
        let p = a + b - c;
        let pa = Math.abs(p - a);
        let pb = Math.abs(p - b);
        let pc = Math.abs(p - c);
        let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        line[i] = (line[i] + pr) & 0xff;
        break;
    }
  }
  return line;
}

function processLogo(inputPath, outputPath) {
  const fileBuf = fs.readFileSync(inputPath);
  let offset = 8;
  let ihdr = null;
  let idatChunks = [];

  while (offset < fileBuf.length) {
    const length = fileBuf.readUInt32BE(offset);
    const type = fileBuf.slice(offset + 4, offset + 8).toString('ascii');
    const data = fileBuf.slice(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
      };
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    }
    offset += 12 + length;
  }

  const { width, height } = ihdr;
  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);

  const bpp = 4; // RGBA
  const stride = width * bpp;
  const rawRgba = Buffer.alloc(width * height * 4);

  let inOffset = 0;
  let prevLine = null;

  for (let y = 0; y < height; y++) {
    const filter = decompressed[inOffset];
    const scan = decompressed.slice(inOffset + 1, inOffset + 1 + stride);
    const unfilt = unfilterScanline(filter, scan, prevLine, bpp);
    unfilt.copy(rawRgba, y * stride);
    prevLine = unfilt;
    inOffset += 1 + stride;
  }

  // Circular Mask + Dark Background Transparency
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width / 2 - 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = rawRgba[idx];
      const g = rawRgba[idx + 1];
      const b = rawRgba[idx + 2];
      const a = rawRgba[idx + 3];

      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

      // Outside circular boundary -> Make 100% transparent
      if (dist > radius) {
        rawRgba[idx + 3] = 0;
      } else if (dist > radius - 3) {
        // Feather edge
        const alphaFactor = Math.max(0, (radius - dist) / 3);
        rawRgba[idx + 3] = Math.round(a * alphaFactor);
      } else if (r < 25 && g < 25 && b < 30) {
        // Inside dark background around the logo text
        // Keep smooth transparency for very dark pixels
        const brightness = (r + g + b) / 3;
        if (brightness < 12) {
          rawRgba[idx + 3] = 0;
        } else {
          rawRgba[idx + 3] = Math.min(255, Math.round(((brightness - 12) / 20) * a));
        }
      }
    }
  }

  // Re-encode to PNG
  function createPng(w, h, rgba) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(w, 0);
    ihdrData.writeUInt32BE(h, 4);
    ihdrData[8] = 8; // bit depth
    ihdrData[9] = 6; // color type RGBA
    ihdrData[10] = 0; // compression
    ihdrData[11] = 0; // filter
    ihdrData[12] = 0; // interlace

    function makeChunk(typeStr, chunkData) {
      const len = chunkData.length;
      const buf = Buffer.alloc(12 + len);
      buf.writeUInt32BE(len, 0);
      buf.write(typeStr, 4, 4, 'ascii');
      chunkData.copy(buf, 8);
      // CRC32
      const crc = crc32(buf.slice(4, 8 + len));
      buf.writeUInt32BE(crc >>> 0, 8 + len);
      return buf;
    }

    const rowSize = w * 4;
    const filteredRows = Buffer.alloc(h * (rowSize + 1));
    for (let row = 0; row < h; row++) {
      filteredRows[row * (rowSize + 1)] = 0; // Filter None
      rgba.copy(filteredRows, row * (rowSize + 1) + 1, row * rowSize, (row + 1) * rowSize);
    }

    const compressedData = zlib.deflateSync(filteredRows, { level: 9 });

    const ihdrChunk = makeChunk('IHDR', ihdrData);
    const idatChunk = makeChunk('IDAT', compressedData);
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  }

  // CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const pngOut = createPng(width, height, rawRgba);
  fs.writeFileSync(outputPath, pngOut);
  console.log(`Saved transparent logo to ${outputPath} (${pngOut.length} bytes)`);
}

processLogo('public/wyndra-logo.png', 'public/wyndra-logo.png');
processLogo('public/wyndra-logo.png', 'public/favicon.png');
