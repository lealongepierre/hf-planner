import { apiClient } from './client'

export interface PushSubscribePayload {
  endpoint: string
  keys: { p256dh: string; auth: string }
  user_agent?: string
}

export const pushApi = {
  async getVapidPublicKey(): Promise<string> {
    const response = await apiClient.get<{ key: string }>('/push/vapid-public-key')
    return response.data.key
  },

  async subscribe(payload: PushSubscribePayload): Promise<void> {
    await apiClient.post('/push/subscriptions', payload)
  },

  async unsubscribe(endpoint: string): Promise<void> {
    await apiClient.delete('/push/subscriptions', { data: { endpoint } })
  },
}
