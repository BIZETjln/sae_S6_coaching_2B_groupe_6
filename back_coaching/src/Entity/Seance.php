<?php

namespace App\Entity;

use App\Repository\SeanceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
#[ORM\Entity(repositoryClass: SeanceRepository::class)]
class Seance
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $date_heure = null;

    #[ORM\Column(length: 50)]
    private ?string $type_seance = null;

    #[ORM\Column(length: 50)]
    private ?string $theme_seance = null;

    #[ORM\ManyToOne(inversedBy: 'seances')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Coach $coach_id = null;

    /**
     * @var Collection<int, Sportif>
     */
    #[ORM\ManyToMany(targetEntity: Sportif::class, inversedBy: 'seances')]
    private Collection $sportifs;

    /**
     * @var Collection<int, Exercice>
     */
    #[ORM\ManyToMany(targetEntity: Exercice::class, inversedBy: 'seances')]
    private Collection $exercices;

    #[ORM\Column(length: 20)]
    private ?string $statut = null;

    #[ORM\Column(length: 30)]
    private ?string $niveau_seance = null;

    public const TYPE_SOLO = 'solo';
    public const TYPE_DUO = 'duo';
    public const TYPE_TRIO = 'trio';

    public const THEME_FITNESS = 'fitness';
    public const THEME_CARDIO = 'cardio';
    public const THEME_MUSCULATION = 'musculation';
    public const THEME_CROSSFIT = 'crossfit';

    public const STATUT_PREVUE = 'prevue';
    public const STATUT_VALIDEE = 'validee';
    public const STATUT_ANNULEE = 'annulee';

    public const NIVEAU_DEBUTANT = 'debutant';
    public const NIVEAU_INTERMEDIAIRE = 'intermediaire';
    public const NIVEAU_AVANCE = 'avance';

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

    public function getTypeSeance(): ?string
    {
        return $this->type_seance;
    }

    public function setTypeSeance(string $type_seance): static
    {
        if (!in_array($type_seance, [self::TYPE_SOLO, self::TYPE_DUO, self::TYPE_TRIO])) {
            throw new \InvalidArgumentException('Type de séance invalide');
        }

        $this->type_seance = $type_seance;

        return $this;
    }

    public function getThemeSeance(): ?string
    {
        return $this->theme_seance;
    }

    public function setThemeSeance(string $theme_seance): static
    {
        if (!in_array($theme_seance, [self::THEME_FITNESS, self::THEME_CARDIO, self::THEME_MUSCULATION, self::THEME_CROSSFIT])) {
            throw new \InvalidArgumentException('Thème de séance invalide');
        }

        $this->theme_seance = $theme_seance;

        return $this;
    }

    public function getCoach(): ?Coach
    {
        return $this->coach_id;
    }

    public function setCoach(?Coach $coach_id): static
    {
        $this->coach_id = $coach_id;

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

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getNiveauSeance(): ?string
    {
        return $this->niveau_seance;
    }

    public function setNiveauSeance(string $niveau_seance): static
    {
        if (!in_array($niveau_seance, [self::NIVEAU_DEBUTANT, self::NIVEAU_INTERMEDIAIRE, self::NIVEAU_AVANCE])) {
            throw new \InvalidArgumentException('Niveau de séance invalide');
        }

        $this->niveau_seance = $niveau_seance;

        return $this;
    }
}
