import { Screen, Heading, Empty } from "../../src/components/ui";
export default function Exercises() {
  return (
    <Screen>
      <Heading title="All exercises" />
      <Empty
        title="30 approved exercises"
        description="Your offline exercise library is ready."
      />
    </Screen>
  );
}
