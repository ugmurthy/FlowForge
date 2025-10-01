import axios from 'axios';
import { NodeExecutor, ExecutionContext } from '../types/workflow.js';
import { replaceVariables } from '../utils/variable-utils.js';

export class SlackNodeExecutor implements NodeExecutor {
  async execute(context: ExecutionContext, nodeData: any): Promise<any> {
    const config = nodeData.config || {};
    const webhookUrl = config.webhookUrl || '';
    const token = config.token || '';
    const channel = config.channel || '';
    const message = config.message || '';
    const username = config.username || 'FlowForge';
    const iconEmoji = config.iconEmoji || ':robot_face:';

    if (!webhookUrl && !token) {
      throw new Error('Slack node requires either webhookUrl or token');
    }

    if (!message) {
      throw new Error('Message is required for Slack node');
    }

    // Replace variables in message with context data
    const processedMessage = replaceVariables(message, context.data);

    try {
      if (webhookUrl) {
        // Use webhook URL (simpler approach)
        const payload = {
          text: processedMessage,
          username,
          icon_emoji: iconEmoji
        };

        const response = await axios.post(webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        return {
          success: true,
          method: 'webhook',
          message: processedMessage,
          response: response.status === 200 ? 'ok' : response.data
        };

      } else if (token) {
        // Use Slack Web API
        if (!channel) {
          throw new Error('Channel is required when using Slack token');
        }

        const payload = {
          channel,
          text: processedMessage,
          username,
          icon_emoji: iconEmoji
        };

        const response = await axios.post(
          'https://slack.com/api/chat.postMessage',
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.data.ok) {
          throw new Error(`Slack API error: ${response.data.error}`);
        }

        return {
          success: true,
          method: 'api',
          message: processedMessage,
          channel,
          messageTs: response.data.ts
        };
      }

    } catch (error: any) {
      if (error.response) {
        throw new Error(`Slack request failed: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      }
      throw new Error(`Slack request failed: ${error.message}`);
    }
  }
}

export const slackNodeExecutor = new SlackNodeExecutor();
