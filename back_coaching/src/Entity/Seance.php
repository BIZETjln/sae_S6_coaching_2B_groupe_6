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
            denormalizationContext: ['groups' => ['seance:write:sportifs']],
            // TODO A décommenter lorsque la sécurité sera implémentée
            // security: "is_granted('ROLE_USER')"
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

    /**
     * @var Collection<int, Sportif>
     */
    #[Groups(['seance:read', 'coach:read', 'seance:write:sportifs'])]
    #[ORM\ManyToMany(targetEntity: Sportif::class, inversedBy: 'seances')]
    private Collection $sportifs;

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

    public function __construct()
    {
        $this->sportifs = new ArrayCollection();
        $this->exercices = new ArrayCollection();
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
     * @return Collection<int, Sportif>
     */
    public function getSportifs(): Collection
    {
        return $this->sportifs;
    }

    public function addSportif(Sportif $sportif): static
    {
        if ($this->sportifs->count() >= 3) {
            throw new \InvalidArgumentException('Uniquement 3 sportifs maximum par séance');
        }

        if (!$this->sportifs->contains($sportif)) {
            $this->sportifs->add($sportif);
        }

        return $this;
    }

    public function removeSportif(Sportif $sportif): static
    {
        $this->sportifs->removeElement($sportif);

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
}
