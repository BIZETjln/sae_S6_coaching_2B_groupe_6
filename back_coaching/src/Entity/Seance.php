<?php

namespace App\Entity;

use App\Enum\Niveau;
use App\Enum\StatutSeance;
use App\Enum\TypeSeance;
use App\Repository\SeanceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use App\Enum\ThemeSeance;
use App\Entity\Sportif;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: SeanceRepository::class)]
#[ApiResource(
    operations: [
        new Get(normalizationContext: ['groups' => ['seance:read']]),
        new GetCollection(normalizationContext: ['groups' => ['seance:read']]),
        new Patch(
            uriTemplate: '/seances/{id}/inscription',
            input: false,
            controller: 'App\Controller\Api\SeanceInscriptionController::toggleInscription',
            security: "is_granted('ROLE_USER')",
        )
    ]
)]
class Seance
{
    #[Groups(['seance:read', 'coach:read', 'sportif:read'])]
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[Groups(['seance:read', 'coach:read', 'sportif:read'])]
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $date_heure = null;

    #[Groups(['seance:read', 'coach:read', 'sportif:read'])]
    #[ORM\Column(enumType: TypeSeance::class)]
    private ?TypeSeance $type_seance = null;

    #[Groups(['seance:read', 'coach:read', 'sportif:read'])]
    #[ORM\Column(enumType: ThemeSeance::class)]
    private ?ThemeSeance $theme_seance = null;

    #[Groups(['seance:read', 'coach:read', 'sportif:read'])]
    #[ORM\ManyToOne(inversedBy: 'seances')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Coach $coach = null;

    #[Groups(['seance:read', 'coach:read', 'sportif:read'])]
    #[ORM\Column(enumType: StatutSeance::class)]
    private ?StatutSeance $statut = null;

    #[Groups(['seance:read', 'coach:read', 'sportif:read'])]
    #[ORM\Column(enumType: Niveau::class)]
    private ?Niveau $niveau_seance = null;

    /**
     * @var Collection<int, Exercice>
     */
    #[Groups(['seance:read', 'coach:read', 'sportif:read'])]
    #[ORM\ManyToMany(targetEntity: Exercice::class, inversedBy: 'seances')]
    private Collection $exercices;

    #[Groups(['seance:read', 'coach:read', 'sportif:read'])]
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $photo = null;

    #[ORM\OneToMany(mappedBy: "seance", targetEntity: Participation::class, cascade: ["persist", "remove"])]
    private Collection $participations;

    public function __construct()
    {
        $this->exercices = new ArrayCollection();
        $this->participations = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getDateHeure(): ?\DateTimeInterface
    {
        return $this->date_heure;
    }

    public function setDateHeure(\DateTimeInterface $date_heure): static
    {
        $this->date_heure = $date_heure;

        return $this;
    }

    public function getTypeSeance(): ?TypeSeance
    {
        return $this->type_seance;
    }

    public function setTypeSeance(TypeSeance $type_seance): static
    {
        $this->type_seance = $type_seance;

        return $this;
    }

    public function getThemeSeance(): ?ThemeSeance
    {
        return $this->theme_seance;
    }

    public function setThemeSeance(ThemeSeance $theme_seance): static
    {
        if (!in_array($theme_seance, [ThemeSeance::FITNESS, ThemeSeance::CARDIO, ThemeSeance::MUSCULATION, ThemeSeance::CROSSFIT])) {
            throw new \InvalidArgumentException('Thème de séance invalide');
        }

        $this->theme_seance = $theme_seance;

        return $this;
    }

    public function getCoach(): ?Coach
    {
        return $this->coach;
    }

    public function setCoach(?Coach $coach): static
    {
        $this->coach = $coach;

        return $this;
    }

    /**
     * @return Collection<int, Participation>
     */
    public function getParticipations(): Collection
    {
        return $this->participations;
    }

    /**
     * @return Collection<int, Sportif>
     */
    public function getSportifs(): Collection
    {
        return new ArrayCollection(
            $this->participations->map(fn($p) => $p->getSportif())->toArray()
        );
    }

    /**
     * Retourne les IDs des sportifs participant à la séance
     * @return array
     */
    #[Groups(['seance:read', 'coach:read'])]
    public function getSportifsIds(): array
    {
        return $this->participations
            ->map(fn($p) => $p->getSportif()->getId()->__toString())
            ->toArray();
    }

    public function addParticipation(Participation $participation): static
    {
        // Vérifier si le sportif existe déjà dans les participations
        if ($participation->getSportif() !== null) {
            foreach ($this->participations as $existingParticipation) {
                if (
                    $existingParticipation !== $participation &&
                    $existingParticipation->getSportif() !== null &&
                    $existingParticipation->getSportif()->getId() === $participation->getSportif()->getId()
                ) {
                    // Au lieu de retourner silencieusement, lancer une exception
                    throw new \LogicException("Le sportif " . $participation->getSportif()->getNom() . " " .
                        $participation->getSportif()->getPrenom() . " participe déjà à cette séance");
                }
            }
        }

        if (!$this->participations->contains($participation)) {
            $this->participations->add($participation);
            // Maintenir la relation bidirectionnelle
            if ($participation->getSeance() !== $this) {
                $participation->setSeance($this);
            }
        }
        return $this;
    }

    public function removeParticipation(Participation $participation): static
    {
        if ($this->participations->contains($participation)) {
            $this->participations->removeElement($participation);
            // Ne pas définir seance à null pour éviter l'erreur de contrainte
            // Nous supprimerons plutôt l'entité Participation elle-même dans le contrôleur
        }
        return $this;
    }

    public function addSportif(Sportif $sportif): static
    {
        // Vérifie si le sportif participe déjà à la séance
        foreach ($this->participations as $participation) {
            if ($participation->getSportif() === $sportif) {
                return $this;
            }
        }

        // Crée une nouvelle participation et l'ajoute
        $participation = new Participation();
        $participation->setSportif($sportif);
        $participation->setSeance($this);
        $this->addParticipation($participation);

        return $this;
    }

    public function removeSportif(Sportif $sportif): static
    {
        foreach ($this->participations as $participation) {
            if ($participation->getSportif() === $sportif) {
                $this->removeParticipation($participation);
                break;
            }
        }

        return $this;
    }

    public function getStatut(): ?StatutSeance
    {
        return $this->statut;
    }

    public function setStatut(StatutSeance $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getNiveauSeance(): ?Niveau
    {
        return $this->niveau_seance;
    }

    public function setNiveauSeance(Niveau $niveau_seance): static
    {

        if (!in_array($niveau_seance, [Niveau::DEBUTANT, Niveau::INTERMEDIAIRE, Niveau::AVANCE])) {
            throw new \InvalidArgumentException('Niveau de séance invalide');
        }

        $this->niveau_seance = $niveau_seance;

        return $this;
    }

    /**
     * @return Collection<int, Exercice>
     */
    public function getExercices(): Collection
    {
        return $this->exercices;
    }

    public function addExercice(Exercice $exercice): static
    {
        if (!$this->exercices->contains($exercice)) {
            $this->exercices->add($exercice);
        }

        return $this;
    }

    public function removeExercice(Exercice $exercice): static
    {
        $this->exercices->removeElement($exercice);

        return $this;
    }

    /**
     * Vérifie si la séance peut être annulée par un sportif
     * (jusqu'à 24h avant)
     */
    public function canBeCancelledBySportif(): bool
    {
        if ($this->statut === StatutSeance::VALIDEE) {
            return false;
        }

        $now = new \DateTime();
        $limit = new \DateTime($this->date_heure->format('Y-m-d H:i:s'));
        $limit->modify('-24 hours');

        return $now < $limit;
    }

    /**
     * Vérifie si la séance peut être modifiée
     */
    public function canBeModified(): bool
    {
        return $this->statut !== StatutSeance::VALIDEE;
    }

    /**
     * Annule la séance
     */
    public function cancel(): static
    {
        if ($this->statut === StatutSeance::VALIDEE) {
            throw new \LogicException('Une séance validée ne peut pas être annulée');
        }

        $this->statut = StatutSeance::ANNULEE;

        return $this;
    }

    public function getPhoto(): ?string
    {
        return $this->photo;
    }

    public function setPhoto(?string $photo): static
    {
        $this->photo = $photo;

        return $this;
    }
}
