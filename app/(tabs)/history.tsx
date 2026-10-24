import { Screen, Heading, Empty } from "../../src/components/ui";
export default function History() {
  return (
    <Screen>
      <Heading title="History" />
      <Empty
        title="Your progress starts here"
        description="Logged exercises will appear in your history."
      />
    </Screen>
  );
}
