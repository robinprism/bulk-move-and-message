import type { Candidate } from "./data";

/** Who candidates hear back from. One person, named, so a reply has somewhere to go. */
const hiringManager = "Robin";

export interface RenderedMessage {
  subject: string;
  text: string;
}

export function renderNextStep(candidate: Candidate): RenderedMessage {
  const firstName = candidate.name.split(" ")[0];
  return {
    subject: "Next step: a conversation about your exercise",
    text: [
      `Hi ${firstName},`,
      "",
      "Thank you for completing the exercise. We'd like to talk through your approach in a 45-minute interview.",
      "",
      "Please reply to this email with two or three times that work for you this week or next.",
      `${hiringManager}, our hiring manager, will confirm a time within two working days.`,
      "",
      `Thanks,`,
      hiringManager,
    ].join("\n"),
  };
}
