# Recovery calculation

The engine is a pure function of log snapshots, an explicit current timestamp and
recovery speed. It does not depend on the current exercise catalogue, so content
updates cannot rewrite past muscle assignments.

Implementation choices for the MVP's volume scaling:

- A done-only entry counts as 0.5 of a session.
- Sets contribute total repetitions / 30, capped at 1 per entry. Weight is excluded;
  the app does not know the person's relative effort.
- Primary contribution is 1, secondary is 0.5. A muscle accidentally listed in both
  gets the primary contribution once.
- Each contribution fades linearly over its muscle window. Contributions from
  separate entries add together; displayed fatigue is capped at 1 after summation.
- Ready-in time is the latest remaining positive contribution's expiry, rounded up
  to whole hours. Future-dated entries do not affect current recovery.
- Large groups use 72 hours, medium 60, small 48, as listed in MVP.md. Fast multiplies
  those windows by 0.75; slow by 1.25.
- Trained is above 0.66, Recovering includes 0.33 through 0.66, Almost ready is above
  zero and below 0.33, and Ready is zero.

These are product estimates, not a measurement of physiological recovery. Tests
cover all state boundaries, session overlap, caps, exact expiry, speed, future
entries and primary/secondary weighting. Visual body acceptance requires approved
matching base images and masks; engine tests do not substitute for that check.
