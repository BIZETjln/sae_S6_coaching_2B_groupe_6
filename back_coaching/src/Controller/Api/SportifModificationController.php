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
class SportifModificationController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private SerializerInterface $serializer,
    ) {}

    public function __invoke(Request $request, Sportif $sportif): JsonResponse
    {
        try {
            // Récupérer le contenu de la requête
            $data = $request->getContent();
            $updatedData = json_decode($data, true);
            
            // Mise à jour des propriétés de base
            if (isset($updatedData['nom'])) {
                $sportif->setNom($updatedData['nom']);
            }
            
            if (isset($updatedData['prenom'])) {
                $sportif->setPrenom($updatedData['prenom']);
            }
            
            if (isset($updatedData['email'])) {
                $sportif->setEmail($updatedData['email']);
            }
            
            // Gestion explicite de la photo
            if (array_key_exists('photo', $updatedData)) {
                // Si photo est null ou "", on supprime la photo
                if ($updatedData['photo'] === null || $updatedData['photo'] === '') {
                    $sportif->setPhoto(null);
                } else {
                    // Sinon on met à jour avec la nouvelle valeur
                    $sportif->setPhoto($updatedData['photo']);
                }
            }
            
            // Mise à jour du mot de passe si fourni
            if (isset($updatedData['password']) && !empty($updatedData['password'])) {
                $hashedPassword = $this->passwordHasher->hashPassword($sportif, $updatedData['password']);
                $sportif->setPassword($hashedPassword);
            }
            
            // Définir le rôle par défaut
            $sportif->setRoles(['ROLE_USER']);
            
            // Persister les modifications
            $this->entityManager->flush();
            
            // Retourner une réponse avec le sportif mis à jour
            return $this->json(
                $sportif, 
                Response::HTTP_OK, 
                [], 
                ['groups' => 'sportif:read']
            );
        } catch (\Exception $e) {
            return $this->json(
                ['message' => 'Erreur lors de la modification du sportif: ' . $e->getMessage()], 
                Response::HTTP_BAD_REQUEST
            );
        }
    }
} 