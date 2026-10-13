import SwiftUI

/// Front + back body figures; primary muscles green, secondary teal.
struct MuscleBodyMap: View {
    var primary: [String]
    var secondary: [String]
    var compact = false

    private static let frontIDs: Set<String> = ["chest", "front_delt", "side_delt", "biceps", "forearms", "abs", "quads", "calves", "adductors", "abductors"]
    private static let backIDs: Set<String> = ["traps", "lats", "mid_back", "lower_back", "rear_delt", "triceps", "glutes", "hamstrings", "calves"]

    var body: some View {
        HStack(spacing: compact ? 8 : 24) {
            BodyFigure(parts: MuscleMapData.front, lines: MuscleMapData.frontLines, label: "FRONT",
                       primary: primary.filter(Self.frontIDs.contains), secondary: secondary.filter(Self.frontIDs.contains))
            BodyFigure(parts: MuscleMapData.back, lines: MuscleMapData.backLines, label: "BACK",
                       primary: primary.filter(Self.backIDs.contains), secondary: secondary.filter(Self.backIDs.contains))
        }
        .frame(height: compact ? 250 : 320)
        .frame(maxWidth: .infinity)
    }
}

private struct BodyFigure: View {
    var parts: [(muscle: String, d: String)]
    var lines: [(Double, Double, Double, Double)]
    var label: String
    var primary: [String]
    var secondary: [String]

    var body: some View {
        Canvas { ctx, size in
            let scale = min(size.width / 200, size.height / 450)
            ctx.translateBy(x: (size.width - 200 * scale) / 2, y: 0)
            ctx.scaleBy(x: scale, y: scale)

            ctx.fill(Path(ellipseIn: CGRect(x: 82, y: 5, width: 36, height: 42)), with: .color(Color(hex: 0x1C1C1C)))
            ctx.stroke(Path(ellipseIn: CGRect(x: 82, y: 5, width: 36, height: 42)), with: .color(Color(hex: 0x3A3A3A)), lineWidth: 1.2)
            for d in MuscleMapData.silhouette {
                let p = SVGPath.parse(d)
                ctx.fill(p, with: .color(Color(hex: 0x1C1C1C)))
                ctx.stroke(p, with: .color(Color(hex: 0x3A3A3A)), lineWidth: 1.2)
            }
            for part in parts {
                let color = primary.contains(part.muscle) ? Theme.green : secondary.contains(part.muscle) ? Theme.teal : Theme.field
                ctx.fill(SVGPath.parse(part.d), with: .color(color.opacity(0.9)))
            }
            for l in lines {
                var p = Path()
                p.move(to: CGPoint(x: l.0, y: l.1))
                p.addLine(to: CGPoint(x: l.2, y: l.3))
                ctx.stroke(p, with: .color(Color(hex: 0x2E2E2E).opacity(0.6)), lineWidth: 1.2)
            }
            ctx.draw(Text(label).font(.system(size: 9, weight: .bold)).tracking(3).foregroundColor(Theme.dim), at: CGPoint(x: 100, y: 444))
        }
    }
}

/// Minimal SVG path parser for the absolute M/L/C/Z commands the map uses.
enum SVGPath {
    private static var cache: [String: Path] = [:]

    static func parse(_ d: String) -> Path {
        if let hit = cache[d] { return hit }
        var path = Path()
        var nums: [Double] = []
        var cmd: Character = "M"
        var token = ""

        func flushNumber() {
            if let v = Double(token) { nums.append(v) }
            token = ""
        }
        func apply() {
            var i = 0
            switch cmd {
            case "M", "L":
                while i + 1 < nums.count {
                    let p = CGPoint(x: nums[i], y: nums[i + 1])
                    if cmd == "M" && i == 0 { path.move(to: p) } else { path.addLine(to: p) }
                    i += 2
                }
            case "C":
                while i + 5 < nums.count {
                    path.addCurve(to: CGPoint(x: nums[i + 4], y: nums[i + 5]),
                                  control1: CGPoint(x: nums[i], y: nums[i + 1]),
                                  control2: CGPoint(x: nums[i + 2], y: nums[i + 3]))
                    i += 6
                }
            case "Z": path.closeSubpath()
            default: break
            }
            nums.removeAll()
        }

        for ch in d {
            if "MLCZ".contains(ch) {
                flushNumber(); apply(); cmd = ch
                if ch == "Z" { apply() }
            } else if ch == "," || ch == " " || ch == "\n" {
                flushNumber()
            } else if ch == "-" && !token.isEmpty {
                flushNumber(); token = "-"
            } else {
                token.append(ch)
            }
        }
        flushNumber(); apply()
        cache[d] = path
        return path
    }
}
