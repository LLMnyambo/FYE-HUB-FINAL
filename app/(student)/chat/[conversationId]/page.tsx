'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send, Paperclip, File, Image as ImageIcon } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  file_url?: string
  file_name?: string
  file_type?: string
}

interface Profile {
  id: string
  first_name: string
  last_name: string
  avatar_url?: string
}

export default function ChatPage() {
  const params = useParams()
  const conversationId = params.conversationId as string
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [otherPerson, setOtherPerson] = useState<Profile | null>(null)
  const [isStudent, setIsStudent] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUser(profile)
        setIsStudent(profile?.role === 'student')
      }
    }
    getUser()
  }, [])

  // Load messages and conversation details
  useEffect(() => {
    if (!user || !conversationId) return

    const loadChat = async () => {
      setLoading(true)
      
      // Get conversation details
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (conv) {
        // Determine who we're talking to
        const otherId = user.id === conv.student_id ? conv.tutor_id : conv.student_id
        
        // Get other person's profile
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, avatar_url')
          .eq('id', otherId)
          .single()
        setOtherPerson(otherProfile)
      }

      // Load messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgs) {
        setMessages(msgs)
      }

      setLoading(false)
    }

    loadChat()
  }, [conversationId, user])

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim(),
        })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1A2A6C] border-t-transparent"></div>
          <p className="mt-4 text-[#757575]">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col rounded-xl bg-white shadow-md border border-[#F9A825]/20">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-[#E8F5E9] p-4">
        <Link
          href={isStudent ? '/tutors' : '/tutor/chats'}
          className="rounded-full p-1 hover:bg-[#E8F5E9] transition"
        >
          <ArrowLeft className="h-5 w-5 text-[#1A2A6C]" />
        </Link>
        <div className="flex-1">
          <h3 className="font-semibold text-[#1A2A6C]">
            {otherPerson?.first_name} {otherPerson?.last_name}
          </h3>
          <p className="text-xs text-[#757575]">
            {isStudent ? 'Tutor' : 'Student'}
          </p>
        </div>
        <div className="h-2 w-2 rounded-full bg-green-500" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isMine
                    ? 'bg-[#1A2A6C] text-white'
                    : 'bg-[#E8F5E9] text-[#212121]'
                }`}
              >
                {msg.content && <p className="text-sm">{msg.content}</p>}
                <p className="mt-1 text-right text-xs opacity-70">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#E8F5E9] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 rounded-md border border-[#E8F5E9] px-4 py-2 text-sm focus:border-[#F9A825] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="rounded-md bg-[#F9A825] px-4 py-2 text-[#1A2A6C] hover:bg-[#FFC107] transition disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}