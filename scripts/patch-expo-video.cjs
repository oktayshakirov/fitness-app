// Android 15 Goldfish AVC decoding inserts black frames during continuous playback.
// Prefer a non-Goldfish decoder when available; physical-device codecs are untouched.
// Upstream context: https://github.com/androidx/media/issues/2059
const fs = require("node:fs");
const path = require("node:path");
const root = path.dirname(require.resolve("expo-video/package.json"));
const target = path.join(root, "android/src/main/java/expo/modules/video/player/VideoPlayer.kt");
const marker = "// Muscle Pal: bypass the flickering Goldfish AVC decoder.";
const source = fs.readFileSync(target, "utf8");
if (source.includes(marker)) process.exit(0);
const anchor = "    .setEnableDecoderFallback(true)";
if (source.split(anchor).length !== 2) {
  throw new Error("expo-video changed: review the Goldfish decoder workaround before building Android.");
}
fs.writeFileSync(target, source.replace(anchor, `${anchor}
    ${marker}
    .setMediaCodecSelector { mimeType, secure, tunneling ->
      val decoders = androidx.media3.exoplayer.mediacodec.MediaCodecSelector.DEFAULT
        .getDecoderInfos(mimeType, secure, tunneling)
      decoders.filterNot { it.name == "c2.goldfish.h264.decoder" }
        .ifEmpty { decoders }
    }`));
console.log("Applied expo-video Goldfish AVC decoder workaround.");
