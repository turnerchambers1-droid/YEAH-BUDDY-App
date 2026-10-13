import SwiftUI

/// Port of RestTimer.jsx — the vintage clock face with presets 60/90/120/180s.
/// Default 60s, auto-starts whenever a set is added.
struct RestTimerView: View {
    @Environment(Store.self) private var store
    var inline = true

    static let presets = [60, 90, 120, 180]

    var body: some View {
        TimelineView(.periodic(from: .now, by: 0.25)) { context in
            let duration = store.data.restDuration
            let remaining = store.restRemaining(at: context.date)
            let ding = store.restFinishedAt.map { context.date.timeIntervalSince($0) < 2.5 } ?? false

            HStack(spacing: 16) {
                ClockFace(duration: duration, remaining: remaining, ding: ding)
                    .frame(width: 72, height: 72)
                    .shadow(color: ding ? Theme.green : .clear, radius: 10)
                    .animation(.easeInOut(duration: 0.3), value: ding)

                VStack(alignment: .leading, spacing: 8) {
                    Text("REST TIMER")
                        .font(.system(size: 11, weight: .bold, design: .monospaced)).tracking(1.5)
                        .foregroundStyle(Theme.gold)
                    HStack(spacing: 12) {
                        let running = store.restRunning
                        Button { store.toggleRest() } label: {
                            Image(systemName: running ? "pause.fill" : "play.fill")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundStyle(running ? Theme.green : .black)
                                .frame(width: 48, height: 48)
                                .background(running ? Color(hex: 0x1A1A1A) : Theme.green, in: Circle())
                                .overlay(Circle().stroke(running ? Theme.green : .clear, lineWidth: 2))
                                .shadow(color: Theme.green.opacity(running ? 0.27 : 0.33), radius: 8)
                        }
                        .buttonStyle(PressableStyle())
                        Button("RST") { store.resetRest() }
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundStyle(Theme.gold)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(Color(hex: 0x1A1A1A), in: Capsule())
                            .overlay(Capsule().stroke(Color(hex: 0x333333)))
                    }
                    HStack(spacing: 6) {
                        ForEach(Self.presets, id: \.self) { s in
                            let on = duration == s
                            Button { store.selectRestPreset(s) } label: {
                                Text(s < 60 ? "\(s)s" : (s % 60 == 0 ? "\(s / 60)m" : String(format: "%.1fm", Double(s) / 60)))
                                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                    .padding(.horizontal, 10).padding(.vertical, 4)
                                    .foregroundStyle(on ? Theme.green : Theme.muted)
                                    .background(on ? Theme.green.opacity(0.13) : Color(hex: 0x1A1A1A), in: Capsule())
                                    .overlay(Capsule().stroke(on ? Theme.green.opacity(0.33) : Color(hex: 0x222222)))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 16).padding(.vertical, 12)
            .card(Theme.timerBg)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Theme.field, lineWidth: 1))
        }
    }
}

/// The clock face, drawn in the web SVG's 220×220 coordinate space and scaled.
struct ClockFace: View {
    var duration: Int
    var remaining: Int
    var ding: Bool

    var body: some View {
        Canvas { ctx, size in
            let s = size.width / 220
            ctx.scaleBy(x: s, y: s)
            let c = CGPoint(x: 110, y: 110)
            let r: CGFloat = 90, outer: CGFloat = 92
            func circle(_ radius: CGFloat) -> Path {
                Path(ellipseIn: CGRect(x: c.x - radius, y: c.y - radius, width: radius * 2, height: radius * 2))
            }
            let progress = duration > 0 ? CGFloat(duration - remaining) / CGFloat(duration) : 0

            ctx.stroke(circle(outer + 6), with: .color(Theme.gold.opacity(0.6)), lineWidth: 3)
            ctx.fill(circle(outer), with: .radialGradient(
                Gradient(colors: [Color(hex: 0x1E1E1E), Color(hex: 0x080808)]),
                center: CGPoint(x: 88, y: 77), startRadius: 0, endRadius: outer * 1.2))
            ctx.stroke(circle(outer), with: .color(Color(hex: 0x333333)), lineWidth: 1)

            for i in 0..<60 {
                let a = (Double(i) * 6 - 90) * .pi / 180
                let major = i % 5 == 0
                let inner = r - (major ? 9 : 5)
                var p = Path()
                p.move(to: CGPoint(x: c.x + inner * cos(a), y: c.y + inner * sin(a)))
                p.addLine(to: CGPoint(x: c.x + r * cos(a), y: c.y + r * sin(a)))
                ctx.stroke(p, with: .color(major ? Theme.gold : Color(hex: 0x555555)),
                           style: StrokeStyle(lineWidth: major ? 2 : 1, lineCap: .round))
            }

            for (label, deg) in [("12", -90.0), ("3", 0.0), ("6", 90.0), ("9", 180.0)] {
                let a = deg * .pi / 180, nr = r - 16
                ctx.draw(Text(label).font(.system(size: 11, weight: .bold, design: .monospaced)).foregroundColor(Theme.gold),
                         at: CGPoint(x: c.x + nr * cos(a), y: c.y + nr * sin(a)))
            }

            // Remaining-time arc, starting at 12 o'clock.
            if progress < 1 {
                var arc = Path()
                arc.addArc(center: c, radius: r - 4, startAngle: .degrees(-90 + 360 * progress), endAngle: .degrees(270), clockwise: false)
                ctx.stroke(arc, with: .color(Theme.green.opacity(0.85)), style: StrokeStyle(lineWidth: 5, lineCap: .round))
            }

            let ha = (-90 + progress * 360) * .pi / 180
            var hand = Path()
            hand.move(to: c)
            hand.addLine(to: CGPoint(x: c.x + (r - 18) * cos(ha), y: c.y + (r - 18) * sin(ha)))
            ctx.stroke(hand, with: .color(Theme.green), style: StrokeStyle(lineWidth: 2.5, lineCap: .round))
            ctx.fill(circle(5), with: .color(Theme.gold))
            ctx.fill(circle(2.5), with: .color(Color(hex: 0x111111)))

            let mm = String(format: "%02d:%02d", remaining / 60, remaining % 60)
            ctx.draw(Text(mm).font(.system(size: 30, weight: .bold, design: .monospaced)).foregroundColor(ding ? Theme.green : Theme.text).tracking(3),
                     at: CGPoint(x: c.x, y: c.y - 22))
            let pct = duration > 0 ? Int((Double(remaining) / Double(duration) * 100).rounded()) : 0
            ctx.draw(Text(ding ? "— DONE —" : "\(pct)%").font(.system(size: 11, design: .monospaced)).foregroundColor(Theme.muted).tracking(1),
                     at: CGPoint(x: c.x, y: c.y + 14))
        }
        .animation(.linear(duration: 0.8), value: remaining)
    }
}
