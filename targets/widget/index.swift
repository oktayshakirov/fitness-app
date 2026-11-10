import SwiftUI
import WidgetKit

// The app writes "data" to the App Group (src/widget/sync.tsx). The widget works out what to show
// for each hour itself, so recovery keeps counting down without the app being opened.
private let appGroup = "group.com.shadev.musclepal"
private let lime = Color(red: 0xC8 / 255, green: 0xFA / 255, blue: 0x3C / 255)
private let background = Color(red: 0x0B / 255, green: 0x0B / 255, blue: 0x0C / 255)

struct RestingMuscle: Codable {
  let name: String
  let readyAt: Double
}

struct WidgetData: Codable {
  let isPro: Bool
  let total: Int
  let resting: [RestingMuscle]
  let streak: Int
  let lastLogAt: Double?
}

struct RecoveryEntry: TimelineEntry {
  let date: Date
  let isPro: Bool
  let percent: Int
  let resting: [String]
  let streak: Int
}

private func loadData() -> WidgetData? {
  guard let raw = UserDefaults(suiteName: appGroup)?.string(forKey: "data"),
    let bytes = raw.data(using: .utf8)
  else { return nil }
  return try? JSONDecoder().decode(WidgetData.self, from: bytes)
}

/// Same rules as widgetView in src/widget/data.ts.
private func entry(at date: Date, from data: WidgetData?) -> RecoveryEntry {
  guard let data else {
    return RecoveryEntry(date: date, isPro: false, percent: 100, resting: [], streak: 0)
  }
  let now = date.timeIntervalSince1970 * 1000
  let resting = data.resting.filter { $0.readyAt > now }.map(\.name)
  let percent = data.total > 0 ? Int((Double(data.total - resting.count) / Double(data.total) * 100).rounded()) : 100
  var streak = 0
  if let last = data.lastLogAt {
    let calendar = Calendar.current
    let days = calendar.dateComponents(
      [.day],
      from: calendar.startOfDay(for: Date(timeIntervalSince1970: last / 1000)),
      to: calendar.startOfDay(for: date)
    ).day ?? 99
    if days <= 1 { streak = data.streak }
  }
  return RecoveryEntry(date: date, isPro: data.isPro, percent: percent, resting: resting, streak: streak)
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> RecoveryEntry {
    RecoveryEntry(date: Date(), isPro: true, percent: 82, resting: ["Chest", "Triceps", "Shoulders"], streak: 4)
  }

  func getSnapshot(in context: Context, completion: @escaping (RecoveryEntry) -> Void) {
    completion(context.isPreview ? placeholder(in: context) : entry(at: Date(), from: loadData()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<RecoveryEntry>) -> Void) {
    let data = loadData()
    let now = Date()
    let entries = (0..<24).map { entry(at: now.addingTimeInterval(Double($0) * 3600), from: data) }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

struct RecoveryView: View {
  let entry: RecoveryEntry
  @Environment(\.widgetFamily) private var family

  private var restingText: String {
    if entry.resting.isEmpty { return "All muscles ready" }
    let limit = family == .systemSmall ? 2 : 4
    let shown = entry.resting.prefix(limit).joined(separator: ", ")
    return entry.resting.count > limit ? "\(shown) +\(entry.resting.count - limit)" : shown
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      Text("Muscle Pal").font(.system(size: 13, weight: .bold)).foregroundColor(lime)
      Spacer(minLength: 4)
      if entry.isPro {
        Text("\(entry.percent)%").font(.system(size: 38, weight: .bold, design: .rounded)).foregroundColor(.white)
        Text("recovered").font(.system(size: 13)).foregroundColor(.gray)
        Spacer(minLength: 4)
        Text(restingText).font(.system(size: 12, weight: .medium)).foregroundColor(.white).lineLimit(2)
        if entry.streak > 0 {
          Text("\(entry.streak)-day streak").font(.system(size: 12, weight: .semibold)).foregroundColor(lime)
        }
      } else {
        Text("Muscle recovery").font(.system(size: 17, weight: .bold)).foregroundColor(.white)
        Text("Upgrade to Pro to use this widget").font(.system(size: 12)).foregroundColor(.gray)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .widgetURL(URL(string: "fitness://"))
  }
}

struct RecoveryWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "MusclePalRecovery", provider: Provider()) { entry in
      if #available(iOS 17.0, *) {
        RecoveryView(entry: entry).containerBackground(background, for: .widget)
      } else {
        RecoveryView(entry: entry).padding().background(background)
      }
    }
    .configurationDisplayName("Muscle recovery")
    .description("How recovered you are and which muscles are still resting.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct MusclePalWidgets: WidgetBundle {
  var body: some Widget {
    RecoveryWidget()
  }
}
