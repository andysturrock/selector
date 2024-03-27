export function generateImmediateSlackResponseBlocks() {
  const blocks = {
    response_type: "ephemeral",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Thinking...`
        }
      }
    ]
  };
  return blocks;
}
