import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import graphqlClient from './graphql/client';

// 定义消息类型
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

function App(): React.JSX.Element {
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: '你好！我是AI助手，有什么可以帮助你的吗？', sender: 'ai', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到最新消息
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // 处理发送消息
  const handleSendMessage = async (): Promise<void> => {
    if (inputText.trim() === '') return;
    
    // 添加用户消息
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    const currentInput = inputText;
    setMessages([...messages, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // 调用真实的GraphQL API
      const response = await graphqlClient.sendMessage({
        message: currentInput,
        model: 'gpt-3.5-turbo'
      });
      
      const aiMessage: Message = {
        id: messages.length + 2,
        text: response.message,
        sender: 'ai',
        timestamp: new Date(response.timestamp || new Date().toISOString())
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // 添加错误消息
      const errorMessage: Message = {
        id: messages.length + 2,
        text: `抱歉，发送消息时出现错误：${error instanceof Error ? error.message : '未知错误'}。请确保AI聊天服务正在运行。`,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 检查服务连接状态
  const checkServiceHealth = async (): Promise<void> => {
    try {
      const isHealthy = await graphqlClient.healthCheck();
      if (!isHealthy) {
        console.warn('AI chat service is not responding');
      }
    } catch (error) {
      console.error('Failed to check service health:', error);
    }
  };
  
  // 组件挂载时检查服务状态
  useEffect(() => {
    checkServiceHealth();
  }, []);
  
  // 处理按键事件
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // 格式化时间
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h1>AI 聊天助手</h1>
        </div>
        
        <div className="messages-container">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-content">{message.text}</div>
              <div className="message-timestamp">{formatTime(message.timestamp)}</div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message ai-message">
              <div className="message-content loading">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-container">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={isLoading || inputText.trim() === ''}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;