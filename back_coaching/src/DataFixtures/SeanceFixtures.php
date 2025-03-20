<?php

namespace App\DataFixtures;

use App\Entity\Seance;
use App\Entity\Coach;
use App\Entity\Sportif;
use App\Entity\Exercice;
use App\Entity\Participation;
use App\Enum\TypeSeance;
use App\Enum\StatutSeance;
use App\Enum\Niveau;
use App\Enum\ThemeSeance;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;
use DateTime;
use DateInterval;

class SeanceFixtures extends Fixture implements DependentFixtureInterface
{
    private array $coachSeances = [];

    private function isCoachAvailable(int $coachIndex, DateTime $dateHeure): bool
    {
        if (!isset($this->coachSeances[$coachIndex])) {
            $this->coachSeances[$coachIndex] = [];
            return true;
        }

        foreach ($this->coachSeances[$coachIndex] as $seanceDate) {
            $diff = $dateHeure->diff($seanceDate);
            $diffMinutes = ($diff->h * 60) + $diff->i;

            if (abs($diffMinutes) < 90) {
                return false;
            }
        }
        return true;
    }

    private function getSportifsParNiveau(ObjectManager $manager, Niveau $niveau): array
    {
        $sportifs = [];
        for ($i = 0; $i < 20; $i++) {
            $sportif = $this->getReference('sportif-' . $i, Sportif::class);
            if ($sportif->getNiveauSportif() === $niveau) {
                $sportifs[] = $i;
            }
        }
        return $sportifs;
    }

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');

        $types = [TypeSeance::SOLO, TypeSeance::DUO, TypeSeance::TRIO];
        $themes = [ThemeSeance::FITNESS, ThemeSeance::CARDIO, ThemeSeance::MUSCULATION, ThemeSeance::CROSSFIT];
        $niveaux = [Niveau::DEBUTANT, Niveau::INTERMEDIAIRE, Niveau::AVANCE];

        // Création de 80 séances passées (validées ou annulées)
        $tentatives = 0;
        $seancesCreees = 0;
        while ($seancesCreees < 80 && $tentatives < 200) {
            $tentatives++;
            $seance = new Seance();

            // Date entre il y a 4 mois et aujourd'hui
            $date = $faker->dateTimeBetween('-4 months', 'now');

            // Ajuster l'heure entre 6h et 21h, uniquement à 00 ou 30 minutes
            $hour = $faker->numberBetween(6, 21);
            $minute = $faker->randomElement([0, 30]);
            $date->setTime($hour, $minute);

            // Sélection aléatoire du coach
            $coachId = $faker->numberBetween(0, 4);
            $coach = $this->getReference('coach-' . $coachId, Coach::class);

            // Vérifier la disponibilité du coach
            if (!$this->isCoachAvailable($coachId, $date)) {
                continue;
            }

            $seance->setDateHeure($date);
            $seance->setTypeSeance($faker->randomElement($types));
            $seance->setThemeSeance($faker->randomElement($themes));
            $seance->setStatut($faker->boolean(80) ? StatutSeance::VALIDEE : StatutSeance::ANNULEE);
            $seance->setCoach($coach);

            // Enregistrer la séance dans le planning du coach
            $this->coachSeances[$coachId][] = clone $date;

            // Sélection du niveau et des sportifs correspondants
            $niveauSeance = $faker->randomElement($niveaux);
            $seance->setNiveauSeance($niveauSeance);

            // Persistence de la séance
            $manager->persist($seance);

            // Récupérer les sportifs du même niveau
            $sportifsDisponibles = $this->getSportifsParNiveau($manager, $niveauSeance);

            if (empty($sportifsDisponibles)) {
                continue;
            }

            // Pour les séances passées, on varie le remplissage
            $nombreParticipants = match ($seance->getTypeSeance()) {
                TypeSeance::SOLO => 1,
                TypeSeance::DUO => $faker->numberBetween(1, 2),
                TypeSeance::TRIO => $faker->numberBetween(1, 3),
            };

            // Ajouter les participations
            $sportifIds = $faker->randomElements($sportifsDisponibles, min($nombreParticipants, count($sportifsDisponibles)));
            foreach ($sportifIds as $sportifId) {
                $participation = new Participation();
                $sportif = $this->getReference('sportif-' . $sportifId, Sportif::class);

                $participation->setSportif($sportif);
                $participation->setSeance($seance);

                // Si la séance est validée, 85% de chance d'être présent
                if ($seance->getStatut() === StatutSeance::VALIDEE) {
                    $participation->setPresence($faker->boolean(85));
                } else {
                    $participation->setPresence(false);
                }

                $manager->persist($participation);
            }

            // 2 à 4 exercices par séance
            $exerciceIds = $faker->randomElements(range(0, 19), $faker->numberBetween(2, 4));
            foreach ($exerciceIds as $exerciceId) {
                $seance->addExercice($this->getReference('exercice-' . $exerciceId, Exercice::class));
            }

            $seancesCreees++;
        }

        // Réinitialiser le planning des coachs pour les séances futures
        $this->coachSeances = [];

        // Création de 20 séances futures (prévues)
        $tentatives = 0;
        $seancesCreees = 0;
        while ($seancesCreees < 20 && $tentatives < 100) {
            $tentatives++;
            $seance = new Seance();

            // Date entre demain et dans 2 mois
            $date = $faker->dateTimeBetween('tomorrow', '+2 months');

            // Ajuster l'heure entre 6h et 21h, uniquement à 00 ou 30 minutes
            $hour = $faker->numberBetween(6, 21);
            $minute = $faker->randomElement([0, 30]);
            $date->setTime($hour, $minute);

            // Sélection aléatoire du coach
            $coachId = $faker->numberBetween(0, 4);
            $coach = $this->getReference('coach-' . $coachId, Coach::class);

            // Vérifier la disponibilité du coach
            if (!$this->isCoachAvailable($coachId, $date)) {
                continue;
            }

            $seance->setDateHeure($date);
            $seance->setTypeSeance($faker->randomElement($types));
            $seance->setThemeSeance($faker->randomElement($themes));
            $seance->setStatut(StatutSeance::PREVUE);
            $seance->setCoach($coach);

            // Enregistrer la séance dans le planning du coach
            $this->coachSeances[$coachId][] = clone $date;

            // Sélection du niveau et des sportifs correspondants
            $niveauSeance = $faker->randomElement($niveaux);
            $seance->setNiveauSeance($niveauSeance);

            $manager->persist($seance);

            // Récupérer les sportifs du même niveau
            $sportifsDisponibles = $this->getSportifsParNiveau($manager, $niveauSeance);

            if (!empty($sportifsDisponibles)) {
                // Pour les séances futures, on met moins de participants
                $nombreParticipants = match ($seance->getTypeSeance()) {
                    TypeSeance::SOLO => $faker->boolean(70) ? 1 : 0,
                    TypeSeance::DUO => $faker->numberBetween(0, 1),
                    TypeSeance::TRIO => $faker->numberBetween(0, 2),
                };

                if ($nombreParticipants > 0) {
                    $sportifIds = $faker->randomElements($sportifsDisponibles, min($nombreParticipants, count($sportifsDisponibles)));
                    foreach ($sportifIds as $sportifId) {
                        $participation = new Participation();
                        $sportif = $this->getReference('sportif-' . $sportifId, Sportif::class);

                        $participation->setSportif($sportif);
                        $participation->setSeance($seance);
                        $participation->setPresence(false);

                        $manager->persist($participation);
                    }
                }
            }

            // 2 à 4 exercices par séance
            $exerciceIds = $faker->randomElements(range(0, 19), $faker->numberBetween(2, 4));
            foreach ($exerciceIds as $exerciceId) {
                $seance->addExercice($this->getReference('exercice-' . $exerciceId, Exercice::class));
            }

            $seancesCreees++;
        }

        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [
            UtilisateurFixtures::class,
            ExerciceFixtures::class,
        ];
    }
}
