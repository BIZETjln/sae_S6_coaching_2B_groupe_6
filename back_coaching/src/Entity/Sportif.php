<?php

namespace App\Entity;

use App\Enum\Niveau;
use App\Repository\SportifRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use App\Entity\Utilisateur;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: SportifRepository::class)]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['sportif:read']],
        ),
        new GetCollection(
            normalizationContext: ['groups' => ['sportif:read']],
        ),
        new Post(
            denormalizationContext: ['groups' => ['sportif:write']],
            normalizationContext: ['groups' => ['sportif:read']],
        ),
        new Put(
            denormalizationContext: ['groups' => ['sportif:write']],
            normalizationContext: ['groups' => ['sportif:read']],
        ),
        new Delete(
        )
    ],
)]
class Sportif extends Utilisateur
{
    #[Groups(['sportif:read', 'sportif:write'])]
    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $date_inscription = null;

    #[Groups(['sportif:read', 'sportif:write'])]
    #[ORM\Column(enumType: Niveau::class)]
    private ?Niveau $niveau_sportif = null;

    /**
     * @var Collection<int, Seance>
     */
    #[Groups(['sportif:read'])]
    #[ORM\ManyToMany(targetEntity: Seance::class, mappedBy: 'sportifs')]
    private Collection $seances;

    public function __construct()
    {
        $this->seances = new ArrayCollection();
    }

    public function getDateInscription(): ?\DateTimeInterface
    {
        return $this->date_inscription;
    }

    public function setDateInscription(\DateTimeInterface $date_inscription): static
    {
        $this->date_inscription = $date_inscription;

        return $this;
    }

    public function getNiveauSportif(): ?Niveau
    {
        return $this->niveau_sportif;
    }

    public function setNiveauSportif(Niveau $niveau_sportif): static
    {
        if (!in_array($niveau_sportif, [Niveau::DEBUTANT, Niveau::INTERMEDIAIRE, Niveau::AVANCE])) {
            throw new \InvalidArgumentException('Niveau sportif invalide');
        }

        $this->niveau_sportif = $niveau_sportif;

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
            $seance->addSportif($this);
        }

        return $this;
    }

    public function removeSeance(Seance $seance): static
    {
        if ($this->seances->removeElement($seance)) {
            $seance->removeSportif($this);
        }

        return $this;
    }

    public function __toString(): string
    {
        return $this->getNom() . ' ' . $this->getPrenom();
    }
}
