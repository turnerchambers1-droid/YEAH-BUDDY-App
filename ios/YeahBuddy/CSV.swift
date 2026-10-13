import Foundation

/// Same CSV format as the web app's Profile → Export/Import:
/// date, workout_name, exercise_name, set_number, weight, reps
enum WorkoutCSV {
    static func export(_ workouts: [Workout]) -> String {
        var rows = [["date", "workout_name", "exercise_name", "set_number", "weight", "reps"]]
        for w in workouts {
            let name = w.name ?? w.split
            for ex in w.exercises {
                for (i, s) in ex.sets.enumerated() {
                    rows.append([w.date, name, ex.name, String(i + 1), s.weight, s.reps])
                }
            }
        }
        return rows.map { $0.map { "\"\($0.replacingOccurrences(of: "\"", with: "\"\""))\"" }.joined(separator: ",") }
            .joined(separator: "\n")
    }

    static func parse(_ text: String) -> [Workout] {
        var map: [String: Workout] = [:]
        var order: [String] = []
        let lines = text.replacingOccurrences(of: "\r\n", with: "\n").split(separator: "\n", omittingEmptySubsequences: true).dropFirst()
        for line in lines {
            let cols = splitRow(String(line))
            guard cols.count >= 3 else { continue }
            let date = cols[0], workoutName = cols[1], exerciseName = cols[2]
            let weight = cols.count > 4 ? cols[4] : ""
            let reps = cols.count > 5 ? cols[5] : ""
            guard !date.isEmpty, !exerciseName.isEmpty else { continue }

            let key = "\(date)__\(workoutName)"
            if map[key] == nil {
                var w = Workout(split: ExerciseCatalog.splitLabels[workoutName] != nil ? workoutName : "custom",
                                name: workoutName.isEmpty || ExerciseCatalog.splitLabels[workoutName] != nil ? nil : workoutName)
                w.date = date
                w.startTime = DateFormatter.ymd.date(from: date) ?? Date()
                map[key] = w
                order.append(key)
            }
            if !map[key]!.exercises.contains(where: { $0.name == exerciseName }) {
                map[key]!.exercises.append(LoggedExercise(name: exerciseName))
            }
            let i = map[key]!.exercises.firstIndex { $0.name == exerciseName }!
            map[key]!.exercises[i].sets.append(LoggedSet(weight: weight, reps: reps))
        }
        return order.compactMap { map[$0] }
    }

    /// Splits one CSV row, honouring quoted fields with "" escapes.
    private static func splitRow(_ line: String) -> [String] {
        var out: [String] = []
        var field = ""
        var inQuotes = false
        var chars = Array(line)
        var i = 0
        while i < chars.count {
            let c = chars[i]
            if inQuotes {
                if c == "\"" {
                    if i + 1 < chars.count, chars[i + 1] == "\"" { field.append("\""); i += 1 } else { inQuotes = false }
                } else {
                    field.append(c)
                }
            } else if c == "\"" {
                inQuotes = true
            } else if c == "," {
                out.append(field.trimmingCharacters(in: .whitespaces)); field = ""
            } else {
                field.append(c)
            }
            i += 1
        }
        out.append(field.trimmingCharacters(in: .whitespaces))
        chars.removeAll()
        return out
    }
}
