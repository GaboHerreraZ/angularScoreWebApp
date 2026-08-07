import { FlowDefinition, TourDefinition } from '@/app/types/tour';
import { WELCOME_TOUR } from './welcome.tour';
import { CREDIT_STUDY_CREATE_FLOW } from './credit-study-create.flow';
import { CUSTOMERS_FIND_TOUR, CUSTOMERS_OVERVIEW_TOUR } from './customers.tour';
import { CREDIT_STUDY_CREATE_TOUR, CREDIT_STUDY_NEW_TOUR, CREDIT_STUDY_OVERVIEW_TOUR, CREDIT_STUDY_RESULTS_TOUR } from './credit-study.tour';
import { DASHBOARD_OVERVIEW_TOUR } from './dashboard.tour';
import { ADMIN_COMPANY_TOUR, ADMIN_DIMENSIONS_TOUR, ADMIN_PACKS_TOUR, ADMIN_PROFILE_TOUR, ADMIN_SECURITY_TOUR } from './administration.tour';

export const TOURS: TourDefinition[] = [
    WELCOME_TOUR,
    DASHBOARD_OVERVIEW_TOUR,
    CUSTOMERS_OVERVIEW_TOUR,
    CUSTOMERS_FIND_TOUR,
    CREDIT_STUDY_OVERVIEW_TOUR,
    CREDIT_STUDY_CREATE_TOUR,
    CREDIT_STUDY_RESULTS_TOUR,
    CREDIT_STUDY_NEW_TOUR,
    ADMIN_PROFILE_TOUR,
    ADMIN_SECURITY_TOUR,
    ADMIN_COMPANY_TOUR,
    ADMIN_PACKS_TOUR,
    ADMIN_DIMENSIONS_TOUR
];

export const FLOWS: FlowDefinition[] = [
    CREDIT_STUDY_CREATE_FLOW
];

export { WELCOME_TOUR };
