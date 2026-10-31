import { CharacterStatus, CommunityRole, ThemePalette } from './database.types';

/** Comunidad tal como la muestra la interfaz. */
export interface CommunityServer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  theme: ThemePalette;
  userRole: CommunityRole | null;
  createdBy: string | null;
}

/** Personaje resumido dentro de la lista de miembros. */
export interface MemberCharacter {
  id: string;
  name: string;
  status: CharacterStatus;
  profesion: string;
  rasgos: string[];
}

/** Miembro de una comunidad con sus personajes. */
export interface CommunityMember {
  userId: string;
  role: CommunityRole;
  displayName: string;
  characters: MemberCharacter[];
}

/** Membresía usada por el store para calcular el rol activo. */
export interface MembershipRef {
  serverId: string;
  role: CommunityRole;
}
