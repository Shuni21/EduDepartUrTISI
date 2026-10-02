import { io, type Socket } from 'socket.io-client'

import { getScheduleSocketUrl } from '@/config/api'

export type ScheduleChangedPayload = {
    reason:
        | 'item-created'
        | 'item-updated'
        | 'item-disabled'
        | 'item-deleted'
        | 'preholiday-updated'
        | 'schedule-uploaded'
        | 'schedule-upload-deleted'
}

export type ScheduleSubscription = {
    type: 'group' | 'teacher' | 'room'
    identity: string
}

export type PreholidayDaysUpdatedPayload = {
    preholidayDays: string[]
}

export type ScheduleSocketHandlers = {
    onScheduleChanged: (payload: ScheduleChangedPayload) => void
    onPreholidayDaysUpdated: (payload: PreholidayDaysUpdatedPayload) => void
    onConnectError?: (error: Error) => void
}

export function connectScheduleSocket(
    handlers: ScheduleSocketHandlers,
): Socket {
    const socket = io(getScheduleSocketUrl(), {
        transports: ['websocket'],
    })

    socket.on('schedule:changed', handlers.onScheduleChanged)
    socket.on('schedule:preholiday-days-updated', handlers.onPreholidayDaysUpdated)

    if (handlers.onConnectError) {
        socket.on('connect_error', handlers.onConnectError)
    }

    return socket
}