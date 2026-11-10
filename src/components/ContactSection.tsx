import { Group, Row, SectionTitle } from "./ui";
import {
  TIKTOK_URL,
  YOUTUBE_URL,
  openLink,
  rateApp,
  reportBug,
  suggestFeature,
  workWithUs,
} from "../contact/contact";

export function ContactSection() {
  return (
    <>
      <SectionTitle title="Help us improve" />
      <Group>
        <Row title="Report a bug" icon="bug-outline" onPress={reportBug} />
        <Row title="Suggest a feature" icon="bulb-outline" onPress={suggestFeature} />
        <Row title="Rate Muscle Pal" icon="star-outline" onPress={() => void rateApp()} />
      </Group>
      <SectionTitle title="Follow us" />
      <Group>
        <Row
          title="TikTok"
          icon="logo-tiktok"
          value={TIKTOK_URL ? undefined : "Soon"}
          onPress={TIKTOK_URL ? () => openLink(TIKTOK_URL) : undefined}
        />
        <Row
          title="YouTube"
          icon="logo-youtube"
          value={YOUTUBE_URL ? undefined : "Soon"}
          onPress={YOUTUBE_URL ? () => openLink(YOUTUBE_URL) : undefined}
        />
      </Group>
      <SectionTitle title="Business" />
      <Group>
        <Row title="Work with us" icon="rocket-outline" onPress={workWithUs} />
      </Group>
    </>
  );
}
