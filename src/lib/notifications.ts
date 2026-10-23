// ============================================================================
// PesanBotol - Logika Antrian Notifikasi dan Push
// ============================================================================

import { supabase } from '@/lib/supabase';

export interface NotificationQueueRow {
  id: number;
  device_token: string;
  target_bottle_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
}

// Simpan notifikasi ke antrian (dipanggil saat ada balasan baru).
// Tidak melempar error agar kegagalan antrian notifikasi tidak mengganggu
// alur penyimpanan botol utama (fire-and-forget).
export async function enqueueNotification(params: {
  deviceToken: string;
  targetBottleId: number;
  content: string;
}): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('notification_queue')
      .insert({
        device_token: params.deviceToken,
        target_bottle_id: params.targetBottleId,
        content: params.content,
        is_read: false,
      });
    if (error) {
      const detail =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);
      console.error(
        '[PesanBotol] Gagal menyimpan notifikasi: %s. Pastikan tabel notification_queue sudah dibuat (jalankan migrasi 202610190001_notification_queue.sql).',
        detail
      );
    }
  } catch (err) {
    const detail =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : JSON.stringify(err);
    console.error(
      '[PesanBotol] Gagal menyimpan notifikasi: %s. Pastikan tabel notification_queue sudah dibuat (jalankan migrasi 202610190001_notification_queue.sql).',
      detail
    );
  }
}

// Ambil notifikasi belum dibaca per device token
export async function getUnreadNotifications(deviceToken: string): Promise<NotificationQueueRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('device_token', deviceToken)
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as NotificationQueueRow[];
}

// Tandai notifikasi sebagai dibaca
export async function markNotificationRead(notificationId: number): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('notification_queue')
    .update({ is_read: true })
    .eq('id', notificationId);
}

// Simpan langganan push ke database
export async function savePushSubscription(params: {
  deviceToken: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
}): Promise<void> {
  if (!supabase) return;
  await supabase.from('push_subscriptions').upsert(
    {
      device_token: params.deviceToken,
      endpoint: params.endpoint,
      p256dh_key: params.p256dhKey,
      auth_key: params.authKey,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  );
}

// Hapus langganan push
export async function removePushSubscription(endpoint: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}

// Cek apakah device sudah menerima push hari ini (kuota 1x per hari)
export async function hasPushToday(deviceToken: string): Promise<boolean> {
  if (!supabase) return false;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('notification_queue')
    .select('id')
    .eq('device_token', deviceToken)
    .gte('created_at', todayStart.toISOString())
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}
