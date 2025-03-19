export interface Sportif {
  date_inscription: string;
  niveau_sportif: string;
  email: string;
  password: string;
  nom: string;
  prenom: string;
  photo: string | null;
}

export interface SportifResponse {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  id?: string;
  date_inscription: string;
  niveau_sportif: string;
  email: string;
  nom: string;
  prenom: string;
  photo: string | null;
}
