import UIKit
import UserNotifications

/// The rest-over alert is scheduled with the system when the timer starts, so it
/// fires with sound + vibration even if the app is suspended or the screen is off.
enum RestNotifications {
    static let identifier = "rest-timer"

    static func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    static func schedule(at end: Date, duration: Int) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [identifier])

        let content = UNMutableNotificationContent()
        content.title = "Rest over — back to work! 💪"
        let length = duration >= 60 ? "\(Int((Double(duration) / 60).rounded()))m" : "\(duration)s"
        content.body = "\(length) rest complete — time to lift!"
        content.sound = UNNotificationSound(named: UNNotificationSoundName("lunk.caf"))
        content.interruptionLevel = .active
        content.threadIdentifier = identifier
        content.userInfo = ["deeplink": "yeahbuddy://exercise"]

        let interval = max(1, end.timeIntervalSinceNow)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        center.add(UNNotificationRequest(identifier: identifier, content: content, trigger: trigger))
    }

    static func cancel() {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [identifier])
        center.removeDeliveredNotifications(withIdentifiers: [identifier])
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    // Show the banner and play the sound while the app is open too.
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .list]
    }

    // Tapping the alert opens the current exercise.
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        await MainActor.run { Store.shared.openCurrentExercise() }
    }
}
