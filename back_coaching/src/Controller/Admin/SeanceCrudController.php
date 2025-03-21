<?php

namespace App\Controller\Admin;

use App\Entity\Seance;
use App\Entity\Sportif;
use App\Entity\Participation;
use App\Enum\Niveau;
use App\Enum\StatutSeance;
use App\Enum\ThemeSeance;
use App\Enum\TypeSeance;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\FormField;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use Symfony\Component\Form\FormEvents;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use EasyCorp\Bundle\EasyAdminBundle\Dto\EntityDto;
use EasyCorp\Bundle\EasyAdminBundle\Config\KeyValueStore;
use EasyCorp\Bundle\EasyAdminBundle\Context\AdminContext;
use EasyCorp\Bundle\EasyAdminBundle\Field\ImageField;
use EasyCorp\Bundle\EasyAdminBundle\Field\CollectionField;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use App\Form\ParticipationType;
use Doctrine\Common\Collections\ArrayCollection;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateField;

class SeanceCrudController extends AbstractCrudController
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public static function getEntityFqcn(): string
    {
        return Seance::class;
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
                ->setHelp('Coach, sportifs et exercices de la séance'),

            AssociationField::new('coach', 'Coach')
                ->setRequired(true)
                ->setColumns(12),

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
                // Supprimer ou commenter cette ligne:
                // ->setTemplatePath('admin/field/participation_collection.html.twig')
                ->setLabel('Sportifs participants')
                ->setHelp('Le nombre maximum de sportifs dépend du type de séance : Solo (1), Duo (2), Trio (3)')
                ->setColumns(12)
                ->hideOnIndex(),

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
                ->setColumns(12)
                ->hideOnIndex(),

            ImageField::new('photo', 'Photo')
                ->setBasePath('images/seances')
                ->setUploadDir('public/images/seances')
                ->setUploadedFileNamePattern('[randomhash].[extension]')
                ->setRequired(false)
                ->setColumns(12)
                ->hideOnIndex(),
        ];

        // Ajouter le champ statut uniquement en mode édition
        if (Crud::PAGE_NEW !== $pageName) {
            $fields[] = ChoiceField::new('statut', 'Statut de la séance')
                ->setChoices(StatutSeance::cases())
                ->renderExpanded()
                ->setFormTypeOption('row_attr', ['class' => 'statut-seance-container'])
                ->setColumns(12);
        } else {
            // En mode création, on ajoute un champ caché avec la valeur par défaut
            $fields[] = ChoiceField::new('statut')
                ->setFormTypeOption('data', StatutSeance::PREVUE)
                ->hideOnForm();
        }

        return $fields;
    }

    public function configureCrud(Crud $crud): Crud
    {
        return $crud
            ->setEntityLabelInSingular('Séance')
            ->setEntityLabelInPlural('Séances')
            ->setPageTitle('index', 'Liste des séances')
            ->setPageTitle('new', 'Créer une séance')
            ->setPageTitle('edit', 'Modifier la séance')
            ->setPageTitle('detail', 'Détails de la séance')
            ->setDefaultSort(['date_heure' => 'DESC']);
    }

    public function createEntity(string $entityFqcn)
    {
        $seance = new Seance();
        $seance->setStatut(StatutSeance::PREVUE);

        return $seance;
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

        // Récupérer la séance originale depuis la base de données
        $originalSeance = $this->entityManager->getRepository(Seance::class)->find($seance->getId());

        // Vérifier si la séance était déjà validée
        if ($originalSeance && $originalSeance->getStatut() === StatutSeance::VALIDEE) {
            $this->addFlash('warning', 'Une séance validée ne peut plus être modifiée.');
            // Désactiver tous les champs du formulaire
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

                // Vérifier les conflits d'horaires pour les sportifs
                // Nous ne vérifions les sportifs que s'il y a au moins une participation
                if (!$seance->getParticipations()->isEmpty()) {
                    $conflicts = $this->checkSportifsAvailability($seance);
                    foreach ($conflicts as $conflict) {
                        $form->addError(new \Symfony\Component\Form\FormError($conflict));
                    }

                    // Vérifier le nombre de séances futures par sportif
                    $maxFutureSessionsConflicts = $this->checkMaxFutureSessions($seance);
                    foreach ($maxFutureSessionsConflicts as $conflict) {
                        $form->addError(new \Symfony\Component\Form\FormError($conflict));
                    }
                }
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
                    'Ce coach a déjà une séance programmée à un horaire trop proche. ' .
                        'Il doit y avoir au moins 1h30 entre deux séances.'
                ));
            }
        }
    }

    /**
     * Vérifie si les sportifs peuvent être ajoutés à la séance
     */
    private function checkSportifsAvailability(Seance $seance): array
    {
        $conflicts = [];
        $repository = $this->entityManager->getRepository(Seance::class);

        if ($repository instanceof \App\Repository\SeanceRepository) {
            foreach ($seance->getParticipations() as $participation) {
                $sportif = $participation->getSportif();
                if (!$sportif) continue;

                // Vérifier les conflits d'horaires
                $hasConflict = $repository->hasSportifSessionConflict($sportif, $seance->getDateHeure(), $seance->getId());
                if ($hasConflict) {
                    $conflicts[] = sprintf(
                        'Le sportif %s a déjà une séance programmée, il doit y avoir au moins 1h30 entre deux séances',
                        $sportif->__toString()
                    );
                }

                // Vérifier la correspondance des niveaux
                $niveauSportif = $sportif->getNiveauSportif();
                $niveauSeance = $seance->getNiveauSeance();
                if ($niveauSportif !== $niveauSeance) {
                    $conflicts[] = sprintf(
                        'Le sportif %s de niveau %s ne peut pas être inscrit à une séance de niveau %s',
                        $sportif->__toString(),
                        $niveauSportif->value,
                        $niveauSeance->value
                    );
                }

                // Vérifier le nombre d'annulations
                $historiqueRepo = $this->entityManager->getRepository(\App\Entity\HistoriqueAnnulation::class);
                $historique = $historiqueRepo->findOneBy([
                    'sportif' => $sportif,
                    'seance' => $seance
                ]);

                if ($historique && $historique->getNbAnnulation() >= 2) {
                    $conflicts[] = sprintf(
                        'Le sportif %s a déjà annulé cette séance 2 fois et ne peut plus y être inscrit',
                        $sportif->__toString()
                    );
                }
            }
        }

        return $conflicts;
    }

    /**
     * Vérifie que les sportifs n'ont pas plus de 3 séances réservées à l'avance
     */
    private function checkMaxFutureSessions(Seance $seance): array
    {
        $conflicts = [];
        $repository = $this->entityManager->getRepository(Seance::class);

        if ($repository instanceof \App\Repository\SeanceRepository) {
            foreach ($seance->getParticipations() as $participation) {
                $sportif = $participation->getSportif();
                if (!$sportif) continue;

                // Ne pas compter la séance actuelle si c'est une mise à jour
                $countFutureSessions = $repository->countFutureSessionsForSportif($sportif, $seance->getId());

                // Si nouvelle séance, on ajoute 1 au compte
                if (!$seance->getId()) {
                    $countFutureSessions++;
                }

                if ($countFutureSessions > 3) {
                    $conflicts[] = sprintf(
                        'Le sportif %s %s ne peut pas avoir plus de 3 séances réservées à l\'avance.',
                        $sportif->getNom(),
                        $sportif->getPrenom()
                    );
                }
            }
        }

        return $conflicts;
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
                $form->addError(new \Symfony\Component\Form\FormError(
                    sprintf(
                        'Une séance %s ne peut avoir que %d sportif(s) maximum',
                        $typeSeance->value,
                        $maxSportifs
                    )
                ));
            }

            // Vérifier les conflits d'horaires et les annulations pour les sportifs
            if ($seance->getDateHeure()) {
                $conflicts = $this->checkSportifsAvailability($seance);
                foreach ($conflicts as $conflict) {
                    $form->addError(new \Symfony\Component\Form\FormError($conflict));
                }
            }
        };
    }

    public function persistEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        try {
            // Vérifier à nouveau les conflits de séances avant la persistance
            if ($entityInstance instanceof Seance && $entityInstance->getCoach() && $entityInstance->getDateHeure()) {
                // Vérification du nombre de sportifs selon le type de séance
                $typeSeance = $entityInstance->getTypeSeance();
                $maxSportifs = match ($typeSeance) {
                    TypeSeance::SOLO => 1,
                    TypeSeance::DUO => 2,
                    TypeSeance::TRIO => 3,
                    default => 3
                };

                if (count($entityInstance->getSportifs()) > $maxSportifs) {
                    throw new \LogicException(
                        sprintf(
                            'Une séance %s ne peut avoir que %d sportif(s) maximum',
                            $typeSeance->value,
                            $maxSportifs
                        )
                    );
                }

                $repository = $entityManager->getRepository(Seance::class);
                if ($repository instanceof \App\Repository\SeanceRepository) {
                    $hasConflict = $repository->hasConflictingSession($entityInstance->getCoach(), $entityInstance->getDateHeure(), $entityInstance->getId());
                    if ($hasConflict) {
                        throw new \LogicException(
                            'Ce coach a déjà une séance programmée à un horaire trop proche. ' .
                                'Il doit y avoir au moins 1h30 entre deux séances.'
                        );
                    }

                    // Vérifier les conflits pour les sportifs
                    $conflicts = $this->checkSportifsAvailability($entityInstance);
                    if (!empty($conflicts)) {
                        throw new \LogicException(implode("\n", $conflicts));
                    }

                    // Vérifier le nombre maximum de séances futures
                    $maxSessionsConflicts = $this->checkMaxFutureSessions($entityInstance);
                    if (!empty($maxSessionsConflicts)) {
                        throw new \LogicException(implode("\n", $maxSessionsConflicts));
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
            throw $e;
        }
    }

    public function updateEntity(EntityManagerInterface $entityManager, $entityInstance): void
    {
        try {
            // Vérifier à nouveau les conflits de séances avant la mise à jour
            if ($entityInstance instanceof Seance && $entityInstance->getCoach() && $entityInstance->getDateHeure()) {
                $repository = $entityManager->getRepository(Seance::class);
                if ($repository instanceof \App\Repository\SeanceRepository) {
                    $hasConflict = $repository->hasConflictingSession($entityInstance->getCoach(), $entityInstance->getDateHeure(), $entityInstance->getId());
                    if ($hasConflict) {
                        throw new \LogicException(
                            'Ce coach a déjà une séance programmée à un horaire trop proche. ' .
                                'Il doit y avoir au moins 1h30 entre deux séances.'
                        );
                    }

                    // Vérifier les conflits pour les sportifs
                    $conflicts = $this->checkSportifsAvailability($entityInstance);
                    if (!empty($conflicts)) {
                        throw new \LogicException(implode("\n", $conflicts));
                    }
                }
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
}
