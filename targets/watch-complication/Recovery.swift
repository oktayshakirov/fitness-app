import Foundation

// A copy of targets/watch/Recovery.swift (the summary the iPhone app sends, src/widget/data.ts);
// each target compiles its own folder. Keep the two in step.
let appGroup = "group.com.shadev.musclepal"

struct RestingMuscle: Codable, Hashable {
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

/// What to show at `date`; the same rules as widgetView in src/widget/data.ts.
struct Recovery {
  let percent: Int
  let resting: [RestingMuscle]
  let streak: Int

  init(_ data: WidgetData, at date: Date) {
    let now = date.timeIntervalSince1970 * 1000
    resting = data.resting.filter { $0.readyAt > now }
    percent = data.total > 0 ? Int((Double(data.total - resting.count) / Double(data.total) * 100).rounded()) : 100
    var alive = false
    if let last = data.lastLogAt {
      let calendar = Calendar.current
      let days = calendar.dateComponents(
        [.day],
        from: calendar.startOfDay(for: Date(timeIntervalSince1970: last / 1000)),
        to: calendar.startOfDay(for: date)
      ).day ?? 99
      alive = days <= 1
    }
    streak = alive ? data.streak : 0
  }
}

func loadSavedData() -> WidgetData? {
  guard let raw = UserDefaults(suiteName: appGroup)?.string(forKey: "data") else { return nil }
  return decode(raw)
}

func decode(_ raw: String) -> WidgetData? {
  guard let bytes = raw.data(using: .utf8) else { return nil }
  return try? JSONDecoder().decode(WidgetData.self, from: bytes)
}

/// "ready in ~5 h" / "ready in ~2 days", like readyIn in src/recovery/labels.ts.
func readyIn(_ muscle: RestingMuscle, from date: Date) -> String {
  let hours = (muscle.readyAt / 1000 - date.timeIntervalSince1970) / 3600
  if hours < 24 { return "ready in ~\(Int(hours.rounded(.up))) h" }
  let days = Int((hours / 24).rounded())
  return "ready in ~\(days) \(days == 1 ? "day" : "days")"
}
