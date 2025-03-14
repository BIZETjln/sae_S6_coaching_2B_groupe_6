<?php

namespace App\DataFixtures;

use App\Entity\Seance;
use App\Entity\Coach;
use App\Entity\Sportif;
use App\Entity\Exercice;
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
        $statuts = [StatutSeance::PREVUE, StatutSeance::VALIDEE, StatutSeance::ANNULEE];
        $niveaux = [Niveau::DEBUTANT, Niveau::INTERMEDIAIRE, Niveau::AVANCE];

        // Création de 30 séances
        for ($i = 0; $i < 30; $i++) {
            $seance = new Seance();

            // Date entre aujourd'hui et dans 2 mois
            $seance->setDateHeure($faker->dateTimeBetween('now', '+2 months'));
            $seance->setTypeSeance($faker->randomElement($types));
            $seance->setThemeSeance($faker->randomElement($themes));

            // Attribution d'un coach aléatoire
            $coachId = $faker->numberBetween(0, 4);
            $seance->setCoach($this->getReference('coach-' . $coachId, Coach::class));

            // Attribution de 1 à 3 sportifs selon le type de séance
            $maxSportifs = match ($seance->getTypeSeance()) {
                TypeSeance::SOLO => 1,
                TypeSeance::DUO => 2,
                TypeSeance::TRIO => 3,
            };

            $sportifIds = $faker->randomElements(range(0, 19), $maxSportifs);
            foreach ($sportifIds as $sportifId) {
                $seance->addSportif($this->getReference('sportif-' . $sportifId, Sportif::class));
            }

            $seance->setStatut($faker->randomElement($statuts));
            $seance->setNiveauSeance($faker->randomElement($niveaux));

            // Attribution de 2 à 5 exercices aléatoires
            $exerciceIds = $faker->randomElements(range(0, 19), $faker->numberBetween(2, 5));
            foreach ($exerciceIds as $exerciceId) {
                $seance->addExercice($this->getReference('exercice-' . $exerciceId, Exercice::class));
            }

            $manager->persist($seance);
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
