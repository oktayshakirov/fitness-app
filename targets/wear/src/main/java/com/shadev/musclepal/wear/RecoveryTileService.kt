package com.shadev.musclepal.wear

import androidx.wear.tiles.*
import androidx.wear.protolayout.LayoutElementBuilders.*
import androidx.wear.protolayout.DimensionBuilders.*
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.ModifiersBuilders.*
import androidx.wear.protolayout.ActionBuilders.*
import androidx.wear.protolayout.TimelineBuilders.*
import androidx.wear.protolayout.ResourceBuilders
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

class RecoveryTileService : TileService() {
    private fun line(value: String, size: Float = 14f, lime: Boolean = false) = Text.Builder().setText(value)
        .setFontStyle(FontStyle.Builder().setSize(sp(size)).setColor(argb(if (lime) 0xFFC8FA3C.toInt() else 0xFFFFFFFF.toInt())).build())
        .setMaxLines(2).setMultilineAlignment(TEXT_ALIGN_CENTER).build()

    private fun layout(data: WidgetData?, now: Long, screen: Int): Layout {
        val view = data?.takeIf { it.isPro }?.let { recovery(it, now) }
        val content = Column.Builder().setHorizontalAlignment(HORIZONTAL_ALIGN_CENTER)
        content.addContent(line("Muscle Pal", 12f, true))
        if (view == null) content.addContent(line(if (data == null) "Open Muscle Pal on your phone" else "Muscle Pal Pro required"))
        else {
            content.addContent(line("${view.percent}%", 26f, true)).addContent(line("recovered", 12f))
            if (view.streak > 0) content.addContent(line("${view.streak}-day streak", 12f, true))
            if (view.resting.isEmpty()) content.addContent(line("All muscles ready", 12f))
            else view.resting.take(3).forEach { content.addContent(line(it.name, 12f)) }
        }
        val size = (screen - 20).coerceAtLeast(120).toFloat()
        val box = Box.Builder().setWidth(dp(size)).setHeight(dp(size))
            .setModifiers(Modifiers.Builder().setClickable(Clickable.Builder().setId("open")
                .setOnClick(LaunchAction.Builder().setAndroidActivity(AndroidActivity.Builder()
                    .setPackageName(packageName).setClassName(MainActivity::class.java.name).build()).build()).build()).build())
        if (view != null) box.addContent(Arc.Builder()
            .addContent(ArcLine.Builder().setLength(degrees(360f * view.percent / 100f)).setThickness(dp(4f)).setColor(argb(0xFFC8FA3C.toInt())).build()).build())
        box.addContent(content.build())
        return Layout.Builder().setRoot(box.build()).build()
    }
    override fun onTileRequest(requestParams: RequestBuilders.TileRequest): ListenableFuture<TileBuilders.Tile> {
        val data = RecoveryStore.load(this)
        val times = timelineTimes(data, System.currentTimeMillis())
        val timeline = Timeline.Builder()
        times.forEachIndexed { index, start ->
            val entry = TimelineEntry.Builder().setLayout(layout(data, start, requestParams.deviceConfiguration.screenWidthDp))
            if (index < times.lastIndex) entry.setValidity(TimeInterval.Builder().setStartMillis(start).setEndMillis(times[index + 1]).build())
            // The final state is the timeless fallback, used after every recovery has ended.
            timeline.addTimelineEntry(entry.build())
        }
        return Futures.immediateFuture(TileBuilders.Tile.Builder().setResourcesVersion("1")
            .setFreshnessIntervalMillis(3600000).setTileTimeline(timeline.build()).build())
    }
    override fun onTileResourcesRequest(requestParams: RequestBuilders.ResourcesRequest): ListenableFuture<ResourceBuilders.Resources> =
        Futures.immediateFuture(ResourceBuilders.Resources.Builder().setVersion("1").build())
}
