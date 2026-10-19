package com.turnerchambers.yeahbuddy.data

/**
 * Same CSV format as the web app's / iOS app's Profile → Export/Import:
 * date, workout_name, exercise_name, set_number, weight, reps
 */
object WorkoutCSV {
    fun export(workouts: List<Workout>): String {
        val rows = mutableListOf(listOf("date", "workout_name", "exercise_name", "set_number", "weight", "reps"))
        for (w in workouts) {
            val name = w.name ?: w.split
            for (ex in w.exercises) {
                ex.sets.forEachIndexed { i, s ->
                    rows.add(listOf(w.date, name, ex.name, (i + 1).toString(), s.weight, s.reps))
                }
            }
        }
        return rows.joinToString("\n") { r -> r.joinToString(",") { "\"" + it.replace("\"", "\"\"") + "\"" } }
    }

    fun parse(text: String): List<Workout> {
        val map = LinkedHashMap<String, Workout>()
        val lines = text.replace("\r\n", "\n").split("\n").filter { it.isNotEmpty() }.drop(1)
        for (line in lines) {
            val cols = splitRow(line)
            if (cols.size < 3) continue
            val date = cols[0]; val workoutName = cols[1]; val exerciseName = cols[2]
            val weight = if (cols.size > 4) cols[4] else ""
            val reps = if (cols.size > 5) cols[5] else ""
            if (date.isEmpty() || exerciseName.isEmpty()) continue

            val key = "${date}__$workoutName"
            val known = ExerciseCatalog.splitLabels[workoutName] != null
            var w = map[key] ?: Workout(
                split = if (known) workoutName else "custom",
                name = if (workoutName.isEmpty() || known) null else workoutName,
                date = date,
                startTime = Ymd.parse(date) ?: nowMs(),
            )
            var exercises = w.exercises
            if (exercises.none { it.name == exerciseName }) exercises = exercises + LoggedExercise(name = exerciseName)
            exercises = exercises.map { if (it.name == exerciseName) it.copy(sets = it.sets + LoggedSet(weight = weight, reps = reps)) else it }
            w = w.copy(exercises = exercises)
            map[key] = w
        }
        return map.values.toList()
    }

    /** Splits one CSV row, honouring quoted fields with "" escapes. */
    private fun splitRow(line: String): List<String> {
        val out = mutableListOf<String>()
        val field = StringBuilder()
        var inQuotes = false
        var i = 0
        while (i < line.length) {
            val c = line[i]
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < line.length && line[i + 1] == '"') { field.append('"'); i++ } else inQuotes = false
                } else field.append(c)
            } else if (c == '"') {
                inQuotes = true
            } else if (c == ',') {
                out.add(field.toString().trim()); field.clear()
            } else field.append(c)
            i++
        }
        out.add(field.toString().trim())
        return out
    }
}
