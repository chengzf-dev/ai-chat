// GraphQL客户端，用于与AI聊天服务通信

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

interface ChatResponse {
  chat: {
    id: string;
    message: string;
    timestamp: string;
    model: string;
  };
}

interface SendMessageResponse {
  sendMessage: {
    id: string;
    message: string;
    timestamp: string;
    model: string;
  };
}

interface MessageInput {
  message: string;
  model?: string;
}

class GraphQLClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.REACT_APP_WORKERS_URL || '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(query: string, variables?: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }

      if (!result.data) {
        throw new Error('No data received from server');
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL request failed:', error);
      throw error;
    }
  }

  // 查询聊天
  async chat(message: string): Promise<ChatResponse['chat']> {
    const query = `
      query Chat($message: String!) {
        chat(message: $message) {
          id
          message
          timestamp
          model
        }
      }
    `;

    const result = await this.request<ChatResponse>(query, { message });
    return result.chat;
  }

  // 发送消息
  async sendMessage(input: MessageInput): Promise<SendMessageResponse['sendMessage']> {
    const mutation = `
      mutation SendMessage($input: MessageInput!) {
        sendMessage(input: $input) {
          id
          message
          timestamp
          model
        }
      }
    `;

    const result = await this.request<SendMessageResponse>(mutation, { input });
    return result.sendMessage;
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// 创建单例实例
const graphqlClient = new GraphQLClient();

export default graphqlClient;
export { GraphQLClient };
export type { MessageInput, ChatResponse, SendMessageResponse };