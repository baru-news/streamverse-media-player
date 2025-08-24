export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_telegram_users: {
        Row: {
          added_at: string
          id: string
          is_active: boolean
          telegram_user_id: number
          telegram_username: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          is_active?: boolean
          telegram_user_id: number
          telegram_username?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          is_active?: boolean
          telegram_user_id?: number
          telegram_username?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          position: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          position?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ads_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      badge_store: {
        Row: {
          badge_key: string
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_coins: number
          rarity: string
          sort_order: number
        }
        Insert: {
          badge_key: string
          color?: string
          created_at?: string
          description?: string | null
          icon: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_coins: number
          rarity?: string
          sort_order?: number
        }
        Update: {
          badge_key?: string
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_coins?: number
          rarity?: string
          sort_order?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          reward_coins: number
          target_value: number
          task_key: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reward_coins: number
          target_value?: number
          task_key: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reward_coins?: number
          target_value?: number
          task_key?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_groups: {
        Row: {
          added_by_admin_id: string | null
          auto_upload_enabled: boolean
          chat_id: number
          chat_title: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          added_by_admin_id?: string | null
          auto_upload_enabled?: boolean
          chat_id: number
          chat_title?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          added_by_admin_id?: string | null
          auto_upload_enabled?: boolean
          chat_id?: number
          chat_title?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_subscription_requests: {
        Row: {
          admin_notes: string | null
          admin_user_id: string | null
          amount: number
          created_at: string
          id: string
          payment_proof_url: string | null
          processed_at: string | null
          status: string
          subscription_type: string
          telegram_username: string | null
          trakteer_transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          admin_user_id?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_proof_url?: string | null
          processed_at?: string | null
          status?: string
          subscription_type?: string
          telegram_username?: string | null
          trakteer_transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          admin_user_id?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_proof_url?: string | null
          processed_at?: string | null
          status?: string
          subscription_type?: string
          telegram_username?: string | null
          trakteer_transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          payment_info: Json | null
          start_date: string
          subscription_type: string
          telegram_user_id: number | null
          telegram_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          payment_info?: Json | null
          start_date?: string
          subscription_type?: string
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          payment_info?: Json | null
          start_date?: string
          subscription_type?: string
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_verified: boolean | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          profile_complete: boolean
          telegram_chat_id: number | null
          telegram_user_id: number | null
          telegram_username: string | null
          updated_at: string
          username: string | null
          welcome_bonus_claimed: boolean
        }
        Insert: {
          age_verified?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          profile_complete?: boolean
          telegram_chat_id?: number | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          username?: string | null
          welcome_bonus_claimed?: boolean
        }
        Update: {
          age_verified?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          profile_complete?: boolean
          telegram_chat_id?: number | null
          telegram_user_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          username?: string | null
          welcome_bonus_claimed?: boolean
        }
        Relationships: []
      }
      spin_wheel_rewards: {
        Row: {
          coin_amount: number
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          probability: number
          rarity: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          coin_amount: number
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          probability?: number
          rarity?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          coin_amount?: number
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          probability?: number
          rarity?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      spin_wheel_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_type?: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_invitations: {
        Row: {
          chat_id: number
          created_at: string
          error_message: string | null
          id: string
          invitation_status: string
          invited_at: string
          joined_at: string | null
          telegram_user_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: number
          created_at?: string
          error_message?: string | null
          id?: string
          invitation_status?: string
          invited_at?: string
          joined_at?: string | null
          telegram_user_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: number
          created_at?: string
          error_message?: string | null
          id?: string
          invitation_status?: string
          invited_at?: string
          joined_at?: string | null
          telegram_user_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_link_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          telegram_user_id: number
          telegram_username: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          telegram_user_id: number
          telegram_username?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          telegram_user_id?: number
          telegram_username?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_link_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_uploads: {
        Row: {
          created_at: string
          doodstream_file_code: string | null
          error_message: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          original_filename: string | null
          processed_at: string | null
          telegram_chat_id: number
          telegram_file_id: string
          telegram_file_unique_id: string
          telegram_message_id: number
          telegram_user_id: number
          updated_at: string
          upload_status: string
          video_id: string | null
        }
        Insert: {
          created_at?: string
          doodstream_file_code?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          processed_at?: string | null
          telegram_chat_id: number
          telegram_file_id: string
          telegram_file_unique_id: string
          telegram_message_id: number
          telegram_user_id: number
          updated_at?: string
          upload_status?: string
          video_id?: string | null
        }
        Update: {
          created_at?: string
          doodstream_file_code?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_filename?: string | null
          processed_at?: string | null
          telegram_chat_id?: number
          telegram_file_id?: string
          telegram_file_unique_id?: string
          telegram_message_id?: number
          telegram_user_id?: number
          updated_at?: string
          upload_status?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telegram_uploads_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_logs: {
        Row: {
          created_at: string
          error_message: string | null
          file_size: number | null
          filename: string
          id: string
          ip_address: string | null
          success: boolean
          upload_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_size?: number | null
          filename: string
          id?: string
          ip_address?: string | null
          success?: boolean
          upload_type?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_size?: number | null
          filename?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          upload_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_key: string
          id: string
          is_active: boolean
          purchased_at: string
          user_id: string
        }
        Insert: {
          badge_key: string
          id?: string
          is_active?: boolean
          purchased_at?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          id?: string
          is_active?: boolean
          purchased_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_coins: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          progress_value: number
          task_date: string
          task_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress_value?: number
          task_date?: string
          task_key: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          progress_value?: number
          task_date?: string
          task_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_kitty_keys: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_spin_attempts: {
        Row: {
          coins_won: number
          created_at: string
          id: string
          reward_id: string
          spin_date: string
          user_id: string
        }
        Insert: {
          coins_won: number
          created_at?: string
          id?: string
          reward_id: string
          spin_date?: string
          user_id: string
        }
        Update: {
          coins_won?: number
          created_at?: string
          id?: string
          reward_id?: string
          spin_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_spin_attempts_reward_id"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "spin_wheel_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          creator_name: string
          id: string
          subscriber_id: string
        }
        Insert: {
          created_at?: string
          creator_name: string
          id?: string
          subscriber_id: string
        }
        Update: {
          created_at?: string
          creator_name?: string
          id?: string
          subscriber_id?: string
        }
        Relationships: []
      }
      user_watch_sessions: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          session_end: string | null
          session_start: string
          user_id: string
          video_id: string | null
          watch_duration: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          session_end?: string | null
          session_start?: string
          user_id: string
          video_id?: string | null
          watch_duration?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          session_end?: string | null
          session_start?: string
          user_id?: string
          video_id?: string | null
          watch_duration?: number
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_edited: boolean | null
          parent_id: string | null
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          parent_id?: string | null
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      video_hashtags: {
        Row: {
          created_at: string
          hashtag_id: string
          id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          hashtag_id: string
          id?: string
          video_id: string
        }
        Update: {
          created_at?: string
          hashtag_id?: string
          id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_video_hashtags_hashtag"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_video_hashtags_video"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          description_edited: boolean | null
          doodstream_file_code: string | null
          duration: number | null
          file_code: string
          file_size: number | null
          id: string
          original_title: string | null
          primary_provider: Database["public"]["Enums"]["video_provider"] | null
          provider: Database["public"]["Enums"]["video_provider"]
          provider_data: Json | null
          slug: string | null
          status: string | null
          thumbnail_url: string | null
          title: string
          title_edited: boolean | null
          updated_at: string
          upload_date: string | null
          views: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          description_edited?: boolean | null
          doodstream_file_code?: string | null
          duration?: number | null
          file_code: string
          file_size?: number | null
          id?: string
          original_title?: string | null
          primary_provider?:
            | Database["public"]["Enums"]["video_provider"]
            | null
          provider?: Database["public"]["Enums"]["video_provider"]
          provider_data?: Json | null
          slug?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          title_edited?: boolean | null
          updated_at?: string
          upload_date?: string | null
          views?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          description_edited?: boolean | null
          doodstream_file_code?: string | null
          duration?: number | null
          file_code?: string
          file_size?: number | null
          id?: string
          original_title?: string | null
          primary_provider?:
            | Database["public"]["Enums"]["video_provider"]
            | null
          provider?: Database["public"]["Enums"]["video_provider"]
          provider_data?: Json | null
          slug?: string | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          title_edited?: boolean | null
          updated_at?: string
          upload_date?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      website_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: Json
      }
      approve_premium_request: {
        Args:
          | {
              admin_notes_param?: string
              premium_group_id?: number
              request_id: string
            }
          | { admin_notes_param?: string; request_id: string }
        Returns: Json
      }
      award_welcome_bonus: {
        Args: { user_id_param: string }
        Returns: Json
      }
      can_user_claim_kitty_key_today: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      check_user_premium_status: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      check_username_exists: {
        Args: { username_input: string }
        Returns: boolean
      }
      claim_kitty_key: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      cleanup_old_avatar: {
        Args: { new_avatar_path: string; user_id_param: string }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      handle_daily_login: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_user_to_telegram: {
        Args: {
          chat_id_param: number
          telegram_user_id_param: number
          user_id_param: string
        }
        Returns: boolean
      }
      is_telegram_admin: {
        Args: { telegram_user_id_param: number }
        Returns: boolean
      }
      make_user_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      reject_premium_request: {
        Args: { admin_notes_param: string; request_id: string }
        Returns: boolean
      }
      update_watch_progress: {
        Args: { duration_seconds: number; user_id_param: string }
        Returns: undefined
      }
      verify_telegram_link_code: {
        Args: { link_code: string; user_id_param: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "premium"
      video_provider: "doodstream"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "premium"],
      video_provider: ["doodstream"],
    },
  },
} as const
