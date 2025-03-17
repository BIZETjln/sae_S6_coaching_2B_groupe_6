<?php

namespace App\DataFixtures;

use App\Entity\Utilisateur;
use App\Entity\Coach;
use App\Entity\Sportif;
use App\Enum\Niveau;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Faker\Factory;

class UtilisateurFixtures extends Fixture
{
    private UserPasswordHasherInterface $hasher;

    public function __construct(UserPasswordHasherInterface $hasher)
    {
        $this->hasher = $hasher;
    }

    public function load(ObjectManager $manager): void
    {
        $faker = Factory::create('fr_FR');

        // Création d'un admin
        $admin = new Utilisateur();
        $admin->setEmail('admin@example.com');
        $admin->setNom('Admin');
        $admin->setPrenom('Super');
        $admin->setRoles(['ROLE_USER', 'ROLE_COACH', 'ROLE_ADMIN']);
        $admin->setPassword($this->hasher->hashPassword($admin, 'admin'));
        $manager->persist($admin);

        // Création de 5 coachs
        for ($i = 0; $i < 5; $i++) {
            $coach = new Coach();
            $coach->setEmail(sprintf('coach%d@example.com', $i + 1));
            $coach->setNom($faker->lastName);
            $coach->setPrenom($faker->firstName);
            $coach->setRoles(['ROLE_USER', 'ROLE_COACH']);
            $coach->setPassword($this->hasher->hashPassword($coach, 'coach'));

            // Génération aléatoire de spécialités
            $specialites = $faker->randomElements(
                ['fitness', 'cardio', 'musculation', 'crossfit'],
                $faker->numberBetween(2, 4)
            );
            $coach->setSpecialites($specialites);

            $coach->setTarifHoraire($faker->randomFloat(2, 30, 80));
            $manager->persist($coach);
            $this->addReference('coach-' . $i, $coach);
        }

        // Création de 20 sportifs
        $niveaux = [Niveau::DEBUTANT, Niveau::INTERMEDIAIRE, Niveau::AVANCE];

        for ($i = 0; $i < 20; $i++) {
            $sportif = new Sportif();
            $sportif->setEmail(sprintf('sportif%d@example.com', $i + 1));
            $sportif->setNom($faker->lastName);
            $sportif->setPrenom($faker->firstName);
            $sportif->setRoles(['ROLE_USER']);
            $sportif->setPassword($this->hasher->hashPassword($sportif, 'sportif'));

            // Date d'inscription aléatoire dans les 6 derniers mois
            $dateInscription = $faker->dateTimeBetween('-6 months', 'now');
            $sportif->setDateInscription($dateInscription);

            // Niveau aléatoire
            $sportif->setNiveauSportif($faker->randomElement($niveaux));

            $manager->persist($sportif);
            $this->addReference('sportif-' . $i, $sportif);
        }

        $manager->flush();
    }
}
