import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-conditions',
  templateUrl: './conditions.component.html',
  styleUrls: ['./conditions.component.css'],
  standalone: false,
})
export class ConditionsComponent implements OnInit {
  // Sections des conditions d'utilisation
  termsSections = [
    {
      title: 'Inscription et éligibilité',
      description: 'En vous inscrivant sur SportCoach, vous certifiez être majeur ou avoir l\'autorisation d\'un responsable légal, et être en mesure physique de pratiquer les activités proposées.',
      icon: 'bi-person-check'
    },
    {
      title: 'Réservation de séances',
      description: 'Les réservations sont validées après paiement complet. Une annulation est possible jusqu\'à 24h avant la séance pour un remboursement partiel selon nos conditions.',
      icon: 'bi-calendar-check'
    },
    {
      title: 'Responsabilité',
      description: 'Vous êtes responsable de consulter un médecin avant de débuter toute activité physique. SportCoach ne pourra être tenu responsable en cas de blessure ou problème de santé.',
      icon: 'bi-shield-exclamation'
    },
    {
      title: 'Propriété intellectuelle',
      description: 'Tous les contenus disponibles sur notre plateforme (logo, textes, images) sont protégés par des droits de propriété intellectuelle et ne peuvent être reproduits sans autorisation.',
      icon: 'bi-file-earmark-lock'
    }
  ];

  // Sections principales des conditions
  mainConditions = [
    {
      title: 'Utilisation du service',
      content: `
        <p>En utilisant nos services, vous vous engagez à :</p>
        <ul>
          <li>Fournir des informations exactes et complètes lors de votre inscription</li>
          <li>Maintenir la confidentialité de vos identifiants de connexion</li>
          <li>Ne pas créer de faux comptes ou usurper l'identité d'un tiers</li>
          <li>Ne pas utiliser le service à des fins illégales ou non autorisées</li>
          <li>Respecter les autres utilisateurs et les coachs de la plateforme</li>
        </ul>
        <p>Nous nous réservons le droit de suspendre ou supprimer votre compte en cas de violation de ces conditions.</p>
      `
    },
    {
      title: 'Tarification et paiements',
      content: `
        <p>Notre politique de tarification et de paiement s'articule comme suit :</p>
        <ul>
          <li>Les prix des séances sont clairement indiqués et incluent toutes les taxes applicables</li>
          <li>Le paiement est requis au moment de la réservation pour confirmer votre séance</li>
          <li>Nous acceptons les paiements par carte bancaire et autres moyens spécifiés sur la plateforme</li>
          <li>Les remboursements sont possibles selon notre politique d'annulation</li>
          <li>Nous pouvons modifier nos tarifs à tout moment, avec notification préalable</li>
        </ul>
        <p>En cas de problème de facturation, veuillez contacter notre service client dans les 30 jours suivant la date de facturation.</p>
      `
    },
    {
      title: 'Annulations et remboursements',
      content: `
        <p>Notre politique d'annulation est la suivante :</p>
        <ul>
          <li>Annulation plus de 24h avant la séance : remboursement à 80% du montant payé</li>
          <li>Annulation moins de 24h avant la séance : aucun remboursement</li>
          <li>En cas d'annulation par le coach : remboursement intégral ou report sans frais</li>
          <li>Des crédits peuvent être accordés pour une utilisation future plutôt qu'un remboursement</li>
          <li>Les abonnements peuvent être suspendus temporairement sous certaines conditions (certificat médical)</li>
        </ul>
        <p>Pour toute demande d'annulation, veuillez utiliser la fonction dédiée dans votre espace client ou contacter le service client.</p>
      `
    },
    {
      title: 'Limitation de responsabilité',
      content: `
        <p>SportCoach limite sa responsabilité dans les cas suivants :</p>
        <ul>
          <li>Nous ne sommes pas responsables des blessures ou problèmes de santé survenus pendant ou après les séances</li>
          <li>Nous ne garantissons pas les résultats spécifiques liés à l'utilisation de nos services</li>
          <li>Nous ne sommes pas responsables des contenus partagés par les coachs ou autres utilisateurs</li>
          <li>Notre responsabilité financière est limitée au montant que vous avez payé pour le service concerné</li>
          <li>Nous ne sommes pas responsables des interruptions de service dues à des facteurs hors de notre contrôle</li>
        </ul>
        <p>Nous vous recommandons de consulter un médecin avant de commencer tout programme d'exercice physique.</p>
      `
    }
  ];

  constructor() {}

  ngOnInit(): void {
    // Animation au défilement
    this.initScrollAnimation();
  }

  // Méthode pour initialiser les animations au défilement
  private initScrollAnimation(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Sélectionner tous les éléments à animer
    const animatedElements = document.querySelectorAll(
      '.terms-card, .main-condition, .cta'
    );
    animatedElements.forEach((element) => {
      observer.observe(element);
    });
  }
} 