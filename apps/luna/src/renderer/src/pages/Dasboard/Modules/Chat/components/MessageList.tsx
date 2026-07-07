import React, { useRef, useEffect } from 'react'
import { MessageItem } from './MessageItem'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface MessageListProps {
  messages: Message[]
  assistantName: string
  isStreaming: boolean
  isThinking: boolean
  streamingMessage: string
  onSuggestionClick?: (text: string) => void
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  assistantName,
  isStreaming,
  isThinking,
  streamingMessage,
  onSuggestionClick
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  return (
    <div className="flex-1 w-full overflow-y-auto space-y-4 px-1 py-2 min-h-[30vh]">
      {messages.map((msg, index) => (
        <MessageItem
          key={index}
          role={msg.role}
          content={msg.content}
          assistantName={assistantName}
          onSuggestionClick={onSuggestionClick}
        />
      ))}

      {isStreaming && (
        <MessageItem
          role="assistant"
          content={streamingMessage}
          assistantName={assistantName}
          isThinking={isThinking}
          isStreaming={true}
          onSuggestionClick={onSuggestionClick}
        />
      )}

      <div ref={bottomRef} />
    </div>
  )
}
