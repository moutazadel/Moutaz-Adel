import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Portfolio, Trade, Target, UserProfile } from './types';
import SetupForm from './components/SetupForm';
import Dashboard from './components/Dashboard';
import { sendNotification } from './utils/notifications';
import { formatCurrency as formatCurrencyUtil } from './utils/formatters';
import ThemeToggleButton from './components/ThemeToggleButton';
import { EditIcon, TrashIcon, UserCircleIcon } from './components/Icons';
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
    assetNamePlaceholder: 'ابحث عن سهم EGX...',
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
    previouslyTradedStock: 'سهم متداول سابقاً',
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
    // Profile Page
    profile: 'الملف الشخصي',
    profilePageTitle: 'تعديل الملف الشخصي',
    displayNameLabel: 'الاسم المعروض',
    phoneNumberLabel: 'رقم الهاتف',
    changeProfilePicture: 'تغيير الصورة',
    saveProfileChanges: 'حفظ التغييرات',
    backToHome: 'العودة للرئيسية',
    phonePlaceholder: 'مثال: 01012345678',
    namePlaceholder: 'اسمك الكامل',
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
    assetNamePlaceholder: 'Search for an EGX stock...',
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
    previouslyTradedStock: 'Previously Traded Stock',
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
    // Profile Page
    profile: 'Profile',
    profilePageTitle: 'Edit Profile',
    displayNameLabel: 'Display Name',
    phoneNumberLabel: 'Phone Number',
    changeProfilePicture: 'Change Picture',
    saveProfileChanges: 'Save Changes',
    backToHome: 'Back to Home',
    phonePlaceholder: 'e.g., 01012345678',
    namePlaceholder: 'Your full name',
};

const translations = {
    ar: arTranslations,
    en: enTranslations,
};

type Language = 'ar' | 'en';

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
            className="p-2 w-12 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 font-bold"
            aria-label={language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
        >
            {language === 'ar' ? 'EN' : 'AR'}
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
}> = ({ auth, t, language, setLanguage, theme, setTheme }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            setError(getFirebaseAuthErrorMessage(error, t));
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim() && password.trim()) {
            try {
                setError('');
                await signInWithEmailAndPassword(auth, email, password);
            } catch(error) {
                setError(getFirebaseAuthErrorMessage(error, t));
            }
        } else {
            setError(t('loginErrorEmptyFields'));
        }
    };
    
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError(t('signUpErrorEmptyFields'));
            return;
        }
        if (password !== confirmPassword) {
            setError(t('signUpErrorPasswordMismatch'));
            return;
        }
        try {
            setError('');
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError(getFirebaseAuthErrorMessage(error, t));
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
    };

    const toggleView = () => {
        resetForm();
        setIsLoginView(!isLoginView);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 relative">
             <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 flex items-center gap-2">
                <ThemeToggleButton theme={theme} setTheme={setTheme} />
                <LanguageToggleButton language={language} setLanguage={setLanguage} t={t} />
            </div>
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                     <h1 className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">{t('appName')}</h1>
                     <p className="text-gray-600 dark:text-gray-400 mt-2">{t('appDescription')}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl shadow-cyan-500/10 animate-fade-in">
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">{isLoginView ? t('loginTitle') : t('signUpTitle')}</h2>
                    
                    {isLoginView ? (
                        <>
                            <div className="space-y-4">
                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-md transition duration-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
                                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
                                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.582-3.443-11.115-8.102l-6.571 4.819C9.656 39.663 16.318 44 24 44z"></path>
                                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.16-4.082 5.571l6.19 5.238C42.012 36.49 44 30.654 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
                                    </svg>
                                    <span>{t('loginWithGoogle')}</span>
                                </button>
                                <div className="relative my-2">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">{t('loginOrSeparator')}</span>
                                    </div>
                                </div>
                                <form onSubmit={handleEmailLogin} className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('emailLabel')}</label>
                                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('emailPlaceholder')} />
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('passwordLabel')}</label>
                                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('passwordPlaceholder')} />
                                    </div>
                                    {error && <p className="text-red-500 dark:text-red-400 text-sm text-center pt-2">{error}</p>}
                                    <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 !mt-6">
                                        {t('signInButton')}
                                    </button>
                                </form>
                            </div>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                                {t('switchToSignUp')}{' '}
                                <button onClick={toggleView} className="font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300">
                                    {t('signUpLink')}
                                </button>
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-md transition duration-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
                                        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
                                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.582-3.443-11.115-8.102l-6.571 4.819C9.656 39.663 16.318 44 24 44z"></path>
                                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.16-4.082 5.571l6.19 5.238C42.012 36.49 44 30.654 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
                                    </svg>
                                    <span>{t('signUpWithGoogle')}</span>
                                </button>
                                <div className="relative my-2">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white dark:bg-gray-800 px-2 text-sm text-gray-500 dark:text-gray-400">{t('loginOrSeparator')}</span>
                                    </div>
                                </div>
                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div>
                                        <label htmlFor="email-signup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('emailLabel')}</label>
                                        <input type="email" id="email-signup" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('emailPlaceholder')} required />
                                    </div>
                                    <div>
                                        <label htmlFor="password-signup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('passwordLabel')}</label>
                                        <input type="password" id="password-signup" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('passwordPlaceholder')} required />
                                    </div>
                                    <div>
                                        <label htmlFor="confirm-password-signup" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('confirmPasswordLabel')}</label>
                                        <input type="password" id="confirm-password-signup" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition" placeholder={t('passwordPlaceholder')} required />
                                    </div>
                                    {error && <p className="text-red-500 dark:text-red-400 text-sm text-center pt-2">{error}</p>}
                                    <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 !mt-6">
                                        {t('signUpButton')}
                                    </button>
                                </form>
                            </div>
                            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
                                {t('switchToSignIn')}{' '}
                                <button onClick={toggleView} className="font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300">
                                    {t('signInLink')}
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProfilePage: React.FC<{
    user: User;
    profile: UserProfile;
    onSaveProfile: (profile: UserProfile) => void;
    onGoHome: () => void;
    t: (key: string) => string;
}> = ({ user, profile, onSaveProfile, onGoHome, t }) => {
    const [displayName, setDisplayName] = useState(profile.displayName || user.displayName || '');
    const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber || '');
    const [photoFile, setPhotoFile] = useState<string | null>(profile.photoURL || user.photoURL || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoFile(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSaveProfile({
            displayName,
            phoneNumber,
            photoURL: photoFile || '',
        });
        onGoHome(); // Navigate back after saving
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl shadow-cyan-500/10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{t('profilePageTitle')}</h2>
                <button onClick={onGoHome} className="text-sm text-gray-600 dark:text-gray-400 hover:text-cyan-500">{t('goHome')}</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-32 h-32">
                        {photoFile ? (
                            <img src={photoFile} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 dark:border-gray-600" />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 flex items-center justify-center">
                                <UserCircleIcon />
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/png, image/jpeg"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 bg-cyan-600 hover:bg-cyan-700 text-white p-2 rounded-full shadow-md"
                            aria-label={t('changeProfilePicture')}
                            title={t('changeProfilePicture')}
                        >
                            <EditIcon />
                        </button>
                    </div>
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                    >
                        {t('changeProfilePicture')}
                    </button>
                </div>

                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('displayNameLabel')}
                    </label>
                    <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                        placeholder={t('namePlaceholder')}
                    />
                </div>

                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('phoneNumberLabel')}
                    </label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-3 focus:ring-2 focus:ring-cyan-500 outline-none transition"
                        placeholder={t('phonePlaceholder')}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                     <button
                        type="button"
                        onClick={onGoHome}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-md transition"
                    >
                        {t('saveProfileChanges')}
                    </button>
                </div>
            </form>
        </div>
    );
};


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const userSpecificKey = (baseKey: string) => user ? `${baseKey}_${user.uid}` : baseKey;

  const [portfolios, setPortfolios] = useLocalStorage<Portfolio[]>(userSpecificKey('tradingPortfolios'), []);
  const [activePortfolioId, setActivePortfolioId] = useLocalStorage<string | null>(userSpecificKey('activePortfolioId'), null);
  const [view, setView] = useLocalStorage<'home' | 'dashboard' | 'setup' | 'profile'>(userSpecificKey('appView'), 'home');
  
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
  const [language, setLanguage] = useLocalStorage<Language>('language', navigator.language.startsWith('ar') ? 'ar' : 'en');
  const [isEditPortfolioNameModalOpen, setIsEditPortfolioNameModalOpen] = useState(false);
  
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>(userSpecificKey('userProfile'), {
    displayName: '',
    phoneNumber: '',
    photoURL: '',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            const key = `userProfile_${currentUser.uid}`;
            try {
                const storedProfileRaw = localStorage.getItem(key);
                const storedProfile = storedProfileRaw ? JSON.parse(storedProfileRaw) : null;
                // If no profile is stored, or if it's stored but has no name (initial state), then populate from Auth provider.
                if (!storedProfile || !storedProfile.displayName) { 
                    setUserProfile({
                        displayName: currentUser.displayName || '',
                        phoneNumber: currentUser.phoneNumber || '',
                        photoURL: currentUser.photoURL || '',
                    });
                }
            } catch(e) {
                // Handle potential JSON parsing error if data is corrupt
                 setUserProfile({
                    displayName: currentUser.displayName || '',
                    phoneNumber: currentUser.phoneNumber || '',
                    photoURL: currentUser.photoURL || '',
                });
            }
        }
        setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []); // Intentionally empty to run once.

  const activePortfolio = useMemo(() => {
      return portfolios.find(p => p.id === activePortfolioId) || null;
  }, [portfolios, activePortfolioId]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const formatCurrency = (amount: number, currency: string) => {
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    return formatCurrencyUtil(amount, locale, currency);
  };
   
  useEffect(() => {
    // One-time migration from old single-portfolio format for a logged-in user
    if (user) {
        const userPortfoliosKey = `tradingPortfolios_${user.uid}`;
        const userPortfoliosRaw = localStorage.getItem(userPortfoliosKey);
        const oldPortfolioRaw = localStorage.getItem('tradingPortfolio');

        if (oldPortfolioRaw && (!userPortfoliosRaw || JSON.parse(userPortfoliosRaw).length === 0)) {
            console.log("Migrating legacy portfolio for user:", user.uid);
            try {
                const oldPortfolio = JSON.parse(oldPortfolioRaw);
                if (oldPortfolio.initialCapital > 0) {
                     const newPortfolio: Portfolio = {
                        id: Date.now().toString(),
                        portfolioName: oldPortfolio.portfolioName || t('myFirstPortfolio'),
                        initialCapital: oldPortfolio.initialCapital,
                        currency: oldPortfolio.currency || 'USD',
                        trades: oldPortfolio.trades || [],
                        targets: oldPortfolio.targets || (oldPortfolio.target ? [{ id: 'default', name: t('initialTargetName'), amount: oldPortfolio.target }] : [])
                    };
                    setPortfolios([newPortfolio]);
                    localStorage.removeItem('tradingPortfolio');
                }
            } catch (e) {
                console.error("Failed to migrate old portfolio data:", e);
                localStorage.removeItem('tradingPortfolio');
            }
        }
    }
  }, [user, setPortfolios, t]);

  useEffect(() => {
    document.title = activePortfolio ? activePortfolio.portfolioName : t('appName');
  }, [activePortfolio, t]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.style.fontFamily = language === 'en' ? 'system-ui, sans-serif' : "'Cairo', sans-serif";
  }, [theme, language]);

  const currentCapital = useMemo(() => {
    if (!activePortfolio) return 0;
    return calculateCurrentCapital(activePortfolio);
  }, [activePortfolio]);
  
  const historicalAssets = useMemo(() => {
    if (!activePortfolio) return [];
    const commonSymbols = ['BTC', 'ETH', 'AAPL', 'GOOGL', 'TSLA', 'AMZN', 'NVDA'];
    const tradeAssets = activePortfolio.trades.map(trade => trade.assetName);
    return [...new Set([...commonSymbols, ...tradeAssets])];
  }, [activePortfolio]);

  const handleSetup = (portfolioName: string, initialCapital: number, targetAmount: number, currency: string) => {
    const firstTarget: Target = {
      id: Date.now().toString(),
      name: t('initialTargetName'),
      amount: targetAmount,
    };
    const newPortfolio: Portfolio = {
      id: Date.now().toString(),
      portfolioName,
      initialCapital,
      targets: [firstTarget],
      trades: [],
      currency
    };
    const newPortfolios = [...portfolios, newPortfolio];
    setPortfolios(newPortfolios);
    // Go back to home screen to show the new portfolio in the list
    setView('home');
  };
  
  const updateActivePortfolio = (updater: (portfolio: Portfolio) => Portfolio) => {
      setPortfolios(prev => prev.map(p => p.id === activePortfolioId ? updater(p) : p));
  };

  const handleAddTrade = (tradeData: Omit<Trade, 'id' | 'capitalBeforeTrade' | 'status' | 'pnl' | 'openDate' | 'closeDate'>) => {
    updateActivePortfolio(p => {
        const newTrade: Trade = {
            ...tradeData,
            id: Date.now().toString(),
            capitalBeforeTrade: calculateCurrentCapital(p),
            status: 'open',
            pnl: 0,
            openDate: Date.now(),
        };
        return { ...p, trades: [...p.trades, newTrade] };
    });
  };
  
  const handleCloseTrade = (tradeId: string, finalPnl: number) => {
    let tradeToClose: Trade | undefined;
    updateActivePortfolio(p => {
        const updatedTrades = p.trades.map(trade => {
            if (trade.id === tradeId) {
                tradeToClose = trade;
                // Fix: Explicitly type the returned object as Trade to satisfy TypeScript.
                // The compiler was incorrectly inferring the `status` property as `string`
                // instead of the more specific literal type `'closed'`.
                const updatedTrade: Trade = { ...trade, status: 'closed', pnl: finalPnl, closeDate: Date.now() };
                return updatedTrade;
            }
            return trade;
        });
        return { ...p, trades: updatedTrades };
    });

    if (tradeToClose && activePortfolio) {
        const formattedPnl = formatCurrency(finalPnl, activePortfolio.currency);
        if (finalPnl > 0) {
            sendNotification(t('notificationWinTitle'), { body: t('notificationWinBody').replace('{assetName}', tradeToClose.assetName).replace('{pnl}', formattedPnl) });
        } else if (finalPnl < 0) {
            sendNotification(t('notificationLossTitle'), { body: t('notificationLossBody').replace('{assetName}', tradeToClose.assetName).replace('{pnl}', formattedPnl) });
        } else {
             sendNotification(t('notificationBreakevenTitle'), { body: t('notificationBreakevenBody').replace('{assetName}', tradeToClose.assetName) });
        }
    }
  };

  const handleUpdateTrade = (tradeId: string, updates: Partial<Pick<Trade, 'entryPrice' | 'tradeValue' | 'takeProfitPrice' | 'stopLossPrice' | 'notes'>>) => {
    updateActivePortfolio(p => ({
        ...p,
        trades: p.trades.map(trade => {
            if (trade.id === tradeId && trade.status === 'open') {
                const updatedTrade = { ...trade, ...updates };
                const { entryPrice, tradeValue, takeProfitPrice, stopLossPrice } = updatedTrade;
                if(entryPrice > 0 && tradeValue > 0 && takeProfitPrice > 0 && stopLossPrice > 0) {
                    const numberOfShares = tradeValue / entryPrice;
                    updatedTrade.takeProfit = (takeProfitPrice - entryPrice) * numberOfShares;
                    updatedTrade.stopLoss = (entryPrice - stopLossPrice) * numberOfShares;
                }
                return updatedTrade;
            }
            return trade;
        }),
    }));
  };

  const handleDeleteTrade = (tradeId: string) => {
    updateActivePortfolio(p => ({ ...p, trades: p.trades.filter(trade => trade.id !== tradeId) }));
  };

  const handleUpdateInitialCapital = (newCapital: number) => {
    updateActivePortfolio(p => ({ ...p, initialCapital: newCapital }));
  };

  const handleUpdateTargets = (newTargets: Target[]) => {
    updateActivePortfolio(p => ({ ...p, targets: newTargets.sort((a, b) => a.amount - b.amount) }));
  };

  const handleUpdatePortfolioName = (newName: string) => {
    updateActivePortfolio(p => ({ ...p, portfolioName: newName }));
  };

  const handleDeletePortfolio = () => {
    if (!activePortfolioId) return;
    setPortfolios(prev => prev.filter(p => p.id !== activePortfolioId));
    setActivePortfolioId(null);
    setView('home');
  };

  const handleDeletePortfolioById = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
    if (activePortfolioId === id) {
        setActivePortfolioId(null);
        setView('home');
    }
  };

  const handleExportCSV = () => {
    if (!activePortfolio) return;
    const headers = ["ID", "Asset Name", "Status", "Open Date", "Close Date", "Entry Price", "Trade Value", "Number of Shares", "Take Profit Price", "Stop Loss Price", "Final PnL", "PnL Percentage", "Notes"];
    const rows = activePortfolio.trades.map(trade => {
      const numberOfShares = trade.entryPrice > 0 ? trade.tradeValue / trade.entryPrice : 0;
      const pnlPercentage = (trade.status === 'closed' && trade.capitalBeforeTrade > 0) ? (trade.pnl / trade.capitalBeforeTrade) * 100 : 0;
      return [trade.id, trade.assetName, trade.status, trade.openDate ? new Date(trade.openDate).toISOString() : 'N/A', trade.closeDate ? new Date(trade.closeDate).toISOString() : 'N/A', trade.entryPrice, trade.tradeValue, numberOfShares.toFixed(4), trade.takeProfitPrice, trade.stopLossPrice, trade.status === 'closed' ? trade.pnl : 0, `${pnlPercentage.toFixed(2)}%`, `"${(trade.notes || '').replace(/"/g, '""')}"`].join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activePortfolio.portfolioName}_trades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSelectPortfolio = (id: string) => {
      setActivePortfolioId(id);
      setView('dashboard');
  };
  
  const handleGoHome = () => {
      setActivePortfolioId(null);
      setView('home');
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        setActivePortfolioId(null);
        setView('home');
    } catch (error) {
        console.error("Logout error:", error);
    }
  };
  
  const handleSaveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const renderContent = () => {
    switch (view) {
        case 'setup':
            return <SetupForm onSetup={handleSetup} t={t} />;
        case 'dashboard':
            if (activePortfolio) {
                return (
                    <Dashboard
                        portfolio={activePortfolio}
                        currentCapital={currentCapital}
                        closedTrades={activePortfolio.trades.filter(t => t.status === 'closed')}
                        historicalAssets={historicalAssets}
                        onAddTrade={handleAddTrade}
                        onCloseTrade={handleCloseTrade}
                        onUpdateTrade={handleUpdateTrade}
                        onDeleteTrade={handleDeleteTrade}
                        onDeletePortfolio={handleDeletePortfolio}
                        onExportCSV={handleExportCSV}
                        onUpdateTargets={handleUpdateTargets}
                        onUpdateInitialCapital={handleUpdateInitialCapital}
                        onGoHome={handleGoHome}
                        t={t}
                        language={language}
                        formatCurrency={(amount) => formatCurrency(amount, activePortfolio.currency)}
                    />
                );
            }
            // Fallback if active portfolio is not found
            setView('home');
            return null;
        case 'profile':
            return <ProfilePage 
                        user={user!} 
                        profile={userProfile} 
                        onSaveProfile={handleSaveProfile} 
                        onGoHome={handleGoHome} 
                        t={t} 
                    />;
        case 'home':
        default:
             return <HomePage 
                        portfolios={portfolios}
                        onSelectPortfolio={handleSelectPortfolio}
                        onAddNewPortfolio={() => setView('setup')}
                        onDeletePortfolio={handleDeletePortfolioById}
                        t={t}
                        language={language}
                        formatCurrency={formatCurrency}
                    />
    }
  };
  
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage 
                auth={auth} 
                t={t} 
                language={language} 
                setLanguage={setLanguage}
                theme={theme}
                setTheme={setTheme}
            />;
  }

  const profilePhoto = userProfile?.photoURL || user.photoURL;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-white antialiased transition-colors duration-300">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-bold text-cyan-600 dark:text-cyan-400 break-all">
                {activePortfolio ? activePortfolio.portfolioName : t('appName')}
              </h1>
              {activePortfolio && (
                <button 
                  onClick={() => setIsEditPortfolioNameModalOpen(true)} 
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition" 
                  aria-label={t('editPortfolioNameTitle')}
                  title={t('editPortfolioNameTitle')}
                >
                  <EditIcon />
                </button>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('appDescription')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
             <div 
                className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700/50"
                onClick={() => setView('profile')}
                title={t('profile')}
             >
                {profilePhoto ? (
                    <img src={profilePhoto} alt={userProfile?.displayName || user.displayName || 'User avatar'} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-500 flex items-center justify-center">
                        <UserCircleIcon />
                    </div>
                )}
                <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold">{userProfile?.displayName || user.displayName}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                </div>
             </div>
             <ThemeToggleButton theme={theme} setTheme={setTheme} />
             <LanguageToggleButton language={language} setLanguage={setLanguage} t={t} />
             <button
                onClick={handleLogout}
                className="p-2 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold"
                title={t('logoutButton')}
             >
                 {t('logoutButton')}
             </button>
          </div>
        </header>

        {renderContent()}

        {activePortfolio && (
            <EditPortfolioNameModal
                isOpen={isEditPortfolioNameModalOpen}
                onClose={() => setIsEditPortfolioNameModalOpen(false)}
                currentName={activePortfolio.portfolioName}
                onSave={handleUpdatePortfolioName}
                t={t}
            />
        )}

      </div>
      <footer className="text-center py-4 text-gray-500 dark:text-gray-500 text-sm">
        <p>{t('footer')}</p>
      </footer>
    </div>
  );
};

export default App;
