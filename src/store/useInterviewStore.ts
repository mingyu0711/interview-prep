import { create } from 'zustand'
import { createSessionSlice, type SessionSlice } from './sessionSlice'

const useInterviewStore = create<SessionSlice>()(createSessionSlice)

export default useInterviewStore
