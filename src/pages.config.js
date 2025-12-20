import Dashboard from './pages/Dashboard';
import ClientProfiles from './pages/ClientProfiles';
import ClientDetail from './pages/ClientDetail';
import JobEstimates from './pages/JobEstimates';
import ScheduleLeads from './pages/ScheduleLeads';
import EstimateDetail from './pages/EstimateDetail';
import ScheduleLeadDetail from './pages/ScheduleLeadDetail';
import Calculators from './pages/Calculators';
import MaterialProcurement from './pages/MaterialProcurement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "ClientProfiles": ClientProfiles,
    "ClientDetail": ClientDetail,
    "JobEstimates": JobEstimates,
    "ScheduleLeads": ScheduleLeads,
    "EstimateDetail": EstimateDetail,
    "ScheduleLeadDetail": ScheduleLeadDetail,
    "Calculators": Calculators,
    "MaterialProcurement": MaterialProcurement,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};