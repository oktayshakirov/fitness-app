// Builds every shipped brand and muscle image from the source artwork:
//   assets/brand/chest-identity/  -> app icon, Android adaptive layers, splash, favicon, logo
//   assets/ui/muscle-groups/      -> assets/ui/muscles/<muscle>.png, trimmed and small for the UI
// Run from the repo root: swift scripts/make_brand_assets.swift
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let sRGB = CGColorSpace(name: CGColorSpace.sRGB)!

func load(_ path: String) -> CGImage {
  guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil),
    let img = CGImageSourceCreateImageAtIndex(src, 0, nil)
  else { fatalError("could not read \(path)") }
  return img
}

func canvas(_ w: Int, _ h: Int, opaque: Bool = false) -> CGContext {
  let info = opaque ? CGImageAlphaInfo.noneSkipLast : CGImageAlphaInfo.premultipliedLast
  let c = CGContext(
    data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
    space: sRGB, bitmapInfo: info.rawValue)!
  c.interpolationQuality = .high
  return c
}

func write(_ img: CGImage, _ path: String) {
  let dest = CGImageDestinationCreateWithURL(
    URL(fileURLWithPath: path) as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, img, nil)
  guard CGImageDestinationFinalize(dest) else { fatalError("could not write \(path)") }
  print("wrote \(path)")
}

/// Premultiplied RGBA bytes of an image at its own size, top row first.
func pixels(_ img: CGImage) -> [UInt8] {
  let c = canvas(img.width, img.height)
  c.draw(img, in: CGRect(x: 0, y: 0, width: img.width, height: img.height))
  return Array(UnsafeBufferPointer(start: c.data!.assumingMemoryBound(to: UInt8.self), count: img.width * img.height * 4))
}

/// The box around visible pixels; faint generator noise below `threshold` alpha is ignored.
func artBounds(_ img: CGImage, threshold: UInt8 = 40) -> CGRect {
  let p = pixels(img)
  var (x0, y0, x1, y1) = (img.width, img.height, 0, 0)
  for y in 0..<img.height {
    for x in 0..<img.width where p[(y * img.width + x) * 4 + 3] > threshold {
      x0 = min(x0, x); y0 = min(y0, y); x1 = max(x1, x); y1 = max(y1, y)
    }
  }
  return CGRect(x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1)
}

/// Draws the part of `img` inside `box` (top-left origin) scaled by `scale` and centred on a square canvas.
func centred(_ img: CGImage, box: CGRect, scale: CGFloat, in c: CGContext, size: Int) {
  let s = CGFloat(size)
  let cropped = img.cropping(to: box)!
  let w = box.width * scale, h = box.height * scale
  c.draw(cropped, in: CGRect(x: (s - w) / 2, y: (s - h) / 2, width: w, height: h))
}

func resized(_ img: CGImage, to size: Int, opaque: Bool = true) -> CGImage {
  let c = canvas(size, size, opaque: opaque)
  c.draw(img, in: CGRect(x: 0, y: 0, width: size, height: size))
  return c.makeImage()!
}

/// Fits the art to a square with a little padding.
func fitted(_ img: CGImage, size: Int, padding: CGFloat) -> CGImage {
  let box = artBounds(img)
  let scale = CGFloat(size) * (1 - 2 * padding) / max(box.width, box.height)
  let c = canvas(size, size)
  centred(img, box: box, scale: scale, in: c, size: size)
  return c.makeImage()!
}

let identity = "assets/brand/chest-identity"
let gradient = load("\(identity)/logo-gradient.png")
let mark = load("\(identity)/logo-mark.png")
let brand = "assets/brand"

write(resized(gradient, to: 1024), "\(brand)/icon.png")
write(resized(gradient, to: 196), "\(brand)/favicon.png")
write(fitted(mark, size: 512, padding: 0.04), "\(brand)/splash.png")
write(fitted(mark, size: 256, padding: 0.02), "\(brand)/logo.png")

// Android adaptive icon: the launcher can mask down to a circle of 66/108 of the canvas, so the
// farthest visible pixel from the art's centre has to stay inside that circle.
let box = artBounds(mark)
let data = pixels(mark)
var reach: CGFloat = 0
for y in Int(box.minY)...Int(box.maxY - 1) {
  for x in Int(box.minX)...Int(box.maxX - 1) where data[(y * mark.width + x) * 4 + 3] > 40 {
    reach = max(reach, hypot(CGFloat(x) - box.midX, CGFloat(y) - box.midY))
  }
}
let adaptiveSize = 1024
let safeRadius = CGFloat(adaptiveSize) * (66.0 / 108.0) / 2 * 0.96
let foreground = canvas(adaptiveSize, adaptiveSize)
centred(mark, box: box, scale: safeRadius / reach, in: foreground, size: adaptiveSize)
let foregroundImage = foreground.makeImage()!
write(foregroundImage, "\(brand)/adaptive-foreground.png")

// Android themed icon: one colour, tinted by the launcher. The charcoal body drops out so the
// outline and the chest stay readable.
let source = pixels(foregroundImage)
var mono = [UInt8](repeating: 0, count: source.count)
for i in stride(from: 0, to: source.count, by: 4) where source[i + 3] > 0 {
  let a = CGFloat(source[i + 3]) / 255
  let r = CGFloat(source[i]) / 255 / a, g = CGFloat(source[i + 1]) / 255 / a, b = CGFloat(source[i + 2]) / 255 / a
  let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  let t = min(1, max(0, (luma - 0.3) / 0.25))
  let v = UInt8(255 * a * t * t * (3 - 2 * t))
  (mono[i], mono[i + 1], mono[i + 2], mono[i + 3]) = (v, v, v, v)
}
let monoContext = canvas(adaptiveSize, adaptiveSize)
monoContext.data!.copyMemory(from: mono, byteCount: mono.count)
write(monoContext.makeImage()!, "\(brand)/adaptive-monochrome.png")
// Android status-bar icon: white on transparent, as large as the 96 px canvas allows.
write(fitted(monoContext.makeImage()!, size: 96, padding: 0.02), "\(brand)/notification-icon.png")

// Muscle icons: the artwork is 1254 px with wide margins; the UI shows it at 28-64 pt.
let muscles = [
  "chest", "shoulders", "biceps", "triceps", "forearms", "abs", "quadriceps", "hamstrings", "glutes",
  "calves", "lats", "traps", "middle_back", "lower_back", "adductors", "abductors", "neck",
]
let output = "assets/ui/muscles"
try FileManager.default.createDirectory(atPath: output, withIntermediateDirectories: true)
for muscle in muscles {
  write(fitted(load("assets/ui/muscle-groups/\(muscle).png"), size: 256, padding: 0.03), "\(output)/\(muscle).png")
}

// Model pictures: 2:3 full body with the figure filling the height, so male and female line up,
// and the head-and-shoulders portraits, whose own framing is made for a circular crop.
let models = "assets/ui/models"
try FileManager.default.createDirectory(atPath: models, withIntermediateDirectories: true)
for model in ["male", "female"] {
  let body = load("assets/ui/model-placeholders/\(model)-full-body.png")
  let (w, h) = (600, 900)
  let area = artBounds(body)
  let scale = CGFloat(h) * 0.96 / area.height
  let c = canvas(w, h)
  c.draw(
    body.cropping(to: area)!,
    in: CGRect(
      x: (CGFloat(w) - area.width * scale) / 2, y: CGFloat(h) * 0.02,
      width: area.width * scale, height: area.height * scale))
  write(c.makeImage()!, "\(models)/\(model)-body.png")
  write(
    resized(load("assets/ui/model-placeholders/\(model)-profile.png"), to: 256, opaque: false),
    "\(models)/\(model)-profile.png")
}
