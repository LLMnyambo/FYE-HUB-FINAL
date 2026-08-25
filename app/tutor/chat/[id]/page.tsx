'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

type Conversation = {
  id: string
  student_id: string
  tutor_id: string
  last_message_at: string | null
  student_unread: number
  tutor_unread: number
  created_at: string
  status: 'active' | 'closed'
  closed_at: string | null
  closed_by: string | null
}

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  student_number: string | null
  email: string | null
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  is_read: boolean
  created_at: string
}

export default function MentorChatPage() {
  const params = useParams()
  const router = useRouter()
  const initialConversationId = params.id as string
  const [supabase] = useState(() => createClient())

  const [conversations, setConversations] =
    useState<Conversation[]>([])
  const [student, setStudent] =
    useState<Profile | null>(null)
  const [messages, setMessages] =
    useState<Message[]>([])
  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null)

  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null)

  const latestConversation = useMemo(
    () =>
      conversations.length > 0
        ? conversations[conversations.length - 1]
        : null,
    [conversations]
  )

  const activeConversation =
    latestConversation?.status === 'active'
      ? latestConversation
      : null

  useEffect(() => {
    if (!initialConversationId) return

    loadThreadFromConversation(
      initialConversationId
    )
  }, [initialConversationId])

  useEffect(() => {
    if (!currentUserId || !student?.id) return

    const channel = supabase
      .channel(
        `mentor-thread-${currentUserId}-${student.id}`
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        async (payload) => {
          const row = (payload.new ||
            payload.old) as Conversation

          if (
            row?.student_id === student.id &&
            row?.tutor_id === currentUserId
          ) {
            await reloadThread(
              student.id,
              currentUserId
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage =
            payload.new as Message

          const belongsToThread =
            conversations.some(
              (conversation) =>
                conversation.id ===
                newMessage.conversation_id
            )

          if (belongsToThread) {
            setMessages((current) => {
              const exists = current.some(
                (item) =>
                  item.id === newMessage.id
              )

              return exists
                ? current
                : [...current, newMessage]
            })
            return
          }

          await reloadThread(
            student.id,
            currentUserId
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    currentUserId,
    student?.id,
    conversations.map((item) => item.id).join(','),
  ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, conversations])

  async function loadThreadFromConversation(
    conversationId: string
  ) {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('You must be logged in.')
        return
      }

      setCurrentUserId(user.id)

      const {
        data: seedConversation,
        error: seedError,
      } = await supabase
        .from('conversations')
        .select(`
          id,
          student_id,
          tutor_id,
          last_message_at,
          student_unread,
          tutor_unread,
          created_at,
          status,
          closed_at,
          closed_by
        `)
        .eq('id', conversationId)
        .eq('tutor_id', user.id)
        .single()

      if (seedError || !seedConversation) {
        console.error(
          'Conversation error:',
          seedError
        )
        setError(
          'Conversation could not be found.'
        )
        return
      }

      await reloadThread(
        seedConversation.student_id,
        user.id
      )
    } catch (err) {
      console.error(
        'Mentor chat error:',
        err
      )
      setError(
        'Unable to load this conversation.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function reloadThread(
    studentId: string,
    mentorUserId: string
  ) {
    const {
      data: studentData,
      error: studentError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        student_number,
        email
      `)
      .eq('id', studentId)
      .single()

    if (studentError) {
      console.error(
        'Student profile error:',
        studentError
      )
    }

    if (studentData) {
      setStudent(studentData)
    }

    const {
      data: conversationRows,
      error: conversationError,
    } = await supabase
      .from('conversations')
      .select(`
        id,
        student_id,
        tutor_id,
        last_message_at,
        student_unread,
        tutor_unread,
        created_at,
        status,
        closed_at,
        closed_by
      `)
      .eq('student_id', studentId)
      .eq('tutor_id', mentorUserId)
      .order('created_at', {
        ascending: true,
      })

    if (conversationError) {
      console.error(
        'Mentor conversations error:',
        conversationError
      )
      setError(conversationError.message)
      return
    }

    const history =
      (conversationRows || []) as Conversation[]

    setConversations(history)

    if (history.length === 0) {
      setMessages([])
      return
    }

    const conversationIds = history.map(
      (conversation) => conversation.id
    )

    const {
      data: messageRows,
      error: messageError,
    } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        created_at
      `)
      .in(
        'conversation_id',
        conversationIds
      )
      .order('created_at', {
        ascending: true,
      })

    if (messageError) {
      console.error(
        'Message loading error:',
        messageError
      )
      setError(messageError.message)
      return
    }

    setMessages(messageRows || [])

    const newest =
      history[history.length - 1]

    // The mentor is viewing the complete student thread, so clear
    // unread counts across every session in this thread.
    if (conversationIds.length > 0) {
      await supabase
        .from('conversations')
        .update({
          tutor_unread: 0,
        })
        .in('id', conversationIds)
        .eq(
          'tutor_id',
          mentorUserId
        )

      await supabase
        .from('messages')
        .update({
          is_read: true,
        })
        .in(
          'conversation_id',
          conversationIds
        )
        .neq(
          'sender_id',
          mentorUserId
        )

      setConversations((current) =>
        current.map((conversation) => ({
          ...conversation,
          tutor_unread: 0,
        }))
      )
    }
  }

  async function sendMessage() {
    const content = messageText.trim()

    if (!content || !activeConversation) {
      return
    }

    try {
      setSending(true)
      setError('')

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('You must be logged in.')
        return
      }

      if (
        activeConversation.tutor_id !==
        user.id
      ) {
        setError(
          'You do not have access to this conversation.'
        )
        return
      }

      const {
        data: newMessage,
        error: sendError,
      } = await supabase
        .from('messages')
        .insert({
          conversation_id:
            activeConversation.id,
          sender_id: user.id,
          content,
          is_read: false,
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          is_read,
          created_at
        `)
        .single()

      if (sendError) {
        console.error(
          'Message send error:',
          sendError
        )
        setError(sendError.message)
        return
      }

      setMessages((current) => {
        const exists = current.some(
          (item) => item.id === newMessage.id
        )

        return exists
          ? current
          : [...current, newMessage]
      })

      setMessageText('')

      await supabase
        .from('conversations')
        .update({
          last_message_at:
            newMessage.created_at,
          student_unread:
            (activeConversation.student_unread ||
              0) + 1,
        })
        .eq(
          'id',
          activeConversation.id
        )
        .eq(
          'tutor_id',
          user.id
        )

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id ===
          activeConversation.id
            ? {
                ...conversation,
                last_message_at:
                  newMessage.created_at,
                student_unread:
                  (conversation.student_unread ||
                    0) + 1,
              }
            : conversation
        )
      )
    } catch (err) {
      console.error(
        'Mentor send message error:',
        err
      )
      setError(
        'Unable to send your message.'
      )
    } finally {
      setSending(false)
    }
  }

  async function endConversation() {
    if (!activeConversation) {
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to end this conversation? The student will then be able to rate this mentoring session.'
    )

    if (!confirmed) {
      return
    }

    try {
      setClosing(true)
      setError('')

      const {
        data,
        error: closeError,
      } = await supabase.rpc(
        'close_mentor_conversation',
        {
          p_conversation_id:
            activeConversation.id,
        }
      )

      if (closeError) {
        console.error(
          'Close conversation error:',
          closeError
        )
        setError(closeError.message)
        return
      }

      if (!data) {
        setError(
          'Unable to end this conversation.'
        )
        return
      }

      if (student && currentUserId) {
        await reloadThread(
          student.id,
          currentUserId
        )
      }
    } catch (err) {
      console.error(
        'End conversation error:',
        err
      )
      setError(
        'Unable to end this conversation.'
      )
    } finally {
      setClosing(false)
    }
  }

  function getStudentName() {
    if (!student) {
      return 'Student'
    }

    const fullName =
      `${student.first_name || ''} ${
        student.last_name || ''
      }`.trim()

    return (
      fullName ||
      student.student_number ||
      student.email ||
      'Student'
    )
  }

  function messagesForConversation(
    conversationId: string
  ) {
    return messages.filter(
      (item) =>
        item.conversation_id === conversationId
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">
          Loading conversation...
        </p>
      </div>
    )
  }

  if (
    error &&
    conversations.length === 0
  ) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Conversation unavailable
          </h1>

          <p className="mt-3 text-red-600">
            {error}
          </p>

          <button
            onClick={() =>
              router.push(
                '/tutor/dashboard'
              )
            }
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() =>
            router.push(
              '/tutor/dashboard'
            )
          }
          className="mb-5 text-sm font-medium text-gray-600 hover:text-blue-600"
        >
          ← Back to Dashboard
        </button>

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getStudentName()}
              </h1>

              {student?.student_number && (
                <p className="mt-1 text-sm text-gray-500">
                  Student Number:{' '}
                  {student.student_number}
                </p>
              )}
            </div>

            {activeConversation ? (
              <button
                type="button"
                onClick={endConversation}
                disabled={closing}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {closing
                  ? 'Ending...'
                  : 'End Conversation'}
              </button>
            ) : (
              <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                Waiting for New Chat
              </span>
            )}
          </div>

          <div className="min-h-[450px] max-h-[600px] overflow-y-auto p-6">
            {conversations.map(
              (conversation, index) => {
                const conversationMessages =
                  messagesForConversation(
                    conversation.id
                  )

                return (
                  <div key={conversation.id}>
                    {index > 0 && (
                      <div className="my-8 flex items-center gap-4">
                        <div className="h-px flex-1 bg-gray-200" />

                        <span className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold tracking-wide text-blue-700">
                          NEW CHAT
                        </span>

                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                    )}

                    <div className="space-y-4">
                      {conversationMessages.length ===
                      0 ? (
                        <p className="text-center text-sm text-gray-400">
                          No messages in this chat yet.
                        </p>
                      ) : (
                        conversationMessages.map(
                          (message) => {
                            const isMine =
                              currentUserId !== null &&
                              message.sender_id ===
                                currentUserId

                            return (
                              <div
                                key={message.id}
                                className={`flex ${
                                  isMine
                                    ? 'justify-end'
                                    : 'justify-start'
                                }`}
                              >
                                <div className="max-w-[75%]">
                                  <p
                                    className={`mb-1 text-xs font-medium ${
                                      isMine
                                        ? 'text-right text-blue-600'
                                        : 'text-left text-gray-500'
                                    }`}
                                  >
                                    {isMine
                                      ? 'You'
                                      : getStudentName()}
                                  </p>

                                  <div
                                    className={`rounded-2xl px-4 py-3 ${
                                      isMine
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap break-words text-sm">
                                      {
                                        message.content
                                      }
                                    </p>

                                    <p
                                      className={`mt-1 text-xs ${
                                        isMine
                                          ? 'text-blue-100'
                                          : 'text-gray-400'
                                      }`}
                                    >
                                      {new Date(
                                        message.created_at
                                      ).toLocaleTimeString(
                                        'en-ZA',
                                        {
                                          hour:
                                            '2-digit',
                                          minute:
                                            '2-digit',
                                        }
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                        )
                      )}
                    </div>

                    {conversation.status ===
                      'closed' && (
                      <div className="my-6 text-center">
                        <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600">
                          Conversation Ended
                        </span>
                      </div>
                    )}
                  </div>
                )
              }
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="border-t bg-red-50 px-5 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {activeConversation ? (
            <div className="border-t p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(event) =>
                    setMessageText(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type your reply..."
                  disabled={sending}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={
                    sending ||
                    !messageText.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending
                    ? 'Sending...'
                    : 'Send'}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t bg-gray-50 p-5 text-center">
              <p className="font-semibold text-gray-700">
                This conversation has ended.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Keep this page open. A new student chat will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}