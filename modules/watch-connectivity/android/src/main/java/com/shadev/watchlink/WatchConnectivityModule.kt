package com.shadev.watchlink

import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WatchConnectivityModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("MusclePalWatchLink")
        Function("send") { json: String ->
            val context = appContext.reactContext ?: return@Function
            try {
                val request = PutDataMapRequest.create("/recovery").apply {
                    dataMap.putString("data", json)
                }.asPutDataRequest().setUrgent()
                // Asynchronous and best effort; absence of Play Services or a watch is normal.
                Wearable.getDataClient(context).putDataItem(request).addOnFailureListener { }
            } catch (_: Exception) { }
        }
    }
}
