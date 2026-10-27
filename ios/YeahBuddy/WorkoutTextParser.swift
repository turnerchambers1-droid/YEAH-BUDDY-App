import Foundation

/// Turns a typed / pasted / photographed workout into workouts. Handles notes like:
///
///     Workout 10/26
///     Dips BW
///     15
///     10
///     Cable kickback
///     15x15
///     EZ bar tricep extension
///     15x40, 15x50
///
/// A line with a date starts a workout. A line of numbers is sets for the exercise above it:
/// "15" is reps (bodyweight if the exercise says BW), "15x40" is 15 reps × 40 lb,
/// "4x10@135" is 4 sets of 10 at 135. Any other line is an exercise name.
enum WorkoutTextParser {
    struct ParsedExercise: Hashable {
        /// Name as written (minus "BW").
        var rawName: String
        var sets: [LoggedSet]
    }

    struct ParsedWorkout: Hashable {
        var date: Date
        var title: String?
        var exercises: [ParsedExercise]
    }

    static func parse(_ text: String, today: Date = Date()) -> [ParsedWorkout] {
        var workouts: [ParsedWorkout] = []
        var current: ParsedWorkout?
        var exercise: ParsedExercise?
        var exerciseIsBW = false

        func flushExercise() {
            if let ex = exercise, !ex.sets.isEmpty {
                if current == nil { current = ParsedWorkout(date: today, title: nil, exercises: []) }
                current!.exercises.append(ex)
            }
            exercise = nil
        }
        func flushWorkout() {
            flushExercise()
            if let w = current, !w.exercises.isEmpty { workouts.append(w) }
            current = nil
        }

        let lines = text.replacingOccurrences(of: "\r\n", with: "\n").replacingOccurrences(of: "\r", with: "\n")
            .split(separator: "\n").map { clean(String($0)) }

        for line in lines where !line.isEmpty {
            if let sets = parseSets(line, bodyweight: exerciseIsBW) {
                if exercise == nil { exercise = ParsedExercise(rawName: "Exercise", sets: []) }
                exercise!.sets.append(contentsOf: sets)
                continue
            }
            if let (date, title) = parseHeader(line, today: today) {
                flushWorkout()
                current = ParsedWorkout(date: date, title: title, exercises: [])
                continue
            }
            // Exercise name, possibly with sets on the same line ("Dips BW: 15, 15, 10").
            flushExercise()
            var name = line
            var inlineSets: [LoggedSet] = []
            if let (n, sets) = splitTrailingSets(name) {
                name = n
                inlineSets = sets
            }
            exerciseIsBW = isBW(name)
            name = stripBW(name)
            if name.isEmpty { name = "Exercise" }
            exercise = ParsedExercise(rawName: name, sets: inlineSets)
        }
        flushWorkout()
        return workouts
    }

    // MARK: - Lines

    /// "Dips BW: 15, 15, 10", "Bench - 135x10", "Push ups bw x 20" → name + sets.
    private static func splitTrailingSets(_ line: String) -> (String, [LoggedSet])? {
        for sep in [":", " - ", " – "] {
            if let r = line.range(of: sep) {
                let name = String(line[..<r.lowerBound]), rest = String(line[r.upperBound...])
                if let sets = parseSets(rest, bodyweight: isBW(name)) { return (name, sets) }
            }
        }
        let words = line.split(separator: " ").map(String.init)
        guard words.count >= 2 else { return nil }
        // Longest run of words at the end that reads as sets, keeping at least one word of name.
        for start in 1..<words.count {
            let name = words[..<start].joined(separator: " ")
            let rest = words[start...].joined(separator: " ")
            guard rest.first?.isNumber == true || rest.lowercased().hasPrefix("bw") else { continue }
            if let sets = parseSets(rest, bodyweight: isBW(name)) { return (name, sets) }
        }
        return nil
    }

    private static func clean(_ s: String) -> String {
        var t = s.trimmingCharacters(in: .whitespaces)
        // Bullets and list markers from notes apps.
        while let f = t.first, "•-*·▪◦".contains(f) { t.removeFirst(); t = t.trimmingCharacters(in: .whitespaces) }
        t = t.replacingOccurrences(of: "×", with: "x").replacingOccurrences(of: "X", with: "x")
        return t
    }

    private static func isBW(_ name: String) -> Bool {
        let n = " \(name.lowercased()) "
        return n.range(of: "[^a-z](bw|bodyweight|body weight)[^a-z]", options: .regularExpression) != nil
    }

    private static func stripBW(_ name: String) -> String {
        name.replacingOccurrences(of: "(?i)\\(?\\b(bw|bodyweight|body weight)\\b\\)?", with: "", options: .regularExpression)
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: " :-–"))
    }

    /// "Workout 10/26", "10/26/26", "Mon 10/26 back day", "2026-10-26".
    private static func parseHeader(_ line: String, today: Date) -> (Date, String?)? {
        let cal = Calendar(identifier: .gregorian)
        let patterns = ["(\\d{4})-(\\d{1,2})-(\\d{1,2})", "(\\d{1,2})[/.](\\d{1,2})(?:[/.](\\d{2,4}))?"]
        for (pi, p) in patterns.enumerated() {
            guard let re = try? NSRegularExpression(pattern: "(?<![\\d/])" + p + "(?![\\d/])"),
                  let m = re.firstMatch(in: line, range: NSRange(line.startIndex..., in: line)) else { continue }
            func g(_ i: Int) -> Int? {
                guard let r = Range(m.range(at: i), in: line) else { return nil }
                return Int(line[r])
            }
            var y: Int?, mo: Int?, d: Int?
            if pi == 0 { y = g(1); mo = g(2); d = g(3) } else { mo = g(1); d = g(2); y = g(3) }
            guard let month = mo, let day = d, (1...12).contains(month), (1...31).contains(day) else { continue }
            let thisYear = cal.component(.year, from: today)
            var year = y.map { $0 < 100 ? 2000 + $0 : $0 } ?? thisYear
            var comps = DateComponents(year: year, month: month, day: day, hour: 12)
            guard var date = cal.date(from: comps) else { continue }
            // No year given and the date is still ahead: it was last year.
            if y == nil, date > today.addingTimeInterval(86400) {
                year -= 1; comps.year = year
                date = cal.date(from: comps) ?? date
            }
            let title = re.stringByReplacingMatches(in: line, range: NSRange(line.startIndex..., in: line), withTemplate: "")
                .replacingOccurrences(of: "(?i)\\b(workout|date)\\b", with: "", options: .regularExpression)
                .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
                .trimmingCharacters(in: CharacterSet(charactersIn: " :-–,"))
            return (date, title.isEmpty ? nil : title)
        }
        return nil
    }

    /// A line made only of sets, e.g. "15", "15x40", "8 x 90 lbs", "15, 15, 10", "4x10@135", "BW x 12".
    static func parseSets(_ line: String, bodyweight: Bool) -> [LoggedSet]? {
        let t = line.lowercased()
            .replacingOccurrences(of: "(lbs?|pounds?|reps?|kg)\\b", with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { return nil }
        let parts = t.split(whereSeparator: { $0 == "," || $0 == ";" || $0 == "|" })
            .map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
        guard !parts.isEmpty else { return nil }
        var out: [LoggedSet] = []
        for part in parts {
            guard let sets = parseOne(part, bodyweight: bodyweight) else { return nil }
            out += sets
        }
        return out
    }

    private static let num = "(\\d+(?:\\.\\d+)?|bw)"

    private static func parseOne(_ part: String, bodyweight: Bool) -> [LoggedSet]? {
        let p = part.replacingOccurrences(of: "\\s+", with: "", options: .regularExpression)
        func match(_ pattern: String) -> [String]? {
            guard let re = try? NSRegularExpression(pattern: "^" + pattern + "$"),
                  let m = re.firstMatch(in: p, range: NSRange(p.startIndex..., in: p)) else { return nil }
            return (1..<m.numberOfRanges).map { i in Range(m.range(at: i), in: p).map { String(p[$0]) } ?? "" }
        }
        func w(_ s: String) -> String { s == "bw" ? "BW" : s }
        let defaultWeight = bodyweight ? "BW" : ""

        // 4x10@135 → 4 sets of 10 reps at 135
        if let g = match("(\\d+)x(\\d+)@" + num), let n = Int(g[0]), (1...20).contains(n) {
            return Array(repeating: LoggedSet(weight: w(g[2]), reps: g[1]), count: n).map { LoggedSet(weight: $0.weight, reps: $0.reps) }
        }
        // 10@135
        if let g = match("(\\d+)@" + num) { return [LoggedSet(weight: w(g[1]), reps: g[0])] }
        // bw x 12
        if let g = match("bwx(\\d+)") { return [LoggedSet(weight: "BW", reps: g[0])] }
        // 15x40 → 15 reps × 40 lb (15xbw allowed). "135x10" is clearly weight × reps.
        if let g = match("(\\d+(?:\\.\\d+)?)x" + num) {
            if let a = Double(g[0]), let b = Double(g[1]), a > 50, b <= 50, b == b.rounded() {
                return [LoggedSet(weight: g[0], reps: g[1])]
            }
            return [LoggedSet(weight: w(g[1]), reps: g[0])]
        }
        // 15 → reps only
        if let g = match("(\\d+)"), let r = Int(g[0]), r <= 200 { return [LoggedSet(weight: defaultWeight, reps: g[0])] }
        return nil
    }

    // MARK: - Exercise names

    /// Picks the closest known exercise for a typed name, or nil when nothing is close.
    static func bestMatch(for raw: String, among names: [String]) -> String? {
        let input = tokens(raw)
        guard !input.isEmpty else { return nil }
        if let exact = names.first(where: { tokens($0) == input }) { return exact }
        var best: (name: String, score: Double)?
        for name in names {
            let cand = tokens(name)
            guard !cand.isEmpty else { continue }
            let shared = Double(input.intersection(cand).count)
            // Every typed word is in the known name ("pull ups inside" → "Inside Grip Pull Up"),
            // or every word of a 2+ word known name is in what was typed.
            let covers = input.isSubset(of: cand) || (cand.count >= 2 && cand.isSubset(of: input))
            guard covers else { continue }
            let score = shared / Double(input.union(cand).count)
            if score > (best?.score ?? 0) { best = (name, score) }
        }
        return (best?.score ?? 0) >= 0.5 ? best?.name : nil
    }

    private static let aliases: [String: String] = [
        "pullup": "pull up", "pullups": "pull up", "chinup": "chin up", "chinups": "chin up", "pushup": "push up",
        "pushups": "push up", "ups": "up", "dumbbell": "db", "barbell": "bb", "kettlebell": "kb", "triceps": "tricep",
        "biceps": "bicep", "ezbar": "ez", "single arm": "sa", "kickbacks": "kickback",
    ]
    private static let ignored: Set<String> = ["the", "a", "of", "with", "on", "bar"]

    static func tokens(_ s: String) -> Set<String> {
        var t = " " + s.lowercased().replacingOccurrences(of: "[^a-z0-9 ]", with: " ", options: .regularExpression) + " "
        for (k, v) in aliases { t = t.replacingOccurrences(of: " \(k) ", with: " \(v) ") }
        let words = t.split(separator: " ").map { w -> String in
            var w = String(w)
            if w.count > 3, w.hasSuffix("s"), !w.hasSuffix("ss") { w.removeLast() }
            return w
        }
        return Set(words.filter { !ignored.contains($0) })
    }
}
