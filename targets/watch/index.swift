import SwiftUI
import WatchConnectivity
import WidgetKit

// The iPhone app sends its recovery summary over WatchConnectivity
// (modules/watch-connectivity); the watch keeps the newest copy in its App Group, where the
// complications read it too.
private let lime = Color(red: 0xC8 / 255, green: 0xFA / 255, blue: 0x3C / 255)

final class Store: NSObject, ObservableObject, WCSessionDelegate {
  @Published var data: WidgetData? = loadSavedData()

  override init() {
    super.init()
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  private func receive(_ context: [String: Any]) {
    guard let raw = context["data"] as? String, let next = decode(raw) else { return }
    UserDefaults(suiteName: appGroup)?.set(raw, forKey: "data")
    WidgetCenter.shared.reloadAllTimelines()
    DispatchQueue.main.async { self.data = next }
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    receive(session.receivedApplicationContext)
  }

  func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
    receive(context)
  }
}

struct ContentView: View {
  @EnvironmentObject private var store: Store

  var body: some View {
    NavigationStack {
      TimelineView(.periodic(from: .now, by: 60)) { context in
        if let data = store.data {
          if data.isPro {
            Summary(recovery: Recovery(data, at: context.date), date: context.date)
          } else {
            Message(icon: "lock.fill", text: "Muscle recovery on your watch is part of Muscle Pal Pro.")
          }
        } else {
          Message(icon: "iphone", text: "Open Muscle Pal on your iPhone to see your recovery here.")
        }
      }
      .navigationTitle("Muscle Pal")
    }
  }
}

struct Summary: View {
  let recovery: Recovery
  let date: Date

  var body: some View {
    List {
      VStack(spacing: 6) {
        Gauge(value: Double(recovery.percent), in: 0...100) {
          EmptyView()
        } currentValueLabel: {
          Text("\(recovery.percent)%").font(.system(.title3, design: .rounded).weight(.bold))
        }
        .gaugeStyle(.accessoryCircularCapacity)
        .tint(lime)
        .scaleEffect(1.3)
        .padding(.vertical, 10)
        Text("recovered").font(.footnote).foregroundStyle(.secondary)
        if recovery.streak > 0 {
          Label("\(recovery.streak)-day streak", systemImage: "flame.fill")
            .font(.footnote.weight(.semibold))
            .foregroundStyle(lime)
        }
      }
      .frame(maxWidth: .infinity)
      .listRowBackground(Color.clear)
      .accessibilityElement(children: .combine)

      if recovery.resting.isEmpty {
        Text("All muscles ready. A good day to train.").font(.footnote)
      } else {
        Section("Resting") {
          ForEach(recovery.resting, id: \.self) { muscle in
            VStack(alignment: .leading, spacing: 2) {
              Text(muscle.name).font(.headline)
              Text(readyIn(muscle, from: date)).font(.footnote).foregroundStyle(.secondary)
            }
            .accessibilityElement(children: .combine)
          }
        }
      }
    }
  }
}

struct Message: View {
  let icon: String
  let text: String

  var body: some View {
    VStack(spacing: 10) {
      Image(systemName: icon).font(.title2).foregroundStyle(lime)
      Text(text).font(.footnote).multilineTextAlignment(.center)
    }
    .padding()
  }
}

@main
struct MusclePalWatchApp: App {
  @StateObject private var store = Store()

  var body: some Scene {
    WindowGroup {
      ContentView().environmentObject(store)
    }
  }
}
