export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'user';
export type CommunityRole = 'narrator' | 'player';
export type CharacterStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceStatus = 'yes' | 'maybe' | 'no';

export type BackgroundStyle = 'solid' | 'tint' | 'gradient';

export type ThemePalette = {
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
  background?: string | null;
  surface?: string | null;
  preset?: string | null;
  backgroundStyle?: BackgroundStyle | null;
};

export function communityRoleLabel(role: CommunityRole | null | undefined): string {
  if (role === 'narrator') {
    return 'Narrador';
  }
  if (role === 'player') {
    return 'Roleador';
  }
  return 'Sin rol en la comunidad';
}

export function characterStatusLabel(status: CharacterStatus): string {
  if (status === 'approved') {
    return 'Aprobado';
  }
  if (status === 'rejected') {
    return 'Rechazado';
  }
  return 'Pendiente';
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          global_role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          global_role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          global_role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      servers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          theme: ThemePalette;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          theme: ThemePalette;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          theme?: ThemePalette;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      server_members: {
        Row: {
          id: string;
          server_id: string;
          user_id: string;
          role: CommunityRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          server_id: string;
          user_id: string;
          role: CommunityRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          server_id?: string;
          user_id?: string;
          role?: CommunityRole;
          created_at?: string;
        };
        Relationships: [];
      };
      server_invites: {
        Row: {
          server_id: string;
          code: string;
        };
        Insert: {
          server_id: string;
          code: string;
        };
        Update: {
          server_id?: string;
          code?: string;
        };
        Relationships: [];
      };
      characters: {
        Row: {
          id: string;
          server_id: string;
          owner_id: string;
          name: string;
          data: Json;
          status: CharacterStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          server_id: string;
          owner_id: string;
          name: string;
          data: Json;
          status?: CharacterStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          server_id?: string;
          owner_id?: string;
          name?: string;
          data?: Json;
          status?: CharacterStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      community_races: {
        Row: {
          id: string;
          server_id: string;
          name: string;
          traits: Json;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          server_id: string;
          name: string;
          traits?: Json;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          server_id?: string;
          name?: string;
          traits?: Json;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          server_id: string;
          title: string;
          place: string;
          description: string | null;
          starts_at: string;
          ends_at: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          server_id: string;
          title: string;
          place: string;
          description?: string | null;
          starts_at: string;
          ends_at: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          server_id?: string;
          title?: string;
          place?: string;
          description?: string | null;
          starts_at?: string;
          ends_at?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      event_attendance: {
        Row: {
          id: string;
          event_id: string;
          server_id: string;
          user_id: string;
          status: AttendanceStatus;
        };
        Insert: {
          id?: string;
          event_id: string;
          server_id: string;
          user_id: string;
          status: AttendanceStatus;
        };
        Update: {
          id?: string;
          event_id?: string;
          server_id?: string;
          user_id?: string;
          status?: AttendanceStatus;
        };
        Relationships: [];
      };
      doc_feed: {
        Row: {
          id: string;
          server_id: string;
          author_id: string;
          kind: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          server_id: string;
          author_id: string;
          kind: string;
          payload: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          server_id?: string;
          author_id?: string;
          kind?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      doc_dice: {
        Row: {
          id: string;
          server_id: string;
          user_id: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          server_id: string;
          user_id: string;
          payload: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          server_id?: string;
          user_id?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      invite_code_valid: {
        Args: { p_code: string };
        Returns: boolean;
      };
      join_server: {
        Args: { p_code: string };
        Returns: string;
      };
      event_conflict: {
        Args: { p_place: string; p_start: string; p_end: string; p_exclude?: string };
        Returns: boolean;
      };
      character_name_available: {
        Args: { p_server: string; p_name: string; p_exclude?: string };
        Returns: boolean;
      };
      admin_set_global_role: {
        Args: { p_user: string; p_role: string };
        Returns: undefined;
      };
      create_community: {
        Args: { p_name: string; p_slug: string; p_description: string | null; p_theme: Json };
        Returns: string;
      };
      delete_community: {
        Args: { p_server: string };
        Returns: undefined;
      };
      regenerate_invite_code: {
        Args: { p_server: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
