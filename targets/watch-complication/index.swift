import SwiftUI
import WidgetKit

// Watch face complications. The watch app saves the iPhone's summary to the App Group
// (targets/watch/index.swift); the timeline works out each hour itself, so recovery keeps
// counting down while the phone is away.
private let lime = Color(red: 0xC8 / 255, green: 0xFA / 255, blue: 0x3C / 255)

struct Entry: TimelineEntry {
  let date: Date
  /// nil before the iPhone app has sent anything, or without Pro.
  let recovery: Recovery?
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> Entry {
    let sample = WidgetData(
      isPro: true, total: 17,
      resting: [RestingMuscle(name: "Chest", readyAt: .infinity), RestingMuscle(name: "Triceps", readyAt: .infinity)],
      streak: 4, lastLogAt: Date().timeIntervalSince1970 * 1000)
    return Entry(date: Date(), recovery: Recovery(sample, at: Date()))
  }

  private func entry(at date: Date, from data: WidgetData?) -> Entry {
    guard let data, data.isPro else { return Entry(date: date, recovery: nil) }
    return Entry(date: date, recovery: Recovery(data, at: date))
  }

  func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) {
    completion(context.isPreview ? placeholder(in: context) : entry(at: Date(), from: loadSavedData()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
    let data = loadSavedData()
    let now = Date()
    let entries = (0..<24).map { entry(at: now.addingTimeInterval(Double($0) * 3600), from: data) }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

struct ComplicationView: View {
  let entry: Entry
  @Environment(\.widgetFamily) private var family

  var body: some View {
    switch family {
    case .accessoryCircular: circular
    case .accessoryCorner: corner
    case .accessoryInline: inline
    default: rectangular
    }
  }

  private var percent: Double { Double(entry.recovery?.percent ?? 0) }
  private var percentText: String { entry.recovery.map { "\($0.percent)%" } ?? "--" }

  private var circular: some View {
    Gauge(value: percent, in: 0...100) {
      Image(systemName: "figure.strengthtraining.traditional")
    } currentValueLabel: {
      Text(percentText)
    }
    .gaugeStyle(.accessoryCircularCapacity)
    .tint(lime)
    .accessibilityLabel(entry.recovery.map { "\($0.percent)% recovered" } ?? "Muscle Pal")
  }

  private var corner: some View {
    Image(systemName: "figure.strengthtraining.traditional")
      .font(.title3)
      .widgetLabel {
        Gauge(value: percent, in: 0...100) { Text("") } currentValueLabel: { Text(percentText) }
          .tint(lime)
      }
  }

  private var inline: some View {
    Text(entry.recovery.map { "\($0.percent)% recovered" } ?? "Muscle Pal")
  }

  private var rectangular: some View {
    VStack(alignment: .leading, spacing: 1) {
      Text("Muscle Pal").font(.headline).foregroundStyle(lime).widgetAccentable()
      if let recovery = entry.recovery {
        Text("\(recovery.percent)% recovered").font(.body.weight(.semibold))
        Text(recovery.resting.isEmpty ? "All muscles ready" : recovery.resting.map(\.name).joined(separator: ", "))
          .font(.footnote)
          .foregroundStyle(.secondary)
          .lineLimit(1)
      } else {
        Text("Open the app on iPhone").font(.footnote).foregroundStyle(.secondary)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

@main
struct RecoveryComplication: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "MusclePalRecoveryWatch", provider: Provider()) { entry in
      ComplicationView(entry: entry).containerBackground(.clear, for: .widget)
    }
    .configurationDisplayName("Muscle recovery")
    .description("How recovered you are and which muscles are still resting.")
    .supportedFamilies([.accessoryCircular, .accessoryCorner, .accessoryInline, .accessoryRectangular])
  }
}
