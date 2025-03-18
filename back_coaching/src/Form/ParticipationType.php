<?php
// src/Form/ParticipationType.php
namespace App\Form;

use App\Entity\Participation;
use App\Entity\Sportif;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ParticipationType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('sportif', EntityType::class, [
                'class' => Sportif::class,
                'choice_label' => function (Sportif $sportif) {
                    return $sportif->getNom() . ' ' . $sportif->getPrenom();
                },
                'label' => 'Sportif'
            ])
            ->add('presence', CheckboxType::class, [
                'label' => 'Présent',
                'required' => false
            ]);
    }

    public function configureOptions(OptionsResolver $resolver)
    {
        $resolver->setDefaults([
            'data_class' => Participation::class,
        ]);
    }
}
