import ExpoModulesCore
import WatchConnectivity

/// Sends the latest recovery summary to the Watch app. Application context keeps only the newest
/// value and is delivered whenever the watch is next reachable, so the phone never waits on it.
public class WatchConnectivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MusclePalWatchLink")

    Function("send") { (json: String) in
      WatchLink.shared.send(json)
    }
  }
}

final class WatchLink: NSObject, WCSessionDelegate {
  static let shared = WatchLink()
  /// The newest summary, kept for a watch that pairs or installs the app later.
  private var latest: String?

  func send(_ json: String) {
    guard WCSession.isSupported() else { return }
    latest = json
    let session = WCSession.default
    if session.activationState == .activated {
      push(on: session)
    } else {
      session.delegate = self
      session.activate()
    }
  }

  private func push(on session: WCSession) {
    // Nothing to deliver to: no paired watch, or Muscle Pal is not installed on it.
    guard let json = latest, session.isPaired, session.isWatchAppInstalled else { return }
    try? session.updateApplicationContext(["data": json])
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    if state == .activated { push(on: session) }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  // After switching to another watch, activate again so the new one gets updates.
  func sessionDidDeactivate(_ session: WCSession) {
    session.activate()
  }

  // The watch app was just installed, or another watch was paired.
  func sessionWatchStateDidChange(_ session: WCSession) {
    push(on: session)
  }
}
