import { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "expo-image";
import { useIsFocused } from "expo-router";
import { content } from "../content";
import type { ExerciseView } from "../content/types";
import { colors } from "../theme";
import { IconButton, s } from "./ui";
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
    if (focused && active && visible && !paused && loaded === path && !error)
      player.play();
    else player.pause();
    return () => player.pause();
  }, [player, focused, active, visible, paused, loaded, path, error]);
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
        <IconButton
          name={error ? "refresh" : paused ? "play" : "pause"}
          label={error ? "Retry video" : paused ? "Play video" : "Pause video"}
          onPress={() =>
            error ? setAttempt((a) => a + 1) : setPaused((p) => !p)
          }
        />
      </View>
      {error && (
        <View style={styles.error}>
          <Text style={s.footnote}>Video unavailable. Tap retry.</Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 4 / 5,
    backgroundColor: colors.video,
    borderRadius: 16,
    overflow: "hidden",
  },
  controls: { position: "absolute", right: 12, bottom: 12 },
  error: { position: "absolute", left: 12, bottom: 16, right: 64 },
});
