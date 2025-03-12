<?php

namespace App\DataFixtures;

use App\Entity\Exercice;
use App\Enum\Difficulte;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory;

class ExerciceFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');

        $exerciceTypes = [
            'Pompes' => 'Exercice de musculation pour le haut du corps',
            'Squats' => 'Exercice pour les jambes',
            'Burpees' => 'Exercice cardio intense',
            'Planche' => 'Exercice de gainage',
            'Jumping Jacks' => 'Exercice cardio',
            'Mountain Climbers' => 'Exercice cardio et abdominaux',
            'Dips' => 'Exercice pour les triceps',
            'Crunchs' => 'Exercice pour les abdominaux',
            'Fentes' => 'Exercice pour les jambes',
            'Pull-ups' => 'Exercice pour le dos'
        ];

        $difficultes = [Difficulte::FACILE, Difficulte::MOYEN, Difficulte::DIFFICILE];

        // Création de 20 exercices
        for ($i = 0; $i < 20; $i++) {
            $exercice = new Exercice();

            // Si on a épuisé la liste prédéfinie, on génère des noms aléatoires
            if ($i < count($exerciceTypes)) {
                $nom = array_keys($exerciceTypes)[$i];
                $description = $exerciceTypes[$nom];
            } else {
                $nom = sprintf("Exercice %s %d", $faker->word, $i + 1);
                $description = $faker->sentence(10);
            }

            $exercice->setNom($nom);
            $exercice->setDescription($description);
            $exercice->setDureeEstimee($faker->numberBetween(5, 45));
            $exercice->setDifficulte($faker->randomElement($difficultes));

            $manager->persist($exercice);
            $this->addReference('exercice-' . $i, $exercice);
        }

        $manager->flush();
    }
}
