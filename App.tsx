

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
  type Auth
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, Unsubscribe } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Portfolio, Trade, Target } from './types';
import SetupForm from './components/SetupForm';
import Dashboard from './components/Dashboard';
import { sendNotification } from './utils/notifications';
import { formatCurrency as formatCurrencyUtil } from './utils/formatters';
import ThemeToggleButton from './components/ThemeToggleButton';
import { EditIcon, TrashIcon, UserIcon, LogoutIcon } from './components/Icons';
import EditPortfolioNameModal from './components/EditPortfolioNameModal';
import ConfirmModal from './components/ConfirmModal';

const firebaseConfig = {
  apiKey: "AIzaSyBMHZ-r1chuf2wMqB1zhvM2ujyRVyvrllM",
  authDomain: "moutaz-mahfaza.firebaseapp.com",
  projectId: "moutaz-mahfaza",
  storageBucket: "moutaz-mahfaza.firebasestorage.app",
  messagingSenderId: "712648979777",
  appId: "1:712648979777:web:160d9542d6f64fe3991dc0",
  measurementId: "G-4QC62DWH9G"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Fix: Moved translations to be defined within the file, as new files cannot be created.
// This resolves the multiple default export errors and the incorrect import.
const arTranslations = {
    appName: 'محفظة التداول الذكية',
    appDescription: 'تتبع صفقاتك وحقق أهدافك المالية',
    footer: 'تم التطوير بواسطة معتز عادل',
    // Login Page
    loginTitle: 'تسجيل الدخول إلى محفظتك',
    loginWithGoogle: 'تسجيل الدخول باستخدام جوجل',
    signUpWithGoogle: 'إنشاء حساب باستخدام جوجل',
    loginOrSeparator: 'أو',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: '••••••••',
    signInButton: 'تسجيل الدخول',
    logoutButton: 'تسجيل الخروج',
    loginErrorEmptyFields: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.',
    loginErrorInvalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    loginErrorInvalidEmail: 'البريد الإلكتروني الذي أدخلته غير صالح.',
    loginErrorGeneric: 'حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.',
    authErrorUnauthorizedDomainDetailed: 'النطاق الحالي ({hostname}) غير مصرح به. يرجى إضافته إلى "النطاقات المصرّح بها" في إعدادات المصادقة بمشروع Firebase.',
    signUpTitle: 'إنشاء حساب جديد',
    signUpButton: 'إنشاء حساب',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    switchToSignUp: 'ليس لديك حساب؟',
    signUpLink: 'إنشاء حساب',
    switchToSignIn: 'هل لديك حساب بالفعل؟',
    signInLink: 'تسجيل الدخول',
    signUpErrorPasswordMismatch: 'كلمتا المرور غير متطابقتين.',
    signUpErrorEmptyFields: 'الرجاء ملء جميع الحقول.',
    signUpErrorEmailInUse: 'هذا البريد الإلكتروني مستخدم بالفعل.',
    signUpErrorWeakPassword: 'كلمة المرور ضعيفة جدًا. يجب أن تكون 6 أحرف على الأقل.',
    multiDeviceLogout: 'تم تسجيل الدخول من جهاز آخر! سيتم تسجيل خروجك الآن.',
    // HomePage
    totalCapital: 'رأس المال الإجمالي',
    allPortfolios: 'جميع المحافظ',
    addNewPortfolio: '+ إضافة محفظة جديدة',
    managePortfolio: 'إدارة',
    noPortfolios: 'لا توجد محافظ بعد',
    noPortfoliosMessage: 'ابدأ بإنشاء محفظتك الأولى لبدء تتبع صفقاتك.',
    confirmDeletePortfolioTitle: 'تأكيد حذف المحفظة',
    confirmDeletePortfolioMessage: 'هل أنت متأكد من رغبتك في حذف محفظة {portfolioName}؟ لا يمكن التراجع عن هذا الإجراء.',
    totalPnlPercentage: 'إجمالي نسبة الربح/الخسارة',
    openTradesCount: 'الصفقات المفتوحة',
    // SetupForm
    setupTitle: 'إعداد محفظة جديدة',
    portfolioNameLabel: 'اسم المحفظة',
    portfolioNamePlaceholder: 'مثال: محفظتي للتداول اليومي',
    initialCapitalLabel: 'رأس المال المبدئي',
    initialCapitalPlaceholder: 'مثال: 1000',
    firstTargetLabel: 'الهدف المالي الأول',
    targetPlaceholder: 'مثال: 5000',
    currencyLabel: 'العملة',
    startButton: 'ابدأ التتبع',
    setupErrorPositive: 'الرجاء إدخال قيم رقمية موجبة لكل من رأس المال والهدف.',
    setupErrorTargetGreater: 'يجب أن يكون الهدف أكبر من رأس المال المبدئي.',
    confirmSetupTitle: 'تأكيد بدء المحفظة',
    confirmSetupMessage: 'هل أنت متأكد من رغبتك في بدء محفظة جديدة برأس مال مبدئي {capital} وهدف أولي {target}؟',
    confirmSetupButton: 'نعم، ابدأ',
    // Dashboard
    goHome: 'جميع المحافظ',
    deletePortfolio: 'حذف المحفظة',
    initialCapital: 'رأس المال المبدئي',
    editInitialCapital: 'تعديل رأس المال المبدئي',
    currentCapital: 'رأس المال الحالي',
    target: 'الهدف',
    editTargets: 'تعديل الأهداف',
    progressToTarget: 'التقدم نحو الهدف',
    remaining: 'متبقي',
    progressStartPoint: 'نقطة البداية للمرحلة الحالية',
    nextTarget: 'الهدف التالي',
    totalClosedTrades: 'إجمالي الصفقات المغلقة',
    winRate: 'نسبة الصفقات الرابحة',
    estimatedTradesToTarget: 'صفقات متوقعة للهدف',
    netProfitLoss: 'صافي الربح/الخسارة',
    avgWin: 'متوسط الربح',
    avgLoss: 'متوسط الخسارة',
    targetAchieved: '✓ الهدف محقق',
    insufficientData: 'بيانات غير كافية',
    improvePerformance: 'تحسين الأداء',
    trades: 'صفقة',
    exportCSV: 'تصدير CSV',
    reset: 'Reset',
    all: 'الكل',
    open: 'المفتوحة',
    closed: 'المغلقة',
    performanceAnalysis: 'تحليل الأداء',
    newTradeTab: 'تداول',
    watchlistTab: 'قائمة المراقبة',
    // AddTradeForm
    newTradeTitle: 'فتح صفقة جديدة',
    assetNameLabel: 'اسم السهم',
    assetNamePlaceholder: 'مثال: CIB, TMGH, FWRY',
    entryPriceLabel: 'سعر الشراء',
    entryPricePlaceholder: '150.5',
    tradeValueLabel: 'قيمة الصفقة',
    tradeValuePlaceholder: '1000',
    tpPriceLabel: 'سعر البيع (TP)',
    tpPricePlaceholder: '160',
    slPriceLabel: 'سعر وقف الخسارة (SL)',
    slPricePlaceholder: '145',
    notesLabel: 'ملاحظات (اختياري)',
    notesPlaceholder: 'سبب الدخول، الاستراتيجية...',
    openTradeButton: 'فتح الصفقة',
    addTradeErrorAsset: 'الرجاء إدخال اسم السهم.',
    addTradeErrorEntry: 'الرجاء إدخال سعر شراء رقمي موجب.',
    addTradeErrorValue: 'الرجاء إدخال قيمة صفقة رقمية موجبة.',
    addTradeErrorTP: 'الرجاء إدخال سعر بيع رقمي موجب.',
    addTradeErrorSL: 'الرجاء إدخال سعر وقف خسارة رقمي موجب.',
    addTradeErrorTPGreater: 'يجب أن يكون سعر البيع (TP) أعلى من سعر الشراء.',
    addTradeErrorSLLess: 'يجب أن يكون سعر وقف الخسارة (SL) أقل من سعر الشراء.',
    // TradeList
    openTrades: 'الصفقات المفتوحة',
    noOpenTrades: 'لا توجد صفقات مفتوحة حاليًا.',
    close: 'إغلاق',
    closedTradesHistory: 'سجل الصفقات',
    noClosedTrades: 'لم يتم إغلاق أي صفقات بعد.',
    tradeNumHeader: '#',
    assetHeader: 'السهم',
    dateHeader: 'التاريخ',
    pnlHeader: 'الربح/الخسارة',
    percentageHeader: 'النسبة',
    actionsHeader: 'إجراءات',
    showNotes: 'إظهار الملاحظات',
    hideNotes: 'إخفاء الملاحظات',
    analyzeTradeTooltip: 'تحليل الصفقة بالذكاء الاصطناعي',
    // CloseTradeModal
    closeTradeTitle: 'إغلاق صفقة: {assetName}',
    closeTradeDescription: 'اختر إغلاق الصفقة بسعر الربح/الخسارة المحدد مسبقًا، أو أدخل قيمة مخصصة.',
    confirmProfit: 'تأكيد الربح',
    confirmLoss: 'تأكيد الخسارة',
    orCustomValue: 'أو إغلاق بقيمة مخصصة',
    manualPnlLabel: 'الربح / الخسارة اليدوية',
    manualPnlPlaceholder: '50 للربح, -25 للخسارة',
    pnlError: 'الرجاء إدخال قيمة رقمية صحيحة.',
    addAndConfirm: 'إضافة وتأكيد',
    confirmCloseTitle: 'تأكيد إغلاق الصفقة',
    confirmCloseMessage: 'هل أنت متأكد من رغبتك في إغلاق هذه الصفقة بنتيجة {pnl}؟',
    confirmCloseButton: 'نعم، أغلق الصفقة',
    cancel: 'إلغاء',
    // EditTradeModal
    editTradeTitle: 'تعديل صفقة: {assetName}',
    saveChanges: 'حفظ التعديلات',
    // DeleteTradeModal
    confirmDeleteTitle: 'تأكيد الحذف',
    confirmDeleteMessage: 'هل أنت متأكد من رغبتك في حذف صفقة {assetName}؟ لا يمكن التراجع عن هذا الإجراء.',
    confirmDeleteButton: 'نعم، احذف الصفقة',
    // MonthlyStats
    monthlyPerformance: 'الأداء الشهري (للصفقات المغلقة)',
    noMonthlyData: 'لا توجد بيانات كافية لعرض الأداء الشهري.',
    monthHeader: 'الشهر',
    winsHeader: 'صفقات رابحة',
    lossesHeader: 'صفقات خاسرة',
    netProfitHeader: 'صافي الربح',
    // ManageTargetsModal
    manageTargetsTitle: 'إدارة الأهداف المالية',
    manageTargetsDescription: 'قم بإضافة وتعديل أهدافك. سيتم ترتيبها تلقائيًا حسب المبلغ.',
    targetNameLabel: 'اسم الهدف',
    targetNamePlaceholder: 'مثال: شراء سيارة',
    targetAmountLabel: 'المبلغ المستهدف',
    targetAmountPlaceholder: '50000',
    deleteTarget: 'حذف الهدف',
    addNewTarget: '+ إضافة هدف جديد',
    confirmTargetEditTitle: 'تأكيد تعديل الأهداف',
    confirmTargetEditMessage: 'هل أنت متأكد من رغبتك في تحديث أهدافك؟ سيؤثر هذا على حسابات التقدم.',
    // EditCapitalModal
    editCapitalTitle: 'تعديل رأس المال المبدئي',
    capitalError: 'الرجاء إدخال قيمة رقمية موجبة لرأس المال.',
    save: 'حفظ',
    confirmCapitalEditTitle: 'تأكيد تعديل رأس المال',
    confirmCapitalEditMessage: 'تغيير رأس المال المبدئي سيؤثر على جميع حسابات الأداء والنمو.',
    confirmCapitalEditWarning: 'هل أنت متأكد من المتابعة؟',
    // Notifications
    enableNotifications: 'تفعيل الإشعارات',
    notificationsEnabled: 'الإشعارات مفعلة',
    notificationsBlocked: 'الإشعارات محظورة',
    enableNotificationsTooltip: 'انقر لتفعيل الإشعارات عند إغلاق الصفقات.',
    notificationsEnabledTooltip: 'تصلك إشعارات عند إغلاق الصفقات.',
    notificationsBlockedTooltip: 'لقد حظرت الإشعارات. يرجى تفعيلها من إعدادات المتصفح.',
    notificationWinTitle: '🎉 صفقة رابحة!',
    notificationWinBody: 'تم إغلاق صفقة {assetName} بربح قدره {pnl}.',
    notificationLossTitle: '⚠️ صفقة خاسرة',
    notificationLossBody: 'تم إغلاق صفقة {assetName} بخسارة قدرها {pnl}.',
    notificationBreakevenTitle: '⚖️ صفقة متعادلة',
    notificationBreakevenBody: 'تم إغلاق صفقة {assetName} بدون ربح أو خسارة.',
    initialTargetName: 'الهدف الأولي',
    // ProgressBar
    progressBarTargetAchieved: 'الهدف مكتمل!',
    // Portfolio Name
    editPortfolioNameTitle: 'تعديل اسم المحفظة',
    portfolioNameError: 'الرجاء إدخال اسم للمحفظة.',
    // Analytics Page
    returnToDashboard: 'العودة للوحة التحكم',
    noClosedTradesToAnalyze: 'لا توجد صفقات مغلقة لتحليلها.',
    equityCurveTitle: 'منحنى نمو رأس المال',
    capitalAnalysisTitle: 'توزيع رأس المال',
    profitDistributionByAssetTitle: 'توزيع الأرباح حسب السهم',
    stockPerformanceAnalysisTitle: 'تحليل أداء الأسهم',
    winsLosses: 'صفقات رابحة / خاسرة',
    tradePerformanceOldestNewest: 'أداء الصفقات (من الأقدم للأحدث)',
    noChartData: 'لا توجد بيانات للرسم',
    chartStart: 'البداية',
    chartAfterTrade: 'بعد الصفقة #{tradeNumber}',
    pieInitialCapital: 'رأس المال المبدئي',
    pieNetProfit: 'صافي الربح',
    pieRemainingCapital: 'رأس المال المتبقي',
    pieTotalLoss: 'إجمالي الخسارة',
    pieCurrentCapital: 'رأس المال الحالي',
    noProfitData: 'لا توجد بيانات أرباح لعرضها.',
    closeOneTradeForChart: 'أغلق صفقة واحدة على الأقل لعرض الرسم البياني.',
    profitDistributionTitle: 'توزيع الأرباح',
    // Language
    switchToEnglish: 'التحويل إلى الإنجليزية',
    switchToArabic: 'التحويل إلى العربية',
    myFirstPortfolio: 'محفظتي الأولى',
    myPortfolio: 'محفظتي',
    myPortfolios: 'محافظ الأستثمار',
    expenses: 'المصروفات',
    // Profile
    profilePageTitle: 'الملف الشخصي',
    displayNameLabel: 'الاسم المعروض',
    displayNamePlaceholder: 'اسمك الكامل',
    changeProfilePicture: 'تغيير الصورة',
    profileEmailNotEditable: 'البريد الإلكتروني لتسجيل الدخول (غير قابل للتعديل)',
    saveProfile: 'حفظ الملف الشخصي',
    saving: 'جارٍ الحفظ...',
    back: 'رجوع',
    profile: 'الملف الشخصي',
    addressLabel: 'العنوان',
    addressPlaceholder: 'شارع، مبنى، شقة',
    phoneNumberLabel: 'رقم الهاتف',
    phoneNumberPlaceholder: '+201234567890',
    countryLabel: 'الدولة',
    cityLabel: 'المدينة',
    selectCountry: 'اختر الدولة',
    selectCity: 'اختر المدينة',
    profileUpdateSuccess: 'تم تحديث الملف الشخصي بنجاح!',
    profileUpdateImageError: 'فشل تحميل الصورة. الرجاء المحاولة مرة أخرى.',
    profileUpdateSaveError: 'فشل حفظ الملف الشخصي. الرجاء المحاولة مرة أخرى.',
};

const enTranslations: Record<string, string> = {
    appName: 'Smart Trading Portfolio',
    appDescription: 'Track your trades and achieve your financial goals',
    footer: 'Developed by Moataz Adel',
     // Login Page
    loginTitle: 'Sign in to your Portfolio',
    loginWithGoogle: 'Sign in with Google',
    signUpWithGoogle: 'Sign up with Google',
    loginOrSeparator: 'OR',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    signInButton: 'Sign In',
    logoutButton: 'Logout',
    loginErrorEmptyFields: 'Please enter both email and password.',
    loginErrorInvalidCredentials: 'Invalid email or password.',
    loginErrorInvalidEmail: 'The email address is not valid.',
    loginErrorGeneric: 'An unexpected error occurred. Please try again.',
    authErrorUnauthorizedDomainDetailed: 'The current domain ({hostname}) is not authorized. Please add it to the "Authorized domains" list in your Firebase project\'s Authentication settings.',
    signUpTitle: 'Create a New Account',
    signUpButton: 'Sign Up',
    confirmPasswordLabel: 'Confirm Password',
    switchToSignUp: "Don't have an account?",
    signUpLink: 'Sign Up',
    switchToSignIn: 'Already have an account?',
    signInLink: 'Sign In',
    signUpErrorPasswordMismatch: 'Passwords do not match.',
    signUpErrorEmptyFields: 'Please fill in all fields.',
    signUpErrorEmailInUse: 'This email is already in use.',
    signUpErrorWeakPassword: 'Password is too weak. Must be at least 6 characters.',
    multiDeviceLogout: 'You have been logged in from another device! You will be logged out now.',
    // HomePage
    totalCapital: 'Total Capital',
    allPortfolios: 'All Portfolios',
    addNewPortfolio: '+ Add New Portfolio',
    managePortfolio: 'Manage',
    noPortfolios: 'No Portfolios Yet',
    noPortfoliosMessage: 'Get started by creating your first portfolio to start tracking your trades.',
    confirmDeletePortfolioTitle: 'Confirm Portfolio Deletion',
    confirmDeletePortfolioMessage: 'Are you sure you want to delete the portfolio {portfolioName}? This action cannot be undone.',
    totalPnlPercentage: 'Total P/L %',
    openTradesCount: 'Open Trades',
    // SetupForm
    setupTitle: 'New Portfolio Setup',
    portfolioNameLabel: 'Portfolio Name',
    portfolioNamePlaceholder: 'e.g., My Day Trading Portfolio',
    initialCapitalLabel: 'Initial Capital',
    initialCapitalPlaceholder: 'e.g., 1000',
    firstTargetLabel: 'First Financial Target',
    targetPlaceholder: 'e.g., 5000',
    currencyLabel: 'Currency',
    startButton: 'Start Tracking',
    setupErrorPositive: 'Please enter positive numeric values for both capital and target.',
    setupErrorTargetGreater: 'Target must be greater than initial capital.',
    confirmSetupTitle: 'Confirm Portfolio Start',
    confirmSetupMessage: 'Are you sure you want to start a new portfolio with an initial capital of {capital} and an initial target of {target}?',
    confirmSetupButton: 'Yes, Start',
    // Dashboard
    goHome: 'All Portfolios',
    deletePortfolio: 'Delete Portfolio',
    initialCapital: 'Initial Capital',
    editInitialCapital: 'Edit Initial Capital',
    currentCapital: 'Current Capital',
    target: 'Target',
    editTargets: 'Edit Targets',
    progressToTarget: 'Progress to Target',
    remaining: 'Remaining',
    progressStartPoint: 'Start point for the current stage',
    nextTarget: 'Next Target',
    totalClosedTrades: 'Total Closed Trades',
    winRate: 'Win Rate',
    estimatedTradesToTarget: 'Est. Trades to Target',
    netProfitLoss: 'Net Profit/Loss',
    avgWin: 'Average Win',
    avgLoss: 'Average Loss',
    targetAchieved: '✓ Target Achieved',
    insufficientData: 'Insufficient Data',
    improvePerformance: 'Improve Performance',
    trades: 'trades',
    exportCSV: 'Export CSV',
    reset: 'Reset',
    all: 'All',
    open: 'Open',
    closed: 'Closed',
    performanceAnalysis: 'Performance Analysis',
    newTradeTab: 'Trading',
    watchlistTab: 'Watchlist',
    // AddTradeForm
    newTradeTitle: 'Open a New Trade',
    assetNameLabel: 'Asset Name',
    assetNamePlaceholder: 'e.g., CIB, TMGH, FWRY',
    entryPriceLabel: 'Entry Price',
    entryPricePlaceholder: '150.5',
    tradeValueLabel: 'Trade Value',
    tradeValuePlaceholder: '1000',
    tpPriceLabel: 'Take Profit Price (TP)',
    tpPricePlaceholder: '160',
    slPriceLabel: 'Stop Loss Price (SL)',
    slPricePlaceholder: '145',
    notesLabel: 'Notes (Optional)',
    notesPlaceholder: 'Entry reason, strategy...',
    openTradeButton: 'Open Trade',
    addTradeErrorAsset: 'Please enter an asset name.',
    addTradeErrorEntry: 'Please enter a positive numeric entry price.',
    addTradeErrorValue: 'Please enter a positive numeric trade value.',
    addTradeErrorTP: 'Please enter a positive numeric take profit price.',
    addTradeErrorSL: 'Please enter a positive numeric stop loss price.',
    addTradeErrorTPGreater: 'Take Profit price must be higher than entry price.',
    addTradeErrorSLLess: 'Stop Loss price must be lower than entry price.',
    // TradeList
    openTrades: 'Open Trades',
    noOpenTrades: 'No open trades at the moment.',
    close: 'Close',
    closedTradesHistory: 'Closed Trades History',
    noClosedTrades: 'No trades have been closed yet.',
    tradeNumHeader: '#',
    assetHeader: 'Asset',
    dateHeader: 'Date',
    pnlHeader: 'P/L',
    percentageHeader: 'Percent',
    actionsHeader: 'Actions',
    showNotes: 'Show Notes',
    hideNotes: 'Hide Notes',
    analyzeTradeTooltip: 'Analyze trade with AI',
    // CloseTradeModal
    closeTradeTitle: 'Close Trade: {assetName}',
    closeTradeDescription: 'Choose to close the trade at the preset P/L, or enter a custom value.',
    confirmProfit: 'Confirm Profit',
    confirmLoss: 'Confirm Loss',
    orCustomValue: 'Or close with a custom value',
    manualPnlLabel: 'Manual P/L',
    manualPnlPlaceholder: '50 for profit, -25 for loss',
    pnlError: 'Please enter a valid numeric value.',
    addAndConfirm: 'Add & Confirm',
    confirmCloseTitle: 'Confirm Trade Closure',
    confirmCloseMessage: 'Are you sure you want to close this trade with a result of {pnl}?',
    confirmCloseButton: 'Yes, Close Trade',
    cancel: 'Cancel',
    // EditTradeModal
    editTradeTitle: 'Edit Trade: {assetName}',
    saveChanges: 'Save Changes',
    // DeleteTradeModal
    confirmDeleteTitle: 'Confirm Deletion',
    confirmDeleteMessage: 'Are you sure you want to delete the trade for {assetName}? This action cannot be undone.',
    confirmDeleteButton: 'Yes, Delete Trade',
    // MonthlyStats
    monthlyPerformance: 'Monthly Performance (Closed Trades)',
    noMonthlyData: 'Not enough data to display monthly performance.',
    monthHeader: 'Month',
    winsHeader: 'Winning Trades',
    lossesHeader: 'Losing Trades',
    netProfitHeader: 'Net Profit',
    // ManageTargetsModal
    manageTargetsTitle: 'Manage Financial Targets',
    manageTargetsDescription: 'Add and edit your targets. They will be automatically sorted by amount.',
    targetNameLabel: 'Target Name',
    targetNamePlaceholder: 'e.g., Buy a car',
    targetAmountLabel: 'Target Amount',
    targetAmountPlaceholder: '50000',
    deleteTarget: 'Delete Target',
    addNewTarget: '+ Add New Target',
    confirmTargetEditTitle: 'Confirm Target Edits',
    confirmTargetEditMessage: 'Are you sure you want to update your targets? This will affect progress calculations.',
    // EditCapitalModal
    editCapitalTitle: 'Edit Initial Capital',
    capitalError: 'Please enter a positive numeric value for the capital.',
    save: 'Save',
    confirmCapitalEditTitle: 'Confirm Capital Edit',
    confirmCapitalEditMessage: 'Changing the initial capital will affect all performance and growth calculations.',
    confirmCapitalEditWarning: 'Are you sure you want to proceed?',
    // Notifications
    enableNotifications: 'Enable Notifications',
    notificationsEnabled: 'Notifications Enabled',
    notificationsBlocked: 'Notifications Blocked',
    enableNotificationsTooltip: 'Click to enable notifications when trades are closed.',
    notificationsEnabledTooltip: 'You will receive notifications when trades are closed.',
    notificationsBlockedTooltip: 'You have blocked notifications. Please enable them in your browser settings.',
    notificationWinTitle: '🎉 Profitable Trade!',
    notificationWinBody: 'Closed {assetName} trade with a profit of {pnl}.',
    notificationLossTitle: '⚠️ Losing Trade',
    notificationLossBody: 'Closed {assetName} trade with a loss of {pnl}.',
    notificationBreakevenTitle: '⚖️ Breakeven Trade',
    notificationBreakevenBody: 'Closed {assetName} trade with no profit or loss.',
    initialTargetName: 'Initial Target',
    // ProgressBar
    progressBarTargetAchieved: 'Target Achieved!',
    // Portfolio Name
    editPortfolioNameTitle: 'Edit Portfolio Name',
    portfolioNameError: 'Please enter a portfolio name.',
    // Analytics Page
    returnToDashboard: 'Return to Dashboard',
    noClosedTradesToAnalyze: 'No closed trades to analyze.',
    equityCurveTitle: 'Equity Curve',
    capitalAnalysisTitle: 'Capital Distribution',
    profitDistributionByAssetTitle: 'Profit Distribution by Asset',
    stockPerformanceAnalysisTitle: 'Stock Performance Analysis',
    winsLosses: 'Wins / Losses',
    tradePerformanceOldestNewest: 'Trade Performance (Oldest to Newest)',
    noChartData: 'No data to chart',
    chartStart: 'Start',
    chartAfterTrade: 'After Trade #{tradeNumber}',
    pieInitialCapital: 'Initial Capital',
    pieNetProfit: 'Net Profit',
    pieRemainingCapital: 'Remaining Capital',
    pieTotalLoss: 'Total Loss',
    pieCurrentCapital: 'Current Capital',
    noProfitData: 'No profit data to display.',
    closeOneTradeForChart: 'Close at least one trade to see the chart.',
    profitDistributionTitle: 'Profit Distribution',
    // Language
    switchToEnglish: 'Switch to English',
    switchToArabic: 'Switch to Arabic',
    myFirstPortfolio: 'My First Portfolio',
    myPortfolio: 'My Portfolio',
    myPortfolios: 'Investment Portfolios',
    expenses: 'Expenses',
    // Profile
    profilePageTitle: 'Profile',
    displayNameLabel: 'Display Name',
    displayNamePlaceholder: 'Your full name',
    changeProfilePicture: 'Change Picture',
    profileEmailNotEditable: 'Login Email (cannot be changed)',
    saveProfile: 'Save Profile',
    saving: 'Saving...',
    back: 'Back',
    profile: 'Profile',
    addressLabel: 'Address',
    addressPlaceholder: 'Street, Building, Apartment',
    phoneNumberLabel: 'Phone Number',
    phoneNumberPlaceholder: '+1 (555) 123-4567',
    countryLabel: 'Country',
    cityLabel: 'City',
    selectCountry: 'Select Country',
    selectCity: 'Select City',
    profileUpdateSuccess: 'Profile updated successfully!',
    profileUpdateImageError: 'Failed to upload image. Please try again.',
    profileUpdateSaveError: 'Failed to save profile. Please try again.',
};

const translations = {
    ar: arTranslations,
    en: enTranslations,
};

const countryCityData = {
    ar: {
        'مصر': ['القاهرة', 'الإسكندرية', 'الجيزة', 'الأقصر'],
        'المملكة العربية السعودية': ['الرياض', 'جدة', 'مكة', 'المدينة المنورة', 'الدمام'],
        'الإمارات العربية المتحدة': ['دبي', 'أبو ظبي', 'الشارقة', 'عجمان'],
        'الولايات المتحدة': ['نيويورك', 'لوس أنجلوس', 'شيكاغو', 'هيوستن']
    },
    en: {
        'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Luxor'],
        'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'],
        'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
        'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston']
    }
};


type Language = 'ar' | 'en';
interface Profile {
    displayName: string;
    photoURL: string;
    address?: string;
    country?: string;
    city?: string;
    phoneNumber?: string;
}

const getFirebaseAuthErrorMessage = (error: any, t: (key: string) => string) => {
    switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return t('loginErrorInvalidCredentials');
        case 'auth/email-already-in-use':
            return t('signUpErrorEmailInUse');
        case 'auth/weak-password':
            return t('signUpErrorWeakPassword');
        case 'auth/invalid-email':
            return t('loginErrorInvalidEmail');
        case 'auth/unauthorized-domain':
            const hostname = window.location.hostname || 'this website';
            return t('authErrorUnauthorizedDomainDetailed').replace('{hostname}', hostname);
        default:
            console.error('Firebase Auth Error:', error);
            return t('loginErrorGeneric');
    }
};

const LanguageToggleButton: React.FC<{ language: Language, setLanguage: (lang: Language) => void, t: (key: string) => string }> = ({ language, setLanguage, t }) => {
    const toggleLanguage = () => {
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };
    return (
        <button
            onClick={toggleLanguage}
            className="p-2 w-full text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
        >
            {language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
        </button>
    );
};

const calculateCurrentCapital = (portfolio: Portfolio): number => {
  const closedTrades = portfolio.trades.filter(trade => trade.status === 'closed');
  return closedTrades.reduce((acc, trade) => acc + trade.pnl, portfolio.initialCapital);
};

// Home Page Component
const HomePage: React.FC<{
    portfolios: Portfolio[];
    onSelectPortfolio: (id: string) => void;
    onAddNewPortfolio: () => void;
    onDeletePortfolio: (id: string) => void;
    t: (key: string) => string;
    language: Language;
    formatCurrency: (amount: number, currency: string) => string;
}> = ({ portfolios, onSelectPortfolio, onAddNewPortfolio, onDeletePortfolio, t, language, formatCurrency }) => {
    
    const [portfolioToDelete, setPortfolioToDelete] = useState<Portfolio | null>(null);

    const globalStatsByCurrency = useMemo(() => {
        const stats: { [currency: string]: { totalInitialCapital: number; totalCurrentCapital: number; totalClosedTrades: number } } = {};

        portfolios.forEach(p => {
            if (!stats[p.currency]) {
                stats[p.currency] = { totalInitialCapital: 0, totalCurrentCapital: 0, totalClosedTrades: 0 };
            }
            stats[p.currency].totalInitialCapital += p.initialCapital;
            stats[p.currency].totalCurrentCapital += calculateCurrentCapital(p);
            stats[p.currency].totalClosedTrades += p.trades.filter(t => t.status === 'closed').length;
        });

        return Object.entries(stats).map(([currency, data]) => {
            const netPnl = data.totalCurrentCapital - data.totalInitialCapital;
            const pnlPercentage = data.totalInitialCapital > 0 ? (netPnl / data.totalInitialCapital) * 100 : 0;
            return {
                currency,
                ...data,
                netPnl,
                pnlPercentage
            };
        });
    }, [portfolios]);

    const calculatePortfolioStats = (portfolio: Portfolio) => {
        const closedTrades = portfolio.trades.filter(t => t.status === 'closed');
        const winningTrades = closedTrades.filter(t => t.pnl > 0);
        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
        return {
            winRate: winRate,
        };
    };
    
    return (
        <div className="animate-fade-in space-y-8">
             {globalStatsByCurrency.map(stat => (
                 <div key={stat.currency} className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black p-6 rounded-2xl shadow-2xl shadow-cyan-500/10">
                    <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-right gap-4">
                        <div className="flex-1">
                            <h3 className="text-xl text-cyan-400">{t('totalCapital')} ({stat.currency})</h3>
                            <p className="text-5xl font-extrabold text-white my-2">{formatCurrency(stat.totalCurrentCapital, stat.currency)}</p>
                        </div>
                        <div className="h-16 w-px bg-gray-700 hidden md:block"></div>
                        <div className="grid grid-cols-3 gap-4 text-center w-full md:w-auto">
                            <div>
                               <h4 className="text-sm text-gray-400">{t('netProfitLoss')}</h4>
                               <p className={`text-lg font-bold ${stat.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                   {stat.netPnl >= 0 ? '+' : ''}{formatCurrency(stat.netPnl, stat.currency)}
                               </p>
                            </div>
                             <div>
                               <h4 className="text-sm text-gray-400">{t('totalPnlPercentage')}</h4>
                               <p className={`text-lg font-bold ${stat.pnlPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                   {stat.pnlPercentage >= 0 ? '+' : ''}{stat.pnlPercentage.toFixed(2)}%
                               </p>
                            </div>
                             <div>
                               <h4 className="text-sm text-gray-400">{t('totalClosedTrades')}</h4>
                               <p className="text-lg font-bold text-white">
                                   {stat.totalClosedTrades}
                               </p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{t('allPortfolios')}</h2>
                 <button
                    onClick={onAddNewPortfolio}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                    </svg>
                    <span>{t('addNewPortfolio').replace('+ ', '')}</span>
                </button>
            </div>

            <div>
                {portfolios.length === 0 ? (
                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center py-16 px-6">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-full">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375a.375.375 0 0 1 .375.375v1.5a.375.375 0 0 1-.375.375H9a.375.375 0 0 1-.375-.375v-1.5A.375.375 0 0 1 9 6.75Zm.75 4.5h4.875a.375.375 0 0 1 .375.375v1.5a.375.375 0 0 1-.375.375H9.75a.375.375 0 0 1-.375-.375v-1.5a.375.375 0 0 1 .375-.375Zm0 4.5h4.875a.375.375 0 0 1 .375.375v1.5a.375.375 0 0 1-.375.375H9.75a.375.375 0 0 1-.375-.375v-1.5a.375.375 0 0 1 .375-.375Z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('noPortfolios')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6 max-w-md mx-auto">{t('noPortfoliosMessage')}</p>
                         <button
                            onClick={onAddNewPortfolio}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-md transition duration-300 ease-in-out transform hover:scale-105 inline-flex items-center gap-2"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                            </svg>
                            <span>{t('addNewPortfolio').replace('+ ', '')}</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {portfolios.map(p => {
                            const currentCapital = calculateCurrentCapital(p);
                            const netPnl = currentCapital - p.initialCapital;
                            const stats = calculatePortfolioStats(p);
                            const isProfit = netPnl >= 0;
                            
                            return (
                                <div 
                                    key={p.id} 
                                    className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-cyan-500/20 hover:scale-[1.02] flex flex-col border-t-4 ${isProfit ? 'border-green-500' : 'border-red-500'}`}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPortfolioToDelete(p);
                                        }}
                                        className="absolute top-2 right-2 rtl:right-auto rtl:left-2 p-2 rounded-full text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-colors z-10"
                                        aria-label={t('deletePortfolio')}
                                        title={t('deletePortfolio')}
                                    >
                                        <TrashIcon />
                                    </button>
                                    <div className="p-6 flex-grow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 truncate">{p.portfolioName}</h3>
                                                <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{p.currency}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('currentCapital')}</span>
                                                <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{formatCurrency(currentCapital, p.currency)}</span>
                                            </div>
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('netProfitLoss')}</span>
                                                <span className={`font-bold text-lg ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                                                    {netPnl >= 0 ? '+' : ''}{formatCurrency(netPnl, p.currency)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('winRate')}</span>
                                                <span className="font-bold text-lg text-gray-800 dark:text-gray-200">{stats.winRate.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 mt-auto">
                                            <button
                                            onClick={() => onSelectPortfolio(p.id)}
                                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                                        >
                                            {t('managePortfolio')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {portfolioToDelete && (
                <ConfirmModal
                    isOpen={!!portfolioToDelete}
                    onClose={() => setPortfolioToDelete(null)}
                    onConfirm={() => {
                        onDeletePortfolio(portfolioToDelete.id);
                        setPortfolioToDelete(null);
                    }}
                    title={t('confirmDeletePortfolioTitle')}
                    message={<p dangerouslySetInnerHTML={{ __html: t('confirmDeletePortfolioMessage').replace('{portfolioName}', `<strong>${portfolioToDelete.portfolioName}</strong>`) }} />}
                    confirmText={t('confirmDeleteButton')}
                    t={t}
                />
            )}
        </div>
    );
}

const LoginPage: React.FC<{ 
    auth: Auth; 
    t: (key: string) => string;
    language: Language;
    setLanguage: (lang: Language) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    onLoginSuccess: (uid: string) => Promise<void>;
}> = ({ auth, t, language, setLanguage, theme, setTheme, onLoginSuccess }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            const userCredential = await signInWithPopup(auth, provider);
            if (userCredential.user) {
                await onLoginSuccess(userCredential.user.uid);
            }
        } catch (error: any) {
            setError(getFirebaseAuthErrorMessage(error, t));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailSignUp = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isLoading) return;

        if (!email || !password || !confirmPassword) {
            setError(t('signUpErrorEmptyFields'));
            return;
        }
        if (password !== confirmPassword) {
            setError(t('signUpErrorPasswordMismatch'));
            return;
        }
        
        setIsLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                await onLoginSuccess(userCredential.user.uid);
            }
        } catch (error: any) {
            setError(getFirebaseAuthErrorMessage(error, t));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEmailSignIn = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isLoading) return;

        if (!email || !password) {
            setError(t('loginErrorEmptyFields'));
            return;
        }
        
        setIsLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential.user) {
                await onLoginSuccess(userCredential.user.uid);
            }
        } catch (error: any) {
            setError(getFirebaseAuthErrorMessage(error, t));
        } finally {
            setIsLoading(false);
        }
    };
    
    const toggleView = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setIsLoginView(!isLoginView);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 animate-fade-in">
            <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 flex items-center gap-2">
                 <button
                    onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                    className="p-2 w-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                    aria-label={language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
                >
                    {language === 'ar' ? 'EN' : 'AR'}
                </button>
                <ThemeToggleButton theme={theme} setTheme={setTheme} />
            </div>

            <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl shadow-cyan-500/10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{t('appName')}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{t('appDescription')}</p>
                </div>

                <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
                    {isLoginView ? t('loginTitle') : t('signUpTitle')}
                </h2>

                <form onSubmit={isLoginView ? handleEmailSignIn : handleEmailSignUp} className="space-y-6">
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('emailLabel')}</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                            placeholder={t('emailPlaceholder')}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('passwordLabel')}</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                            placeholder={t('passwordPlaceholder')}
                            required
                            autoComplete={isLoginView ? "current-password" : "new-password"}
                        />
                    </div>
                     {!isLoginView && (
                        <div>
                            <label htmlFor="confirmPassword"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('confirmPasswordLabel')}</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                                placeholder={t('passwordPlaceholder')}
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    {error && <p className="text-red-500 dark:text-red-400 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                         {isLoading && (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoginView ? t('signInButton') : t('signUpButton')}
                    </button>
                </form>

                 <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('loginOrSeparator')}</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-300 flex items-center justify-center disabled:opacity-50"
                >
                    <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C327 113.2 290.5 96 248 96c-88.8 0-160.1 71.3-160.1 160s71.3 160 160.1 160c94.4 0 150.3-64.2 155.6-96.6H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path>
                    </svg>
                    {isLoginView ? t('loginWithGoogle') : t('signUpWithGoogle')}
                </button>
                 <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {isLoginView ? t('switchToSignUp') : t('switchToSignIn')}
                    <a href="#" onClick={toggleView} className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300">
                        {' '}{isLoginView ? t('signUpLink') : t('signInLink')}
                    </a>
                </p>
            </div>
        </div>
    );
};

type ProfileFormData = Omit<Profile, 'photoURL'>;

const ProfilePage: React.FC<{
    user: User;
    profile: Profile | null;
    onUpdate: (updates: ProfileFormData, newImageFile: File | null) => Promise<void>;
    onBack: () => void;
    t: (key: string) => string;
    language: Language;
}> = ({ user, profile, onUpdate, onBack, t, language }) => {
    const [formData, setFormData] = useState<ProfileFormData>({
        displayName: '', address: '', phoneNumber: '', country: '', city: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Definitive Fix: This useEffect hook correctly synchronizes the form's internal state
    // with the profile data that is loaded asynchronously from Firestore.
    // This ensures the form is always populated with the latest data, fixing the bug
    // where the form would be empty if the data arrived after the initial render.
    useEffect(() => {
        if (profile) {
            setFormData({
                displayName: profile.displayName || '',
                address: profile.address || '',
                phoneNumber: profile.phoneNumber || '',
                country: profile.country || '',
                city: profile.city || '',
            });
            setImagePreview(profile.photoURL || null);
        }
    }, [profile]);


    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const countries = useMemo(() => Object.keys(countryCityData[language]), [language]);
    const cities = useMemo(() => formData.country ? countryCityData[language][formData.country as keyof typeof countryCityData[Language]] || [] : [], [formData.country, language]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountry = e.target.value;
        setFormData(prev => ({
            ...prev,
            country: newCountry,
            city: '', // Reset city when country changes
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onUpdate(formData, imageFile);
            alert(t('profileUpdateSuccess'));
        } catch(error) {
            console.error("Failed to update profile", error);
            // The onUpdate function itself will alert the user of specific errors.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl shadow-cyan-500/10 animate-fade-in">
            <h2 className="text-2xl font-bold text-center mb-6 text-cyan-600 dark:text-cyan-400">{t('profilePageTitle')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-full shadow-md"
                            aria-label={t('changeProfilePicture')}
                        >
                           <EditIcon />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/png, image/jpeg, image/gif"
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('displayNameLabel')}</label>
                        <input
                            type="text"
                            id="displayName"
                            value={formData.displayName}
                            onChange={handleFormChange}
                            className="mt-1 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                            placeholder={t('displayNamePlaceholder')}
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('phoneNumberLabel')}</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleFormChange}
                            className="mt-1 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                            placeholder={t('phoneNumberPlaceholder')}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('addressLabel')}</label>
                    <input
                        type="text"
                        id="address"
                        value={formData.address}
                        onChange={handleFormChange}
                        className="mt-1 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                        placeholder={t('addressPlaceholder')}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('countryLabel')}</label>
                        <select
                            id="country"
                            value={formData.country}
                            onChange={handleCountryChange}
                            className="mt-1 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                        >
                            <option value="">{t('selectCountry')}</option>
                            {countries.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('cityLabel')}</label>
                        <select
                            id="city"
                            value={formData.city}
                            onChange={handleFormChange}
                            className="mt-1 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                            disabled={!formData.country}
                        >
                            <option value="">{t('selectCity')}</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('profileEmailNotEditable')}</label>
                    <input
                        type="email"
                        id="email"
                        value={user.email || ''}
                        disabled
                        className="mt-1 w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-md p-3 cursor-not-allowed"
                    />
                </div>

                <div className="flex items-center gap-4 pt-4">
                     <button
                        type="button"
                        onClick={onBack}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-md transition"
                    >
                        {t('back')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? t('saving') : t('saveProfile')}
                    </button>
                </div>
            </form>
        </div>
    );
};


const UserMenu: React.FC<{
    profile: Profile | null;
    portfolios: Portfolio[];
    onProfileClick: () => void;
    onPortfolioClick: (id: string) => void;
    onExpensesClick: () => void;
    onLogout: () => void;
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}> = ({ profile, portfolios, onProfileClick, onPortfolioClick, onExpensesClick, onLogout, language, setLanguage, t }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initials = profile?.displayName ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : (profile?.displayName || '?');

    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{initials}</span>
                    )}
                </div>
                 <div className="hidden sm:block text-left rtl:text-right">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-28 block">{profile?.displayName || '...'}</span>
                </div>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 w-60 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 py-1">
                    <button onClick={() => { onProfileClick(); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{t('profile')}</button>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    
                     <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{t('myPortfolios')}</div>
                     <div className="max-h-32 overflow-y-auto">
                        {portfolios.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => { onPortfolioClick(p.id); setIsOpen(false); }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                                title={p.portfolioName}
                            >
                                {p.portfolioName}
                            </button>
                        ))}
                        {portfolios.length === 0 && <span className="block px-4 py-2 text-sm text-gray-500">{t('noPortfolios')}</span>}
                     </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button onClick={() => { onExpensesClick(); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">{t('expenses')}</button>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <LanguageToggleButton language={language} setLanguage={setLanguage} t={t} />

                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                     <button 
                        onClick={() => { onLogout(); setIsOpen(false); }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <LogoutIcon />
                        <span>{t('logoutButton')}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

const ExpensesPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl shadow-cyan-500/10 animate-fade-in text-center">
            <h2 className="text-2xl font-bold mb-4">Expenses</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">This section is under construction.</p>
            <button onClick={onBack} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition">
                Back
            </button>
        </div>
    );
};


function App() {
  const defaultLang = navigator.language.startsWith('ar') ? 'ar' : 'en';
  const [language, setLanguage] = useLocalStorage<Language>('language', defaultLang);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true); // Always start in a loading state
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'profile' | 'expenses'>('home');
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);

  const t = useCallback((key: string): string => {
    const translation = translations[language][key] || translations['en'][key];
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translation;
  }, [language]);

  const handleLoginSuccess = async (uid: string) => {
    const localSessionId = crypto.randomUUID();
    localStorage.setItem('localSessionId', localSessionId);
    try {
        await setDoc(doc(db, "userSessions", uid), { sessionId: localSessionId }, { merge: true });
    } catch (error) {
        console.error("Failed to set user session:", error);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  // Effect 1: Manages auth state changes. Runs only once to set up the listener.
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);
    return () => unsubscribeAuth();
  }, []);

  // Effect 2: Manages all data and session logic based on the user's auth state.
  useEffect(() => {
    if (user) {
      let unsubscribeData: Unsubscribe | undefined;
      let unsubscribeSession: Unsubscribe | undefined;

      // 1. Session listener for multi-device logout
      const sessionDocRef = doc(db, "userSessions", user.uid);
      unsubscribeSession = onSnapshot(sessionDocRef, (docSnapshot) => {
        const localSessionId = localStorage.getItem('localSessionId');
        if (docSnapshot.exists() && localSessionId) {
          const firestoreSessionId = docSnapshot.data().sessionId;
          if (firestoreSessionId !== localSessionId) {
            alert(t('multiDeviceLogout'));
            signOut(auth).catch(error => console.error("Error signing out:", error));
          }
        }
      }, (error) => {
        console.error("Error listening to session changes:", error);
      });

      // 2. Data listener for portfolios and profile with self-healing logic
      const userDocRef = doc(db, 'userData', user.uid);
      unsubscribeData = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Ensure portfolios is always an array
          setPortfolios(data.portfolios && Array.isArray(data.portfolios) ? data.portfolios : []);

          // Robustly handle profile data
          const profileData = data.profile;
          const isValidProfile = profileData && typeof profileData === 'object' && !Array.isArray(profileData);

          if (isValidProfile) {
            setProfile(profileData as Profile);
          } else {
            // If profile is missing or malformed, create a default one and merge it back.
            // This prevents app crashes and self-heals corrupted data.
            console.warn("User profile is missing or malformed. Resetting to default.");
            const defaultDisplayName = user.email?.split('@')[0] || 'User';
            const defaultProfile: Profile = {
              displayName: defaultDisplayName,
              photoURL: '', address: '', country: '', city: '', phoneNumber: ''
            };
            setProfile(defaultProfile); // Update local state immediately
            try {
              await setDoc(userDocRef, { profile: defaultProfile }, { merge: true });
            } catch (error) {
              console.error("Error resetting user profile in Firestore:", error);
            }
          }
        } else {
          // If user doc doesn't exist, create it with defaults.
          try {
            const defaultDisplayName = user.email?.split('@')[0] || 'User';
            const defaultProfile: Profile = {
              displayName: defaultDisplayName,
              photoURL: '', address: '', country: '', city: '', phoneNumber: ''
            };
            await setDoc(userDocRef, { profile: defaultProfile, portfolios: [] });
            // The listener will fire again automatically with the new data.
          } catch (error) {
            console.error("Error creating user document:", error);
            await signOut(auth);
          }
        }
        setLoading(false);
      }, async (error) => {
        console.error("Error listening to user data:", error);
        await signOut(auth);
        setLoading(false);
      });
      
      return () => {
        if (unsubscribeData) unsubscribeData();
        if (unsubscribeSession) unsubscribeSession();
      };
    } else {
      // User is not logged in or has logged out.
      setProfile(null);
      setPortfolios([]);
      setLoading(false);
    }
  }, [user, t]);


  const activePortfolio = useMemo(() => {
    return portfolios.find(p => p.id === activePortfolioId) || null;
  }, [portfolios, activePortfolioId]);
  
  const formatCurrency = useCallback((amount: number, currencyCode: string = activePortfolio?.currency || 'USD') => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return formatCurrencyUtil(amount, locale, currencyCode);
  }, [language, activePortfolio]);

  const savePortfoliosToFirestore = (newPortfolios: Portfolio[]) => {
      if (user) {
          setDoc(doc(db, 'userData', user.uid), { portfolios: newPortfolios }, { merge: true }).catch(error => {
              console.error("Error saving portfolios:", error);
          });
      }
  };

   const handleProfileUpdate = async (updates: ProfileFormData, newImageFile: File | null) => {
        if (!user) return;

        let newPhotoURL = profile?.photoURL || '';

        if (newImageFile) {
            const storageRef = ref(storage, `profile_images/${user.uid}`);
            try {
                const snapshot = await uploadBytes(storageRef, newImageFile);
                newPhotoURL = await getDownloadURL(snapshot.ref);
            } catch (error) {
                console.error("Error uploading profile image:", error);
                alert(t('profileUpdateImageError'));
                throw error; // Propagate error to the caller
            }
        }
        
        const completeProfile: Profile = {
            ...updates,
            photoURL: newPhotoURL,
        };
        
        const userDocRef = doc(db, 'userData', user.uid);
        
        try {
            await setDoc(userDocRef, { profile: completeProfile }, { merge: true });
            setView('home');
            setActivePortfolioId(null);
        } catch (error) {
            console.error("Error saving profile to Firestore:", error);
            alert(t('profileUpdateSaveError'));
            throw error; // Propagate error to the caller
        }
    };


  const handleSetup = (portfolioName: string, initialCapital: number, targetAmount: number, currency: string) => {
    const newPortfolio: Portfolio = {
      id: Date.now().toString(),
      portfolioName,
      initialCapital,
      targets: [{ id: 'default_target', name: t('initialTargetName'), amount: targetAmount }],
      trades: [],
      currency,
    };
    const updatedPortfolios = [...portfolios, newPortfolio];
    setPortfolios(updatedPortfolios);
    savePortfoliosToFirestore(updatedPortfolios);
    setActivePortfolioId(newPortfolio.id);
    setIsAddingPortfolio(false);
  };
  
  const handleUpdatePortfolios = (updatedPortfolio: Portfolio) => {
      const updatedPortfolios = portfolios.map(p => p.id === updatedPortfolio.id ? updatedPortfolio : p);
      setPortfolios(updatedPortfolios);
      savePortfoliosToFirestore(updatedPortfolios);
  };
  
  const handleAddNewPortfolio = () => {
    setIsAddingPortfolio(true);
    setActivePortfolioId(null);
    setView('home');
  };

  const handleDeletePortfolio = (id: string) => {
      const updatedPortfolios = portfolios.filter(p => p.id !== id);
      setPortfolios(updatedPortfolios);
      savePortfoliosToFirestore(updatedPortfolios);
      if (activePortfolioId === id) {
          setActivePortfolioId(null);
      }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div></div>;
  }
  
  if (!user) {
     return <LoginPage 
        auth={auth} 
        t={t}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        onLoginSuccess={handleLoginSuccess}
     />;
  }

  const goHome = () => {
    setView('home');
    setActivePortfolioId(null);
    setIsAddingPortfolio(false);
  };

  const handleNavigateToPortfolio = (id: string) => {
    setView('home');
    setActivePortfolioId(id);
    setIsAddingPortfolio(false);
  }
  
  const handleNavigateToExpenses = () => {
      setView('expenses');
      setActivePortfolioId(null);
      setIsAddingPortfolio(false);
  }

  const renderContent = () => {
    switch (view) {
      case 'profile':
        return <ProfilePage user={user} profile={profile} onUpdate={handleProfileUpdate} onBack={goHome} t={t} language={language} />;
      case 'expenses':
          return <ExpensesPage onBack={goHome} />;
      case 'home':
      default:
        if (isAddingPortfolio || (portfolios.length === 0 && !activePortfolioId)) {
            return <SetupForm onSetup={handleSetup} t={t} onCancel={portfolios.length > 0 ? () => setIsAddingPortfolio(false) : undefined} />;
        }
        
        if (activePortfolio) {
             const closedTrades = activePortfolio.trades.filter(trade => trade.status === 'closed');
            const currentCapital = closedTrades.reduce((acc, trade) => acc + trade.pnl, activePortfolio.initialCapital);
            const historicalAssets = Array.from(new Set(activePortfolio.trades.map(t => t.assetName)));
            
            const handleAddTrade = (tradeData: Omit<Trade, 'id' | 'capitalBeforeTrade' | 'status' | 'pnl' | 'openDate' | 'closeDate'>) => {
              const newTrade: Trade = {
                ...tradeData,
                id: Date.now().toString(),
                status: 'open',
                pnl: 0,
                capitalBeforeTrade: currentCapital,
                openDate: Date.now(),
              };
              const updatedPortfolio = { ...activePortfolio, trades: [...activePortfolio.trades, newTrade] };
              handleUpdatePortfolios(updatedPortfolio);
            };

            const handleCloseTrade = (tradeId: string, finalPnl: number) => {
              const updatedTrades = activePortfolio.trades.map(trade => 
                trade.id === tradeId ? { ...trade, status: 'closed', pnl: finalPnl, closeDate: Date.now() } : trade
              );
              const updatedPortfolio = { ...activePortfolio, trades: updatedTrades };
              handleUpdatePortfolios(updatedPortfolio);

              const closedTrade = updatedTrades.find(t => t.id === tradeId);
              if (closedTrade) {
                const pnlFormatted = formatCurrency(finalPnl);
                let title, body;
                if (finalPnl > 0) {
                  title = t('notificationWinTitle');
                  body = t('notificationWinBody').replace('{assetName}', closedTrade.assetName).replace('{pnl}', pnlFormatted);
                } else if (finalPnl < 0) {
                  title = t('notificationLossTitle');
                  body = t('notificationLossBody').replace('{assetName}', closedTrade.assetName).replace('{pnl}', pnlFormatted);
                } else {
                  title = t('notificationBreakevenTitle');
                  body = t('notificationBreakevenBody').replace('{assetName}', closedTrade.assetName);
                }
                sendNotification(title, { body });
              }
            };
            
            const handleUpdateTrade = (tradeId: string, updates: Partial<Pick<Trade, 'entryPrice' | 'tradeValue' | 'takeProfitPrice' | 'stopLossPrice' | 'notes'>>) => {
                const updatedTrades = activePortfolio.trades.map(trade => {
                    if (trade.id === tradeId) {
                        const updatedTrade = { ...trade, ...updates };
                        // Recalculate TP/SL amounts if prices changed
                        if (updates.entryPrice !== undefined || updates.tradeValue !== undefined || updates.takeProfitPrice !== undefined || updates.stopLossPrice !== undefined) {
                            const entryPrice = updatedTrade.entryPrice;
                            const tradeValue = updatedTrade.tradeValue;
                            const takeProfitPrice = updatedTrade.takeProfitPrice;
                            const stopLossPrice = updatedTrade.stopLossPrice;
                            const numberOfShares = tradeValue / entryPrice;
                            updatedTrade.takeProfit = (takeProfitPrice - entryPrice) * numberOfShares;
                            updatedTrade.stopLoss = (entryPrice - stopLossPrice) * numberOfShares;
                        }
                        return updatedTrade;
                    }
                    return trade;
                });
                handleUpdatePortfolios({ ...activePortfolio, trades: updatedTrades });
            };
            
            const handleDeleteTrade = (tradeId: string) => {
              const updatedTrades = activePortfolio.trades.filter(trade => trade.id !== tradeId);
              const updatedPortfolio = { ...activePortfolio, trades: updatedTrades };
              handleUpdatePortfolios(updatedPortfolio);
            };
            
            const handleDeleteCurrentPortfolio = () => {
                handleDeletePortfolio(activePortfolio.id);
            };

            const handleExportCSV = () => {
              const headers = ['#', t('assetHeader'), t('dateHeader'), `${t('pnlHeader')} (${activePortfolio.currency})`, t('percentageHeader'), t('notesLabel')];
              const rows = closedTrades.map((trade, index) => [
                closedTrades.length - index,
                trade.assetName,
                trade.closeDate ? new Date(trade.closeDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-',
                trade.pnl,
                trade.tradeValue > 0 ? ((trade.pnl / trade.tradeValue) * 100).toFixed(2) : '0.00',
                trade.notes || ''
              ]);
              const csvContent = "data:text/csv;charset=utf-8," 
                + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
              
              const link = document.createElement("a");
              link.setAttribute("href", encodeURI(csvContent));
              link.setAttribute("download", `${activePortfolio.portfolioName}_trades.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            };
            
            const handleUpdateTargets = (newTargets: Target[]) => {
                handleUpdatePortfolios({ ...activePortfolio, targets: newTargets });
            };

            const handleUpdateInitialCapital = (newCapital: number) => {
                handleUpdatePortfolios({ ...activePortfolio, initialCapital: newCapital });
            };

            return (
              <Dashboard
                portfolio={activePortfolio}
                currentCapital={currentCapital}
                closedTrades={closedTrades}
                historicalAssets={historicalAssets}
                onAddTrade={handleAddTrade}
                onCloseTrade={handleCloseTrade}
                onUpdateTrade={handleUpdateTrade}
                onDeleteTrade={handleDeleteTrade}
                onDeletePortfolio={handleDeleteCurrentPortfolio}
                onExportCSV={handleExportCSV}
                onUpdateTargets={handleUpdateTargets}
                onUpdateInitialCapital={handleUpdateInitialCapital}
                onGoHome={goHome}
                t={t}
                language={language}
                formatCurrency={(amount) => formatCurrency(amount, activePortfolio.currency)}
              />
            );
        }

        return (
             <HomePage 
              portfolios={portfolios} 
              onSelectPortfolio={setActivePortfolioId} 
              onAddNewPortfolio={handleAddNewPortfolio}
              onDeletePortfolio={handleDeletePortfolio}
              t={t} 
              language={language} 
              formatCurrency={formatCurrency}
            />
        );
    }
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center cursor-pointer" onClick={goHome}>
                    <h1 className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{t('appName')}</h1>
                </div>
                 <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeToggleButton theme={theme} setTheme={setTheme} />
                    <UserMenu 
                        profile={profile}
                        portfolios={portfolios}
                        onProfileClick={() => { setView('profile'); setActivePortfolioId(null); setIsAddingPortfolio(false); }}
                        onPortfolioClick={handleNavigateToPortfolio}
                        onExpensesClick={handleNavigateToExpenses}
                        onLogout={() => signOut(auth)}
                        language={language}
                        setLanguage={setLanguage}
                        t={t}
                    />
                </div>
            </div>
        </nav>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
       <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
}

export default App;