import SwiftUI

/// Colours lifted straight from the web app's inline styles.
enum Theme {
    static let bg = Color(hex: 0x0A0A0A)
    static let card = Color(hex: 0x141414)
    static let card2 = Color(hex: 0x1A1A1A)
    static let raised = Color(hex: 0x1E1E1E)
    static let field = Color(hex: 0x2A2A2A)
    static let border = Color(hex: 0x1E1E1E)
    static let timerBg = Color(hex: 0x0D0D0D)

    static let green = Color(hex: 0x22C55E)
    static let gold = Color(hex: 0xC8B97A)
    static let cyan = Color(hex: 0x00D4FF)
    static let red = Color(hex: 0xEF4444)
    static let orange = Color(hex: 0xF97316)
    static let teal = Color(hex: 0x99F6E4)

    static let text = Color(hex: 0xF5F5F5)
    static let muted = Color(hex: 0x555555)
    static let dim = Color(hex: 0x444444)
    static let soft = Color(hex: 0x888888)

    static let mono = Font.system(.body, design: .monospaced)

    static func equipColor(_ tag: String) -> Color {
        switch tag {
        case "BB": return Color(hex: 0xF59E0B)
        case "Camber": return Color(hex: 0xFB923C)
        case "Hex", "HB": return Color(hex: 0xEAB308)
        case "Smith": return Color(hex: 0x818CF8)
        case "DB": return Color(hex: 0x3B82F6)
        case "KB": return Color(hex: 0xA78BFA)
        case "Cable", "MAG": return orange
        case "Machine", "SA", "DA": return Color(hex: 0x22D3EE)
        case "BW": return green
        case "EZ": return Color(hex: 0xF43F5E)
        case "Plate", "SL": return Color(hex: 0x84CC16)
        case "Other": return Color(hex: 0x9CA3AF)
        default: return soft
        }
    }
}

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255,
                  opacity: opacity)
    }
}

// MARK: - Small shared pieces

struct SectionLabel: View {
    var text: String
    var color: Color = Theme.muted
    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 11, weight: .bold))
            .tracking(1.5)
            .foregroundStyle(color)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct Tag: View {
    var text: String
    var color: Color
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .bold))
            .padding(.horizontal, 6).padding(.vertical, 2)
            .foregroundStyle(color)
            .background(color.opacity(0.13), in: RoundedRectangle(cornerRadius: 5))
            .overlay(RoundedRectangle(cornerRadius: 5).stroke(color.opacity(0.33), lineWidth: 1))
    }
}

struct Pill: View {
    var text: String
    var selected: Bool
    var color: Color = Theme.green
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.system(size: 12, weight: .semibold))
                .padding(.horizontal, 10).padding(.vertical, 5)
                .foregroundStyle(selected ? color : Theme.soft)
                .background(selected ? color.opacity(0.13) : Theme.field, in: Capsule())
                .overlay(Capsule().stroke(selected ? color.opacity(0.27) : .clear, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

struct ChipButton: View {
    var label: String
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: .bold))
                .padding(.horizontal, 12).padding(.vertical, 5)
                .foregroundStyle(Theme.green)
                .background(Theme.green.opacity(0.13), in: Capsule())
                .overlay(Capsule().stroke(Theme.green.opacity(0.27), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

struct EmptyState: View {
    var icon: String
    var text: String
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.system(size: 34, weight: .light))
            Text(text).font(.subheadline).multilineTextAlignment(.center)
        }
        .foregroundStyle(Theme.muted)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 48)
    }
}

extension View {
    func card(_ color: Color = Theme.card, radius: CGFloat = 16) -> some View {
        background(color, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
    }

    func screenBackground() -> some View {
        frame(maxWidth: .infinity, maxHeight: .infinity).background(Theme.bg.ignoresSafeArea())
    }

    /// The web inputs: dark field, centered bold text.
    func fieldStyle(_ bg: Color = Theme.field) -> some View {
        font(.system(size: 16, weight: .semibold))
            .multilineTextAlignment(.center)
            .padding(.vertical, 8)
            .background(bg, in: RoundedRectangle(cornerRadius: 8))
    }
}

func daysAgoLabel(_ ymd: String) -> String { ymd }
