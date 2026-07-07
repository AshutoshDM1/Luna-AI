import React, { useState } from 'react'
import {
  Copy,
  Link2,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  MoreHorizontal,
  CornerDownRight,
  Check
} from 'lucide-react'

interface MessageItemProps {
  role: 'user' | 'assistant'
  content: string
  assistantName: string
  isThinking?: boolean
  isStreaming?: boolean
  onSuggestionClick?: (text: string) => void
}

export const MessageItem: React.FC<MessageItemProps> = ({
  role,
  content,
  assistantName,
  isThinking = false,
  isStreaming = false,
  onSuggestionClick
}) => {
  const isUser = role === 'user'
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<boolean | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <div className="flex justify-end w-full animate-[fadeIn_0.2s_ease-out]">
        <div className="bg-neutral-800/90 text-foreground text-xs sm:text-sm px-4 py-2.5 rounded-2xl max-w-[85%] font-medium">
          {content}
        </div>
      </div>
    )
  }

  // Assistant message rendering (completely borderless, clean layout)
  return (
    <div className="flex flex-col items-start w-full text-left space-y-3 animate-[fadeIn_0.2s_ease-out] py-4">
      {/* Content text */}
      <div className="leading-relaxed text-foreground whitespace-pre-wrap font-medium text-xs sm:text-sm break-words select-text w-full">
        {isThinking ? (
          /* Animated thinking dots */
          <span className="inline-flex items-center gap-1 py-1">
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </span>
        ) : content ? (
          <>
            {content}
            {/* Blinking cursor only on the live streaming bubble */}
            {isStreaming && (
              <span className="inline-block w-0.5 h-3.5 bg-foreground/70 ml-0.5 align-middle animate-pulse" />
            )}
          </>
        ) : (
          <span className="text-muted-foreground/40 animate-pulse font-sans">Thinking...</span>
        )}
      </div>

      {content && (
        <div className="space-y-4 w-full">
          {/* Action Toolbar */}
          <div className="flex items-center gap-3 text-muted-foreground/60">
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-all cursor-pointer"
              title="Copy response"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-all cursor-pointer"
              title="Copy link"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setLiked(true)}
              className={`p-1 rounded-md hover:bg-accent transition-all cursor-pointer ${
                liked === true ? 'text-indigo-500' : 'hover:text-foreground'
              }`}
              title="Good response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setLiked(false)}
              className={`p-1 rounded-md hover:bg-accent transition-all cursor-pointer ${
                liked === false ? 'text-red-500' : 'hover:text-foreground'
              }`}
              title="Bad response"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>

            <button
              className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-all cursor-pointer"
              title="Regenerate"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              className="p-1 rounded-md hover:bg-accent hover:text-foreground transition-all cursor-pointer"
              title="More"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Suggestion Prompts */}
          <div className="flex flex-col gap-2 pt-1 font-sans text-xs text-muted-foreground/80">
            <button
              onClick={() => onSuggestionClick?.('Tell me about your interests')}
              className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors w-fit text-left cursor-pointer"
            >
              <CornerDownRight className="w-3 h-3 text-muted-foreground/40" />
              <span>Tell me about your interests</span>
            </button>
            <button
              onClick={() => onSuggestionClick?.('Share your hobbies or passions')}
              className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors w-fit text-left cursor-pointer"
            >
              <CornerDownRight className="w-3 h-3 text-muted-foreground/40" />
              <span>Share your hobbies or passions</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
