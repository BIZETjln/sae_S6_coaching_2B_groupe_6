<?php

namespace App\Entity;

use App\Enum\Difficulte;
use App\Repository\ExerciceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ExerciceRepository::class)]
#[ApiResource(
    operations: [
        new Get(normalizationContext: ['groups' => ['exercice:read']]),
        new GetCollection(normalizationContext: ['groups' => ['exercice:read']])
    ]
)]
class Exercice
{
    #[Groups(['exercice:read', 'seance:read'])]
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[Groups(['exercice:read', 'seance:read'])]
    #[ORM\Column(length: 255)]
    private ?string $nom = null;

    #[Groups(['exercice:read', 'seance:read'])]
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[Groups(['exercice:read', 'seance:read'])]
    #[ORM\Column]
    private ?int $duree_estimee = null;

    #[Groups(['exercice:read', 'seance:read'])]
    #[ORM\Column(enumType: Difficulte::class)]
    private ?Difficulte $difficulte = null;

    /**
     * @var Collection<int, Seance>
     */
    #[Groups(['exercice:read'])]
    #[ORM\ManyToMany(targetEntity: Seance::class, mappedBy: 'exercices')]
    private Collection $seances;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $photo = null;

    public function __construct()
    {
        $this->seances = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getDureeEstimee(): ?int
    {
        return $this->duree_estimee;
    }

    public function setDureeEstimee(int $duree_estimee): static
    {
        $this->duree_estimee = $duree_estimee;

        return $this;
    }

    public function getDifficulte(): ?Difficulte
    {
        return $this->difficulte;
    }

    public function setDifficulte(Difficulte $difficulte): static
    {

        if (!in_array($difficulte, [Difficulte::FACILE, Difficulte::MOYEN, Difficulte::DIFFICILE])) {
            throw new \InvalidArgumentException('Difficulté invalide');
        }

        $this->difficulte = $difficulte;

        return $this;
    }

    /**
     * @return Collection<int, Seance>
     */
    public function getSeances(): Collection
    {
        return $this->seances;
    }

    public function addSeance(Seance $seance): static
    {
        if (!$this->seances->contains($seance)) {
            $this->seances->add($seance);
            $seance->addExercice($this);
        }

        return $this;
    }

    public function removeSeance(Seance $seance): static
    {
        if ($this->seances->removeElement($seance)) {
            $seance->removeExercice($this);
        }

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
    
    public function __toString(): string
    {
        return $this->getNom() ?? 'Exercice #' . $this->getId();
    }
}
