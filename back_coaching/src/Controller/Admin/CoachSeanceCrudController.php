<?php
// src/Controller/Admin/CoachSeanceCrudController.php

namespace App\Controller\Admin;

use App\Entity\Seance;
use App\Entity\Coach;
use App\Entity\Participation;
use App\Enum\Niveau;
use App\Enum\StatutSeance;
use App\Enum\ThemeSeance;
use App\Enum\TypeSeance;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\QueryBuilder;
use EasyCorp\Bundle\EasyAdminBundle\Collection\FieldCollection;
use EasyCorp\Bundle\EasyAdminBundle\Collection\FilterCollection;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Config\Assets;
use EasyCorp\Bundle\EasyAdminBundle\Config\Asset;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Dto\EntityDto;
use EasyCorp\Bundle\EasyAdminBundle\Dto\SearchDto;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\CollectionField;
use App\Form\ParticipationType;
use Doctrine\Common\Collections\ArrayCollection;
use Psr\Log\LoggerInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use EasyCorp\Bundle\EasyAdminBundle\Config\KeyValueStore;
use EasyCorp\Bundle\EasyAdminBundle\Context\AdminContext;

class CoachSeanceCrudController extends AbstractCrudController
{
    private EntityManagerInterface $entityManager;
    private LoggerInterface $logger;

    public function __construct(EntityManagerInterface $entityManager, LoggerInterface $logger)
    {
        $this->entityManager = $entityManager;
        $this->logger = $logger;
    }

    public static function getEntityFqcn(): string
    {
        return Seance::class;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Séance')
            ->setEntityLabelInPlural('Mes séances')
            ->setPageTitle('index', 'Liste de mes séances')
            ->setPageTitle('new', 'Créer une séance')
            ->setPageTitle('edit', 'Modifier ma séance')
            ->setPageTitle('detail', 'Détails de ma séance')
            ->setDefaultSort(['date_heure' => 'DESC'])
            ->setPaginatorPageSize(10)
            ->showEntityActionsInlined();
    }

    public function configureFields(string $pageName): iterable
    {
        $fields = [
            FormField::addPanel('Informations générales')
                ->setIcon('fa fa-calendar-alt')
                ->setHelp('Informations de base de la séance'),

            // Champ combiné date/heure pour la vue détail
            DateTimeField::new('date_heure', 'Date et Heure')
                ->setFormat('dd/MM/yyyy HH:mm')
                ->hideOnForm(),

            // Champs séparés pour le formulaire uniquement
            DateField::new('dateOnly', 'Date')
                ->setFormTypeOptions([
                    'widget' => 'single_text',
                    'html5' => true,
                    'format' => 'yyyy-MM-dd',
                    'attr' => [
                        'min' => (new \DateTime('now'))->format('Y-m-d')
                    ],
                    'mapped' => false,
                    'data' => $pageName === Crud::PAGE_EDIT && $this->getContext()->getEntity()->getInstance()->getDateHeure()
                        ? $this->getContext()->getEntity()->getInstance()->getDateHeure()
                        : new \DateTime()
                ])
                ->setColumns(6)
                ->hideOnIndex()
                ->hideOnDetail(),

            ChoiceField::new('timeOnly', 'Heure')
                ->setChoices(function () {
                    $choices = [];
                    // Créneaux de 30 minutes de 6h à 21h
                    for ($hour = 6; $hour <= 21; $hour++) {
                        $choices[sprintf("%02d:00", $hour)] = sprintf("%02d:00:00", $hour);
                        if ($hour < 21) { // Pas de créneau à 21h30
                            $choices[sprintf("%02d:30", $hour)] = sprintf("%02d:30:00", $hour);
                        }
                    }
                    return $choices;
                })
                ->setFormTypeOptions([
                    'mapped' => false,
                    'data' => $pageName === Crud::PAGE_EDIT && $this->getContext()->getEntity()->getInstance()->getDateHeure()
                        ? $this->getContext()->getEntity()->getInstance()->getDateHeure()->format('H:i:00')
                        : '09:00:00'
                ])
                ->setColumns(6)
                ->hideOnIndex()
                ->hideOnDetail(),

            FormField::addPanel('Caractéristiques de la séance')
                ->setIcon('fa fa-list')
                ->setHelp('Type, thème et niveau de la séance'),

            ChoiceField::new('type_seance', 'Type de séance')
                ->setChoices(TypeSeance::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'type-seance-container'])
                ->setColumns(4),

            ChoiceField::new('theme_seance', 'Thème de la séance')
                ->setChoices(ThemeSeance::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'theme-seance-container'])
                ->setColumns(4),

            ChoiceField::new('niveau_seance', 'Niveau de la séance')
                ->setChoices(Niveau::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'niveau-seance-container'])
                ->setColumns(4),

            FormField::addPanel('Participants et contenu')
                ->setIcon('fa fa-users')
                ->setHelp('Sportifs et exercices de la séance'),

            // Le coach est déjà défini comme l'utilisateur connecté
            AssociationField::new('coach')
                ->hideOnForm()
                ->hideOnIndex()
                ->hideOnDetail(),

            // Utilisation d'un champ CollectionField pour les sportifs via participations
            CollectionField::new('participations')
                ->setEntryType(ParticipationType::class)
                ->setFormTypeOptions([
                    'by_reference' => false,
                    'allow_add' => true,
                    'allow_delete' => true,
                    'entry_options' => [
                        'label' => false
                    ]
                ])
                ->setLabel('Sportifs participants')
                ->setHelp('Le nombre maximum de sportifs dépend du type de séance : Solo (1), Duo (2), Trio (3)')
                ->setColumns(12),

            AssociationField::new('exercices', 'Exercices')
                ->setFormTypeOptions([
                    'by_reference' => false,
                    'constraints' => [
                        new \Symfony\Component\Validator\Constraints\Count([
                            'min' => 1,
                            'minMessage' => 'Vous devez sélectionner au moins un exercice',
                        ]),
                    ],
                ])
                ->setColumns(12),

            ImageField::new('photo', 'Photo')
                ->setBasePath('images/seances')
                ->setUploadDir('public/images/seances')
                ->setUploadedFileNamePattern('[randomhash].[extension]')
                ->setRequired(false)
                ->setColumns(12),
        ];

        // Ajouter le champ statut uniquement en mode édition
        if (Crud::PAGE_NEW !== $pageName) {
            $seance = $this->getContext()->getEntity()->getInstance();
            $isValidatedSession = ($seance instanceof Seance && $seance->getStatut() === StatutSeance::VALIDEE);

            $fields[] = ChoiceField::new('statut', 'Statut de la séance')
                ->setChoices(StatutSeance::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'statut-seance-container'])
                ->setColumns(12)
                ->setFormTypeOption('disabled', $isValidatedSession);
        } else {
            // En mode création, on ajoute un champ caché avec la valeur par défaut
            $fields[] = ChoiceField::new('statut')
                ->setFormTypeOption('data', StatutSeance::PREVUE)
                ->hideOnForm();
        }

        return $fields;
    }

    public function configureActions(Actions $actions): Actions
    {
        $detailAction = Action::new('detail', '')
            ->setIcon('fa fa-eye')
            ->linkToCrudAction('detail');

        $editAction = Action::new('edit', '')
            ->setIcon('fa fa-pencil-alt')
            ->linkToCrudAction('edit')
            ->displayIf(static function (Seance $seance) {
                // N'afficher le bouton Modifier que si la séance n'est pas validée
                return $seance->getStatut() !== StatutSeance::VALIDEE;
            });

        $deleteAction = Action::new('delete', '')
            ->setIcon('fa fa-trash')
            ->linkToCrudAction('delete')
            ->displayIf(static function (Seance $seance) {
                // N'afficher le bouton Supprimer que si :
                // 1. La séance est dans le futur
                // 2. La séance est prévue (pas validée ni annulée)
                $now = new \DateTime();
                return $seance->getDateHeure() > $now && $seance->getStatut() === StatutSeance::PREVUE;
            });

        return $actions
            ->remove(Crud::PAGE_INDEX, Action::EDIT)
            ->remove(Crud::PAGE_INDEX, Action::DELETE)
            ->add(Crud::PAGE_INDEX, $detailAction)
            ->add(Crud::PAGE_INDEX, $editAction)
            ->add(Crud::PAGE_INDEX, $deleteAction)
            ->add(Crud::PAGE_NEW, Action::INDEX)
            ->update(Crud::PAGE_NEW, Action::SAVE_AND_RETURN, function (Action $action) {
                return $action->setLabel('Créer');
            })
            ->update(Crud::PAGE_EDIT, Action::SAVE_AND_RETURN, function (Action $action) {
                return $action->setLabel('Enregistrer les modifications');
            })
            ->update(Crud::PAGE_DETAIL, Action::DELETE, function (Action $action) {
                return $action->setLabel('Supprimer');
            })
            ->update(Crud::PAGE_DETAIL, Action::EDIT, function (Action $action) {
                return $action->setLabel('Modifier');
            })
            ->update(Crud::PAGE_DETAIL, Action::INDEX, function (Action $action) {
                return $action->setLabel('Retour à la liste');
            })
            ->setPermission(Action::EDIT, 'ROLE_COACH')
            ->setPermission(Action::DELETE, 'ROLE_COACH');
    }

    public function createIndexQueryBuilder(SearchDto $searchDto, EntityDto $entityDto, FieldCollection $fields, FilterCollection $filters): QueryBuilder
    {
        $user = $this->getUser();
        $qb = parent::createIndexQueryBuilder($searchDto, $entityDto, $fields, $filters);

        if (!$user instanceof Coach) {
            $this->logger->warning('Utilisateur non-coach connecté: ' . get_class($user));
            // Si l'utilisateur n'est pas un coach, ne montrer aucune séance
            $qb->andWhere('1 = 0');
            return $qb;
        }

        // Récupérer l'ID du coach et le convertir au format sans tirets
        $coachId = $user->getId();
        $coachIdHex = str_replace('-', '', $coachId->__toString());
        $this->logger->info('Coach connecté: ID=' . $coachId . ', Hex=' . $coachIdHex);

        // Récupérer les séances via une requête SQL native
        $conn = $this->entityManager->getConnection();
        $sql = "
            SELECT s.id 
            FROM seance s
            WHERE HEX(s.coach_id) = :coachIdHex
        ";

        $stmt = $conn->prepare($sql);
        $resultSet = $stmt->executeQuery(['coachIdHex' => $coachIdHex]);
        $seanceIds = array_column($resultSet->fetchAllAssociative(), 'id');

        $this->logger->info('Séances trouvées: ' . implode(', ', $seanceIds));

        // Filtrer le QueryBuilder pour ne montrer que les séances récupérées
        if (!empty($seanceIds)) {
            $qb->andWhere('entity.id IN (:seanceIds)')
                ->setParameter('seanceIds', $seanceIds);
        } else {
            // Si aucune séance n'est trouvée, ne montrer aucune séance
            $qb->andWhere('1 = 0');
        }

        return $qb;
    }

    public function createNewFormBuilder(EntityDto $entityDto, KeyValueStore $formOptions, AdminContext $context): FormBuilderInterface
    {
        $formBuilder = parent::createNewFormBuilder($entityDto, $formOptions, $context);
        return $formBuilder
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleDateTimeFields())
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleImageUpload())
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleSportifs());
    }

    public function createEditFormBuilder(EntityDto $entityDto, KeyValueStore $formOptions, AdminContext $context): FormBuilderInterface
    {
        $seance = $entityDto->getInstance();

        // Vérifier si la séance est validée
        if ($seance instanceof Seance && $seance->getStatut() === StatutSeance::VALIDEE) {
            $this->addFlash('warning', 'Une séance validée ne peut plus être modifiée.');
            // Au lieu de rediriger, on continue mais on désactive les champs
            $formOptions->set('disabled', true);
        }

        $formBuilder = parent::createEditFormBuilder($entityDto, $formOptions, $context);
        return $formBuilder
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleDateTimeFields())
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleImageUpload())
            ->addEventListener(FormEvents::POST_SUBMIT, $this->handleSportifs());
    }

    private function handleDateTimeFields()
    {
        return function (FormEvent $event) {
            $form = $event->getForm();
            $seance = $form->getData();

            if (!$seance instanceof Seance) {
                return;
            }

            // Vérifier si le coach tente d'annuler la séance
            if ($seance->getStatut() === StatutSeance::ANNULEE) {
                // Remettre le statut à PREVUE
                $seance->setStatut(StatutSeance::PREVUE);
                $this->addFlash(
                    'info',
                    'Votre demande d\'annulation a été transmise aux responsables. La séance reste prévue jusqu\'à validation de l\'annulation.'
                );
                // Ici on pourrait envoyer un email à l'administrateur
            }

            // Récupérer les valeurs des champs date et heure
            $dateOnly = $form->get('dateOnly')->getData();
            $timeOnly = $form->get('timeOnly')->getData();

            // Vérifier que les données sont valides
            if ($dateOnly instanceof \DateTimeInterface && $timeOnly) {
                // Créer un objet DateTime combiné
                $dateTime = new \DateTime($dateOnly->format('Y-m-d') . ' ' . $timeOnly);

                // Définir cette valeur sur l'entité
                $seance->setDateHeure($dateTime);

                // Vérifier les conflits de séances pour le coach
                $this->checkCoachAvailability($form, $seance, $dateTime);
            }
        };
    }

    /**
     * Vérifie si le coach a des séances en conflit avec l'horaire choisi
     */
    private function checkCoachAvailability($form, Seance $seance, \DateTime $dateTime): void
    {
        $coach = $seance->getCoach();
        if (!$coach) {
            return; // Pas de coach sélectionné, on ne peut pas vérifier
        }

        // Utiliser le repository au lieu de refaire la requête directement
        $repository = $this->entityManager->getRepository(Seance::class);
        if ($repository instanceof \App\Repository\SeanceRepository) {
            $hasConflict = $repository->hasConflictingSession($coach, $dateTime, $seance->getId());

            if ($hasConflict) {
                $form->addError(new \Symfony\Component\Form\FormError(
                    'Vous avez déjà une séance programmée à un horaire trop proche. ' .
                        'Il doit y avoir au moins 1h30 entre deux séances.'
                ));
            }
        }
    }

    private function handleImageUpload()
    {
        return function ($event) {
            $form = $event->getForm();
            if (!$form->isValid()) {
                return;
            }

            $seance = $form->getData();
            if (!$seance instanceof Seance) {
                return;
            }

            $uploadedFile = $seance->getPhoto();

            // Si on a une nouvelle image
            if ($uploadedFile instanceof UploadedFile) {
                // Supprimer l'ancienne photo si elle existe
                $oldPhotoPath = $seance->getPhoto();
                if ($oldPhotoPath && file_exists('public/' . $oldPhotoPath)) {
                    unlink('public/' . $oldPhotoPath);
                }

                // Upload la nouvelle photo
                $newFilename = uniqid() . '.' . $uploadedFile->guessExtension();
                $uploadedFile->move(
                    'public/images/seances',
                    $newFilename
                );
                $seance->setPhoto('images/seances/' . $newFilename);
            }
            // Si la photo a été supprimée (champ vidé)
            elseif ($uploadedFile === null) {
                $oldPhotoPath = $seance->getPhoto();
                if ($oldPhotoPath && file_exists('public/' . $oldPhotoPath)) {
                    unlink('public/' . $oldPhotoPath);
                    $seance->setPhoto(null);
                }
            }
        };
    }

    private function handleSportifs()
    {
        return function (FormEvent $event) {
            $form = $event->getForm();
            if (!$form->isValid()) {
                return;
            }

            $seance = $form->getData();
            if (!$seance instanceof Seance) {
                return;
            }

            try {
                // Vérification du nombre de sportifs selon le type de séance
                $typeSeance = $seance->getTypeSeance();
                $maxSportifs = match ($typeSeance) {
                    TypeSeance::SOLO => 1,
                    TypeSeance::DUO => 2,
                    TypeSeance::TRIO => 3,
                    default => 3
                };

                $sportifs = $seance->getSportifs();
                if (count($sportifs) > $maxSportifs) {
                    throw new \LogicException(sprintf(
                        'Une séance %s ne peut avoir que %d sportif(s) maximum',
                        $typeSeance->value,
                        $maxSportifs
                    ));
                }

                // Vérifier les doublons de sportifs
                $sportifIds = [];
                foreach ($seance->getParticipations() as $participation) {
                    $sportif = $participation->getSportif();
                    if ($sportif) {
                        $sportifId = $sportif->getId()->__toString();
                        if (in_array($sportifId, $sportifIds)) {
                            throw new \LogicException(
                                sprintf(
                                    'Le sportif %s %s ne peut être ajouté qu\'une seule fois à la séance',
                                    $sportif->getPrenom(),
                                    $sportif->getNom()
                                )
                            );
                        }
                        $sportifIds[] = $sportifId;
                    }
                }
            } catch (\LogicException $e) {
                // On ne met plus de flash message ici
                $form->addError(new \Symfony\Component\Form\FormError($e->getMessage()));
            }
        };
    }

    public function persistEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        try {
            // Vérifier à nouveau les conflits de séances avant la persistance
            if ($entityInstance instanceof Seance && $entityInstance->getDateHeure()) {
                $repository = $entityManager->getRepository(Seance::class);

                // Définir le coach comme l'utilisateur connecté
                $coach = $this->getUser();
                if ($coach instanceof Coach) {
                    $entityInstance->setCoach($coach);
                }

                if ($repository instanceof \App\Repository\SeanceRepository) {
                    $hasConflict = $repository->hasConflictingSession($entityInstance->getCoach(), $entityInstance->getDateHeure(), $entityInstance->getId());
                    if ($hasConflict) {
                        throw new \LogicException(
                            'Vous avez déjà une séance programmée à un horaire trop proche. ' .
                                'Il doit y avoir au moins 1h30 entre deux séances.'
                        );
                    }
                }
            }

            parent::persistEntity($entityManager, $entityInstance);

            // Mise à jour des informations sur les participations après sauvegarde
            if (method_exists($entityInstance, 'getParticipations')) {
                foreach ($entityInstance->getParticipations() as $participation) {
                    $entityManager->persist($participation);
                }
                $entityManager->flush();
            }
        } catch (\LogicException $e) {
            // Ajouter un flash message pour afficher l'erreur
            $this->addFlash('danger', $e->getMessage());

            // Ne pas propager l'exception pour permettre à l'utilisateur de corriger l'erreur
            // La transaction sera automatiquement annulée par Doctrine
        }
    }

    public function updateEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        try {
            // Si la séance est validée, ne pas permettre la modification
            if ($entityInstance instanceof Seance && $entityInstance->getStatut() === StatutSeance::VALIDEE) {
                $this->addFlash('warning', 'Une séance validée ne peut plus être modifiée.');
                return;
            }

            // Vérifier à nouveau les conflits de séances avant la mise à jour
            if ($entityInstance instanceof Seance && $entityInstance->getCoach() && $entityInstance->getDateHeure()) {
                $repository = $entityManager->getRepository(Seance::class);
                if ($repository instanceof \App\Repository\SeanceRepository) {
                    $hasConflict = $repository->hasConflictingSession($entityInstance->getCoach(), $entityInstance->getDateHeure(), $entityInstance->getId());
                    if ($hasConflict) {
                        throw new \LogicException(
                            'Vous avez déjà une séance programmée à un horaire trop proche. ' .
                                'Il doit y avoir au moins 1h30 entre deux séances.'
                        );
                    }
                }
            }

            // S'assurer que le coach reste le même (celui connecté)
            $coach = $this->getUser();
            if ($coach instanceof Coach) {
                $entityInstance->setCoach($coach);
            }

            // Récupérer les participations existantes avant modification
            $originalParticipations = new ArrayCollection();
            foreach ($entityManager->getRepository(Participation::class)->findBy(['seance' => $entityInstance]) as $participation) {
                $originalParticipations->add($participation);
            }

            // Mettre à jour l'entité de base
            parent::updateEntity($entityManager, $entityInstance);

            // Gérer les participations
            if (method_exists($entityInstance, 'getParticipations')) {
                // 1. Supprimer les participations qui ne sont plus présentes
                foreach ($originalParticipations as $originalParticipation) {
                    $found = false;
                    foreach ($entityInstance->getParticipations() as $currentParticipation) {
                        if ($currentParticipation->getId() === $originalParticipation->getId()) {
                            $found = true;
                            break;
                        }
                    }

                    if (!$found) {
                        $entityManager->remove($originalParticipation);
                    }
                }

                // 2. Ajouter/mettre à jour les participations courantes
                foreach ($entityInstance->getParticipations() as $participation) {
                    // S'assurer que la séance est correctement définie
                    if ($participation->getSeance() === null) {
                        $participation->setSeance($entityInstance);
                    }

                    // Persister la participation
                    $entityManager->persist($participation);
                }

                // Appliquer les changements
                $entityManager->flush();
            }
        } catch (\LogicException $e) {
            // Ajouter un flash message pour afficher l'erreur
            $this->addFlash('danger', $e->getMessage());

            // Ne pas propager l'exception pour permettre à l'utilisateur de corriger l'erreur
            // La transaction sera automatiquement annulée par Doctrine
        }
    }

    public function createEntity(string $entityFqcn)
    {
        $seance = new Seance();
        $seance->setStatut(StatutSeance::PREVUE);

        // Définir le coach comme l'utilisateur connecté
        $coach = $this->getUser();
        if ($coach instanceof Coach) {
            $seance->setCoach($coach);
        }

        return $seance;
    }

    public function deleteEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        if (!$entityInstance instanceof Seance) {
            return;
        }

        // Vérifier si la séance peut être supprimée
        $now = new \DateTime();
        if ($entityInstance->getDateHeure() <= $now || $entityInstance->getStatut() !== StatutSeance::PREVUE) {
            $this->addFlash('danger', 'Seules les séances futures et prévues peuvent être supprimées.');
            return;
        }

        // Supprimer les participations associées
        foreach ($entityInstance->getParticipations() as $participation) {
            $entityManager->remove($participation);
        }

        // Supprimer la photo si elle existe
        $photoPath = $entityInstance->getPhoto();
        if ($photoPath && file_exists('public/' . $photoPath)) {
            unlink('public/' . $photoPath);
        }

        // Supprimer la séance
        parent::deleteEntity($entityManager, $entityInstance);

        $this->addFlash('success', 'La séance a été supprimée avec succès.');
    }
}
