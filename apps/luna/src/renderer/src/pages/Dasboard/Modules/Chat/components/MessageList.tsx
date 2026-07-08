import React, { useRef, useEffect } from 'react'
import { MessageItem } from './MessageItem'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
}

interface MessageListProps {
  messages: Message[]
  assistantName: string
  isStreaming: boolean
  isThinking: boolean
  streamingMessage: string
  onSuggestionClick?: (text: string) => void
  onPermissionGranted?: (execute: boolean) => void
  onCommandExecuted?: (command: string, success: boolean, output: string) => void
  isExecutingCommand?: boolean
  onStartExecuting?: () => void
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  assistantName,
  isStreaming,
  isThinking,
  streamingMessage,
  onSuggestionClick,
  onPermissionGranted,
  onCommandExecuted,
  isExecutingCommand = false,
  onStartExecuting
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessage])

  return (
    <div className="flex-1 w-full overflow-y-auto space-y-4 px-1 py-2 min-h-[30vh]">
      {messages
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg, index) => (
          <MessageItem
            key={index}
            role={msg.role}
            content={msg.content}
            images={msg.images}
            assistantName={assistantName}
            onSuggestionClick={onSuggestionClick}
            onPermissionGranted={onPermissionGranted}
            onCommandExecuted={onCommandExecuted}
            isExecutingCommand={isExecutingCommand}
            onStartExecuting={onStartExecuting}
          />
        ))}

      {isStreaming && (
        <MessageItem
          role="assistant"
          // While streaming, if the model is outputting a tool call, show a neutral
          // placeholder so the raw [TOOL_CALL:...] JSON doesn't flash to the user.
          // The final TerminalAgent card renders once the message is committed.
          content={streamingMessage.includes('[TOOL_CALL:') ? '' : streamingMessage}
          assistantName={assistantName}
          isThinking={isThinking || streamingMessage.includes('[TOOL_CALL:')}
          isStreaming={true}
          onSuggestionClick={onSuggestionClick}
          isExecutingCommand={isExecutingCommand}
          onStartExecuting={onStartExecuting}
        />
      )}

      <div ref={bottomRef} />
    </div>
  )
}
