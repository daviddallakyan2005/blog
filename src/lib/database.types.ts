export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          status: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          status?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      github_pull_requests: {
        Row: {
          closed_at: string | null
          draft: boolean
          github_created_at: string
          github_id: number
          github_updated_at: string
          html_url: string
          id: string
          issue_comments: number
          merged: boolean
          merged_at: string | null
          number: number
          repo: string
          review_comments: number
          review_decision: string | null
          state: string
          synced_at: string
          title: string
        }
        Insert: {
          closed_at?: string | null
          draft?: boolean
          github_created_at: string
          github_id: number
          github_updated_at: string
          html_url: string
          id?: string
          issue_comments?: number
          merged?: boolean
          merged_at?: string | null
          number: number
          repo: string
          review_comments?: number
          review_decision?: string | null
          state: string
          synced_at?: string
          title: string
        }
        Update: {
          closed_at?: string | null
          draft?: boolean
          github_created_at?: string
          github_id?: number
          github_updated_at?: string
          html_url?: string
          id?: string
          issue_comments?: number
          merged?: boolean
          merged_at?: string | null
          number?: number
          repo?: string
          review_comments?: number
          review_decision?: string | null
          state?: string
          synced_at?: string
          title?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt: string | null
          byte_size: number | null
          created_at: string
          height: number | null
          id: string
          path: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          byte_size?: number | null
          created_at?: string
          height?: number | null
          id?: string
          path: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          byte_size?: number | null
          created_at?: string
          height?: number | null
          id?: string
          path?: string
          width?: number | null
        }
        Relationships: []
      }
      post_revisions: {
        Row: {
          body_md: string
          created_at: string
          id: string
          post_id: string
          title: string
        }
        Insert: {
          body_md: string
          created_at?: string
          id?: string
          post_id: string
          title: string
        }
        Update: {
          body_md?: string
          created_at?: string
          id?: string
          post_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body_html: string
          body_md: string
          canonical_url: string | null
          cover_path: string | null
          created_at: string
          id: string
          kind: string
          published_at: string | null
          reading_minutes: number
          search_vector: unknown
          series_id: string | null
          series_order: number | null
          slug: string
          status: string
          summary: string | null
          title: string
          toc_json: Json
          updated_at: string
          word_count: number
        }
        Insert: {
          body_html?: string
          body_md?: string
          canonical_url?: string | null
          cover_path?: string | null
          created_at?: string
          id?: string
          kind: string
          published_at?: string | null
          reading_minutes?: number
          search_vector?: unknown
          series_id?: string | null
          series_order?: number | null
          slug: string
          status?: string
          summary?: string | null
          title: string
          toc_json?: Json
          updated_at?: string
          word_count?: number
        }
        Update: {
          body_html?: string
          body_md?: string
          canonical_url?: string | null
          cover_path?: string | null
          created_at?: string
          id?: string
          kind?: string
          published_at?: string | null
          reading_minutes?: number
          search_vector?: unknown
          series_id?: string | null
          series_order?: number | null
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          toc_json?: Json
          updated_at?: string
          word_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          github_username: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          github_username?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          github_username?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description_html: string
          description_md: string
          featured: boolean
          forks: number | null
          homepage_url: string | null
          id: string
          name: string
          primary_language: string | null
          repo_url: string | null
          role: string | null
          slug: string
          sort_order: number
          stars: number | null
          stars_synced_at: string | null
          status: string
          tagline: string | null
          tech: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_html?: string
          description_md?: string
          featured?: boolean
          forks?: number | null
          homepage_url?: string | null
          id?: string
          name: string
          primary_language?: string | null
          repo_url?: string | null
          role?: string | null
          slug: string
          sort_order?: number
          stars?: number | null
          stars_synced_at?: string | null
          status?: string
          tagline?: string | null
          tech?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_html?: string
          description_md?: string
          featured?: boolean
          forks?: number | null
          homepage_url?: string | null
          id?: string
          name?: string
          primary_language?: string | null
          repo_url?: string | null
          role?: string | null
          slug?: string
          sort_order?: number
          stars?: number | null
          stars_synced_at?: string | null
          status?: string
          tagline?: string | null
          tech?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          avatar_path: string | null
          bio_html: string | null
          bio_md: string | null
          cv_html: string
          cv_md: string
          display_name: string | null
          id: number
          seo_description: string | null
          seo_title: string | null
          social: Json
          tagline: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          bio_html?: string | null
          bio_md?: string | null
          cv_html?: string
          cv_md?: string
          display_name?: string | null
          id?: number
          seo_description?: string | null
          seo_title?: string | null
          social?: Json
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          bio_html?: string | null
          bio_md?: string | null
          cv_html?: string
          cv_md?: string
          display_name?: string | null
          id?: number
          seo_description?: string | null
          seo_title?: string | null
          social?: Json
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      timeline_entries: {
        Row: {
          created_at: string
          description_html: string
          description_md: string
          end_date: string | null
          highlights: string[]
          id: string
          is_current: boolean
          kind: string
          org: string | null
          org_url: string | null
          sort_order: number
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_html?: string
          description_md?: string
          end_date?: string | null
          highlights?: string[]
          id?: string
          is_current?: boolean
          kind: string
          org?: string | null
          org_url?: string | null
          sort_order?: number
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_html?: string
          description_md?: string
          end_date?: string | null
          highlights?: string[]
          id?: string
          is_current?: boolean
          kind?: string
          org?: string | null
          org_url?: string | null
          sort_order?: number
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_profile_id: { Args: never; Returns: string }
      is_owner: { Args: never; Returns: boolean }
      search_posts: {
        Args: { limit_n?: number; q: string }
        Returns: {
          kind: string
          rank: number
          slug: string
          snippet: string
          title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

