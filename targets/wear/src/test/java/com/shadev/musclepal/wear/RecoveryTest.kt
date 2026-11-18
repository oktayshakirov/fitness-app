package com.shadev.musclepal.wear

import org.junit.Assert.*
import org.junit.Test
import java.time.ZoneId
import java.time.ZonedDateTime

class RecoveryTest {
    private val zone = ZoneId.of("Europe/Berlin")
    private val noon = ZonedDateTime.of(2026, 11, 10, 12, 0, 0, 0, zone).toInstant().toEpochMilli()
    private val hour = 3600000L
    private val data = WidgetData(true, 4, listOf(RestingMuscle("Chest", noon + 10 * hour), RestingMuscle("Triceps", noon + 2 * hour)), 3, noon - hour)
    @Test fun recoveryAdvancesWithoutPhone() {
        assertEquals(50, recovery(data, noon, zone).percent)
        assertEquals(listOf("Chest", "Triceps"), recovery(data, noon, zone).resting.map { it.name })
        assertEquals(75, recovery(data, noon + 2 * hour, zone).percent)
        assertEquals(listOf("Chest"), recovery(data, noon + 3 * hour, zone).resting.map { it.name })
        assertEquals(100, recovery(data, noon + 11 * hour, zone).percent)
        assertEquals(100, recovery(data.copy(total = 0, resting = emptyList()), noon, zone).percent)
    }
    @Test fun streakUsesLocalCalendarDays() {
        assertEquals(3, recovery(data, noon + 24 * hour, zone).streak)
        assertEquals(0, recovery(data, noon + 48 * hour, zone).streak)
        assertEquals(0, recovery(data.copy(lastLogAt = null), noon, zone).streak)
        assertEquals(0, recovery(data.copy(lastLogAt = noon + 48 * hour), noon, zone).streak)
    }
    @Test fun readyInMatchesPhoneWording() {
        assertEquals("ready in ~10 h", readyIn(data.resting[0], noon))
        assertEquals("ready in ~1 h", readyIn(RestingMuscle("Back", noon + 1), noon))
        assertEquals("ready in ~1 day", readyIn(RestingMuscle("Back", noon + 24 * hour), noon))
        assertEquals("ready in ~2 days", readyIn(RestingMuscle("Back", noon + 36 * hour), noon))
    }
    @Test fun timelineIncludesStreakExpiryAndFinalRecovery() {
        val expiry = ZonedDateTime.of(2026, 11, 12, 0, 0, 0, 0, zone).toInstant().toEpochMilli()
        assertEquals(listOf(noon, noon + 2 * hour, noon + 10 * hour, expiry), timelineTimes(data, noon, zone))
        assertEquals(listOf(noon), timelineTimes(data.copy(isPro = false), noon, zone))
        assertEquals(listOf(noon), timelineTimes(null, noon, zone))
    }
    @Test fun decodingRejectsInvalidData() {
        assertNull(decode(null)); assertNull(decode("bad")); assertNull(decode("{}"))
        val raw = """{"isPro":false,"total":4,"resting":[{"name":"Chest","readyAt":1234.5}],"streak":3,"lastLogAt":null}"""
        assertEquals(WidgetData(false, 4, listOf(RestingMuscle("Chest", 1234)), 3, null), decode(raw))
    }
    @Test fun daylightSavingUsesMidnightRatherThan24Hours() {
        val last = ZonedDateTime.of(2026, 3, 28, 23, 30, 0, 0, zone).toInstant().toEpochMilli()
        val now = ZonedDateTime.of(2026, 3, 30, 0, 1, 0, 0, zone).toInstant().toEpochMilli()
        assertEquals(0, recovery(data.copy(lastLogAt = last), now, zone).streak)
    }
}
