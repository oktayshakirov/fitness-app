package com.shadev.musclepal.wear

import android.content.ComponentName
import android.content.Context
import android.net.Uri
import androidx.wear.tiles.TileService
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
import com.google.android.gms.wearable.*
import kotlinx.coroutines.tasks.await

object RecoveryStore {
    fun preferences(context: Context) = context.getSharedPreferences("recovery", Context.MODE_PRIVATE)
    fun load(context: Context) = decode(preferences(context).getString("data", null))
    fun save(context: Context, raw: String) {
        if (decode(raw) == null) return
        // commit before notifying other services, which may read immediately.
        if (preferences(context).edit().putString("data", raw).commit()) {
            TileService.getUpdater(context).requestUpdate(RecoveryTileService::class.java)
            ComplicationDataSourceUpdateRequester.create(context,
                ComponentName(context, RecoveryComplicationService::class.java)).requestUpdateAll()
        }
    }
    suspend fun refresh(context: Context) {
        try {
            val items = Wearable.getDataClient(context).getDataItems(Uri.parse("wear://*/recovery")).await()
            try {
                for (item in items) DataMapItem.fromDataItem(item).dataMap.getString("data")?.let { save(context, it) }
            } finally { items.release() }
        } catch (_: Exception) { /* Cached data works offline. */ }
    }
}

class RecoveryListenerService : WearableListenerService() {
    override fun onDataChanged(events: DataEventBuffer) {
        for (event in events) {
            if (event.type == DataEvent.TYPE_CHANGED && event.dataItem.uri.path == "/recovery") {
                DataMapItem.fromDataItem(event.dataItem).dataMap.getString("data")?.let { RecoveryStore.save(this, it) }
            }
        }
    }
}
