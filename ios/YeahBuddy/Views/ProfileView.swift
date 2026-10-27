import SwiftUI
import UniformTypeIdentifiers

/// Port of the Profile tab: data management + CSV transfer. (No accounts / sign-out.)
struct ProfileView: View {
    @Environment(Store.self) private var store
    @State private var showImporter = false
    @State private var showTextImport = false
    @State private var importMessage: String?
    @State private var exportFile: CSVFile?

    var body: some View {
        @Bindable var store = store
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 16) {
                        Text(store.data.userName.first.map { String($0).uppercased() } ?? "💪")
                            .font(.system(size: 24, weight: .black)).foregroundStyle(Theme.green)
                            .frame(width: 56, height: 56)
                            .background(Theme.green.opacity(0.13), in: Circle())
                            .overlay(Circle().stroke(Theme.green.opacity(0.27), lineWidth: 2))
                        VStack(alignment: .leading, spacing: 2) {
                            TextField("Your name", text: $store.data.userName)
                                .font(.system(size: 18, weight: .bold)).foregroundStyle(.white)
                            Text("\(store.data.workouts.count) workout\(store.data.workouts.count == 1 ? "" : "s") logged")
                                .font(.system(size: 12)).foregroundStyle(Theme.muted)
                        }
                    }
                    .padding(20).card()

                    SectionLabel(text: "Data").padding(.top, 8)
                    VStack(spacing: 0) {
                        NavigationLink { RecentlyDeletedView() } label: {
                            row(icon: "trash", iconColor: Theme.soft, title: "Recently Deleted", badge: store.data.recentlyDeleted.count, badgeColor: Theme.red)
                        }
                        Divider().overlay(Theme.border)
                        NavigationLink { ArchivedView() } label: {
                            row(icon: "archivebox", iconColor: Theme.soft, title: "Archived Workouts", badge: store.data.archivedWorkouts.count, badgeColor: Theme.soft)
                        }
                    }
                    .card()

                    SectionLabel(text: "Data Transfer").padding(.top, 8)
                    VStack(spacing: 0) {
                        Button {
                            let name = "yeah-buddy-workouts-\(DateFormatter.ymd.string(from: Date())).csv"
                            exportFile = CSVFile(name: name, text: WorkoutCSV.export(store.data.workouts))
                        } label: {
                            row(icon: "square.and.arrow.up", iconColor: Theme.green, title: "Export Workouts", subtitle: "Save or share all workouts as CSV")
                        }
                        Divider().overlay(Theme.border)
                        Button { showTextImport = true } label: {
                            row(icon: "text.badge.plus", iconColor: Theme.green, title: "Log Workout from Text or Photo", subtitle: "Type, paste, or upload a workout")
                        }
                        Divider().overlay(Theme.border)
                        Button { showImporter = true } label: {
                            row(icon: "square.and.arrow.down", iconColor: Theme.soft, title: "Import Workouts", subtitle: "CSV from the web app: Profile → Export Workouts")
                        }
                    }
                    .buttonStyle(.plain)
                    .card()

                    if let importMessage {
                        Text(importMessage).font(.system(size: 12))
                            .foregroundStyle(importMessage.hasPrefix("Imported") ? Theme.green : Theme.red)
                            .frame(maxWidth: .infinity)
                    }

                    Text("Your data is stored on this iPhone, kept across app updates, and included in your iPhone's iCloud backup.")
                        .font(.system(size: 12)).foregroundStyle(Theme.muted)
                        .padding(.top, 8)
                }
                .padding(16)
            }
            .screenBackground()
            .navigationTitle("Profile")
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.commaSeparatedText, .plainText]) { result in
                switch result {
                case .success(let url):
                    let scoped = url.startAccessingSecurityScopedResource()
                    defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                    guard let text = try? String(contentsOf: url, encoding: .utf8) else {
                        importMessage = "Import failed — couldn't read the file"; return
                    }
                    let parsed = WorkoutCSV.parse(text)
                    let added = store.importWorkouts(parsed)
                    importMessage = parsed.isEmpty ? "Import failed — check CSV format"
                        : "Imported \(added) workout\(added == 1 ? "" : "s")\(added < parsed.count ? " (\(parsed.count - added) already here)" : "")"
                case .failure:
                    importMessage = "Import failed — check CSV format"
                }
            }
            .sheet(isPresented: $showTextImport) { ImportWorkoutSheet() }
            .sheet(item: $exportFile) { file in
                ShareSheet(items: [file.url])
            }
        }
    }

    private func row(icon: String, iconColor: Color, title: String, subtitle: String? = nil, badge: Int = 0, badgeColor: Color = Theme.soft) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(iconColor).frame(width: 22)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.system(size: 14, weight: .medium)).foregroundStyle(.white)
                if let subtitle { Text(subtitle).font(.system(size: 12)).foregroundStyle(Theme.muted) }
            }
            Spacer()
            if badge > 0 {
                Text("\(badge)").font(.system(size: 12, weight: .bold))
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .foregroundStyle(badgeColor).background(badgeColor.opacity(0.13), in: Capsule())
            }
        }
        .padding(16)
        .contentShape(Rectangle())
    }
}

struct CSVFile: Identifiable {
    let id = UUID()
    let url: URL
    init(name: String, text: String) {
        url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        try? text.write(to: url, atomically: true, encoding: .utf8)
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    var items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}

struct RecentlyDeletedView: View {
    @Environment(Store.self) private var store

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                if store.data.recentlyDeleted.isEmpty {
                    EmptyState(icon: "trash", text: "No recently deleted workouts")
                } else {
                    Text("Workouts are permanently removed after 3 days.").font(.system(size: 12)).foregroundStyle(Theme.muted)
                    ForEach(store.data.recentlyDeleted) { w in
                        let deleted = w.deletedAt ?? Date()
                        let daysLeft = max(0, Int(ceil((deleted.addingTimeInterval(3 * 86400).timeIntervalSinceNow) / 86400)))
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(w.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                                Text("\(w.date) · purges in \(daysLeft)d").font(.system(size: 12)).foregroundStyle(Theme.red)
                            }
                            Spacer()
                            Button { withAnimation { store.restoreDeleted(w.id) } } label: {
                                Label("Restore", systemImage: "arrow.counterclockwise")
                                    .font(.system(size: 12, weight: .semibold))
                                    .padding(.horizontal, 12).padding(.vertical, 6)
                                    .foregroundStyle(Theme.green).background(Theme.green.opacity(0.13), in: Capsule())
                            }
                            Button { withAnimation { store.permanentlyDelete(w.id) } } label: {
                                Text("Delete").font(.system(size: 12, weight: .semibold))
                                    .padding(.horizontal, 12).padding(.vertical, 6)
                                    .foregroundStyle(Theme.red).background(Theme.red.opacity(0.13), in: Capsule())
                            }
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 16).padding(.vertical, 12).card()
                    }
                }
            }
            .padding(16)
        }
        .screenBackground()
        .navigationTitle("Recently Deleted")
    }
}

struct ArchivedView: View {
    @Environment(Store.self) private var store

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                if store.data.archivedWorkouts.isEmpty {
                    EmptyState(icon: "archivebox", text: "No archived workouts")
                }
                ForEach(store.data.archivedWorkouts) { w in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(w.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(.white)
                            Text("\(w.date) · \(w.exercises.count) exercises").font(.system(size: 12)).foregroundStyle(Theme.muted)
                        }
                        Spacer()
                        Button { withAnimation { store.unarchive(w.id) } } label: {
                            Label("Restore", systemImage: "arrow.counterclockwise")
                                .font(.system(size: 12, weight: .semibold))
                                .padding(.horizontal, 12).padding(.vertical, 6)
                                .foregroundStyle(Theme.green).background(Theme.green.opacity(0.13), in: Capsule())
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 16).padding(.vertical, 12).card()
                }
            }
            .padding(16)
        }
        .screenBackground()
        .navigationTitle("Archived Workouts")
    }
}
