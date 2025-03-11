<?php

namespace App\Enum;

enum StatutSeance: string
{
    case PREVUE = 'prevue';
    case VALIDEE = 'validee';
    case ANNULEE = 'annulee';
}
