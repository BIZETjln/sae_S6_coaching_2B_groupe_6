<?php

namespace App\Entity;

use App\Repository\FicheDePaieRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;
use App\Enum\PeriodePaie;

#[ORM\Entity(repositoryClass: FicheDePaieRepository::class)]
class FicheDePaie
{
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(inversedBy: 'ficheDePaies')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Coach $coach_id = null;

    #[ORM\Column(enumType: PeriodePaie::class)]
    private ?PeriodePaie $periode = null;

    #[ORM\Column]
    private ?float $total_heures = null;

    #[ORM\Column]
    private ?float $montant_total = null;

    public function getId(): ?Uuid
    {
        return $this->id;
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
