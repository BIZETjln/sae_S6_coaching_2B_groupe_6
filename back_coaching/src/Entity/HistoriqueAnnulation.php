<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: "historique_annulation")]
class HistoriqueAnnulation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Sportif::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Sportif $sportif = null;

    #[ORM\ManyToOne(targetEntity: Seance::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Seance $seance = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $date_annulation = null;

    #[ORM\Column(type: 'integer')]
    private int $nb_annulation = 0;

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

    public function getDateAnnulation(): ?\DateTimeInterface
    {
        return $this->date_annulation;
    }

    public function setDateAnnulation(\DateTimeInterface $date_annulation): static
    {
        $this->date_annulation = $date_annulation;
        return $this;
    }

    public function getNbAnnulation(): int
    {
        return $this->nb_annulation;
    }

    public function setNbAnnulation(int $nb_annulation): static
    {
        $this->nb_annulation = $nb_annulation;
        return $this;
    }
} 