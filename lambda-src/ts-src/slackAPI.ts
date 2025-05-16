import { Block, KnownBlock } from "@slack/types";
import { LogLevel, WebAPIPlatformError, WebClient } from "@slack/web-api";
import axios from 'axios';
import util from 'util';
import { getSecretValue } from './awsAPI';

async function createClient() {
  const slackBotToken = await getSecretValue('Selector', 'slackBotToken');

  return new WebClient(slackBotToken, {
    logLevel: LogLevel.INFO
  });
}

export class PrivateConversationNonMemberError extends Error {
  channelId: string;
  constructor(channelId:string, cause?: unknown) {
    super(`Cannot list members of channel ${channelId}`, {cause});
    this.channelId = channelId;
  }
}

function isWebAPIPlatformError(obj: unknown): obj is WebAPIPlatformError {
  return typeof obj === "object" && obj !== null && "data" in obj;
}

/**
 * List members of the given channel.  Does not include bot users.
 * @param channelId Channel to list members.
 * @returns List of Slack ids for members of the channel.
 * @throws PrivateConversationNonMemberError if the channel is private and the bot is not a member.
 */
export async function getChannelMembers(channelId: string) {
  const client = await createClient();

  try {
    const membersResult = await client.conversations.members({
      channel: channelId
    });
    const channelMembers: string[] = [];
    if(!membersResult.members) {
      console.warn(`Cannot get members of channel ${channelId}`);
      return channelMembers;
    }
    for(const member of membersResult.members) {
      const userResult = await client.users.info({
        user: member
      });
      if(!userResult.user?.is_bot) {
        channelMembers.push(member);
      }
      else {
        // We don't want to select bot users (including ourself).
        console.warn(`Ignoring bot user ${member}`);
      }
    }
    return channelMembers;
  }
  catch (error) {
    // This is about as good as we can do at catching when we get an error because we aren't a member
    // of a private channel/DM and therefore we can't list the members.
    if(isWebAPIPlatformError(error) && !error.data.ok && error.data.error === "channel_not_found") {
      throw new PrivateConversationNonMemberError(channelId, error);
    }
    throw error;
  }
}

export async function postMessage(channelId: string, text:string, blocks: (KnownBlock | Block)[]) {
  const client = await createClient();
  await client.chat.postMessage({
    channel: channelId,
    text,
    blocks
  });
}

export async function postToResponseUrl(responseUrl: string, response_type: "ephemeral" | "in_channel", text: string, blocks: KnownBlock[]) {
  const messageBody = {
    response_type,
    text,
    blocks
  };
  const result = await axios.post(responseUrl, messageBody);
  if(result.status !== 200) {
    throw new Error(`Error ${util.inspect(result.statusText)} posting response: ${util.inspect(result.data)}`);
  }
  return result;
}

export async function postErrorMessageToResponseUrl(responseUrl: string, text: string) {
  const blocks: KnownBlock[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text
      }
    }
  ];
  await postToResponseUrl(responseUrl, "ephemeral", text, blocks);
}

export type SlashCommandPayload = {
  token: string,
  team_id: string,
  team_domain: string,
  channel_id: string,
  channel_name: string,
  user_id: string,
  user_name: string,
  command: string,
  text: string,
  api_app_id: string,
  is_enterprise_install: string,
  response_url: string,
  trigger_id: string
};

export type Action = {
  action_id: string,
  value: string
};

export type InteractionPayload = {
  type: string,
  user: {
    id: string,
    username: string,
    name: string,
    team_id: string,
  },
  container: {
    type: string,
    message_ts: string,
    channel_id: string,
    is_ephemeral: boolean
  },
  team: {
    id: string,
    domain: string
  },
  channel: {
    id: string,
    name: string,
  },
  message: {
    type: 'message',
    subtype: string,
    text: string,
    ts: string,
    bot_id: string,
  },
  response_url: string,
  actions: Action[]
};