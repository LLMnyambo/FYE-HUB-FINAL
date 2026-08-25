'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, Star } from 'lucide-react'

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

type Tutor = {
  id: string
  first_name: string | null
  last_name: string | null
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  file_url: string | null
  file_name: string | null
  file_type: string | null
  is_read: boolean
  created_at: string
}

type ExistingReview = {
  id: string
  rating: number
  comment: string | null
  created_at: string
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const mentorId = searchParams.get('mentor')
  const [supabase] = useState(() => createClient())

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tutorProfileId, setTutorProfileId] = useState<string | null>(null)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [review, setReview] = useState<ExistingReview | null>(null)
  const [reviewConversation, setReviewConversation] =
    useState<Conversation | null>(null)

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [startingNewConversation, setStartingNewConversation] =
    useState(false)
  const [submittingReview, setSubmittingReview] =
    useState(false)

  const [error, setError] = useState('')
  const [reviewError, setReviewError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

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
    if (!mentorId) {
      setError('No mentor selected.')
      setLoading(false)
      return
    }

    loadChatHistory()
  }, [mentorId])

  useEffect(() => {
    if (!currentUserId || !tutorProfileId) return

    const channel = supabase
      .channel(
        `student-thread-${currentUserId}-${tutorProfileId}`
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMessage = payload.new as Message

          const belongsToThread = conversations.some(
            (conversation) =>
              conversation.id === newMessage.conversation_id
          )

          if (belongsToThread) {
            setMessages((current) => {
              const exists = current.some(
                (item) => item.id === newMessage.id
              )

              return exists ? current : [...current, newMessage]
            })
            return
          }

          await loadChatHistory(false)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        async (payload) => {
          const row = (payload.new || payload.old) as Conversation

          if (
            row?.student_id === currentUserId &&
            row?.tutor_id === tutorProfileId
          ) {
            await loadChatHistory(false)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    currentUserId,
    tutorProfileId,
    conversations.map((item) => item.id).join(','),
  ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, conversations])

  async function loadChatHistory(showLoader = true) {
    try {
      if (showLoader) {
        setLoading(true)
      }

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

      if (!mentorId) {
        setError('No mentor selected.')
        return
      }

      const { data: mentor, error: mentorError } =
        await supabase
          .from('mentor_profiles')
          .select(`
            id,
            profile_id,
            profiles (
              id,
              first_name,
              last_name
            )
          `)
          .eq('id', mentorId)
          .single()

      if (mentorError || !mentor) {
        console.error('Mentor lookup error:', mentorError)
        setError(
          mentorError?.message || 'Mentor could not be found.'
        )
        return
      }

      const mentorProfileId = mentor.profile_id

      if (!mentorProfileId) {
        setError('This mentor does not have a valid profile.')
        return
      }

      setTutorProfileId(mentorProfileId)

      const profile = Array.isArray(mentor.profiles)
        ? mentor.profiles[0]
        : mentor.profiles

      if (profile) {
        setTutor({
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
        })
      }

      let {
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
        .eq('student_id', user.id)
        .eq('tutor_id', mentorProfileId)
        .order('created_at', { ascending: true })

      if (conversationError) {
        console.error(
          'Conversation lookup error:',
          conversationError
        )
        setError(conversationError.message)
        return
      }

      if (!conversationRows || conversationRows.length === 0) {
        const {
          data: newConversation,
          error: createError,
        } = await supabase
          .from('conversations')
          .insert({
            student_id: user.id,
            tutor_id: mentorProfileId,
            student_unread: 0,
            tutor_unread: 0,
            status: 'active',
          })
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
          .single()

        if (createError) {
          console.error(
            'Conversation creation error:',
            createError
          )
          setError(createError.message)
          return
        }

        conversationRows = [newConversation]
      }

      const history = conversationRows as Conversation[]
      setConversations(history)

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
          file_url,
          file_name,
          file_type,
          is_read,
          created_at
        `)
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: true })

      if (messageError) {
        console.error(
          'Message loading error:',
          messageError
        )
        setError(messageError.message)
        return
      }

      setMessages(messageRows || [])

      const newest = history[history.length - 1]

      // The student is viewing the whole mentor thread, so clear
      // unread counts across every session in this thread.
      if (conversationIds.length > 0) {
        await supabase
          .from('conversations')
          .update({ student_unread: 0 })
          .in('id', conversationIds)

        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id)

        setConversations((current) =>
          current.map((conversation) => ({
            ...conversation,
            student_unread: 0,
          }))
        )
      }

      const newestClosed =
        [...history]
          .reverse()
          .find(
            (conversation) =>
              conversation.status === 'closed'
          ) || null

      setReviewConversation(newestClosed)

      if (newestClosed) {
        await loadExistingReview(newestClosed.id)
      } else {
        setReview(null)
      }
    } catch (err) {
      console.error('Chat loading error:', err)
      setError('Unable to load this conversation.')
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  async function loadExistingReview(
    conversationId: string
  ) {
    const { data, error } = await supabase.rpc(
      'get_my_conversation_review',
      {
        p_conversation_id: conversationId,
      }
    )

    if (error) {
      console.error('Review lookup error:', error)
      setReview(null)
      return
    }

    const existingReview =
      Array.isArray(data) && data.length > 0
        ? data[0]
        : null

    setReview(existingReview)
  }

  async function sendMessage() {
    const trimmedMessage = message.trim()

    if (!trimmedMessage || !activeConversation) {
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

      if (user.id !== activeConversation.student_id) {
        setError(
          'Your student login session has changed. Please sign in again as the student.'
        )
        return
      }

      const {
        data: newMessage,
        error: messageError,
      } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          content: trimmedMessage,
          is_read: false,
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          file_url,
          file_name,
          file_type,
          is_read,
          created_at
        `)
        .single()

      if (messageError) {
        console.error(
          'Message send error:',
          messageError
        )
        setError(
          messageError.message || 'Unable to send message.'
        )
        return
      }

      setMessages((current) => {
        const exists = current.some(
          (item) => item.id === newMessage.id
        )
        return exists ? current : [...current, newMessage]
      })

      setMessage('')

      await supabase
        .from('conversations')
        .update({
          last_message_at: newMessage.created_at,
          tutor_unread:
            (activeConversation.tutor_unread || 0) + 1,
        })
        .eq('id', activeConversation.id)

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                last_message_at: newMessage.created_at,
                tutor_unread:
                  (conversation.tutor_unread || 0) + 1,
              }
            : conversation
        )
      )
    } catch (err) {
      console.error('Send message error:', err)
      setError('Unable to send message.')
    } finally {
      setSending(false)
    }
  }

  async function startAnotherConversation() {
    if (!latestConversation) {
      return
    }

    if (latestConversation.status !== 'closed') {
      setError(
        'The current conversation must be ended first.'
      )
      return
    }

    try {
      setStartingNewConversation(true)
      setError('')

      const {
        data: newConversationId,
        error: startError,
      } = await supabase.rpc(
        'start_new_mentor_conversation',
        {
          p_previous_conversation_id:
            latestConversation.id,
        }
      )

      if (startError) {
        console.error(
          'Start new conversation error:',
          startError
        )
        setError(startError.message)
        return
      }

      if (!newConversationId) {
        setError(
          'Unable to start another conversation.'
        )
        return
      }

      await loadChatHistory(false)
    } catch (err) {
      console.error(
        'Start conversation error:',
        err
      )
      setError(
        'Unable to start another conversation.'
      )
    } finally {
      setStartingNewConversation(false)
    }
  }

  async function submitReview() {
    if (!reviewConversation) {
      setReviewError(
        'There is no completed conversation to rate.'
      )
      return
    }

    if (rating < 1) {
      setReviewError('Please select a rating.')
      return
    }

    try {
      setSubmittingReview(true)
      setReviewError('')

      const {
        data: reviewId,
        error,
      } = await supabase.rpc(
        'submit_mentor_review',
        {
          p_conversation_id:
            reviewConversation.id,
          p_rating: rating,
          p_comment: comment,
        }
      )

      if (error) {
        console.error(
          'Review submission error:',
          error
        )
        setReviewError(error.message)
        return
      }

      if (!reviewId) {
        setReviewError(
          'Unable to submit your review.'
        )
        return
      }

      await loadExistingReview(
        reviewConversation.id
      )

      setRating(0)
      setHoverRating(0)
      setComment('')
    } catch (err) {
      console.error(
        'Review submission error:',
        err
      )
      setReviewError(
        'Unable to submit your review.'
      )
    } finally {
      setSubmittingReview(false)
    }
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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-gray-500">
            Opening conversation...
          </p>
        </div>
      </div>
    )
  }

  const tutorName = tutor
    ? `${tutor.first_name || ''} ${
        tutor.last_name || ''
      }`.trim()
    : 'Mentor'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-primary">
          Messages
        </h1>

        <p className="mt-1 text-muted-foreground">
          Your conversation with your mentor
        </p>

        <div className="mt-8 overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {tutorName}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Mentor Conversation
            </p>
          </div>

          <div className="min-h-[400px] max-h-[600px] overflow-y-auto p-6">
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

                    <div className="space-y-3">
                      {conversationMessages.length ===
                      0 ? (
                        <p className="text-center text-sm text-gray-400">
                          No messages in this chat yet.
                        </p>
                      ) : (
                        conversationMessages.map(
                          (msg) => {
                            const isMine =
                              msg.sender_id ===
                              conversation.student_id

                            return (
                              <div
                                key={msg.id}
                                className={`flex ${
                                  isMine
                                    ? 'justify-end'
                                    : 'justify-start'
                                }`}
                              >
                                <div
                                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                    isMine
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words text-sm">
                                    {msg.content}
                                  </p>

                                  <p
                                    className={`mt-1 text-xs ${
                                      isMine
                                        ? 'text-blue-100'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {new Date(
                                      msg.created_at
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
            <div className="border-t bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {activeConversation ? (
            <div className="border-t p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey
                    ) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type your message..."
                  disabled={sending}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={
                    sending || !message.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending
                    ? 'Sending...'
                    : 'Send'}
                </button>
              </div>
            </div>
          ) : latestConversation ? (
            <div className="border-t bg-slate-50 p-6">
              <div className="mx-auto max-w-xl">
                <button
                  type="button"
                  onClick={
                    startAnotherConversation
                  }
                  disabled={
                    startingNewConversation
                  }
                  className="w-full rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {startingNewConversation
                    ? 'Starting...'
                    : 'Start Another Conversation'}
                </button>

                <p className="mt-2 text-center text-xs text-gray-500">
                  Your previous messages will remain visible above.
                </p>
              </div>
            </div>
          ) : null}

          {reviewConversation && (
            <div className="border-t bg-slate-50 p-6">
              <div className="mx-auto max-w-xl">
                {review ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                    <p className="font-semibold text-green-800">
                      Thank you for rating {tutorName}.
                    </p>

                    <div className="mt-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <Star
                            key={star}
                            className={`h-6 w-6 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        )
                      )}
                    </div>

                    {review.comment && (
                      <p className="mt-3 text-sm text-green-800">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl bg-white p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900">
                      Rate {tutorName}
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      Rating is optional. You can start a new chat without rating.
                    </p>

                    <div className="mt-5 flex gap-2">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() =>
                              setHoverRating(star)
                            }
                            onMouseLeave={() =>
                              setHoverRating(0)
                            }
                            onClick={() =>
                              setRating(star)
                            }
                            className="transition hover:scale-110"
                            aria-label={`Rate ${star} stars`}
                          >
                            <Star
                              className={`h-9 w-9 ${
                                star <=
                                (hoverRating ||
                                  rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        )
                      )}
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) =>
                        setComment(e.target.value)
                      }
                      placeholder="Leave a comment (optional)"
                      rows={4}
                      className="mt-5 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />

                    {reviewError && (
                      <p className="mt-3 text-sm text-red-600">
                        {reviewError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={
                        submittingReview ||
                        rating < 1
                      }
                      className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingReview
                        ? 'Submitting...'
                        : 'Submit Rating'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}