import Foundation

// Port of workout-app/src/data/exercises.js (everything except the raw list,
// which lives in ExerciseCatalogData.swift).

struct ExerciseDef: Codable, Hashable, Identifiable {
    var id: String { name }
    var name: String
    var split: String
    var muscleGroup: String
    var primaryMuscles: [String]
    var secondaryMuscles: [String]
    var equipment: String? = nil
    var custom: Bool = false
}

enum ExerciseCatalog {
    static let muscleLabels: [(id: String, label: String)] = [
        ("chest", "Chest"), ("front_delt", "Front Delt"), ("side_delt", "Side Delt"), ("rear_delt", "Rear Delt"),
        ("biceps", "Biceps"), ("forearms", "Forearms"), ("triceps", "Triceps"), ("traps", "Traps"),
        ("lats", "Lats"), ("mid_back", "Mid Back"), ("lower_back", "Lower Back"), ("abs", "Abs"),
        ("glutes", "Glutes"), ("hamstrings", "Hamstrings"), ("quads", "Quads"), ("calves", "Calves"),
        ("adductors", "Adductors"), ("abductors", "Abductors"),
    ]

    static func muscleLabel(_ id: String) -> String {
        muscleLabels.first { $0.id == id }?.label ?? id
    }

    static let splits = ["ChestBi", "BackTri", "Shoulders", "LegsAbs"]

    static let splitLabels: [String: String] = [
        "ChestBi": "Chest & Bi",
        "BackTri": "Back & Tri",
        "Shoulders": "Shoulders & Abs",
        "LegsAbs": "Legs",
    ]

    static func splitLabel(_ split: String?) -> String {
        guard let split else { return "Workout" }
        return splitLabels[split] ?? (split == "custom" ? "Custom" : split)
    }

    // Muscle group tabs relevant to each split — preselects the exercise picker filters.
    static let splitMuscleGroups: [String: [String]] = [
        "ChestBi": ["Chest", "Bicep", "Forearm"],
        "BackTri": ["Back", "Tricep"],
        "Shoulders": ["Shoulder", "Rear Delt", "Trap", "Abs"],
        "LegsAbs": ["Quad", "Hamstring", "Glute", "Calf"],
    ]

    /// Equipment you can pick for an exercise, and the short tag each one shows as.
    static let equipmentOptions = ["Barbell", "Camber Bar", "EZ Bar", "Hex Bar", "Smith Machine", "Dumbbell", "Kettlebell",
                                   "Cable", "Machine", "Plate-Loaded", "Bodyweight", "Other"]
    static let equipmentTags: [String: String] = [
        "barbell": "BB", "camber bar": "Camber", "ez bar": "EZ", "hex bar": "Hex", "smith machine": "Smith",
        "dumbbell": "DB", "kettlebell": "KB", "cable": "Cable", "machine": "Machine", "plate-loaded": "Plate",
        "bodyweight": "BW", "other": "Other",
    ]
    /// Order of the equipment filter chips in the exercise picker.
    static let equipmentTagOrder = ["BB", "Camber", "EZ", "Hex", "Smith", "DB", "KB", "Cable", "Machine", "Plate", "BW", "Other"]

    /// The equipment option (full name) behind a short tag, for pre-selecting the editor.
    static func equipmentOption(forTag tag: String?) -> String? {
        guard let tag else { return nil }
        return equipmentTags.first { $0.value == tag }.map { k, _ in equipmentOptions.first { $0.lowercased() == k } ?? k }
    }

    /// Infer the short equipment tag for an exercise. An explicit choice wins, except that the
    /// generic ones (Machine / Barbell / Other) get refined from the name — e.g. "Plate fly"
    /// set to Machine shows as Plate, "Camber bar row" set to Barbell shows as Camber.
    static func inferEquipment(name: String, equipment: String? = nil) -> String? {
        let fromName = inferFromName(name)
        if let equipment, !equipment.isEmpty {
            let e = equipment.lowercased()
            let tag = equipmentTags[e] ?? equipment
            let refinable: [String: Set<String>] = [
                "Machine": ["Plate", "Smith"], "BB": ["Camber", "Hex", "EZ", "Smith"], "Other": ["Plate", "Smith", "Camber", "Hex", "EZ"],
            ]
            if let fromName, refinable[tag]?.contains(fromName) == true { return fromName }
            return tag
        }
        return fromName
    }

    private static func inferFromName(_ name: String) -> String? {
        let n = name.lowercased()
        func word(_ w: String) -> Bool { n.range(of: "\\b\(w)\\b", options: .regularExpression) != nil }

        if n.hasPrefix("kb ") || n.contains(" kb ") || n.hasSuffix(" kb") { return "KB" }
        if n.contains("camber") { return "Camber" }
        if n.contains("hex bar") || word("hb") { return "Hex" }
        if n.contains("smith") { return "Smith" }
        if word("ez") || n.contains("curl bar") { return "EZ" }
        if word("bb") { return "BB" }
        if word("db") { return "DB" }
        if n.contains("cable") || n.contains("mag grip") || n.contains("rope ") { return "Cable" }
        if n.contains("plate") { return "Plate" }
        if n.contains("machine") || n.contains("assisted") { return "Machine" }
        if n.contains("pushdown") || n.contains("pull down") { return "Cable" }
        if n.contains("dips") || n.contains("push up") || n.contains("pull up") || n.contains("chin up") { return "BW" }
        if n.contains("face pull") { return "Cable" }
        if n.contains("back squat") || n.contains("front squat") || n.contains("t bar") || n.contains("hang clean") { return "BB" }
        if n.contains("hack squat") || n.contains("belt squat") { return "Machine" }
        if n.contains("leg press") || n.contains("leg curl") || n.contains("leg extension") { return "Machine" }
        if n.contains("calf raise") { return "Machine" }
        if n.contains("abduction") || n.contains("adduction") { return "Machine" }
        if n.contains("prone leg") || n.contains("glute back") { return "Machine" }
        if n.contains("lat push") || (n.contains("row") && n.contains("cable")) { return "Cable" }
        return nil
    }

    static func inferEquipment(_ def: ExerciseDef) -> String? {
        inferEquipment(name: def.name, equipment: def.equipment)
    }

    /// Split a name into a readable base name + descriptor tags (UI only; data keys unchanged).
    static func parseDisplay(_ name: String) -> (displayName: String, tags: [String]) {
        let lead = ["KB", "SA", "DA", "SL", "HB", "DB", "BB", "EZ", "MAG", "Cable"]
        let trail = ["DB", "BB", "EZ", "Machine", "Cable"]
        var words = name.trimmingCharacters(in: .whitespaces).split(whereSeparator: \.isWhitespace).map(String.init)
        var tags: [String] = []
        while words.count > 1, lead.contains(words[0]) { tags.append(words.removeFirst()) }
        while words.count > 1, let last = words.last, trail.contains(last) { tags.append(words.removeLast()) }
        var seen = Set<String>()
        return (words.joined(separator: " "), tags.filter { seen.insert($0).inserted })
    }

    /// Every query word must appear somewhere in the name, muscles or equipment, in any order.
    static func matchesSearch(_ ex: ExerciseDef, _ query: String) -> Bool {
        let q = query.lowercased().trimmingCharacters(in: .whitespaces)
        if q.isEmpty { return true }
        let haystack = ([ex.name, ex.muscleGroup] + ex.primaryMuscles + ex.secondaryMuscles + [ex.equipment ?? ""])
            .joined(separator: " ").lowercased().replacingOccurrences(of: "_", with: " ")
        return q.split(whereSeparator: \.isWhitespace).allSatisfy { haystack.contains($0) }
    }

    static func find(_ name: String, custom: [ExerciseDef]) -> ExerciseDef? {
        builtIn.first { $0.name == name } ?? custom.first { $0.name == name }
    }
}
