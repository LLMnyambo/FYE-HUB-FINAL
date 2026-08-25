'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Conversation = {
  id: string
  student_id: string
  tutor_id: string
  last_message_at: string | null
  student_unread: number
  tutor_unread: number
  created_at: string
}

type Student = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  created_at: string
  is_read: boolean
}

export default function TutorDashboardPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [students, setStudents] = useState<Record<string, Student>>({})
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')

  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
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

      console.log('Tutor ID:', user.id)

      const { data, error: conversationError } = await supabase
        .from('conversations')
        .select(`
          id,
          student_id,
          tutor_id,
          last_message_at,
          student_unread,
          tutor_unread,
          created_at
        `)
        .eq('tutor_id', user.id)
        .order('last_message_at', {
          ascending: false,
          nullsFirst: false,
        })

      if (conversationError) {
        console.error(
          'Conversation error:',
          conversationError
        )

        setError(conversationError.message)
        return
      }

      const conversationList = data || []

      setConversations(conversationList)

      /*
       * Get the student profiles for these conversations.
       */
      const studentIds = [
        ...new Set(
          conversationList.map(
            (conversation) => conversation.student_id
          )
        ),
      ]

      if (studentIds.length > 0) {
        const { data: studentData, error: studentError } =
          await supabase
            .from('profiles')
            .select(
              'id, first_name, last_name, email'
            )
            .in('id', studentIds)

        if (studentError) {
          console.error(
            'Student profile error:',
            studentError
          )
        }

        const studentMap: Record<string, Student> = {}

        for (const student of studentData || []) {
          studentMap[student.id] = student
        }

        setStudents(studentMap)
      }
    } catch (err) {
      console.error(
        'Dashboard error:',
        err
      )

      setError(
        'Unable to load your conversations.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function openConversation(
    conversation: Conversation
  ) {
    try {
      setSelectedConversation(conversation)
      setMessagesLoading(true)
      setError('')

      const { data, error: messageError } =
        await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            created_at,
            is_read
          `)
          .eq(
            'conversation_id',
            conversation.id
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

      setMessages(data || [])

      /*
       * Reset the tutor's unread count.
       */
      await supabase
        .from('conversations')
        .update({
          tutor_unread: 0,
        })
        .eq('id', conversation.id)

      /*
       * Mark messages sent by the student as read.
       */
      await supabase
        .from('messages')
        .update({
          is_read: true,
        })
        .eq(
          'conversation_id',
          conversation.id
        )
        .neq(
          'sender_id',
          (await supabase.auth.getUser()).data.user?.id || ''
        )

      /*
       * Update local unread count.
       */
      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id
            ? {
                ...item,
                tutor_unread: 0,
              }
            : item
        )
      )
    } catch (err) {
      console.error(
        'Open conversation error:',
        err
      )

      setError(
        'Unable to open this conversation.'
      )
    } finally {
      setMessagesLoading(false)
    }
  }

  async function sendMessage() {
    if (!selectedConversation) return

    const content = messageText.trim()

    if (!content) return

    try {
      setSending(true)
      setError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in.')
        return
      }

      const { data, error: sendError } =
        await supabase
          .from('messages')
          .insert({
            conversation_id:
              selectedConversation.id,
            sender_id: user.id,
            content,
          })
          .select(`
            id,
            conversation_id,
            sender_id,
            content,
            created_at,
            is_read
          `)
          .single()

      if (sendError) {
        console.error(
          'Send message error:',
          sendError
        )

        setError(sendError.message)
        return
      }

      setMessages((current) => [
        ...current,
        data,
      ])

      setMessageText('')

      /*
       * Update conversation timestamp and
       * student's unread count.
       */
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          student_unread:
            (selectedConversation.student_unread || 0) + 1,
        })
        .eq(
          'id',
          selectedConversation.id
        )

      setSelectedConversation((current) =>
        current
          ? {
              ...current,
              last_message_at:
                new Date().toISOString(),
              student_unread:
                (current.student_unread || 0) + 1,
            }
          : null
      )
    } catch (err) {
      console.error(
        'Send message error:',
        err
      )

      setError(
        'Unable to send your message.'
      )
    } finally {
      setSending(false)
    }
  }

  function getStudentName(
    studentId: string
  ) {
    const student = students[studentId]

    if (!student) {
      return 'Student'
    }

    const name =
      `${student.first_name || ''} ${
        student.last_name || ''
      }`.trim()

    return name || student.email || 'Student'
  }

  const activeChats = conversations.length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">

        <h1 className="text-3xl font-bold text-primary">
          Tutor Dashboard
        </h1>

        <p className="text-muted-foreground">
          Manage your tutoring conversations
        </p>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Session Count
            </p>

            <p className="text-2xl font-bold">
              0
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Rating
            </p>

            <p className="text-2xl font-bold">
              0.00
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm text-muted-foreground">
              Active Chats
            </p>

            <p className="text-2xl font-bold">
              {activeChats}
            </p>
          </div>

        </div>

        {/* Messages */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Conversation list */}
          <div className="rounded-lg bg-white shadow">

            <div className="border-b p-5">
              <h2 className="text-lg font-semibold">
                Messages
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Students who contacted you
              </p>
            </div>

            <div className="max-h-[600px] overflow-y-auto">

              {loading ? (
                <p className="p-6 text-center text-gray-500">
                  Loading conversations...
                </p>
              ) : conversations.length === 0 ? (
                <p className="p-6 text-center text-gray-500">
                  No messages yet.
                </p>
              ) : (
                conversations.map(
                  (conversation) => {
                    const student =
                      students[
                        conversation.student_id
                      ]

                    const selected =
                      selectedConversation?.id ===
                      conversation.id

                    return (
                      <button
                        key={conversation.id}
                        onClick={() =>
                          openConversation(
                            conversation
                          )
                        }
                        className={`w-full border-b p-5 text-left transition hover:bg-gray-50 ${
                          selected
                            ? 'bg-blue-50'
                            : ''
                        }`}
                      >

                        <div className="flex items-center justify-between">

                          <p className="font-semibold text-gray-900">
                            {getStudentName(
                              conversation.student_id
                            )}
                          </p>

                          {conversation.tutor_unread >
                            0 && (
                            <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                              {conversation.tutor_unread}
                            </span>
                          )}

                        </div>

                        {student?.email && (
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {student.email}
                          </p>
                        )}

                        {conversation.last_message_at && (
                          <p className="mt-2 text-xs text-gray-400">
                            {new Date(
                              conversation.last_message_at
                            ).toLocaleString(
                              'en-ZA'
                            )}
                          </p>
                        )}

                      </button>
                    )
                  }
                )
              )}

            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2">

            {!selectedConversation ? (
              <div className="flex min-h-[500px] items-center justify-center rounded-lg bg-white shadow">

                <div className="text-center">

                  <h2 className="text-lg font-semibold text-gray-900">
                    Select a conversation
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Choose a student from the list to view their messages.
                  </p>

                </div>

              </div>
            ) : (
              <div className="overflow-hidden rounded-lg bg-white shadow">

                {/* Chat header */}
                <div className="border-b p-5">

                  <h2 className="text-xl font-semibold text-gray-900">
                    {getStudentName(
                      selectedConversation.student_id
                    )}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Student conversation
                  </p>

                </div>

                {/* Messages */}
                <div className="min-h-[400px] max-h-[500px] space-y-4 overflow-y-auto p-6">

                  {messagesLoading ? (
                    <p className="text-center text-gray-500">
                      Loading messages...
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-500">
                      No messages yet.
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id ===
                          selectedConversation.tutor_id
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >

                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            message.sender_id ===
                            selectedConversation.tutor_id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >

                          <p className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              message.sender_id ===
                              selectedConversation.tutor_id
                                ? 'text-blue-100'
                                : 'text-gray-400'
                            }`}
                          >
                            {new Date(
                              message.created_at
                            ).toLocaleTimeString(
                              'en-ZA',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>

                        </div>

                      </div>
                    ))
                  )}

                </div>

                {/* Send message */}
                <div className="border-t p-4">

                  <div className="flex gap-3">

                    <input
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
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <button
                      onClick={sendMessage}
                      disabled={
                        sending ||
                        !messageText.trim()
                      }
                      className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending
                        ? 'Sending...'
                        : 'Send'}
                    </button>

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}