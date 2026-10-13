import SwiftUI

@main
struct YeahBuddyApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @Environment(\.scenePhase) private var scenePhase
    @State private var store = Store.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .preferredColorScheme(.dark)
                .tint(Theme.green)
                .onOpenURL { url in
                    if url.scheme == "yeahbuddy" { store.openCurrentExercise() }
                }
        }
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active: store.appDidBecomeActive()
            case .background, .inactive: store.saveNow()
            @unknown default: break
            }
        }
    }
}

struct RootView: View {
    @Environment(Store.self) private var store

    var body: some View {
        @Bindable var store = store
        TabView(selection: $store.selectedTab) {
            WorkoutView()
                .tabItem { Label("Workout", systemImage: "dumbbell.fill") }
                .tag(AppTab.workout)
            LibraryView()
                .tabItem { Label("Exercises", systemImage: "book.fill") }
                .tag(AppTab.library)
            ProgressScreen()
                .tabItem { Label("Progress", systemImage: "chart.line.uptrend.xyaxis") }
                .tag(AppTab.progress)
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.fill") }
                .tag(AppTab.profile)
        }
    }
}
