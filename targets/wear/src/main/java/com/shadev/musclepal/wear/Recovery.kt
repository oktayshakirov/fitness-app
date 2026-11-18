package com.shadev.musclepal.wear

import java.time.Instant
import java.time.ZoneId
import kotlin.math.ceil
import kotlin.math.roundToInt
import org.json.JSONObject

data class RestingMuscle(val name: String, val readyAt: Long)
data class WidgetData(val isPro: Boolean, val total: Int, val resting: List<RestingMuscle>, val streak: Int, val lastLogAt: Long?)
data class Recovery(val percent: Int, val resting: List<RestingMuscle>, val streak: Int)

fun recovery(data: WidgetData, now: Long, zone: ZoneId = ZoneId.systemDefault()): Recovery {
    val resting = data.resting.filter { it.readyAt > now }
    val today = Instant.ofEpochMilli(now).atZone(zone).toLocalDate()
    val last = data.lastLogAt?.let { Instant.ofEpochMilli(it).atZone(zone).toLocalDate() }
    return Recovery(
        if (data.total > 0) ((data.total - resting.size) * 100.0 / data.total).roundToInt() else 100,
        resting,
        if (last == today || last == today.minusDays(1)) data.streak else 0
    )
}

fun readyIn(muscle: RestingMuscle, now: Long): String {
    val hours = (muscle.readyAt - now).coerceAtLeast(0) / 3600000.0
    if (hours < 24) return "ready in ~${ceil(hours).toInt()} h"
    val days = (hours / 24).roundToInt()
    return "ready in ~$days ${if (days == 1) "day" else "days"}"
}

fun decode(raw: String?): WidgetData? = try {
    raw?.let {
        val json = JSONObject(it)
        val muscles = json.getJSONArray("resting")
        val resting = (0 until muscles.length()).map { index ->
            val m = muscles.getJSONObject(index)
            RestingMuscle(m.getString("name"), m.getDouble("readyAt").toLong())
        }
        val total = json.getInt("total")
        require(total >= 0 && resting.size <= total)
        WidgetData(json.getBoolean("isPro"), total, resting, json.getInt("streak"),
            if (json.isNull("lastLogAt")) null else json.getDouble("lastLogAt").toLong())
    }
} catch (_: Exception) { null }

/** Boundaries for autonomous surfaces, including streak expiry at local midnight. */
fun timelineTimes(data: WidgetData?, now: Long, zone: ZoneId = ZoneId.systemDefault()): List<Long> {
    if (data == null || !data.isPro) return listOf(now)
    val expiry = data.lastLogAt?.let {
        Instant.ofEpochMilli(it).atZone(zone).toLocalDate().plusDays(2).atStartOfDay(zone).toInstant().toEpochMilli()
    }
    return (listOf(now) + data.resting.map { it.readyAt }.filter { it > now } +
        listOfNotNull(expiry?.takeIf { it > now })).distinct().sorted()
}
