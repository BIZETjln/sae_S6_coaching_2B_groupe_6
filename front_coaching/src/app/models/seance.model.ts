export interface Coach {
  id: number;
  name: string;
  specialite: string;
  avatar: string;
}

export interface Seance {
  id: number;
  titre: string;
  description: string;
  date: Date;
  heureDebut: string;
  heureFin: string;
  duree: number; // en minutes
  coach: Coach;
  lieu: string;
  type: 'individuelle' | 'groupe';
  capaciteMax?: number;
  participantsActuels?: number;
  statut: 'à venir' | 'terminée' | 'annulée';
  couleur?: string; // Pour l'affichage dans le calendrier
} 