<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: "participation")]
#[ORM\UniqueConstraint(name: "unique_participation", columns: ["sportif_id", "seance_id"])]
class Participation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    #[Groups(['sportif:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Sportif::class, inversedBy: "participations")]
    #[ORM\JoinColumn(nullable: false)]
    private ?Sportif $sportif = null;

    #[ORM\ManyToOne(targetEntity: Seance::class, inversedBy: "participations")]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['sportif:read'])]
    private ?Seance $seance = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['sportif:read'])]
    private bool $presence = false; // Par défaut, le sportif est absent

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSportif(): ?Sportif
    {
        return $this->sportif;
    }

    public function setSportif(?Sportif $sportif): static
    {
        $this->sportif = $sportif;
        return $this;
    }

    public function getSeance(): ?Seance
    {
        return $this->seance;
    }

    public function setSeance(?Seance $seance): static
    {
        $this->seance = $seance;
        return $this;
    }

    public function isPresence(): bool
    {
        return $this->presence;
    }

    public function setPresence(bool $presence): static
    {
        $this->presence = $presence;
        return $this;
    }

    public function __toString(): string
    {
        if ($this->getSportif()) {
            return $this->getSportif()->__toString() . ' - ' . ($this->isPresence() ? 'Présent' : 'Absent');
        }
        return 'Nouvelle participation';
    }
}
