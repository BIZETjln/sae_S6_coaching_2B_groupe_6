export interface Coach {
  id: string;
  '@id'?: string;
  '@type'?: string;
  name?: string;
  nom?: string;
  prenom?: string;
  email?: string;
  specialite?: string;
  avatar?: string;
}

export interface Seance {
  id: string;
  '@id'?: string;
  '@type'?: string;
  titre?: string;
  description?: string;
  date?: Date;
  date_heure?: string; // Format API
  dateHeure?: string; // Format API alternative
  heureDebut?: string;
  heureFin?: string;
  duree?: number; // en minutes
  coach?: Coach;
  lieu?: string;
  type?: string; // 'solo', 'duo', 'trio', etc.
  type_seance?: string; // Format API
  typeSeance?: string; // Format API alternative
  capaciteMax?: number;
  participantsActuels?: number;
  statut?: string; // 'prevue', 'validee', 'annulee', 'terminée', 'à venir'
  couleur?: string; // Pour l'affichage dans le calendrier
  theme?: string; // thème de la séance: 'fitness', 'musculation', 'cardio', 'crossfit', etc.
  theme_seance?: string; // Format API
  themeSeance?: string; // Format API alternative
  niveau?: string; // niveau de la séance: 'debutant', 'intermediaire', 'avance'
  niveau_seance?: string; // Format API
  niveauSeance?: string; // Format API alternative
  exercices?: any[]; // Liste des IDs d'exercices
  sportifs?: string[]; // Liste des IDs de sportifs
  image?: string;
  photo?: string; // Format API alternative pour l'image
  groupesMusculaires?: string[];
  selected?: boolean;
} 