import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "expo-image";
import { useIsFocused } from "expo-router";
import { content, mediaBackground } from "../content";
import type { ExerciseView } from "../content/types";
import { colors, themed } from "../theme";
import { IconButton, s } from "./ui";
/** Slow motion stays on for the next exercise opened in this session. */
let slowMotion = false;
/** One decoder for this detail route. Source replacements are serialized; stale loads never play. */
export function ExerciseVideo({
  media,
  visible,
}: {
  media: ExerciseView;
  visible: boolean;
}) {
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === "active");
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState("");
  const [firstFrame, setFirstFrame] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [slow, setSlow] = useState(slowMotion);
  const queue = useRef(Promise.resolve());
  const path = media.video.path;
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setActive(state === "active");
      if (state !== "active") player.pause();
    });
    return () => sub.remove();
  }, [player]);
  useEffect(() => {
    let current = true;
    player.pause();
    setLoaded("");
    setFirstFrame("");
    setError(false);
    setPaused(false);
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        if (!current) return;
        try {
          await player.replaceAsync(content.resolve(media.video));
          if (current) setLoaded(path);
        } catch {
          if (current) setError(true);
        }
      });
    return () => {
      current = false;
      player.pause();
    };
  }, [player, path, attempt]);
  useEffect(() => {
    const sub = player.addListener("statusChange", (event) => {
      if (event.status === "error") setError(true);
    });
    return () => sub.remove();
  }, [player]);
  useEffect(() => {
    if (focused && active && visible && !paused && loaded === path && !error) {
      // Only set the rate when playing: on iOS a non-zero rate starts playback.
      player.playbackRate = slow ? 0.5 : 1;
      player.play();
    } else player.pause();
    return () => player.pause();
  }, [player, focused, active, visible, paused, loaded, path, error, slow]);
  return (
    <View style={styles.container}>
      {loaded === path && (
        <VideoView
          key={path + attempt}
          player={player}
          style={StyleSheet.absoluteFill}
          nativeControls={false}
          contentFit="contain"
          surfaceType="textureView"
          onFirstFrameRender={() => setFirstFrame(path)}
        />
      )}
      {(firstFrame !== path || error) && (
        <Image
          pointerEvents="none"
          source={content.resolve(media.poster)}
          contentFit="contain"
          style={StyleSheet.absoluteFill}
          cachePolicy="memory-disk"
        />
      )}
      <View style={styles.controls}>
        {!error && (
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="Slow motion"
            accessibilityHint="Plays the loop at half speed"
            accessibilityState={{ checked: slow }}
            hitSlop={4}
            onPress={() => {
              slowMotion = !slow;
              setSlow(!slow);
            }}
            style={({ pressed }) => [
              styles.speed,
              slow && { backgroundColor: colors.accent },
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={{ color: slow ? colors.onAccent : "#FFFFFF", fontSize: 14, fontWeight: "600" }}>0.5×</Text>
          </Pressable>
        )}
        <View style={styles.pill}>
          <IconButton
            plain
            name={error ? "refresh" : paused ? "play" : "pause"}
            label={error ? "Retry video" : paused ? "Play video" : "Pause video"}
            onPress={() => (error ? setAttempt((a) => a + 1) : setPaused((p) => !p))}
          />
        </View>
      </View>
      {error && (
        <View accessibilityLiveRegion="polite" style={styles.error}>
          <Text style={s.footnote}>Video unavailable. Tap retry.</Text>
        </View>
      )}
    </View>
  );
}
const styles = themed(() => ({
  container: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: mediaBackground,
    borderRadius: 24,
    overflow: "hidden",
  },
  controls: {
    position: "absolute",
    right: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 8,
  },
  pill: { borderRadius: 22, backgroundColor: "rgba(0,0,0,0.55)" },
  speed: {
    minWidth: 56,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  error: {
    position: "absolute",
    left: 12,
    bottom: 16,
    right: 64,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
}));
