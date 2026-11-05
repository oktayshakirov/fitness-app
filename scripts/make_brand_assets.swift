// Draws the app icon, Android adaptive layers and splash mark into assets/brand.
// Run from the repo root: swift scripts/make_brand_assets.swift
// Colors are the design tokens in src/theme.ts (bg #0B0B0C, accent #C8FA3C).
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let bg = CGColor(srgbRed: 0x0B / 255, green: 0x0B / 255, blue: 0x0C / 255, alpha: 1)
let lime = CGColor(srgbRed: 0xC8 / 255, green: 0xFA / 255, blue: 0x3C / 255, alpha: 1)
let white = CGColor(srgbRed: 1, green: 1, blue: 1, alpha: 1)

/// A dumbbell on the diagonal, centred, in a 1024 design space; `scale` shrinks it.
func drawMark(_ c: CGContext, size: CGFloat, scale: CGFloat, color: CGColor) {
  c.saveGState()
  c.translateBy(x: size / 2, y: size / 2)
  c.scaleBy(x: size / 1024 * scale, y: size / 1024 * scale)
  c.rotate(by: .pi / 4)
  c.setFillColor(color)
  // Centred bar, then (start, width, height, corner) plates mirrored on both sides.
  c.addPath(CGPath(roundedRect: CGRect(x: -372, y: -30, width: 744, height: 60),
    cornerWidth: 30, cornerHeight: 30, transform: nil))
  let plates: [(CGFloat, CGFloat, CGFloat, CGFloat)] = [
    (130, 112, 380, 40),  // inner plate
    (258, 84, 250, 34),  // outer plate
  ]
  for (x, w, h, r) in plates {
    for minX in [x, -x - w] {
      let rect = CGRect(x: minX, y: -h / 2, width: w, height: h)
      c.addPath(CGPath(roundedRect: rect, cornerWidth: r, cornerHeight: r, transform: nil))
    }
  }
  c.fillPath()
  c.restoreGState()
}

func image(size: Int, opaque: Bool, _ draw: (CGContext, CGFloat) -> Void) -> CGImage {
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  let info = opaque ? CGImageAlphaInfo.noneSkipLast : CGImageAlphaInfo.premultipliedLast
  let c = CGContext(
    data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
    space: space, bitmapInfo: info.rawValue)!
  c.interpolationQuality = .high
  draw(c, CGFloat(size))
  return c.makeImage()!
}

func glow(_ c: CGContext, size: CGFloat) {
  let space = CGColorSpace(name: CGColorSpace.sRGB)!
  let colors = [lime.copy(alpha: 0.22)!, lime.copy(alpha: 0)!] as CFArray
  let g = CGGradient(colorsSpace: space, colors: colors, locations: [0, 1])!
  let centre = CGPoint(x: size / 2, y: size / 2)
  c.drawRadialGradient(
    g, startCenter: centre, startRadius: 0, endCenter: centre, endRadius: size * 0.46, options: [])
}

func write(_ img: CGImage, _ path: String) {
  let url = URL(fileURLWithPath: path)
  let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
  CGImageDestinationAddImage(dest, img, nil)
  guard CGImageDestinationFinalize(dest) else { fatalError("could not write \(path)") }
  print("wrote \(path)")
}

let out = "assets/brand"
try FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)

// iOS / store icon: opaque, full bleed (the OS rounds the corners).
write(
  image(size: 1024, opaque: true) { c, s in
    c.setFillColor(bg)
    c.fill(CGRect(x: 0, y: 0, width: s, height: s))
    glow(c, size: s)
    drawMark(c, size: s, scale: 1, color: lime)
  }, "\(out)/icon.png")

// Android adaptive foreground: transparent, inside the 66/108 safe circle.
write(
  image(size: 1024, opaque: false) { c, s in drawMark(c, size: s, scale: 0.8, color: lime) },
  "\(out)/adaptive-foreground.png")

// Android 13 themed icon: single colour, the launcher tints it.
write(
  image(size: 1024, opaque: false) { c, s in drawMark(c, size: s, scale: 0.8, color: white) },
  "\(out)/adaptive-monochrome.png")

// Splash mark: transparent on the bg colour set in app.json.
write(
  image(size: 512, opaque: false) { c, s in drawMark(c, size: s, scale: 1.15, color: lime) },
  "\(out)/splash.png")

// Web favicon.
write(
  image(size: 196, opaque: true) { c, s in
    c.setFillColor(bg)
    c.fill(CGRect(x: 0, y: 0, width: s, height: s))
    drawMark(c, size: s, scale: 1.1, color: lime)
  }, "\(out)/favicon.png")
