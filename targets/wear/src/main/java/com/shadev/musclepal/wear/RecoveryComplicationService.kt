package com.shadev.musclepal.wear

import android.app.PendingIntent
import android.content.Intent
import androidx.wear.watchface.complications.data.*
import androidx.wear.watchface.complications.datasource.*
import java.time.Instant

class RecoveryComplicationService : SuspendingTimelineComplicationDataSourceService() {
    private fun text(value: String) = PlainComplicationText.Builder(value).build()
    private fun render(type: ComplicationType, data: WidgetData?, now: Long): ComplicationData {
        val view = data?.takeIf { it.isPro }?.let { recovery(it, now) }
        val short = if (data == null) "Open app" else if (!data.isPro) "Pro" else "${view!!.percent}%"
        val long = if (view == null) short else "${view.percent}% · ${view.resting.joinToString { it.name }.ifEmpty { "All ready" }}"
        val description = text(if (view == null) short else "${view.percent}% recovered")
        val tap = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        return when (type) {
            ComplicationType.RANGED_VALUE -> RangedValueComplicationData.Builder(view?.percent?.toFloat() ?: 0f, 0f, 100f, description)
                .setText(text(short)).setTapAction(tap).build()
            ComplicationType.SHORT_TEXT -> ShortTextComplicationData.Builder(text(short), description).setTapAction(tap).build()
            ComplicationType.LONG_TEXT -> LongTextComplicationData.Builder(text(long), description).setTapAction(tap).build()
            else -> NoDataComplicationData()
        }
    }
    override suspend fun onComplicationRequest(request: ComplicationRequest): ComplicationDataTimeline {
        val data = RecoveryStore.load(this)
        val times = timelineTimes(data, System.currentTimeMillis())
        return ComplicationDataTimeline(
            defaultComplicationData = render(request.complicationType, data, times.last()),
            timelineEntries = times.zipWithNext { start, end ->
                TimelineEntry(TimeInterval(Instant.ofEpochMilli(start), Instant.ofEpochMilli(end)), render(request.complicationType, data, start))
            }
        )
    }
    override fun getPreviewData(type: ComplicationType): ComplicationData =
        render(type, WidgetData(true, 4, listOf(RestingMuscle("Chest", Long.MAX_VALUE)), 3, null), 0)
}
