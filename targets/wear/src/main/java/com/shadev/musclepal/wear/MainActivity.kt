package com.shadev.musclepal.wear

import android.os.Bundle
import android.content.SharedPreferences
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.Text
import kotlinx.coroutines.delay

private val Lime = Color(0xFFC8FA3C)
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                var data by remember { mutableStateOf(RecoveryStore.load(this)) }
                var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
                DisposableEffect(Unit) {
                    val prefs = RecoveryStore.preferences(this@MainActivity)
                    val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ -> data = RecoveryStore.load(this@MainActivity) }
                    prefs.registerOnSharedPreferenceChangeListener(listener)
                    onDispose { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
                }
                val lifecycle = LocalLifecycleOwner.current.lifecycle
                LaunchedEffect(lifecycle) {
                    lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
                        RecoveryStore.refresh(this@MainActivity)
                        while (true) { now = System.currentTimeMillis(); delay(60000) }
                    }
                }
                val summary = data?.takeIf { it.isPro }?.let { recovery(it, now) }
                ScalingLazyColumn(modifier = Modifier.fillMaxSize().background(Color.Black), horizontalAlignment = Alignment.CenterHorizontally,
                    contentPadding = PaddingValues(horizontal = 24.dp, vertical = 32.dp)) {
                    item { Text("Muscle Pal", fontSize = 16.sp, color = Lime) }
                    if (summary == null) {
                        item { Text(if (data == null) "Open Muscle Pal on your phone to see your recovery here."
                            else "Muscle recovery on your watch is part of Muscle Pal Pro.", textAlign = TextAlign.Center, fontSize = 14.sp) }
                    } else {
                        item {
                            Box(Modifier.size(100.dp), contentAlignment = Alignment.Center) {
                                Canvas(Modifier.fillMaxSize().padding(5.dp)) {
                                    val stroke = Stroke(7.dp.toPx(), cap = StrokeCap.Round)
                                    drawArc(Color.DarkGray, -90f, 360f, false, style = stroke)
                                    drawArc(Lime, -90f, 360f * summary.percent / 100f, false, style = stroke)
                                }
                                Text("${summary.percent}%", fontSize = 26.sp, color = Lime)
                            }
                        }
                        item { Text("recovered", fontSize = 14.sp) }
                        if (summary.streak > 0) item { Text("${summary.streak}-day streak", color = Lime, fontSize = 14.sp) }
                        if (summary.resting.isEmpty()) item { Text("All muscles ready. A good day to train.", textAlign = TextAlign.Center, fontSize = 14.sp) }
                        else {
                            item { Text("Resting", color = Lime, fontSize = 14.sp) }
                            items(summary.resting.size) { index ->
                                val muscle = summary.resting[index]
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(muscle.name, textAlign = TextAlign.Center, fontSize = 16.sp)
                                    Text(readyIn(muscle, now), textAlign = TextAlign.Center, color = Color.LightGray, fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
