<?php

namespace App\Entity;

use App\Enum\PeriodePaie;
use App\Repository\FicheDePaieRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FicheDePaieRepository::class)]
class FicheDePaie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'ficheDePaies')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Coach $coach = null;

    #[ORM\Column(enumType: PeriodePaie::class)]
    private ?PeriodePaie $periode = null;

    #[ORM\Column]
    private ?float $total_heures = null;

    #[ORM\Column]
    private ?float $montant_total = null;

    public function getId(): ?int
    {
        return $this->id;
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

    public function getPeriode(): ?PeriodePaie
    {
        return $this->periode;
    }

    public function setPeriode(PeriodePaie $periode): static
    {
        $this->periode = $periode;

        return $this;
    }

    public function getTotalHeures(): ?float
    {
        return $this->total_heures;
    }

    public function setTotalHeures(float $total_heures): static
    {
        $this->total_heures = $total_heures;

        return $this;
    }

    public function getMontantTotal(): ?float
    {
        return $this->montant_total;
    }

    public function setMontantTotal(float $montant_total): static
    {
        $this->montant_total = $montant_total;

        return $this;
    }
}
