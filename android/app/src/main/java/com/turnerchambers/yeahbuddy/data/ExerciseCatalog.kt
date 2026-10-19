package com.turnerchambers.yeahbuddy.data

// Port of ios/Shared/ExerciseCatalog.swift (from workout-app/src/data/exercises.js).

object ExerciseCatalog {
    val muscleLabels: List<Pair<String, String>> = listOf(
        "chest" to "Chest", "front_delt" to "Front Delt", "side_delt" to "Side Delt", "rear_delt" to "Rear Delt",
        "biceps" to "Biceps", "forearms" to "Forearms", "triceps" to "Triceps", "traps" to "Traps",
        "lats" to "Lats", "mid_back" to "Mid Back", "lower_back" to "Lower Back", "abs" to "Abs",
        "glutes" to "Glutes", "hamstrings" to "Hamstrings", "quads" to "Quads", "calves" to "Calves",
        "adductors" to "Adductors", "abductors" to "Abductors",
    )

    fun muscleLabel(id: String): String = muscleLabels.firstOrNull { it.first == id }?.second ?: id

    val splits = listOf("ChestBi", "BackTri", "Shoulders", "LegsAbs")

    val splitLabels: Map<String, String> = mapOf(
        "ChestBi" to "Chest & Bi",
        "BackTri" to "Back & Tri",
        "Shoulders" to "Shoulders & Abs",
        "LegsAbs" to "Legs",
    )

    fun splitLabel(split: String?): String {
        if (split == null) return "Workout"
        return splitLabels[split] ?: if (split == "custom") "Custom" else split
    }

    /** Muscle group tabs relevant to each split — preselects the exercise picker filters. */
    val splitMuscleGroups: Map<String, List<String>> = mapOf(
        "ChestBi" to listOf("Chest", "Bicep", "Forearm"),
        "BackTri" to listOf("Back", "Tricep"),
        "Shoulders" to listOf("Shoulder", "Rear Delt", "Trap", "Abs"),
        "LegsAbs" to listOf("Quad", "Hamstring", "Glute", "Calf"),
    )

    /** Equipment you can pick for an exercise, and the short tag each one shows as. */
    val equipmentOptions = listOf(
        "Barbell", "Camber Bar", "EZ Bar", "Hex Bar", "Smith Machine", "Dumbbell", "Kettlebell",
        "Cable", "Machine", "Plate-Loaded", "Bodyweight", "Other",
    )
    val equipmentTags: Map<String, String> = mapOf(
        "barbell" to "BB", "camber bar" to "Camber", "ez bar" to "EZ", "hex bar" to "Hex", "smith machine" to "Smith",
        "dumbbell" to "DB", "kettlebell" to "KB", "cable" to "Cable", "machine" to "Machine", "plate-loaded" to "Plate",
        "bodyweight" to "BW", "other" to "Other",
    )
    /** Order of the equipment filter chips in the exercise picker. */
    val equipmentTagOrder = listOf("BB", "Camber", "EZ", "Hex", "Smith", "DB", "KB", "Cable", "Machine", "Plate", "BW", "Other")

    /** The equipment option (full name) behind a short tag, for pre-selecting the editor. */
    fun equipmentOption(forTag: String?): String? {
        if (forTag == null) return null
        val k = equipmentTags.entries.firstOrNull { it.value == forTag }?.key ?: return null
        return equipmentOptions.firstOrNull { it.lowercase() == k } ?: k
    }

    private val refinable: Map<String, Set<String>> = mapOf(
        "Machine" to setOf("Plate", "Smith"),
        "BB" to setOf("Camber", "Hex", "EZ", "Smith"),
        "Other" to setOf("Plate", "Smith", "Camber", "Hex", "EZ"),
    )

    /**
     * Infer the short equipment tag for an exercise. An explicit choice wins, except that the
     * generic ones (Machine / Barbell / Other) get refined from the name.
     */
    fun inferEquipment(name: String, equipment: String? = null): String? {
        val fromName = inferFromName(name)
        if (!equipment.isNullOrEmpty()) {
            val tag = equipmentTags[equipment.lowercase()] ?: equipment
            if (fromName != null && refinable[tag]?.contains(fromName) == true) return fromName
            return tag
        }
        return fromName
    }

    private fun inferFromName(name: String): String? {
        val n = name.lowercase()
        fun word(w: String) = Regex("\\b$w\\b").containsMatchIn(n)

        if (n.startsWith("kb ") || n.contains(" kb ") || n.endsWith(" kb")) return "KB"
        if (n.contains("camber")) return "Camber"
        if (n.contains("hex bar") || word("hb")) return "Hex"
        if (n.contains("smith")) return "Smith"
        if (word("ez") || n.contains("curl bar")) return "EZ"
        if (word("bb")) return "BB"
        if (word("db")) return "DB"
        if (n.contains("cable") || n.contains("mag grip") || n.contains("rope ")) return "Cable"
        if (n.contains("plate")) return "Plate"
        if (n.contains("machine") || n.contains("assisted")) return "Machine"
        if (n.contains("pushdown") || n.contains("pull down")) return "Cable"
        if (n.contains("dips") || n.contains("push up") || n.contains("pull up") || n.contains("chin up")) return "BW"
        if (n.contains("face pull")) return "Cable"
        if (n.contains("back squat") || n.contains("front squat") || n.contains("t bar") || n.contains("hang clean")) return "BB"
        if (n.contains("hack squat") || n.contains("belt squat")) return "Machine"
        if (n.contains("leg press") || n.contains("leg curl") || n.contains("leg extension")) return "Machine"
        if (n.contains("calf raise")) return "Machine"
        if (n.contains("abduction") || n.contains("adduction")) return "Machine"
        if (n.contains("prone leg") || n.contains("glute back")) return "Machine"
        if (n.contains("lat push") || (n.contains("row") && n.contains("cable"))) return "Cable"
        return null
    }

    /** Split a name into a readable base name + descriptor tags (UI only; data keys unchanged). */
    fun parseDisplay(name: String): Pair<String, List<String>> {
        val lead = setOf("KB", "SA", "DA", "SL", "HB", "DB", "BB", "EZ", "MAG", "Cable")
        val trail = setOf("DB", "BB", "EZ", "Machine", "Cable")
        val words = name.trim().split(Regex("\\s+")).filter { it.isNotEmpty() }.toMutableList()
        val tags = mutableListOf<String>()
        while (words.size > 1 && words[0] in lead) tags.add(words.removeAt(0))
        while (words.size > 1 && words.last() in trail) tags.add(words.removeAt(words.size - 1))
        return words.joinToString(" ") to tags.distinct()
    }

    /** Every query word must appear somewhere in the name, muscles or equipment, in any order. */
    fun matchesSearch(ex: ExerciseDef, query: String): Boolean {
        val q = query.lowercase().trim()
        if (q.isEmpty()) return true
        val haystack = (listOf(ex.name, ex.muscleGroup) + ex.primaryMuscles + ex.secondaryMuscles + listOf(ex.equipment ?: ""))
            .joinToString(" ").lowercase().replace("_", " ")
        return q.split(Regex("\\s+")).filter { it.isNotEmpty() }.all { haystack.contains(it) }
    }

    val builtIn: List<ExerciseDef> get() = ExerciseCatalogData.builtIn

    fun find(name: String, custom: List<ExerciseDef>): ExerciseDef? =
        builtIn.firstOrNull { it.name == name } ?: custom.firstOrNull { it.name == name }
}
