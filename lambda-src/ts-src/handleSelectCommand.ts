import {KnownBlock, SectionBlock} from '@slack/types';
import {getChannelMembers, postErrorMessageToResponseUrl, postMessage, PrivateConversationNonMemberError, SlashCommandPayload} from './slackAPI';

export async function handleSelectCommand(event: SlashCommandPayload): Promise<void> {

  try {
    if(!event.channel_id) {
      throw new Error("Channel id not in slash command payload");
    }
    const channelMembers = await getChannelMembers(event.channel_id);
    const randomUserIndex = Math.floor(Math.random() * channelMembers.length);
    // Slack turns <@userid> into an @mention
    const randomUser = `<@${channelMembers[randomUserIndex]}>`;
    const blocks: KnownBlock[] = [];
    
    let text = `<@${event.user_id}> asked me to select someone`;
    if(event.text) {
      text += ` to do "${event.text}"`;
    }
    let sectionBlock: SectionBlock = {
      type: "section",
      text: {
        type: "mrkdwn",
        text
      }
    };
    blocks.push(sectionBlock);
    sectionBlock = {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `I have selected ${randomUser}`
      }
    };
    blocks.push(sectionBlock);
    await postMessage(event.channel_id, `Selected user is ${randomUser}`, blocks);
  }
  catch (error) {
    // Post error message as ephemeral response to the response URL rather than the channel.
    if(error instanceof PrivateConversationNonMemberError) {
      console.warn("Not a member of the channel so returning an error message");
      await postErrorMessageToResponseUrl(event.response_url, "I must be a member of a private channel to be able to select a user.  Please invite me and try again.");
    }
    else {
      console.error(error);
      await postErrorMessageToResponseUrl(event.response_url, "Failed to select user.");
    }
  }
}