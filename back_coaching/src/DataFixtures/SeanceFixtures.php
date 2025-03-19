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

class SeanceFixtures extends Fixture implements DependentFixtureInterface
{
    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');

        $types = [TypeSeance::SOLO, TypeSeance::DUO, TypeSeance::TRIO];
        $themes = [ThemeSeance::FITNESS, ThemeSeance::CARDIO, ThemeSeance::MUSCULATION, ThemeSeance::CROSSFIT];
        $niveaux = [Niveau::DEBUTANT, Niveau::INTERMEDIAIRE, Niveau::AVANCE];

        // Création de 20 séances passées (validées ou annulées)
        for ($i = 0; $i < 20; $i++) {
            $seance = new Seance();

            // Date entre il y a 2 mois et aujourd'hui
            $seance->setDateHeure($faker->dateTimeBetween('-2 months', 'now'));
            $seance->setTypeSeance($faker->randomElement($types));
            $seance->setThemeSeance($faker->randomElement($themes));

            // 80% de chances d'être validée, 20% d'être annulée
            $seance->setStatut($faker->boolean(80) ? StatutSeance::VALIDEE : StatutSeance::ANNULEE);

            // Attribution d'un coach aléatoire
            $coachId = $faker->numberBetween(0, 4);
            $seance->setCoach($this->getReference('coach-' . $coachId, Coach::class));

            $seance->setNiveauSeance($faker->randomElement($niveaux));

            // Persistence de la séance avant d'ajouter les participations
            $manager->persist($seance);

            // Déterminer le nombre max de participants selon le type
            $maxPossible = match ($seance->getTypeSeance()) {
                TypeSeance::SOLO => 1,
                TypeSeance::DUO => 2,
                TypeSeance::TRIO => 3,
            };

            // Pour les séances passées, on varie le remplissage
            $nombreParticipants = match ($seance->getTypeSeance()) {
                TypeSeance::SOLO => 1,
                TypeSeance::DUO => $faker->numberBetween(1, 2),
                TypeSeance::TRIO => $faker->numberBetween(1, 3),
            };

            // Ajouter les participations
            $sportifIds = $faker->randomElements(range(0, 19), $nombreParticipants);
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
        }

        // Création de 20 séances futures (prévues)
        for ($i = 0; $i < 20; $i++) {
            $seance = new Seance();

            // Date entre demain et dans 2 mois
            $seance->setDateHeure($faker->dateTimeBetween('tomorrow', '+2 months'));
            $seance->setTypeSeance($faker->randomElement($types));
            $seance->setThemeSeance($faker->randomElement($themes));
            $seance->setStatut(StatutSeance::PREVUE);

            // Attribution d'un coach aléatoire
            $coachId = $faker->numberBetween(0, 4);
            $seance->setCoach($this->getReference('coach-' . $coachId, Coach::class));

            $seance->setNiveauSeance($faker->randomElement($niveaux));

            $manager->persist($seance);

            // Pour les séances futures, on met moins de participants car elles ne sont pas encore remplies
            $nombreParticipants = match ($seance->getTypeSeance()) {
                TypeSeance::SOLO => $faker->boolean(70) ? 1 : 0, // 70% de chance d'avoir un participant
                TypeSeance::DUO => $faker->numberBetween(0, 1),  // 0 ou 1 participant
                TypeSeance::TRIO => $faker->numberBetween(0, 2), // 0, 1 ou 2 participants
            };

            if ($nombreParticipants > 0) {
                $sportifIds = $faker->randomElements(range(0, 19), $nombreParticipants);
                foreach ($sportifIds as $sportifId) {
                    $participation = new Participation();
                    $sportif = $this->getReference('sportif-' . $sportifId, Sportif::class);

                    $participation->setSportif($sportif);
                    $participation->setSeance($seance);
                    $participation->setPresence(false); // Séance future, donc présence non définie

                    $manager->persist($participation);
                }
            }

            // 2 à 4 exercices par séance
            $exerciceIds = $faker->randomElements(range(0, 19), $faker->numberBetween(2, 4));
            foreach ($exerciceIds as $exerciceId) {
                $seance->addExercice($this->getReference('exercice-' . $exerciceId, Exercice::class));
            }
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
