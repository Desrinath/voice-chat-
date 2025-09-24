
import React, { useState, useEffect } from 'react';
import type { ChatMessage as ChatMessageType } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BotIcon } from './icons/BotIcon';

interface ChatMessageProps extends ChatMessageType {
  isInterim?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, text, isInterim = false }) => {
  const isUser = role === 'user';
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const containerClasses = `
    flex items-start gap-4 
    ${isUser ? 'justify-end' : ''}
    transition-all duration-500 ease-out
    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
  `;

  const bubbleClasses = `
    max-w-xl rounded-2xl px-5 py-3 shadow-md
    ${isUser
      ? 'bg-cyan-500 text-white rounded-br-none'
      : 'bg-gray-700 text-gray-200 rounded-bl-none'}
    ${isInterim ? 'opacity-80' : ''}
  `;

  return (
    <div className={containerClasses}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          <BotIcon className="w-5 h-5 text-cyan-400" />
        </div>
      )}
      <div className={bubbleClasses}>
        <p className="whitespace-pre-wrap leading-relaxed">
          {text}
          {isInterim && <span className="inline-block w-1 h-4 bg-white/70 ml-1 animate-pulse rounded-full" />}
        </p>
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-gray-300" />
        </div>
      )}
    </div>
  );
};
