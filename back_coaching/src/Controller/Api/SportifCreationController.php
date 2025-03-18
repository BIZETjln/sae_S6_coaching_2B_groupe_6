<?php

namespace App\Controller\Api;

use App\Entity\Sportif;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Serializer\SerializerInterface;

#[AsController]
class SportifCreationController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private SerializerInterface $serializer,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        try {
            // Désérialiser les données de la requête en un objet Sportif
            $data = $request->getContent();
            $sportif = $this->serializer->deserialize($data, Sportif::class, 'json');
            
            // Hasher le mot de passe
            $plaintextPassword = $sportif->getPassword();
            if ($plaintextPassword) {
                $hashedPassword = $this->passwordHasher->hashPassword($sportif, $plaintextPassword);
                $sportif->setPassword($hashedPassword);
            }
            
            // Définir le rôle par défaut
            $sportif->setRoles(['ROLE_USER']);
            
            // Définir la date d'inscription (maintenant)
            $sportif->setDateInscription(new \DateTime());
            
            // Persister l'entité
            $this->entityManager->persist($sportif);
            $this->entityManager->flush();
            
            // Retourner une réponse avec le sportif créé
            return $this->json(
                $sportif, 
                Response::HTTP_CREATED, 
                [], 
                ['groups' => 'sportif:read']
            );
        } catch (\Exception $e) {
            return $this->json(
                ['message' => 'Erreur lors de la création du sportif: ' . $e->getMessage()], 
                Response::HTTP_BAD_REQUEST
            );
        }
    }
} 