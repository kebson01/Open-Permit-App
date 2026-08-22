/**
 * pages.config.js - Page routing configuration
 *
 * NOTE: real routing lives in src/App.jsx. This file only registers pages for
 * the auto-generated page index and names the landing page.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 */
import ARTools from './pages/ARTools';
import CameraScan from './pages/CameraScan';
import ExemptionChecker from './pages/ExemptionChecker';
import FeeCalculator from './pages/FeeCalculator';
import Home from './pages/Home';
import PermitGuide from './pages/PermitGuide';
import PermitInfo from './pages/PermitInfo';
import __Layout from './components/Layout';


export const PAGES = {
    "ARTools": ARTools,
    "CameraScan": CameraScan,
    "ExemptionChecker": ExemptionChecker,
    "FeeCalculator": FeeCalculator,
    "Home": Home,
    "PermitGuide": PermitGuide,
    "PermitInfo": PermitInfo,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
