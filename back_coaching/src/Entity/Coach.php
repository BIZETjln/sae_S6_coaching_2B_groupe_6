<?php

namespace App\Entity;

use App\Repository\CoachRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CoachRepository::class)]
#[ApiResource(
    operations: [
        new Get(normalizationContext: ['groups' => ['coach:read']]),
        new GetCollection(normalizationContext: ['groups' => ['coach:read']])
    ],
)]
class Coach extends Utilisateur
{
    #[Groups(['coach:read'])]
    #[ORM\Column(type: Types::ARRAY)]
    private array $specialites = [];

    #[Groups(['coach:read'])]
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $tarif_horaire = null;

    /**
     * @var Collection<int, Seance>
     */
    #[Groups(['coach:read'])]
    #[ORM\OneToMany(targetEntity: Seance::class, mappedBy: 'coach')]
    private Collection $seances;

    /**
     * @var Collection<int, FicheDePaie>
     */
    #[Groups(['coach:read'])]
    #[ORM\OneToMany(targetEntity: FicheDePaie::class, mappedBy: 'coach')]
    private Collection $ficheDePaies;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    public function __construct()
    {
        $this->seances = new ArrayCollection();
        $this->ficheDePaies = new ArrayCollection();
    }

    public function getSpecialites(): array
    {
        return $this->specialites;
    }

    public function setSpecialites(array $specialites): static
    {
        $this->specialites = $specialites;

        return $this;
    }

    public function getTarifHoraire(): ?float
    {
        return $this->tarif_horaire;
    }

    public function setTarifHoraire(float $tarif_horaire): static
    {
        $this->tarif_horaire = $tarif_horaire;

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
            $seance->setCoach($this);
        }

        return $this;
    }

    public function removeSeance(Seance $seance): static
    {
        if ($this->seances->removeElement($seance)) {
            // set the owning side to null (unless already changed)
            if ($seance->getCoach() === $this) {
                $seance->setCoach(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, FicheDePaie>
     */
    public function getFicheDePaies(): Collection
    {
        return $this->ficheDePaies;
    }

    public function addFicheDePaie(FicheDePaie $ficheDePaie): static
    {
        if (!$this->ficheDePaies->contains($ficheDePaie)) {
            $this->ficheDePaies->add($ficheDePaie);
            $ficheDePaie->setCoach($this);
        }

        return $this;
    }

    public function removeFicheDePaie(FicheDePaie $ficheDePaie): static
    {
        if ($this->ficheDePaies->removeElement($ficheDePaie)) {
            // set the owning side to null (unless already changed)
            if ($ficheDePaie->getCoach() === $this) {
                $ficheDePaie->setCoach(null);
            }
        }

        return $this;
    }

    public function __toString(): string
    {
        // Retourne le nom et prénom du coach, ou un autre identifiant approprié
        // Adaptez selon les propriétés disponibles dans votre entité Coach
        return $this->getNom() . ' ' . $this->getPrenom();
        
        // Alternative si vous n'avez pas de nom/prénom :
        // return 'Coach #' . $this->getId();
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
}
