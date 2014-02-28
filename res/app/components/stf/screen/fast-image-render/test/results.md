# Benchmark results (internal data)

-----

### Versions
- Canary 35
- Safari 7
- Firefox 27


### Time to load and draw 5000 frames

Hardware | Browser | Render | Time | ms
-------- | ------- | ------ | ---- | --
iMac | Canary | pixi-canvas | 54s | 
iMac | Canary | pixi-webgl | 58s | 
iMac | Canary | canvas | 54s | 5.8ms
iMac | Firefox | pixi-canvas | 75s | 8.3ms
iMac | Firefox | pixi-webgl | 82s | 11.3ms
iMac | Firefox | canvas | 76s | 8.1ms
MacBook | Canary | pixi-canvas | 68s
MacBook | Canary | pixi-webgl | 83s
MacBook | Canary | canvas | 76s


### Time to just draw 5000 frames

Hardware | Browser | Format | Render | Time | ms
-------- | ------- | ------ | ------ | ---- | --
iMac | Canary | DDS DXT1 | webgl | 55s | 


### Time to render 1 frame
Hardware | Browser | Format | Size | Function | ms
-------- | ------- | ------ | ---- | -------- | --
iMac | Canary | DDS DXT1 | 2.1MB | load | 20-100ms
iMac | Canary | DDS DXT1 | 2.1MB | draw | **0.04ms**
iMac | Canary | DDS GZIP | 271KB | load | 
iMac | Canary | DDS GZIP | 271KB | draw | 
iMac | Canary | WEBP     |  70KB | load | 9ms
iMac | Canary | WEBP     |  70KB | draw | 24ms
iMac | Canary | DDS CRN  | 70KB  | load | 30ms
iMac | Canary | DDS CRN  | 70KB  | draw | **0.04ms**
iMac | Canary | JPEG     | 94KB  | load | 25ms
iMac | Canary | JPEG     | 94KB  | draw | 6ms
iMac | Canary | PNG      | 590KB | load | 6ms
iMac | Canary | PNG      | 590KB | draw | 30ms


# About ST3C DXT1 DDS CRN

### ST3C (S3 Texture Compression) 
Group of related lossy texture compression algorithms, supported by most GPUs in Mac/PCs 

### DXT1 (Block Compression 1)
Smallest ST3C algorithm, 1-bit Alpha, compression ratio 6:1

### DDS (DirectDraw Surface)
Container file format for storing ST3C textures

### CRN (DXTn Real-time Transcoding)
Container file format for transcoding crunched ST3C textures



# DDS vs JPEG

- Drawing a DXT1 texture is over 100 times faster than JPEG
- The DXT1 texture is transferred directly to the GPU, unlike JPEG
- The DXT1 uses 6 times less GPU memory
- File size is big, but when gzipped it's smaller than PNG

# CRN vs JPEG
- It transcodes to DXT1 so has all DXT1 benefits
- File size is very small, even smaller than JPEG (!)
- Requires to transcode on client side, so there is a CPU penalty
- However transcoding CRN->DXT1 is faster than decoding and tranfering JPEG->GPU
- JPEG->GPU texture uploading blocks the main thread and is slow
- Transcoding a CRN can be done async, and even offloaded to a WebWorker
- Currently the Crunch library is compiled to JS with Emscripten, so enabling asm.js would make the transcoding even faster
- Compressing CRN vs libjpeg-turbo benchmarks still need to be done

# Links


ECT1 texture format works on all Android devices
http://developer.android.com/tools/help/etc1tool.html

WebGL also
http://blog.tojicode.com/2011/12/compressed-textures-in-webgl.html

Crunch
https://code.google.com/p/crunch/

Fast compression
http://www.fastcompression.com/

DXT1 crunch WebGL
http://www-cs-students.stanford.edu/~eparker/files/crunch/decode_test.html

WebGL Texture Utils
https://github.com/gunta/webgl-texture-utils#webgl-texture-utils

