import Calculators from './pages/Calculators';
import ClientDetail from './pages/ClientDetail';
import ClientProfiles from './pages/ClientProfiles';
import Dashboard from './pages/Dashboard';
import DataImport from './pages/DataImport';
import EstimateDetail from './pages/EstimateDetail';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import JobDetail from './pages/JobDetail';
import JobEstimates from './pages/JobEstimates';
import JobKits from './pages/JobKits';
import MaterialProcurement from './pages/MaterialProcurement';
import Portfolio from './pages/Portfolio';
import ScheduleLeadDetail from './pages/ScheduleLeadDetail';
import ScheduleLeads from './pages/ScheduleLeads';
import SystemLogs from './pages/SystemLogs';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calculators": Calculators,
    "ClientDetail": ClientDetail,
    "ClientProfiles": ClientProfiles,
    "Dashboard": Dashboard,
    "DataImport": DataImport,
    "EstimateDetail": EstimateDetail,
    "Home": Home,
    "Inventory": Inventory,
    "JobDetail": JobDetail,
    "JobEstimates": JobEstimates,
    "JobKits": JobKits,
    "MaterialProcurement": MaterialProcurement,
    "Portfolio": Portfolio,
    "ScheduleLeadDetail": ScheduleLeadDetail,
    "ScheduleLeads": ScheduleLeads,
    "SystemLogs": SystemLogs,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};