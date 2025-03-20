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
use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Link;
use ApiPlatform\Metadata\ApiProperty;

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
            controller: 'App\Controller\Api\SportifCreationController',
            denormalizationContext: ['groups' => ['sportif:write']],
            security: "is_granted('PUBLIC_ACCESS')"
        ),
        new Put(
            controller: 'App\Controller\Api\SportifModificationController',
            denormalizationContext: ['groups' => ['sportif:write']],
            security: "is_granted('ROLE_USER') and object.getId() == user.getId()",
            securityMessage: "Vous ne pouvez modifier que votre propre profil."
        ),
        new Delete(
            security: "is_granted('ROLE_USER') and object.getId() == user.getId()",
            securityMessage: "Vous ne pouvez supprimer que votre propre profil."
        ),
        new Get(
            uriTemplate: '/sportifs/{id}/statistiques',
            controller: 'App\Controller\Api\SportifStatistiquesController::getStatistiques',
            normalizationContext: ['groups' => ['sportif:read']]
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
     * @var Collection<int, Participation>
     */
    #[Groups(['sportif:read'])]
    #[ORM\OneToMany(mappedBy: 'sportif', targetEntity: Participation::class)]
    private Collection $participations;

    public function __construct()
    {
        $this->participations = new ArrayCollection();
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
        return new ArrayCollection(
            $this->participations->map(fn(Participation $participation) => $participation->getSeance())->toArray()
        );
    }

    public function addSeance(Seance $seance): static
    {
        foreach ($this->participations as $participation) {
            if ($participation->getSeance() === $seance) {
                return $this; // La séance est déjà ajoutée
            }
        }

        // Crée une nouvelle participation
        $participation = new Participation();
        $participation->setSportif($this);
        $participation->setSeance($seance);

        // Ajoute la participation à la collection
        $this->participations->add($participation);

        return $this;
    }

    public function removeSeance(Seance $seance): static
    {
        foreach ($this->participations as $participation) {
            if ($participation->getSeance() === $seance) {
                $this->participations->removeElement($participation);
                return $this;
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Participation>
     */
    public function getParticipations(): Collection
    {
        return $this->participations;
    }

    public function addParticipation(Participation $participation): static
    {
        if (!$this->participations->contains($participation)) {
            $this->participations->add($participation);
            // Maintenir la relation bidirectionnelle
            if ($participation->getSportif() !== $this) {
                $participation->setSportif($this);
            }
        }
        return $this;
    }

    public function removeParticipation(Participation $participation): static
    {
        if ($this->participations->removeElement($participation)) {
            // Ne pas définir sportif à null pour éviter l'erreur de contrainte
            // Nous supprimerons plutôt l'entité Participation elle-même dans le contrôleur
        }
        return $this;
    }

    public function __toString(): string
    {
        return $this->getNom() . ' ' . $this->getPrenom();
    }
}
