import { api, todayKey, escapeHtml } from './api.js';
import { localeForLanguage, normalizeLanguage, setDocumentLanguage, translate } from './i18n.js';

const statusEl = document.getElementById('status-message');
const adminPageTitleEl = document.getElementById('admin-page-title');
const adminPageSubtitleEl = document.getElementById('admin-page-subtitle');
const boardSectionEl = document.querySelector('[data-admin-section="board"]');

const peopleTableEl = document.getElementById('people-table');
const choresTableEl = document.getElementById('chores-table');
const boardSummaryEl = document.getElementById('board-summary');
const boardAttentionListEl = document.getElementById('board-attention-list');
const boardCompletedListEl = document.getElementById('board-completed-list');
const boardDateReadableEl = document.getElementById('board-date-readable');
const boardDateWeekEl = document.getElementById('board-date-week');
const weekOwnerTableEl = document.getElementById('week-owner-table');
const adminWeekPlanGridEl = document.getElementById('admin-week-plan-grid');
const overviewSummaryEl = document.getElementById('overview-summary');
const overviewPlanCardsEl = document.getElementById('overview-plan-cards');
const overviewAlertsEl = document.getElementById('overview-alerts');
const overviewWeekOwnerListEl = document.getElementById('overview-week-owner-list');
const statsStartInput = document.getElementById('stats-start');
const statsEndInput = document.getElementById('stats-end');
const statsRangeDaysSelect = document.getElementById('stats-range-days');
const statsTableEl = document.getElementById('stats-table');
const statsHighlightsEl = document.getElementById('stats-highlights');
const statsWeeklyEl = document.getElementById('stats-weekly');

const personForm = document.getElementById('person-form');
const choreForm = document.getElementById('chore-form');
const weekOwnerForm = document.getElementById('week-owner-form');
const personDialogTitleEl = document.getElementById('person-dialog-title');
const personSubmitLabelEl = document.getElementById('person-submit-label');
const choreDialogTitleEl = document.getElementById('chore-dialog-title');
const choreSubmitLabelEl = document.getElementById('chore-submit-label');
const choreRepeatModeInputs = Array.from(choreForm.querySelectorAll('input[name="repeat_mode"]'));
const choreWeekdayInputs = Array.from(choreForm.querySelectorAll('input[name="weekday_mask"]'));
const choreIntervalFieldEl = document.getElementById('chore-interval-field');
const choreWeekdayFieldEl = document.getElementById('chore-weekday-group');
const choreDeadlineToggleEl = choreForm.querySelector('input[name="has_deadline"]');
const choreDeadlineFieldsEl = document.getElementById('chore-deadline-fields');

const weekViewStartInput = document.getElementById('week-view-start');
const weekViewCountSelect = document.getElementById('week-view-count');
const instanceWeekPrevBtn = document.getElementById('instance-week-prev');
const instanceWeekNextBtn = document.getElementById('instance-week-next');
const instanceWeekLabelEl = document.getElementById('instance-week-label');
const instanceWeekStartInput = document.getElementById('instance-week-start');
const weekOwnerWeekInput = document.getElementById('week-owner-week');
const weekOwnerPersonSelect = document.getElementById('week-owner-person');
const removeWeekOwnerBtn = document.getElementById('remove-week-owner');
const weekOwnerPreviewNumberEl = document.getElementById('week-owner-preview-number');
const weekOwnerPreviewRangeEl = document.getElementById('week-owner-preview-range');

const planDateInput = document.getElementById('plan-date');
const planDatePrevBtn = document.getElementById('plan-date-prev');
const planDateNextBtn = document.getElementById('plan-date-next');
const planDatePickerBtn = document.getElementById('plan-date-picker');

const openPersonDialogBtn = document.getElementById('open-person-dialog');
const openChoreDialogBtn = document.getElementById('open-chore-dialog');
const openWeekOwnerDialogBtn = document.getElementById('open-week-owner-dialog');
const openSettingsDialogBtn = document.getElementById('open-settings-dialog');

const personDialog = document.getElementById('person-dialog');
const choreDialog = document.getElementById('chore-dialog');
const weekOwnerDialog = document.getElementById('week-owner-dialog');
const instanceDialog = document.getElementById('instance-dialog');
const settingsDialog = document.getElementById('settings-dialog');
const instanceForm = document.getElementById('instance-form');
const settingsForm = document.getElementById('settings-form');
const settingsGamificationSelectEl = settingsForm?.querySelector('select[name="gamification_mode"]');
const settingsLanguageSelectEl = settingsForm?.querySelector('select[name="language"]');
const instanceDialogTitleEl = document.getElementById('instance-dialog-title');
const instanceDialogSubtitleEl = document.getElementById('instance-dialog-subtitle');
const instancePreviewNameEl = document.getElementById('instance-preview-name');
const instancePreviewDateEl = document.getElementById('instance-preview-date');
const instancePersonSelectEl = document.getElementById('instance-person');
const instanceDeadlineModeEl = document.getElementById('instance-deadline-mode');
const instanceDeadlineRowEl = document.getElementById('instance-deadline-row');
const instanceEditFieldsEl = document.getElementById('instance-edit-fields');
const removeInstanceOverrideBtn = document.getElementById('remove-instance-override');
const instanceDisabledToggleEl = instanceForm?.querySelector('input[name="disabled"]');
const instanceDueTimeInputEl = instanceForm?.querySelector('input[name="due_time"]');
const instanceAlertToggleEl = instanceForm?.querySelector('input[name="alert_enabled"]');

const TEXT = {
  en: {
    appTitle: 'Moradi - Admin',
    sectionOverviewTitle: 'Overview',
    sectionOverviewSubtitle: 'Dashboard view for planning, status, and risks',
    sectionStatsTitle: 'Statistics',
    sectionStatsSubtitle: 'Leaderboard, streaks, and weekly momentum',
    sectionTeamTitle: 'Team Members',
    sectionTeamSubtitle: 'Manage who can be assigned chores',
    sectionChoresTitle: 'Chores',
    sectionChoresSubtitle: 'Manage chore rules, deadlines, and alert behavior',
    sectionScheduleTitle: 'Schedule',
    sectionScheduleSubtitle: 'Manage week owners and per-day chore instances',
    sectionBoardTitle: 'Daily Operations Board',
    sectionBoardSubtitle: 'Track execution for the selected date and clear open risks',
    navOverview: 'Overview',
    navStats: 'Statistics',
    navTeam: 'Team Members',
    navChores: 'Chores',
    navSchedule: 'Schedule',
    navBoard: 'Daily Operations',
    overviewGlanceTitle: 'Today At A Glance',
    overviewGlanceSubtitle: 'Execution status for chores due today',
    overviewTodayTitle: "Today's Chores",
    overviewTodaySubtitle: 'Due now and completion status',
    overviewAlertsTitle: 'Deadline Alerts',
    overviewAlertsSubtitle: 'Recent missed deadlines',
    overviewWeekOwnersTitle: 'Upcoming Week Owners',
    overviewWeekOwnersSubtitle: 'Who owns all chores per week',
    scheduleWeekResponsibilityTitle: 'Week Responsibility View',
    scheduleWeekResponsibilitySubtitle: 'Assign one person to own all chores for that week',
    scheduleWeeklyInstanceTitle: 'Weekly Instance Plan',
    scheduleWeeklyInstanceSubtitle: 'Week board with per-day instance overrides',
    scheduleWeeklyInstanceHint: 'Edit any chore instance to override details for one date only, or disable that single instance.',
    startWeekMonday: 'Start week (Monday)',
    weeksShown: 'Weeks shown',
    weekStartLabel: 'Week start',
    boardDateLabel: 'Date',
    boardSummaryTotal: 'Planned',
    boardSummaryDone: 'Completed',
    boardSummaryOpen: 'Open',
    boardSummaryOverdue: 'Overdue',
    boardSummaryUnassigned: 'Unassigned',
    boardNeedsAttentionTitle: 'Needs Attention',
    boardNeedsAttentionSubtitle: 'Open chores that need action now',
    boardCompletedTitle: 'Completed',
    boardCompletedSubtitle: 'Completed chores for selected date',
    boardNoAttention: 'No open chores for this date.',
    boardNoCompleted: 'No chores completed yet.',
    boardDoneBy: 'Done by {name}',
    boardDoneByAt: 'Done by {name} at {time}',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    openCalendar: 'Open calendar',
    thName: 'Name',
    thEmail: 'Email',
    thPhone: 'Phone',
    thAction: 'Action',
    thSchedule: 'Schedule',
    thDeadline: 'Deadline',
    thAlerts: 'Alerts',
    thActive: 'Active',
    thDate: 'Date',
    thChore: 'Chore',
    thPerson: 'Person',
    thWeekNumber: 'Week #',
    thWeekStart: 'Week Start',
    thRange: 'Range',
    thResponsible: 'Responsible',
    thSource: 'Source',
    thStatus: 'Status',
    thRank: 'Rank',
    thScore: 'Score',
    thOwnDone: 'Own Done',
    thAssigned: 'Assigned',
    thOwnRate: 'Own Rate',
    thOnTime: 'On-Time',
    thStreak: 'Streak',
    thBadges: 'Badges',
    choreNumber: 'Chore #{id}',
    settings: 'Settings',
    settingsDialogTitle: 'Settings',
    settingsDialogSubtitle: 'Configure notification delivery and language.',
    settingsGeneralTitle: 'General',
    settingsWebhookTitle: 'Webhook / SMS',
    settingsSmtpTitle: 'Email (SMTP)',
    languageLabel: 'Language',
    languageEnglish: 'English',
    languageNorwegian: 'Norwegian',
    enableDeadlineAlertsLabel: 'Enable deadline alerts',
    weeklyOwnerReminderLabel: 'Send weekly owner reminder (Monday 08:00)',
    alertWebhookUrlLabel: 'Alert webhook URL',
    smsGatewayUrlLabel: 'SMS API gateway URL',
    smtpServerLabel: 'SMTP server',
    smtpPortLabel: 'Port',
    smtpAccountLabel: 'Account (user)',
    smtpPasswordLabel: 'Password',
    smtpFromLabel: 'From email',
    smtpSecureLabel: 'Secure (SMTPS/TLS)',
    placeholderPersonNameExample: 'e.g. Sarah Jensen',
    placeholderPersonEmail: 'name@company.com',
    placeholderPersonPhone: '+47 ...',
    placeholderChoreName: 'e.g. Empty dishwasher',
    placeholderChoreDescription: 'Short instructions for the team',
    placeholderInstanceName: 'Use only for this day',
    placeholderInstanceDescription: 'Optional one-day note or instruction',
    placeholderUrl: 'https://...',
    placeholderSmtpHost: 'smtp.example.com',
    placeholderSmtpUser: 'account@example.com',
    placeholderSmtpFrom: 'noreply@example.com',
    openIpadView: 'Open iPad view',
    openIphoneView: 'Open iPhone view',
    week: 'Week {week}',
    unassigned: 'Unassigned',
    noDescription: 'No description',
    noSpecificTime: 'No specific time',
    noDeadline: 'No deadline',
    day: 'day(s)',
    weekdaysLabel: 'Weekdays: {days}',
    everyDaysLabel: 'Every {days} day(s)',
    badgeEnabled: 'Enabled',
    badgeDisabled: 'Disabled',
    badgeActive: 'Active',
    badgeInactive: 'Inactive',
    badgeDone: 'Done',
    badgeOverdue: 'Overdue',
    badgeOpen: 'Open',
    badgeInstanceOverride: 'Instance override',
    badgeWeekOwner: 'Week owner',
    sourceUnassigned: 'Unassigned',
    weekStarts: 'Week starts {date}',
    starts: 'Starts {date}',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    save: 'Save',
    cancel: 'Cancel',
    remove: 'Remove',
    edit: 'Edit',
    editTeamMember: 'Edit team member',
    deleteTeamMember: 'Delete team member',
    editChore: 'Edit chore',
    deleteChore: 'Delete chore',
    pauseChore: 'Pause chore',
    activateChore: 'Activate chore',
    changeWeekOwner: 'Change week owner',
    assignWeekOwner: 'Assign week owner',
    undoCompletion: 'Undo completion',
    markChoreDone: 'Mark chore done',
    editInstance: 'Edit instance',
    enableDayInstance: 'Enable this day instance',
    disableDayInstance: 'Disable this day instance',
    disabledForDay: 'Disabled for this day',
    noSummaryAvailable: 'No summary available yet.',
    noChoresToday: 'No chores are scheduled for today.',
    noAlertsTriggered: 'No alerts have been triggered.',
    noWeekOwnersConfigured: 'No week owners configured yet.',
    noPeopleAdded: 'No people added yet.',
    noChoresAdded: 'No chores added yet.',
    noChoresConfigured: 'No chores configured yet.',
    noChoresAvailable: 'No chores available.',
    noChoresOption: 'No chores',
    noPeopleOption: 'No people',
    selectOption: 'Select',
    noWeeksLoaded: 'No weeks loaded. Select a start week to load.',
    noPlanForDate: 'No chores due on selected date.',
    noWeekDataLoaded: 'No week data loaded.',
    noChoresDue: 'No chores due.',
    useScheduledOwner: 'Use scheduled owner',
    overviewTotalChores: 'Total chores',
    overviewCompleted: 'Completed',
    overviewOpen: 'Open',
    overviewOverdue: 'Overdue',
    responsible: 'Responsible',
    deadline: 'Deadline',
    at: 'at',
    personDialogSubtitle: 'Team members can be assigned chores and week responsibility.',
    personDetailsTitle: 'Member Details',
    fullNameLabel: 'Full name',
    emailOptionalLabel: 'Email (optional)',
    phoneOptionalLabel: 'Phone (optional)',
    choreDialogSubtitle: 'Set what should be done, when it repeats, and how deadline alerts should work.',
    choreDetailsTitle: '1. Chore Details',
    choreNameLabel: 'Chore name',
    choreStartDateLabel: 'Start date',
    choreDescriptionOptionalLabel: 'Description (optional)',
    choreRepeatTitle: '2. Repeat Schedule',
    choreRepeatMode: 'Repeat mode',
    repeatModeIntervalLabel: 'Every X days',
    repeatModeWeekdaysLabel: 'Specific weekdays',
    choreRepeatEveryLabel: 'Repeat every',
    weekdayHint: 'Choose weekdays for this chore.',
    weekdayMon: 'Mon',
    weekdayTue: 'Tue',
    weekdayWed: 'Wed',
    weekdayThu: 'Thu',
    weekdayFri: 'Fri',
    weekdaySat: 'Sat',
    weekdaySun: 'Sun',
    choreDeadlineTitle: '3. Deadline (Optional)',
    useSpecificDeadlineLabel: 'Use a specific deadline time',
    choreDeadlineTimeLabel: 'Deadline time',
    alertIfMissedLabel: 'Alert if deadline is missed',
    noFixedTimeHint: 'If this chore has no fixed time, keep deadline turned off.',
    choreStatusTitle: '4. Chore Status',
    activeChoreLabel: 'Active chore',
    choreStatusHint: 'Turn off to pause this chore without deleting it.',
    assignWeekResponsibilityTitle: 'Assign Week Responsibility',
    assignWeekResponsibilitySubtitle: 'Set one person to own all chores for the selected week.',
    weekAndOwnerTitle: 'Week And Owner',
    weekStartMondayLabel: 'Week start (Monday)',
    responsiblePersonLabel: 'Responsible person',
    instanceOwnerStatusTitle: 'Instance Owner And Status',
    responsiblePersonOptionalLabel: 'Responsible person (optional)',
    disableSingleInstanceLabel: 'Disable this single instance',
    perDayChoreOverridesTitle: 'Per-Day Chore Overrides',
    customChoreNameOptionalLabel: 'Custom chore name (optional)',
    deadlineBehaviorLabel: 'Deadline behavior',
    customDeadlineTimeLabel: 'Custom deadline time',
    alertCustomDeadlineMissedLabel: 'Alert when custom deadline is missed',
    customDescriptionOptionalLabel: 'Custom description (optional)',
    instanceKeepDefaultNote: 'Leave fields empty to keep original chore data for this instance.',
    addTeamMember: 'Add Team Member',
    editTeamMemberTitle: 'Edit Team Member',
    createMember: 'Create Member',
    saveChanges: 'Save Changes',
    addChore: 'Add Chore',
    editChoreTitle: 'Edit Chore',
    createChore: 'Create Chore',
    editChoreInstance: 'Edit Chore Instance',
    saveInstance: 'Save Instance',
    saveSettings: 'Save Settings',
    changesApplyOneDate: 'Changes apply to one date only.',
    clearWeekOwner: 'Clear Week Owner',
    resetOverride: 'Reset Override',
    useChoreDefault: 'Use chore default',
    noDeadlineThisDay: 'No deadline this day',
    useCustomDeadline: 'Use custom deadline',
    couldNotFindTeamMember: 'Could not find that team member.',
    couldNotFindChore: 'Could not find that chore to edit.',
    couldNotFindChoreInstance: 'Could not find that chore instance.',
    teamMemberUpdated: 'Team member updated.',
    teamMemberAdded: 'Team member added.',
    teamMemberDeleted: 'Team member deleted.',
    teamMemberDisabledHistory: '{name} had history and was disabled/hidden instead of deleted.',
    chooseWeekday: 'Choose at least one weekday for "Specific weekdays".',
    setDeadlineOrOff: 'Set a deadline time or turn off deadline.',
    choreUpdated: 'Chore updated.',
    choreAdded: 'Chore added.',
    choreDeleted: 'Chore deleted.',
    selectResponsiblePerson: 'Select a responsible person.',
    weekOwnerSaved: 'Week owner saved.',
    selectWeekToClear: 'Select a week to clear.',
    weekOwnerCleared: 'Week owner cleared.',
    noPersonForCompletion: 'No available person to register completion.',
    completionRemoved: 'Completion removed.',
    choreMarkedComplete: 'Chore marked complete.',
    choreStatusUpdated: 'Chore status updated.',
    missingChoreInstanceInfo: 'Missing chore instance information.',
    setCustomDeadlineOrMode: 'Set a custom deadline time or choose another deadline mode.',
    choreInstanceSaved: 'Chore instance saved.',
    choreInstanceDisabledForDay: 'Chore instance disabled for this day.',
    choreInstanceEnabledForDay: 'Chore instance enabled for this day.',
    instanceOverrideReset: 'Instance override reset.',
    alertSettingsUpdated: 'Alert settings updated.',
    failedLoadData: 'Failed to load data: {error}',
    deletePrompt: 'Delete {name}?',
    statsSectionTitle: 'Performance League',
    statsSectionSubtitle: 'See who completes most, stays on time, and keeps streaks alive',
    statsFrom: 'From',
    statsTo: 'To',
    statsRange: 'Range',
    gamificationModeLabel: 'Gamification mode',
    gamificationFriendly: 'Friendly',
    gamificationHardcore: 'Hardcore',
    statsDays: '{days} days',
    statsRangeCustom: 'Custom',
    statsHallOfFame: 'Hall Of Fame',
    statsHallOfFameHardcore: 'Podium',
    statsStreakStar: 'Streak Star',
    statsStreakStarHardcore: 'Iron Streak',
    statsNeedsAttention: 'Needs Attention',
    statsNeedsAttentionHardcore: 'Underperformers',
    statsNoChampion: 'No completions in this period yet.',
    statsNoStreak: 'No active streak in this period.',
    statsNoNeedsAttention: 'No one flagged right now.',
    statsNoNeedsAttentionHardcore: 'No one underperforming right now.',
    statsWeeklyMomentum: 'Weekly Momentum',
    statsNoData: 'No stats available for this period.',
    statsChampionScore: '{name} leads with {score} points.',
    statsStreakValue: '{name} has a {days}-day streak.',
    statsNeedsAttentionLine: '{name} - Own rate {rate}% - Missed {missed}',
    statsWeekWinner: 'Top: {name} ({score} pts)',
    statsWeekNoWinner: 'Top: none',
    statsWeekTotal: 'Completed: {count}',
    statsBadgeMvp: 'MVP',
    statsBadgeStreak: 'Hot streak',
    statsBadgeReliable: 'Reliable',
    statsBadgeHelper: 'Helper',
    statsBadgeNeedsAttention: 'Needs boost',
    statsBadgeNeedsAttentionHardcore: 'On watch'
  },
  no: {
    appTitle: 'Moradi - Administrasjon',
    sectionOverviewTitle: 'Oversikt',
    sectionOverviewSubtitle: 'Oversikt for planlegging, status og risiko',
    sectionStatsTitle: 'Statistikk',
    sectionStatsSubtitle: 'Toppliste, streaks og ukentlig fremdrift',
    sectionTeamTitle: 'Ansatte',
    sectionTeamSubtitle: 'Administrer hvem som kan tildeles gjøremål',
    sectionChoresTitle: 'Gjøremål',
    sectionChoresSubtitle: 'Administrer regler, frister og varsler',
    sectionScheduleTitle: 'Plan',
    sectionScheduleSubtitle: 'Administrer ukeansvar og dagsinstanser',
    sectionBoardTitle: 'Daglig drift',
    sectionBoardSubtitle: 'Følg gjennomføring for valgt dato og håndter åpne risikoer',
    navOverview: 'Oversikt',
    navStats: 'Statistikk',
    navTeam: 'Ansatte',
    navChores: 'Gjøremål',
    navSchedule: 'Plan',
    navBoard: 'Daglig drift',
    overviewGlanceTitle: 'Dagens oversikt',
    overviewGlanceSubtitle: 'Status for gjøremål som forfaller i dag',
    overviewTodayTitle: 'Dagens gjøremål',
    overviewTodaySubtitle: 'Forfaller nå og gjennomføringsstatus',
    overviewAlertsTitle: 'Fristvarsler',
    overviewAlertsSubtitle: 'Nylige overskredne frister',
    overviewWeekOwnersTitle: 'Kommende ukeansvar',
    overviewWeekOwnersSubtitle: 'Hvem som har ansvar for alle gjøremål per uke',
    scheduleWeekResponsibilityTitle: 'Ansvalig',
    scheduleWeekResponsibilitySubtitle: 'Velg hvem som er ansvarlig for alle gjøremål denne uken',
    scheduleWeeklyInstanceTitle: 'Ukeplan',
    scheduleWeeklyInstanceSubtitle: 'Ukeplan med overstyring per dagsinstans',
    scheduleWeeklyInstanceHint: 'Rediger en instans for én dato, eller deaktiver instansen for den dagen.',
    startWeekMonday: 'Startuke (mandag)',
    weeksShown: 'Uker vist',
    weekStartLabel: 'Ukestart',
    boardDateLabel: 'Dato',
    boardSummaryTotal: 'Planlagt',
    boardSummaryDone: 'Fullført',
    boardSummaryOpen: 'Åpne',
    boardSummaryOverdue: 'Forsinket',
    boardSummaryUnassigned: 'Ikke tildelt',
    boardNeedsAttentionTitle: 'Trenger oppfølging',
    boardNeedsAttentionSubtitle: 'Åpne gjøremål som trenger handling nå',
    boardCompletedTitle: 'Fullført',
    boardCompletedSubtitle: 'Fullførte gjøremål for valgt dato',
    boardNoAttention: 'Ingen åpne gjøremål for denne datoen.',
    boardNoCompleted: 'Ingen gjøremål er fullført enda.',
    boardDoneBy: 'Fullført av {name}',
    boardDoneByAt: 'Fullført av {name} kl. {time}',
    previousDay: 'Forrige dag',
    nextDay: 'Neste dag',
    openCalendar: 'Åpne kalender',
    thName: 'Navn',
    thEmail: 'E-post',
    thPhone: 'Telefon',
    thAction: 'Handling',
    thSchedule: 'Plan',
    thDeadline: 'Frist',
    thAlerts: 'Varsler',
    thActive: 'Aktiv',
    thDate: 'Dato',
    thChore: 'Gjøremål',
    thPerson: 'Person',
    thWeekNumber: 'Uke #',
    thWeekStart: 'Ukestart',
    thRange: 'Periode',
    thResponsible: 'Ansvarlig',
    thSource: 'Kilde',
    thStatus: 'Status',
    thRank: 'Rang',
    thScore: 'Poeng',
    thOwnDone: 'Egne fullført',
    thAssigned: 'Tildelt',
    thOwnRate: 'Egen rate',
    thOnTime: 'Innen frist',
    thStreak: 'Streak',
    thBadges: 'Merker',
    choreNumber: 'Gjøremål #{id}',
    settings: 'Innstillinger',
    settingsDialogTitle: 'Innstillinger',
    settingsDialogSubtitle: 'Konfigurer varsling og språk.',
    settingsGeneralTitle: 'Generelt',
    settingsWebhookTitle: 'Webhook / SMS',
    settingsSmtpTitle: 'E-post (SMTP)',
    languageLabel: 'Språk',
    languageEnglish: 'Engelsk',
    languageNorwegian: 'Norsk',
    enableDeadlineAlertsLabel: 'Aktiver fristvarsler',
    weeklyOwnerReminderLabel: 'Send påminnelse til ukeansvarlig (mandag 08:00)',
    alertWebhookUrlLabel: 'URL for varsel-webhook',
    smsGatewayUrlLabel: 'URL for SMS API-gateway',
    smtpServerLabel: 'SMTP-server',
    smtpPortLabel: 'Port',
    smtpAccountLabel: 'Konto (bruker)',
    smtpPasswordLabel: 'Passord',
    smtpFromLabel: 'Fra e-post',
    smtpSecureLabel: 'Sikker (SMTPS/TLS)',
    placeholderPersonNameExample: 'f.eks. Sarah Jensen',
    placeholderPersonEmail: 'navn@firma.no',
    placeholderPersonPhone: '+47 ...',
    placeholderChoreName: 'f.eks. Tøm oppvaskmaskinen',
    placeholderChoreDescription: 'Korte instrukser for teamet',
    placeholderInstanceName: 'Bruk kun for denne dagen',
    placeholderInstanceDescription: 'Valgfri merknad eller instruks for én dag',
    placeholderUrl: 'https://...',
    placeholderSmtpHost: 'smtp.eksempel.no',
    placeholderSmtpUser: 'konto@eksempel.no',
    placeholderSmtpFrom: 'noreply@eksempel.no',
    openIpadView: 'Åpne iPad-visning',
    openIphoneView: 'Åpne iPhone-visning',
    week: 'Uke {week}',
    unassigned: 'Ikke tildelt',
    noDescription: 'Ingen beskrivelse',
    noSpecificTime: 'Ingen spesifikk tid',
    noDeadline: 'Ingen frist',
    day: 'dag(er)',
    weekdaysLabel: 'Ukedager: {days}',
    everyDaysLabel: 'Hver {days}. dag',
    badgeEnabled: 'På',
    badgeDisabled: 'Av',
    badgeActive: 'Aktiv',
    badgeInactive: 'Inaktiv',
    badgeDone: 'Fullført',
    badgeOverdue: 'Forsinket',
    badgeOpen: 'Åpen',
    badgeInstanceOverride: 'Instansoverstyring',
    badgeWeekOwner: 'Ukeansvar',
    sourceUnassigned: 'Ikke tildelt',
    weekStarts: 'Uken starter {date}',
    starts: 'Starter {date}',
    previousWeek: 'Forrige uke',
    nextWeek: 'Neste uke',
    save: 'Lagre',
    cancel: 'Avbryt',
    remove: 'Fjern',
    edit: 'Rediger',
    editTeamMember: 'Rediger ansatt',
    deleteTeamMember: 'Slett ansatt',
    editChore: 'Rediger gjøremål',
    deleteChore: 'Slett gjøremål',
    pauseChore: 'Sett gjøremål på pause',
    activateChore: 'Aktiver gjøremål',
    changeWeekOwner: 'Endre ukeansvarlig',
    assignWeekOwner: 'Sett ukeansvarlig',
    undoCompletion: 'Angre fullføring',
    markChoreDone: 'Marker gjøremål fullført',
    editInstance: 'Rediger instans',
    enableDayInstance: 'Aktiver denne dagsinstansen',
    disableDayInstance: 'Deaktiver denne dagsinstansen',
    disabledForDay: 'Deaktivert for denne dagen',
    noSummaryAvailable: 'Ingen oppsummering enda.',
    noChoresToday: 'Ingen gjøremål planlagt i dag.',
    noAlertsTriggered: 'Ingen varsler er utløst.',
    noWeekOwnersConfigured: 'Ingen ukeansvarlige konfigurert enda.',
    noPeopleAdded: 'Ingen personer lagt til enda.',
    noChoresAdded: 'Ingen gjøremål lagt til enda.',
    noChoresConfigured: 'Ingen gjøremål konfigurert enda.',
    noChoresAvailable: 'Ingen gjøremål tilgjengelig.',
    noChoresOption: 'Ingen gjøremål',
    noPeopleOption: 'Ingen personer',
    selectOption: 'Velg',
    noWeeksLoaded: 'Ingen uker lastet. Velg startuke for å laste.',
    noPlanForDate: 'Ingen gjøremål forfaller på valgt dato.',
    noWeekDataLoaded: 'Ingen ukedata lastet.',
    noChoresDue: 'Ingen gjøremål forfaller.',
    useScheduledOwner: 'Bruk planlagt ansvarlig',
    overviewTotalChores: 'Totalt gjøremål',
    overviewCompleted: 'Fullført',
    overviewOpen: 'Åpne',
    overviewOverdue: 'Forsinket',
    responsible: 'Ansvarlig',
    deadline: 'Frist',
    at: 'kl.',
    personDialogSubtitle: 'Ansatte kan tildeles gjøremål og ukeansvar.',
    personDetailsTitle: 'Ansattdetaljer',
    fullNameLabel: 'Fullt navn',
    emailOptionalLabel: 'E-post (valgfritt)',
    phoneOptionalLabel: 'Telefon (valgfritt)',
    choreDialogSubtitle: 'Angi hva som skal gjøres, når det gjentas, og hvordan fristvarsler skal fungere.',
    choreDetailsTitle: '1. Gjøremålsdetaljer',
    choreNameLabel: 'Navn på gjøremål',
    choreStartDateLabel: 'Startdato',
    choreDescriptionOptionalLabel: 'Beskrivelse (valgfritt)',
    choreRepeatTitle: '2. Gjentakelse',
    choreRepeatMode: 'Gjentakelsesmodus',
    repeatModeIntervalLabel: 'Hver X. dag',
    repeatModeWeekdaysLabel: 'Spesifikke ukedager',
    choreRepeatEveryLabel: 'Gjenta hver',
    weekdayHint: 'Velg ukedager for dette gjøremålet.',
    weekdayMon: 'Man',
    weekdayTue: 'Tir',
    weekdayWed: 'Ons',
    weekdayThu: 'Tor',
    weekdayFri: 'Fre',
    weekdaySat: 'Lør',
    weekdaySun: 'Søn',
    choreDeadlineTitle: '3. Frist (valgfritt)',
    useSpecificDeadlineLabel: 'Bruk et spesifikt fristtidspunkt',
    choreDeadlineTimeLabel: 'Fristtid',
    alertIfMissedLabel: 'Varsle hvis fristen overskrides',
    noFixedTimeHint: 'Hvis gjøremålet ikke har fast tid, la frist være av.',
    choreStatusTitle: '4. Status for gjøremål',
    activeChoreLabel: 'Aktivt gjøremål',
    choreStatusHint: 'Slå av for å pause gjøremålet uten å slette det.',
    assignWeekResponsibilityTitle: 'Sett ukeansvar',
    assignWeekResponsibilitySubtitle: 'Sett én person som har ansvar for alle gjøremål i valgt uke.',
    weekAndOwnerTitle: 'Uke og ansvarlig',
    weekStartMondayLabel: 'Ukestart (mandag)',
    responsiblePersonLabel: 'Ansvarlig person',
    instanceOwnerStatusTitle: 'Instansansvar og status',
    responsiblePersonOptionalLabel: 'Ansvarlig person (valgfritt)',
    disableSingleInstanceLabel: 'Deaktiver denne ene instansen',
    perDayChoreOverridesTitle: 'Overstyring for denne dagen',
    customChoreNameOptionalLabel: 'Tilpasset navn på gjøremål (valgfritt)',
    deadlineBehaviorLabel: 'Fristhåndtering',
    customDeadlineTimeLabel: 'Tilpasset fristtid',
    alertCustomDeadlineMissedLabel: 'Varsle når tilpasset frist overskrides',
    customDescriptionOptionalLabel: 'Tilpasset beskrivelse (valgfritt)',
    instanceKeepDefaultNote: 'La felt stå tomme for å beholde standarddata for dette gjøremålet.',
    addTeamMember: 'Legg til ansatt',
    editTeamMemberTitle: 'Rediger ansatt',
    createMember: 'Opprett ansatt',
    saveChanges: 'Lagre endringer',
    addChore: 'Legg til gjøremål',
    editChoreTitle: 'Rediger gjøremål',
    createChore: 'Opprett gjøremål',
    editChoreInstance: 'Rediger gjøremålsinstans',
    saveInstance: 'Lagre instans',
    saveSettings: 'Lagre innstillinger',
    changesApplyOneDate: 'Endringer gjelder kun én dato.',
    clearWeekOwner: 'Fjern ukeansvar',
    resetOverride: 'Tilbakestill overstyring',
    useChoreDefault: 'Bruk standard fra gjøremålet',
    noDeadlineThisDay: 'Ingen frist denne dagen',
    useCustomDeadline: 'Bruk tilpasset frist',
    couldNotFindTeamMember: 'Fant ikke denne ansatte.',
    couldNotFindChore: 'Fant ikke gjøremålet som skulle redigeres.',
    couldNotFindChoreInstance: 'Fant ikke denne gjøremålsinstansen.',
    teamMemberUpdated: 'Ansatt oppdatert.',
    teamMemberAdded: 'Ansatt lagt til.',
    teamMemberDeleted: 'Ansatt slettet.',
    teamMemberDisabledHistory: '{name} hadde historikk og ble deaktivert/skjult i stedet for slettet.',
    chooseWeekday: 'Velg minst én ukedag for "Spesifikke ukedager".',
    setDeadlineOrOff: 'Sett fristtid eller slå av frist.',
    choreUpdated: 'Gjøremål oppdatert.',
    choreAdded: 'Gjøremål lagt til.',
    choreDeleted: 'Gjøremål slettet.',
    selectResponsiblePerson: 'Velg en ansvarlig person.',
    weekOwnerSaved: 'Ukeansvar lagret.',
    selectWeekToClear: 'Velg en uke å tømme.',
    weekOwnerCleared: 'Ukeansvar fjernet.',
    noPersonForCompletion: 'Ingen tilgjengelig person for å registrere gjennomføring.',
    completionRemoved: 'Gjennomføring fjernet.',
    choreMarkedComplete: 'Gjøremål markert som fullført.',
    choreStatusUpdated: 'Status for gjøremål oppdatert.',
    missingChoreInstanceInfo: 'Mangler informasjon om gjøremålsinstans.',
    setCustomDeadlineOrMode: 'Sett tilpasset fristtid eller velg annen fristmodus.',
    choreInstanceSaved: 'Gjøremålsinstans lagret.',
    choreInstanceDisabledForDay: 'Gjøremålsinstans deaktivert for denne dagen.',
    choreInstanceEnabledForDay: 'Gjøremålsinstans aktivert for denne dagen.',
    instanceOverrideReset: 'Instansoverstyring tilbakestilt.',
    alertSettingsUpdated: 'Varselinnstillinger oppdatert.',
    failedLoadData: 'Kunne ikke laste data: {error}',
    deletePrompt: 'Slette {name}?',
    statsSectionTitle: 'Resultatliste',
    statsSectionSubtitle: 'Se hvem som fullfører mest, holder frister og bygger streak',
    statsFrom: 'Fra',
    statsTo: 'Til',
    statsRange: 'Periode',
    gamificationModeLabel: 'Spillmodus',
    gamificationFriendly: 'Vennlig',
    gamificationHardcore: 'Hardcore',
    statsDays: '{days} dager',
    statsRangeCustom: 'Egendefinert',
    statsHallOfFame: 'Hall of Fame',
    statsHallOfFameHardcore: 'Podium',
    statsStreakStar: 'Streak-stjerne',
    statsStreakStarHardcore: 'Jernstreak',
    statsNeedsAttention: 'Trenger oppfølging',
    statsNeedsAttentionHardcore: 'Underpresterer',
    statsNoChampion: 'Ingen fullføringer i perioden enda.',
    statsNoStreak: 'Ingen aktiv streak i perioden.',
    statsNoNeedsAttention: 'Ingen flagget akkurat nå.',
    statsNoNeedsAttentionHardcore: 'Ingen underpresterer akkurat nå.',
    statsWeeklyMomentum: 'Ukentlig fremdrift',
    statsNoData: 'Ingen statistikk for valgt periode.',
    statsChampionScore: '{name} leder med {score} poeng.',
    statsStreakValue: '{name} har {days} dager streak.',
    statsNeedsAttentionLine: '{name} - Egen rate {rate}% - Misset {missed}',
    statsWeekWinner: 'Topp: {name} ({score} poeng)',
    statsWeekNoWinner: 'Topp: ingen',
    statsWeekTotal: 'Fullført: {count}',
    statsBadgeMvp: 'MVP',
    statsBadgeStreak: 'Hot streak',
    statsBadgeReliable: 'Stabil',
    statsBadgeHelper: 'Hjelper',
    statsBadgeNeedsAttention: 'Trenger løft',
    statsBadgeNeedsAttentionHardcore: 'På vakt'
  }
};

const sectionMeta = {
  overview: {
    titleKey: 'sectionOverviewTitle',
    subtitleKey: 'sectionOverviewSubtitle'
  },
  stats: {
    titleKey: 'sectionStatsTitle',
    subtitleKey: 'sectionStatsSubtitle'
  },
  team: {
    titleKey: 'sectionTeamTitle',
    subtitleKey: 'sectionTeamSubtitle'
  },
  chores: {
    titleKey: 'sectionChoresTitle',
    subtitleKey: 'sectionChoresSubtitle'
  },
  schedule: {
    titleKey: 'sectionScheduleTitle',
    subtitleKey: 'sectionScheduleSubtitle'
  },
  board: {
    titleKey: 'sectionBoardTitle',
    subtitleKey: 'sectionBoardSubtitle'
  }
};

const state = {
  language: 'en',
  section: 'overview',
  people: [],
  chores: [],
  weekOwners: [],
  overviewWeekOwners: [],
  plan: [],
  overviewPlan: [],
  overviewSummary: null,
  overviewAlerts: [],
  stats: null,
  settings: null,
  scheduleWeekDates: [],
  scheduleWeekPlans: new Map(),
  planDate: todayKey(),
  weekViewStart: todayKey(),
  weekViewCount: 8,
  statsStart: todayKey(),
  statsEnd: todayKey(),
  statsRangeDays: 30
};

function localDateFromKey(dateKey) {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateKey, days) {
  const date = localDateFromKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function startOfWeek(dateKey, weekStartsOn = 1) {
  const date = localDateFromKey(dateKey);
  const weekday = date.getDay();
  const shift = (weekday - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - shift);
  return toDateKey(date);
}

function parseWeekdayMask(weekdayMask) {
  if (!weekdayMask) {
    return [];
  }

  return String(weekdayMask)
    .split(',')
    .map((part) => Number.parseInt(part, 10))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
    .filter((value, index, all) => all.indexOf(value) === index)
    .sort((a, b) => a - b);
}

function t(key, vars = {}) {
  return translate(TEXT, state.language, key, vars);
}

function currentLocale() {
  return localeForLanguage(state.language);
}

function weekdayLabel(weekday) {
  const reference = new Date(2024, 0, 7 + Number(weekday || 0));
  return new Intl.DateTimeFormat(currentLocale(), { weekday: 'short' }).format(reference);
}

function formatWeekRange(startKey) {
  const start = localDateFromKey(startKey);
  const end = localDateFromKey(addDays(startKey, 6));
  const sameYear = start.getFullYear() === end.getFullYear();

  const startFormatter = new Intl.DateTimeFormat(currentLocale(), {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric'
  });
  const endFormatter = new Intl.DateTimeFormat(currentLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `${startFormatter.format(start)} - ${endFormatter.format(end)}`;
}

function weekdayShortFromDateKey(dateKey) {
  return new Intl.DateTimeFormat(currentLocale(), { weekday: 'short' }).format(localDateFromKey(dateKey));
}

function dayNumberFromDateKey(dateKey) {
  return new Intl.DateTimeFormat(currentLocale(), { day: '2-digit', month: 'short' }).format(localDateFromKey(dateKey));
}

function dateLongLabel(dateKey) {
  return new Intl.DateTimeFormat(currentLocale(), { weekday: 'long', month: 'short', day: 'numeric' }).format(
    localDateFromKey(dateKey)
  );
}

function timeLabelFromIso(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat(currentLocale(), { hour: '2-digit', minute: '2-digit' }).format(parsed);
}

function mondayToFridayDates(dateKey) {
  const monday = startOfWeek(dateKey);
  return [0, 1, 2, 3, 4].map((offset) => addDays(monday, offset));
}

function weekNumberFromDateKey(dateKey) {
  const date = localDateFromKey(dateKey);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / 604800000);
}

function formatRate(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }

  return `${Number(value).toFixed(1)}%`;
}

function syncStatsInputs({ setRangeValue = true } = {}) {
  if (statsStartInput) {
    statsStartInput.value = state.statsStart;
  }
  if (statsEndInput) {
    statsEndInput.value = state.statsEnd;
  }
  if (statsRangeDaysSelect && setRangeValue) {
    const optionValue = String(state.statsRangeDays || 'custom');
    const optionExists = Array.from(statsRangeDaysSelect.options).some((option) => option.value === optionValue);
    statsRangeDaysSelect.value = optionExists ? optionValue : 'custom';
  }
}

function applyStatsRange(days, { anchorEnd = state.statsEnd, setCustom = false } = {}) {
  const parsedDays = Math.min(Math.max(Number(days) || 30, 1), 365);
  state.statsRangeDays = setCustom ? 0 : parsedDays;
  state.statsEnd = anchorEnd || todayKey();
  state.statsStart = addDays(state.statsEnd, -(parsedDays - 1));
  syncStatsInputs({ setRangeValue: true });
}

function statsMode() {
  return state.settings?.gamification_mode === 'hardcore' ? 'hardcore' : 'friendly';
}

function statsBadgeLabel(code) {
  const hardcore = statsMode() === 'hardcore';
  switch (code) {
    case 'mvp':
      return t('statsBadgeMvp');
    case 'streak':
      return t('statsBadgeStreak');
    case 'reliable':
      return t('statsBadgeReliable');
    case 'helper':
      return t('statsBadgeHelper');
    case 'needs_attention':
      return hardcore ? t('statsBadgeNeedsAttentionHardcore') : t('statsBadgeNeedsAttention');
    default:
      return code;
  }
}

function renderStatsHighlights() {
  if (!statsHighlightsEl) return;
  const hardcore = statsMode() === 'hardcore';
  const highlights = state.stats?.highlights || {};
  const champion = highlights.champion || null;
  const streakStar = highlights.streak_star || null;
  const needsAttention = Array.isArray(highlights.needs_attention) ? highlights.needs_attention : [];

  const championBody = champion
    ? t('statsChampionScore', { name: champion.name, score: champion.score })
    : t('statsNoChampion');
  const streakBody = streakStar
    ? t('statsStreakValue', { name: streakStar.name, days: streakStar.current_streak })
    : t('statsNoStreak');
  const needsItems = needsAttention
    .map(
      (row) =>
        `<li>${escapeHtml(
          t('statsNeedsAttentionLine', {
            name: row.name,
            rate: row.ownership_rate ?? 0,
            missed: row.missed_open ?? 0
          })
        )}</li>`
    )
    .join('');
  const needsBody = needsItems
    ? `<ul class="stats-highlight-list">${needsItems}</ul>`
    : `<p>${escapeHtml(hardcore ? t('statsNoNeedsAttentionHardcore') : t('statsNoNeedsAttention'))}</p>`;

  statsHighlightsEl.innerHTML = `
    <article class="stats-highlight-card">
      <h4>${escapeHtml(hardcore ? t('statsHallOfFameHardcore') : t('statsHallOfFame'))}</h4>
      <strong>${escapeHtml(champion?.name || '-')}</strong>
      <p>${escapeHtml(championBody)}</p>
    </article>
    <article class="stats-highlight-card">
      <h4>${escapeHtml(hardcore ? t('statsStreakStarHardcore') : t('statsStreakStar'))}</h4>
      <strong>${escapeHtml(streakStar?.name || '-')}</strong>
      <p>${escapeHtml(streakBody)}</p>
    </article>
    <article class="stats-highlight-card">
      <h4>${escapeHtml(hardcore ? t('statsNeedsAttentionHardcore') : t('statsNeedsAttention'))}</h4>
      ${needsBody}
    </article>
  `;
}

function renderStatsTable() {
  if (!statsTableEl) return;
  const rows = state.stats?.leaderboard || [];

  if (!rows.length) {
    statsTableEl.innerHTML = `<tr><td colspan="9" class="notice">${escapeHtml(t('statsNoData'))}</td></tr>`;
    return;
  }

  statsTableEl.innerHTML = rows
    .map((row) => {
      const rowClasses = [
        row.rank === 1 ? 'stats-rank-top' : '',
        row.badges?.includes('needs_attention') ? 'stats-rank-watch' : ''
      ]
        .filter(Boolean)
        .join(' ');
      const badgeHtml = row.badges?.length
        ? `<div class="stats-badges">${row.badges
            .map(
              (badge) =>
                `<span class="stats-badge ${escapeHtml(badge)}">${escapeHtml(statsBadgeLabel(badge))}</span>`
            )
            .join('')}</div>`
        : '-';

      return `
        <tr class="${rowClasses}">
          <td>${row.rank}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${Number(row.score || 0)}</td>
          <td>${Number(row.self_done || 0)}</td>
          <td>${Number(row.assigned || 0)}</td>
          <td>${escapeHtml(formatRate(row.ownership_rate))}</td>
          <td>${escapeHtml(formatRate(row.on_time_rate))}</td>
          <td>${Number(row.current_streak || 0)}</td>
          <td>${badgeHtml}</td>
        </tr>
      `;
    })
    .join('');
}

function renderStatsWeekly() {
  if (!statsWeeklyEl) return;
  const weeks = state.stats?.weekly || [];

  if (!weeks.length) {
    statsWeeklyEl.innerHTML = `<p class="notice">${escapeHtml(t('statsNoData'))}</p>`;
    return;
  }

  statsWeeklyEl.innerHTML = weeks
    .map((week) => {
      const winnerText = week.top_person_name
        ? t('statsWeekWinner', { name: week.top_person_name, score: week.top_score ?? 0 })
        : t('statsWeekNoWinner');

      return `
        <article class="stats-week-item">
          <strong>${escapeHtml(t('week', { week: week.week_number }))} - ${escapeHtml(formatWeekRange(week.week_start))}</strong>
          <p>${escapeHtml(winnerText)}</p>
          <p>${escapeHtml(t('statsWeekTotal', { count: week.total_completed || 0 }))}</p>
        </article>
      `;
    })
    .join('');
}

function renderStats() {
  renderStatsHighlights();
  renderStatsTable();
  renderStatsWeekly();
}

function renderScheduleWeekHeader() {
  if (instanceWeekStartInput) {
    instanceWeekStartInput.value = state.weekViewStart;
  }

  if (!instanceWeekLabelEl) {
    return;
  }

  const weekNumber = weekNumberFromDateKey(state.weekViewStart);
  const rangeText = formatWeekRange(state.weekViewStart);
  instanceWeekLabelEl.innerHTML = `<strong>${escapeHtml(
    t('week', { week: weekNumber })
  )}</strong><span>${escapeHtml(rangeText)}</span>`;
}

function setWeekViewStart(weekStart) {
  state.weekViewStart = startOfWeek(weekStart || todayKey());
  weekViewStartInput.value = state.weekViewStart;
  renderScheduleWeekHeader();
}

function setPlanDate(dateKey) {
  state.planDate = dateKey || todayKey();
  if (planDateInput) {
    planDateInput.value = state.planDate;
  }
  renderBoardDateMeta();
}

function renderBoardDateMeta() {
  if (boardDateReadableEl) {
    boardDateReadableEl.textContent = dateLongLabel(state.planDate);
  }
  if (boardDateWeekEl) {
    boardDateWeekEl.textContent = t('week', { week: weekNumberFromDateKey(state.planDate) });
  }
}

function actionIcon(type) {
  switch (type) {
    case 'edit':
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 20h4l10.5-10.5-4-4L4 16v4zm12.8-13.3 1.5-1.5a1.5 1.5 0 1 1 2.1 2.1l-1.5 1.5-2.1-2.1z"
            fill="currentColor"
          />
        </svg>
      `;
    case 'delete':
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M8 4h8l1 2h4v2H3V6h4l1-2zm1 6h2v8H9v-8zm4 0h2v8h-2v-8zm-6 0h2v8H7v-8zm10 0h-2v8h2v-8z"
            fill="currentColor"
          />
        </svg>
      `;
    case 'pause':
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 5h4v14H7V5zm6 0h4v14h-4V5z" fill="currentColor" />
        </svg>
      `;
    case 'activate':
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
        </svg>
      `;
    case 'done':
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9.2 16.4 5.8 13l-1.4 1.4 4.8 4.8L20 8.4 18.6 7l-9.4 9.4z"
            fill="currentColor"
          />
        </svg>
      `;
    case 'undo':
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 5a7 7 0 0 1 6.6 4.7h-2.2A5 5 0 1 0 17 13h2a7 7 0 1 1-2.1-5L14 11h7V4l-2.7 2.7A8.9 8.9 0 0 0 12 5z"
            fill="currentColor"
          />
        </svg>
      `;
    default:
      return '';
  }
}

function setStatus(message, isError = false) {
  if (!isError) {
    statusEl.textContent = '';
    return;
  }

  statusEl.textContent = message;
  statusEl.style.color = '#b42e2a';
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) {
    el.textContent = value;
  }
}

function setAttr(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) {
    el.setAttribute(attr, value);
  }
}

function setLabelText(labelEl, value) {
  if (!labelEl) return;
  const textNode = Array.from(labelEl.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE && String(node.textContent || '').trim().length > 0
  );
  if (textNode) {
    textNode.textContent = `${value}\n`;
  }
}

function applyStaticTranslations() {
  document.title = t('appTitle');
  const setHeader = (selector, index, value) => {
    const root = document.querySelector(selector);
    const table = root?.closest('table') || root;
    const cell = table?.querySelector(`thead th:nth-child(${index})`);
    if (cell) {
      cell.textContent = value;
    }
  };

  setText('[data-admin-link="overview"]', t('navOverview'));
  setText('[data-admin-link="stats"]', t('navStats'));
  setText('[data-admin-link="team"]', t('navTeam'));
  setText('[data-admin-link="chores"]', t('navChores'));
  setText('[data-admin-link="schedule"]', t('navSchedule'));
  setText('[data-admin-link="board"]', t('navBoard'));

  setAttr('a[href="/employee/ipad"]', 'title', t('openIpadView'));
  setAttr('a[href="/employee/ipad"]', 'aria-label', t('openIpadView'));
  setAttr('a[href="/employee/mobile"]', 'title', t('openIphoneView'));
  setAttr('a[href="/employee/mobile"]', 'aria-label', t('openIphoneView'));
  setAttr('#open-settings-dialog', 'title', t('settings'));
  setAttr('#open-settings-dialog', 'aria-label', t('settings'));
  setAttr('#plan-date-prev', 'title', t('previousDay'));
  setAttr('#plan-date-prev', 'aria-label', t('previousDay'));
  setAttr('#plan-date-next', 'title', t('nextDay'));
  setAttr('#plan-date-next', 'aria-label', t('nextDay'));
  setAttr('#plan-date-picker', 'title', t('openCalendar'));
  setAttr('#plan-date-picker', 'aria-label', t('openCalendar'));

  const overviewGlancePanel = document.querySelector('.overview-glance');
  if (overviewGlancePanel) {
    setText('.overview-glance .section-title h2', t('overviewGlanceTitle'));
    setText('.overview-glance .section-title p', t('overviewGlanceSubtitle'));
  }
  const overviewTodayPanel = overviewPlanCardsEl?.closest('article');
  if (overviewTodayPanel) {
    const heading = overviewTodayPanel.querySelector('.section-title h2');
    const subtitle = overviewTodayPanel.querySelector('.section-title p');
    if (heading) heading.textContent = t('overviewTodayTitle');
    if (subtitle) subtitle.textContent = t('overviewTodaySubtitle');
  }
  const overviewAlertsPanel = overviewAlertsEl?.closest('article');
  if (overviewAlertsPanel) {
    const heading = overviewAlertsPanel.querySelector('.section-title h2');
    const subtitle = overviewAlertsPanel.querySelector('.section-title p');
    if (heading) heading.textContent = t('overviewAlertsTitle');
    if (subtitle) subtitle.textContent = t('overviewAlertsSubtitle');
  }
  const overviewOwnersPanel = overviewWeekOwnerListEl?.closest('article');
  if (overviewOwnersPanel) {
    const heading = overviewOwnersPanel.querySelector('.section-title h2');
    const subtitle = overviewOwnersPanel.querySelector('.section-title p');
    if (heading) heading.textContent = t('overviewWeekOwnersTitle');
    if (subtitle) subtitle.textContent = t('overviewWeekOwnersSubtitle');
  }

  setText('[data-admin-section="team"] .section-title h2', t('sectionTeamTitle'));
  setText('[data-admin-section="team"] .section-title p', t('sectionTeamSubtitle'));
  setText('#open-person-dialog', t('addTeamMember'));

  setText('#stats-section-title', t('statsSectionTitle'));
  setText('#stats-section-subtitle', t('statsSectionSubtitle'));
  setText('#stats-weekly-title', t('statsWeeklyMomentum'));
  setLabelText(statsStartInput?.closest('label'), t('statsFrom'));
  setLabelText(statsEndInput?.closest('label'), t('statsTo'));
  setLabelText(statsRangeDaysSelect?.closest('label'), t('statsRange'));
  setLabelText(settingsGamificationSelectEl?.closest('label'), t('gamificationModeLabel'));

  if (settingsGamificationSelectEl) {
    Array.from(settingsGamificationSelectEl.options).forEach((option) => {
      if (option.value === 'hardcore') {
        option.textContent = t('gamificationHardcore');
      } else {
        option.textContent = t('gamificationFriendly');
      }
    });
  }

  if (settingsLanguageSelectEl) {
    Array.from(settingsLanguageSelectEl.options).forEach((option) => {
      if (option.value === 'no') {
        option.textContent = t('languageNorwegian');
      } else {
        option.textContent = t('languageEnglish');
      }
    });
  }

  if (statsRangeDaysSelect) {
    Array.from(statsRangeDaysSelect.options).forEach((option) => {
      if (option.value === 'custom') {
        option.textContent = t('statsRangeCustom');
      } else {
        option.textContent = t('statsDays', { days: option.value });
      }
    });
  }

  setText('[data-admin-section="chores"] .section-title h2', t('sectionChoresTitle'));
  setText('[data-admin-section="chores"] .section-title p', t('sectionChoresSubtitle'));
  setText('#open-chore-dialog', t('addChore'));

  setText('[data-admin-section="board"] .section-title h2', t('sectionBoardTitle'));
  setText('[data-admin-section="board"] .section-title p', t('sectionBoardSubtitle'));
  setText('#board-attention-title', t('boardNeedsAttentionTitle'));
  setText('#board-attention-subtitle', t('boardNeedsAttentionSubtitle'));
  setText('#board-completed-title', t('boardCompletedTitle'));
  setText('#board-completed-subtitle', t('boardCompletedSubtitle'));
  const schedulePanels = document.querySelectorAll('article[data-admin-section="schedule"]');
  const scheduleWeekRespPanel = schedulePanels[0];
  const scheduleInstancePanel = schedulePanels[1];
  if (scheduleWeekRespPanel) {
    const heading = scheduleWeekRespPanel.querySelector('.section-title h2');
    const subtitle = scheduleWeekRespPanel.querySelector('.section-title p');
    if (heading) heading.textContent = t('scheduleWeekResponsibilityTitle');
    if (subtitle) subtitle.textContent = t('scheduleWeekResponsibilitySubtitle');
  }
  if (scheduleInstancePanel) {
    const heading = scheduleInstancePanel.querySelector('.section-title h2');
    const subtitle = scheduleInstancePanel.querySelector('.section-title p');
    const hint = scheduleInstancePanel.querySelector('.week-plan-hint');
    if (heading) heading.textContent = t('scheduleWeeklyInstanceTitle');
    if (subtitle) subtitle.textContent = t('scheduleWeeklyInstanceSubtitle');
    if (hint) hint.textContent = t('scheduleWeeklyInstanceHint');
  }

  if (instanceWeekPrevBtn) {
    instanceWeekPrevBtn.setAttribute('title', t('previousWeek'));
    instanceWeekPrevBtn.setAttribute('aria-label', t('previousWeek'));
  }
  if (instanceWeekNextBtn) {
    instanceWeekNextBtn.setAttribute('title', t('nextWeek'));
    instanceWeekNextBtn.setAttribute('aria-label', t('nextWeek'));
  }

  setLabelText(weekViewStartInput?.closest('label'), t('startWeekMonday'));
  setLabelText(weekViewCountSelect?.closest('label'), t('weeksShown'));
  setLabelText(instanceWeekStartInput?.closest('label'), t('weekStartLabel'));
  setLabelText(planDateInput?.closest('label'), t('boardDateLabel'));
  setAttr('#chore-repeat-mode-row', 'aria-label', t('choreRepeatMode'));

  setHeader('#people-table', 1, t('thName'));
  setHeader('#people-table', 2, t('thEmail'));
  setHeader('#people-table', 3, t('thPhone'));
  setHeader('#people-table', 4, t('thAction'));

  setHeader('#chores-table', 1, t('thName'));
  setHeader('#chores-table', 2, t('thSchedule'));
  setHeader('#chores-table', 3, t('thDeadline'));
  setHeader('#chores-table', 4, t('thAlerts'));
  setHeader('#chores-table', 5, t('thActive'));

  setHeader('#week-owner-table', 1, t('thWeekNumber'));
  setHeader('#week-owner-table', 2, t('thWeekStart'));
  setHeader('#week-owner-table', 3, t('thRange'));
  setHeader('#week-owner-table', 4, t('thResponsible'));
  setHeader('#week-owner-table', 5, t('thAction'));

  setHeader('#stats-table', 1, t('thRank'));
  setHeader('#stats-table', 2, t('thName'));
  setHeader('#stats-table', 3, t('thScore'));
  setHeader('#stats-table', 4, t('thOwnDone'));
  setHeader('#stats-table', 5, t('thAssigned'));
  setHeader('#stats-table', 6, t('thOwnRate'));
  setHeader('#stats-table', 7, t('thOnTime'));
  setHeader('#stats-table', 8, t('thStreak'));
  setHeader('#stats-table', 9, t('thBadges'));

  setText('#person-submit-label', t('saveChanges'));
  setText('#chore-submit-label', t('saveChanges'));
  setText('#week-owner-save-btn', t('save'));
  setText('#instance-save-btn', t('saveInstance'));
  setText('#settings-save-btn', t('saveSettings'));
  setText('#person-cancel-btn', t('cancel'));
  setText('#chore-cancel-btn', t('cancel'));
  setText('#week-owner-cancel-btn', t('cancel'));
  setText('#instance-cancel-btn', t('cancel'));
  setText('#settings-cancel-btn', t('cancel'));
  setText('#remove-week-owner', t('clearWeekOwner'));
  setText('#remove-instance-override', t('resetOverride'));

  setText('#person-dialog .dialog-heading h3', t('addTeamMember'));
  setText('#person-dialog-subtitle', t('personDialogSubtitle'));
  setText('#person-details-title', t('personDetailsTitle'));
  setLabelText(document.getElementById('person-name-label'), t('fullNameLabel'));
  setLabelText(document.getElementById('person-email-label'), t('emailOptionalLabel'));
  setLabelText(document.getElementById('person-phone-label'), t('phoneOptionalLabel'));

  setText('#chore-dialog .dialog-heading h3', t('addChore'));
  setText('#chore-dialog-subtitle', t('choreDialogSubtitle'));
  setText('#chore-details-title', t('choreDetailsTitle'));
  setLabelText(document.getElementById('chore-name-label'), t('choreNameLabel'));
  setLabelText(document.getElementById('chore-start-date-label'), t('choreStartDateLabel'));
  setLabelText(document.getElementById('chore-description-label'), t('choreDescriptionOptionalLabel'));
  setText('#chore-repeat-title', t('choreRepeatTitle'));
  setLabelText(document.getElementById('chore-repeat-interval-option'), t('repeatModeIntervalLabel'));
  setLabelText(document.getElementById('chore-repeat-weekdays-option'), t('repeatModeWeekdaysLabel'));
  setLabelText(document.getElementById('chore-repeat-interval-label'), t('choreRepeatEveryLabel'));
  setText('#chore-repeat-day-unit', t('day'));
  setText('#chore-weekday-hint', t('weekdayHint'));
  setLabelText(document.getElementById('chore-weekday-mon'), t('weekdayMon'));
  setLabelText(document.getElementById('chore-weekday-tue'), t('weekdayTue'));
  setLabelText(document.getElementById('chore-weekday-wed'), t('weekdayWed'));
  setLabelText(document.getElementById('chore-weekday-thu'), t('weekdayThu'));
  setLabelText(document.getElementById('chore-weekday-fri'), t('weekdayFri'));
  setLabelText(document.getElementById('chore-weekday-sat'), t('weekdaySat'));
  setLabelText(document.getElementById('chore-weekday-sun'), t('weekdaySun'));
  setText('#chore-deadline-title', t('choreDeadlineTitle'));
  setText('#chore-has-deadline-label', t('useSpecificDeadlineLabel'));
  setLabelText(document.getElementById('chore-deadline-time-label'), t('choreDeadlineTimeLabel'));
  setText('#chore-alert-missed-label', t('alertIfMissedLabel'));
  setText('#chore-no-fixed-time-hint', t('noFixedTimeHint'));
  setText('#chore-status-title', t('choreStatusTitle'));
  setText('#chore-active-label', t('activeChoreLabel'));
  setText('#chore-status-hint', t('choreStatusHint'));

  setText('#week-owner-dialog-title', t('assignWeekResponsibilityTitle'));
  setText('#week-owner-dialog-subtitle', t('assignWeekResponsibilitySubtitle'));
  setText('#week-owner-section-title', t('weekAndOwnerTitle'));
  setLabelText(document.getElementById('week-owner-week-label'), t('weekStartMondayLabel'));
  setLabelText(document.getElementById('week-owner-person-label'), t('responsiblePersonLabel'));

  setText('#instance-dialog .dialog-heading h3', t('editChoreInstance'));
  setText('#instance-owner-status-title', t('instanceOwnerStatusTitle'));
  setLabelText(document.getElementById('instance-person-label'), t('responsiblePersonOptionalLabel'));
  setText('#instance-disable-label', t('disableSingleInstanceLabel'));
  setText('#instance-overrides-title', t('perDayChoreOverridesTitle'));
  setLabelText(document.getElementById('instance-name-label'), t('customChoreNameOptionalLabel'));
  setLabelText(document.getElementById('instance-deadline-mode-label'), t('deadlineBehaviorLabel'));
  setLabelText(document.getElementById('instance-custom-deadline-label'), t('customDeadlineTimeLabel'));
  setText('#instance-alert-missed-label', t('alertCustomDeadlineMissedLabel'));
  setLabelText(document.getElementById('instance-description-label'), t('customDescriptionOptionalLabel'));
  setText('#instance-default-note', t('instanceKeepDefaultNote'));

  setText('#settings-dialog .dialog-heading h3', t('settingsDialogTitle'));
  setText('#settings-dialog-subtitle', t('settingsDialogSubtitle'));
  setText('#settings-general-title', t('settingsGeneralTitle'));
  setLabelText(document.getElementById('settings-language-label'), t('languageLabel'));
  setLabelText(document.getElementById('settings-gamification-label'), t('gamificationModeLabel'));
  setText('#settings-deadline-alerts-label', t('enableDeadlineAlertsLabel'));
  setText('#settings-weekly-reminder-label', t('weeklyOwnerReminderLabel'));
  setText('#settings-webhook-title', t('settingsWebhookTitle'));
  setLabelText(document.getElementById('settings-webhook-label'), t('alertWebhookUrlLabel'));
  setLabelText(document.getElementById('settings-sms-label'), t('smsGatewayUrlLabel'));
  setText('#settings-smtp-title', t('settingsSmtpTitle'));
  setLabelText(document.getElementById('settings-smtp-host-label'), t('smtpServerLabel'));
  setLabelText(document.getElementById('settings-smtp-port-label'), t('smtpPortLabel'));
  setLabelText(document.getElementById('settings-smtp-user-label'), t('smtpAccountLabel'));
  setLabelText(document.getElementById('settings-smtp-pass-label'), t('smtpPasswordLabel'));
  setLabelText(document.getElementById('settings-smtp-from-label'), t('smtpFromLabel'));
  setText('#settings-smtp-secure-label', t('smtpSecureLabel'));
  setAttr('#person-form input[name="name"]', 'placeholder', t('placeholderPersonNameExample'));
  setAttr('#person-form input[name="email"]', 'placeholder', t('placeholderPersonEmail'));
  setAttr('#person-form input[name="phone"]', 'placeholder', t('placeholderPersonPhone'));
  setAttr('#chore-form input[name="name"]', 'placeholder', t('placeholderChoreName'));
  setAttr('#chore-form textarea[name="description"]', 'placeholder', t('placeholderChoreDescription'));
  setAttr('#instance-form input[name="name"]', 'placeholder', t('placeholderInstanceName'));
  setAttr('#instance-form textarea[name="description"]', 'placeholder', t('placeholderInstanceDescription'));
  setAttr('#settings-form input[name="alert_webhook_url"]', 'placeholder', t('placeholderUrl'));
  setAttr('#settings-form input[name="sms_gateway_url"]', 'placeholder', t('placeholderUrl'));
  setAttr('#settings-form input[name="smtp_host"]', 'placeholder', t('placeholderSmtpHost'));
  setAttr('#settings-form input[name="smtp_user"]', 'placeholder', t('placeholderSmtpUser'));
  setAttr('#settings-form input[name="smtp_from"]', 'placeholder', t('placeholderSmtpFrom'));

  if (instanceDeadlineModeEl?.options?.length >= 3) {
    instanceDeadlineModeEl.options[0].text = t('useChoreDefault');
    instanceDeadlineModeEl.options[1].text = t('noDeadlineThisDay');
    instanceDeadlineModeEl.options[2].text = t('useCustomDeadline');
  }

  renderStats();
}

function applyLanguage(language) {
  state.language = normalizeLanguage(language);
  setDocumentLanguage(state.language);
  applyStaticTranslations();
  renderBoardDateMeta();
  renderPeople();
  renderChores();
  renderWeekOwners();
  renderPlan();
  renderOverviewSummary();
  renderOverviewPlanCards();
  renderOverviewAlerts();
  renderOverviewWeekOwners();
  renderScheduleWeekHeader();
  renderScheduleWeekPlan();
  renderStats();
  applySection();
}

function applySettingsToForm(settings) {
  if (!settingsForm || !settings) return;

  settingsForm.language.value = settings.language || 'en';
  settingsForm.gamification_mode.value = settings.gamification_mode || 'friendly';
  settingsForm.deadline_alerts_enabled.checked = Number(settings.deadline_alerts_enabled) === 1;
  settingsForm.weekly_owner_alert_enabled.checked = Number(settings.weekly_owner_alert_enabled) === 1;
  settingsForm.alert_webhook_url.value = settings.alert_webhook_url || '';
  settingsForm.sms_gateway_url.value = settings.sms_gateway_url || '';
  settingsForm.smtp_host.value = settings.smtp_host || '';
  settingsForm.smtp_port.value = settings.smtp_port ? String(settings.smtp_port) : '587';
  settingsForm.smtp_secure.checked = Number(settings.smtp_secure) === 1;
  settingsForm.smtp_user.value = settings.smtp_user || '';
  settingsForm.smtp_pass.value = settings.smtp_pass || '';
  settingsForm.smtp_from.value = settings.smtp_from || '';
}

function openDialog(dialogEl) {
  if (!dialogEl || dialogEl.open) return;
  dialogEl.showModal();
}

function closeDialog(dialogEl) {
  if (!dialogEl || !dialogEl.open) return;
  dialogEl.close();
}

function getSectionFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'admin' && parts[1] && sectionMeta[parts[1]]) {
    return parts[1];
  }
  return 'overview';
}

function applySection() {
  state.section = getSectionFromPath();

  const meta = sectionMeta[state.section] || sectionMeta.overview;
  adminPageTitleEl.textContent = t(meta.titleKey);
  adminPageSubtitleEl.textContent = t(meta.subtitleKey);

  document.querySelectorAll('[data-admin-section]').forEach((el) => {
    const matches = el.getAttribute('data-admin-section') === state.section;
    el.classList.toggle('admin-section-hidden', !matches);
  });

  document.querySelectorAll('[data-admin-link]').forEach((el) => {
    const isCurrent = el.getAttribute('data-admin-link') === state.section;
    el.classList.toggle('current', isCurrent);
  });
}

function personOptions(selectedId = null, withEmpty = false) {
  const options = [];

  if (withEmpty) {
    options.push(`<option value="">${escapeHtml(t('selectOption'))}</option>`);
  }

  for (const person of state.people) {
    const selected = Number(selectedId) === Number(person.id) ? 'selected' : '';
    options.push(`<option value="${person.id}" ${selected}>${escapeHtml(person.name)}</option>`);
  }

  return options.join('');
}

function renderPeople() {
  if (!state.people.length) {
    peopleTableEl.innerHTML = `<tr><td colspan="4" class="notice">${escapeHtml(t('noPeopleAdded'))}</td></tr>`;
    return;
  }

  peopleTableEl.innerHTML = state.people
    .map(
      (person) => `
      <tr>
        <td>${escapeHtml(person.name)}</td>
        <td>${escapeHtml(person.email || '-')}</td>
        <td>${escapeHtml(person.phone || '-')}</td>
        <td>
          <div class="actions icon-actions">
            <button
              type="button"
              class="secondary icon-action-btn"
              data-role="edit-person"
              data-id="${person.id}"
              title="${escapeHtml(t('editTeamMember'))}"
              aria-label="${escapeHtml(t('editTeamMember'))}"
            >
              ${actionIcon('edit')}
            </button>
            ${
              Number(person.has_history)
                ? ''
                : `<button
                    type="button"
                    class="warn icon-action-btn"
                    data-role="delete-person"
                    data-id="${person.id}"
                    title="${escapeHtml(t('deleteTeamMember'))}"
                    aria-label="${escapeHtml(t('deleteTeamMember'))}"
                  >
                    ${actionIcon('delete')}
                  </button>`
            }
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

function renderChores() {
  if (!state.chores.length) {
    choresTableEl.innerHTML = `<tr><td colspan="5" class="notice">${escapeHtml(t('noChoresAdded'))}</td></tr>`;
    return;
  }

  choresTableEl.innerHTML = state.chores
    .map((chore) => {
      const weekdayMask = parseWeekdayMask(chore.weekday_mask);
      const schedule =
        weekdayMask.length > 0
          ? t('weekdaysLabel', { days: weekdayMask.map((weekday) => weekdayLabel(weekday)).join(', ') })
          : t('everyDaysLabel', { days: chore.interval_days });

      return `
      <tr>
        <td>
          <strong>${escapeHtml(chore.name)}</strong>
          <div class="notice">${escapeHtml(chore.description || t('noDescription'))}</div>
        </td>
        <td>${escapeHtml(schedule)}</td>
        <td>${escapeHtml(chore.due_time || '-')}</td>
        <td>${
          Number(chore.alert_enabled)
            ? `<span class="badge ok">${escapeHtml(t('badgeEnabled'))}</span>`
            : `<span class="badge warn">${escapeHtml(t('badgeDisabled'))}</span>`
        }</td>
        <td>
          <div class="actions icon-actions chore-action-row">
            <span class="badge chore-state-badge ${chore.active ? 'ok' : 'warn'}">${
              chore.active ? t('badgeActive') : t('badgeInactive')
            }</span>
            <button
              type="button"
              class="secondary icon-action-btn"
              data-role="edit-chore"
              data-id="${chore.id}"
              title="${escapeHtml(t('editChore'))}"
              aria-label="${escapeHtml(t('editChore'))}"
            >
              ${actionIcon('edit')}
            </button>
            <button
              type="button"
              class="warn icon-action-btn"
              data-role="delete-chore"
              data-id="${chore.id}"
              title="${escapeHtml(t('deleteChore'))}"
              aria-label="${escapeHtml(t('deleteChore'))}"
            >
              ${actionIcon('delete')}
            </button>
            <button
              type="button"
              class="secondary icon-action-btn"
              data-role="toggle-chore"
              data-id="${chore.id}"
              data-active="${chore.active ? 1 : 0}"
              title="${chore.active ? escapeHtml(t('pauseChore')) : escapeHtml(t('activateChore'))}"
              aria-label="${chore.active ? escapeHtml(t('pauseChore')) : escapeHtml(t('activateChore'))}"
            >
              ${chore.active ? actionIcon('pause') : actionIcon('activate')}
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');
}

function renderOverviewSummary() {
  if (!overviewSummaryEl) return;

  if (!state.overviewSummary) {
    overviewSummaryEl.innerHTML = `<p class="notice">${escapeHtml(t('noSummaryAvailable'))}</p>`;
    return;
  }

  const items = [
    { label: t('overviewTotalChores'), value: state.overviewSummary.total },
    { label: t('overviewCompleted'), value: state.overviewSummary.done },
    { label: t('overviewOpen'), value: state.overviewSummary.open },
    { label: t('overviewOverdue'), value: state.overviewSummary.overdue }
  ];

  overviewSummaryEl.innerHTML = items
    .map(
      (item) => `
        <article class="kpi">
          <p>${escapeHtml(item.label)}</p>
          <div class="value">${Number(item.value) || 0}</div>
        </article>
      `
    )
    .join('');
}

function renderOverviewPlanCards() {
  if (!overviewPlanCardsEl) return;

  if (!state.overviewPlan.length) {
    overviewPlanCardsEl.innerHTML = `<p class="notice">${escapeHtml(t('noChoresToday'))}</p>`;
    return;
  }

  overviewPlanCardsEl.innerHTML = state.overviewPlan
    .map((item) => {
      const classes = ['chore-card'];
      if (item.completion) classes.push('done');
      if (item.overdue) classes.push('overdue');

      const status = item.completion
        ? `<span class="badge ok">${escapeHtml(t('badgeDone'))}</span>`
        : item.overdue
          ? `<span class="badge warn">${escapeHtml(t('badgeOverdue'))}</span>`
          : `<span class="badge">${escapeHtml(t('badgeOpen'))}</span>`;

      const dueValue = item.due_time ? escapeHtml(item.due_time) : '';

      return `
        <article class="${classes.join(' ')}">
          <h3>${escapeHtml(item.chore_name)}</h3>
          <p>${escapeHtml(item.description || t('noDescription'))}</p>
          <p><strong>${escapeHtml(t('responsible'))}:</strong> ${escapeHtml(
            item.responsible_person?.name || t('unassigned')
          )}</p>
          <p><strong>${escapeHtml(t('deadline'))}:</strong> ${dueValue}</p>
          <p>${status}</p>
        </article>
      `;
    })
    .join('');
}

function renderOverviewAlerts() {
  if (!overviewAlertsEl) return;

  if (!state.overviewAlerts.length) {
    overviewAlertsEl.innerHTML = `<p class="notice">${escapeHtml(t('noAlertsTriggered'))}</p>`;
    return;
  }

  overviewAlertsEl.innerHTML = state.overviewAlerts
    .map(
      (alert) => `
        <article class="alert-item">
          <strong>${escapeHtml(alert.chore_name)}</strong>
          <p>${escapeHtml(alert.message)}</p>
          <p class="notice">${escapeHtml(alert.work_date)} ${escapeHtml(t('at'))} ${escapeHtml(
            new Date(alert.created_at).toLocaleString()
          )}</p>
        </article>
      `
    )
    .join('');
}

function renderOverviewWeekOwners() {
  if (!overviewWeekOwnerListEl) return;

  if (!state.overviewWeekOwners.length) {
    overviewWeekOwnerListEl.innerHTML = `<p class="notice">${escapeHtml(t('noWeekOwnersConfigured'))}</p>`;
    return;
  }

  overviewWeekOwnerListEl.innerHTML = state.overviewWeekOwners
    .map((item) => {
      const weekNumber = weekNumberFromDateKey(item.week_start);
      const ownerHtml = item.person_name
        ? `<span class="badge ok">${escapeHtml(item.person_name)}</span>`
        : `<span class="badge warn">${escapeHtml(t('unassigned'))}</span>`;

      return `
        <article class="week-owner-item">
          <strong>${escapeHtml(t('week', { week: weekNumber }))} • ${escapeHtml(formatWeekRange(item.week_start))}</strong>
          <div>${ownerHtml}</div>
          <p class="notice">${escapeHtml(t('weekStarts', { date: item.week_start }))}</p>
        </article>
      `;
    })
    .join('');
}

function renderWeekOwnerFormOptions(selectedId = null) {
  if (!state.people.length) {
    weekOwnerPersonSelect.innerHTML = `<option value="">${escapeHtml(t('noPeopleOption'))}</option>`;
    return;
  }

  weekOwnerPersonSelect.innerHTML = personOptions(selectedId, true);
}

function renderWeekOwners() {
  if (!state.weekOwners.length) {
    weekOwnerTableEl.innerHTML = `<tr><td colspan="5" class="notice">${escapeHtml(t('noWeeksLoaded'))}</td></tr>`;
    return;
  }

  weekOwnerTableEl.innerHTML = state.weekOwners
    .map((row) => {
      const assigned = Boolean(row.person_id);
      const weekNumber = weekNumberFromDateKey(row.week_start);

      return `
        <tr>
          <td>${weekNumber}</td>
          <td>${escapeHtml(row.week_start)}</td>
          <td>${escapeHtml(formatWeekRange(row.week_start))}</td>
          <td>${
            assigned
              ? `<span class="badge ok">${escapeHtml(row.person_name)}</span>`
              : `<span class="badge warn">${escapeHtml(t('unassigned'))}</span>`
          }</td>
          <td>
            <button
              type="button"
              class="secondary icon-action-btn"
              data-role="edit-week-owner"
              data-week-start="${row.week_start}"
              title="${assigned ? escapeHtml(t('changeWeekOwner')) : escapeHtml(t('assignWeekOwner'))}"
              aria-label="${assigned ? escapeHtml(t('changeWeekOwner')) : escapeHtml(t('assignWeekOwner'))}"
            >
              ${actionIcon('edit')}
            </button>
          </td>
        </tr>
      `;
    })
    .join('');
}

function assignmentSourceBadge(source) {
  switch (source) {
    case 'instance_override':
      return `<span class="badge ok">${escapeHtml(t('badgeInstanceOverride'))}</span>`;
    case 'week_owner':
      return `<span class="badge ok">${escapeHtml(t('badgeWeekOwner'))}</span>`;
    default:
      return `<span class="badge warn">${escapeHtml(t('sourceUnassigned'))}</span>`;
  }
}

function completionLabel(completion) {
  const name = completion?.completed_by_name || t('unassigned');
  const timeText = timeLabelFromIso(completion?.completed_at);
  if (!timeText) {
    return t('boardDoneBy', { name });
  }
  return t('boardDoneByAt', { name, time: timeText });
}

function renderBoardSummary({ total, done, open, overdue, unassigned }) {
  if (!boardSummaryEl) return;

  const cards = [
    { label: t('boardSummaryTotal'), value: total, tone: '' },
    { label: t('boardSummaryDone'), value: done, tone: done > 0 ? 'ok' : '' },
    { label: t('boardSummaryOpen'), value: open, tone: '' },
    { label: t('boardSummaryOverdue'), value: overdue, tone: overdue > 0 ? 'warn' : '' },
    { label: t('boardSummaryUnassigned'), value: unassigned, tone: unassigned > 0 ? 'warn' : '' }
  ];

  boardSummaryEl.innerHTML = cards
    .map(
      (card) => `
        <article class="kpi board-kpi ${card.tone}">
          <p>${escapeHtml(card.label)}</p>
          <div class="value">${Number(card.value) || 0}</div>
        </article>
      `
    )
    .join('');
}

function renderBoardTaskCards(listEl, items, emptyText) {
  if (!listEl) return;

  if (!items.length) {
    listEl.innerHTML = `<p class="notice">${escapeHtml(emptyText)}</p>`;
    return;
  }

  listEl.innerHTML = items
    .map((item) => {
      const completed = Boolean(item.completion);
      const disableAction = !completed && !item.responsible_person && !state.people.length;
      const classes = ['board-task-card'];
      if (completed) classes.push('done');
      if (!completed && item.overdue) classes.push('overdue');
      if (!item.responsible_person) classes.push('unassigned');

      const badges = [
        completed
          ? `<span class="badge ok">${escapeHtml(t('badgeDone'))}</span>`
          : item.overdue
            ? `<span class="badge warn">${escapeHtml(t('badgeOverdue'))}</span>`
            : `<span class="badge">${escapeHtml(t('badgeOpen'))}</span>`,
        assignmentSourceBadge(item.assignment_source),
        !item.responsible_person ? `<span class="badge warn">${escapeHtml(t('unassigned'))}</span>` : ''
      ]
        .filter(Boolean)
        .join('');

      const metaBits = [
        `${escapeHtml(t('responsible'))}: ${escapeHtml(item.responsible_person?.name || t('unassigned'))}`
      ];
      if (item.due_time) {
        metaBits.push(`${escapeHtml(t('deadline'))}: ${escapeHtml(item.due_time)}`);
      }
      if (completed && item.completion) {
        metaBits.push(escapeHtml(completionLabel(item.completion)));
      }

      const descriptionHtml = item.description
        ? `<p class="board-task-note">${escapeHtml(item.description)}</p>`
        : '';

      return `
        <article class="${classes.join(' ')}">
          <div class="board-task-head">
            <strong>${escapeHtml(item.chore_name)}</strong>
            <div class="board-task-badges">${badges}</div>
          </div>
          ${descriptionHtml}
          <p class="board-task-meta">${metaBits.join(' · ')}</p>
          <div class="board-task-actions">
            <button
              type="button"
              class="secondary icon-action-btn"
              data-role="toggle-completion"
              data-chore-id="${item.chore_id}"
              data-completed="${completed ? 1 : 0}"
              title="${completed ? escapeHtml(t('undoCompletion')) : escapeHtml(t('markChoreDone'))}"
              aria-label="${completed ? escapeHtml(t('undoCompletion')) : escapeHtml(t('markChoreDone'))}"
              ${disableAction ? 'disabled' : ''}
            >
              ${completed ? actionIcon('undo') : actionIcon('done')}
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderPlan() {
  renderBoardDateMeta();

  const total = state.plan.length;
  const completedItems = state.plan
    .filter((item) => Boolean(item.completion))
    .sort((a, b) => {
      const aTime = a.completion?.completed_at ? new Date(a.completion.completed_at).getTime() : 0;
      const bTime = b.completion?.completed_at ? new Date(b.completion.completed_at).getTime() : 0;
      return bTime - aTime;
    });
  const attentionItems = state.plan
    .filter((item) => !item.completion)
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      const aUnassigned = !a.responsible_person;
      const bUnassigned = !b.responsible_person;
      if (aUnassigned !== bUnassigned) return aUnassigned ? -1 : 1;
      if (a.due_time && b.due_time && a.due_time !== b.due_time) return a.due_time.localeCompare(b.due_time);
      if (a.due_time !== b.due_time) return a.due_time ? -1 : 1;
      return String(a.chore_name || '').localeCompare(String(b.chore_name || ''));
    });

  const done = completedItems.length;
  const open = attentionItems.length;
  const overdue = attentionItems.filter((item) => item.overdue).length;
  const unassigned = attentionItems.filter((item) => !item.responsible_person).length;

  renderBoardSummary({ total, done, open, overdue, unassigned });

  if (!state.plan.length) {
    renderBoardTaskCards(boardAttentionListEl, [], t('noPlanForDate'));
    renderBoardTaskCards(boardCompletedListEl, [], t('boardNoCompleted'));
    return;
  }

  renderBoardTaskCards(boardAttentionListEl, attentionItems, t('boardNoAttention'));
  renderBoardTaskCards(boardCompletedListEl, completedItems, t('boardNoCompleted'));
}

function findScheduleInstance(choreId, workDate) {
  const dayPlan = state.scheduleWeekPlans.get(workDate) || [];
  return dayPlan.find((item) => Number(item.chore_id) === Number(choreId)) || null;
}

function renderScheduleWeekPlan() {
  if (!adminWeekPlanGridEl) return;

  if (!state.scheduleWeekDates.length) {
    adminWeekPlanGridEl.innerHTML = `<p class="notice">${escapeHtml(t('noWeekDataLoaded'))}</p>`;
    return;
  }

  adminWeekPlanGridEl.innerHTML = state.scheduleWeekDates
    .map((dateKey) => {
      const dayItems = state.scheduleWeekPlans.get(dateKey) || [];
      const isToday = dateKey === todayKey();

      const listHtml = dayItems.length
        ? dayItems
            .map((item) => {
              const completed = Boolean(item.completion);
              const disabledInstance = Boolean(item.instance_disabled);
              const classes = ['admin-instance-card'];

              if (disabledInstance) {
                classes.push('instance-disabled');
              } else if (completed) {
                classes.push('done');
              } else if (item.overdue) {
                classes.push('overdue');
              }

              const statusBadge = disabledInstance
                ? `<span class="badge warn">${escapeHtml(t('badgeDisabled'))}</span>`
                : completed
                  ? `<span class="badge ok">${escapeHtml(t('badgeDone'))}</span>`
                  : item.overdue
                    ? `<span class="badge warn">${escapeHtml(t('badgeOverdue'))}</span>`
                    : `<span class="badge">${escapeHtml(t('badgeOpen'))}</span>`;
              const metaParts = [];
              if (disabledInstance) {
                metaParts.push(t('disabledForDay'));
              } else if (item.due_time) {
                metaParts.push(item.due_time);
              }
              metaParts.push(item.responsible_person?.name || t('unassigned'));
              const descriptionHtml = item.description
                ? `<p class="admin-instance-note">${escapeHtml(item.description)}</p>`
                : '';

              return `
                <article class="${classes.join(' ')}">
                  <div class="admin-instance-head">
                    <strong>${escapeHtml(item.chore_name)}</strong>
                    ${statusBadge}
                  </div>
                  ${descriptionHtml}
                  <p class="admin-instance-meta">${escapeHtml(metaParts.join(' · '))}</p>
                  <div class="admin-instance-actions">
                    <button
                      type="button"
                      class="secondary icon-action-btn"
                      data-role="edit-instance"
                      data-chore-id="${item.chore_id}"
                      data-work-date="${dateKey}"
                      title="${escapeHtml(t('editInstance'))}"
                      aria-label="${escapeHtml(t('editInstance'))}"
                    >
                      ${actionIcon('edit')}
                    </button>
                    <button
                      type="button"
                      class="secondary icon-action-btn"
                      data-role="toggle-instance-disabled"
                      data-chore-id="${item.chore_id}"
                      data-work-date="${dateKey}"
                      data-disabled="${disabledInstance ? 1 : 0}"
                      title="${disabledInstance ? escapeHtml(t('enableDayInstance')) : escapeHtml(t('disableDayInstance'))}"
                      aria-label="${disabledInstance ? escapeHtml(t('enableDayInstance')) : escapeHtml(t('disableDayInstance'))}"
                    >
                      ${disabledInstance ? actionIcon('activate') : actionIcon('pause')}
                    </button>
                  </div>
                </article>
              `;
            })
            .join('')
        : `<p class="admin-instance-empty">${escapeHtml(t('noChoresDue'))}</p>`;

      return `
        <section class="admin-week-day ${isToday ? 'is-today' : ''}">
          <header class="admin-week-day-head">
            <span>${escapeHtml(weekdayShortFromDateKey(dateKey))}</span>
            <strong>${escapeHtml(dayNumberFromDateKey(dateKey))}</strong>
          </header>
          <div class="admin-instance-list">${listHtml}</div>
        </section>
      `;
    })
    .join('');
}

function renderInstancePersonOptions(selectedId = null) {
  if (!instancePersonSelectEl) return;

  instancePersonSelectEl.innerHTML = [`<option value="">${escapeHtml(t('useScheduledOwner'))}</option>`]
    .concat(state.people.map((person) => `<option value="${person.id}">${escapeHtml(person.name)}</option>`))
    .join('');

  if (selectedId) {
    instancePersonSelectEl.value = String(selectedId);
  } else {
    instancePersonSelectEl.value = '';
  }
}

function syncInstanceDialogUi() {
  const deadlineMode = String(instanceDeadlineModeEl?.value || '');
  const isDisabled = Boolean(instanceDisabledToggleEl?.checked);
  const useCustomDeadline = deadlineMode === '1';

  if (instanceDueTimeInputEl) {
    instanceDueTimeInputEl.disabled = !useCustomDeadline;
    instanceDueTimeInputEl.required = useCustomDeadline;
  }

  if (instanceAlertToggleEl) {
    instanceAlertToggleEl.disabled = !useCustomDeadline;
    if (!useCustomDeadline) {
      instanceAlertToggleEl.checked = false;
    }
  }

  instanceDeadlineRowEl?.classList.toggle('is-muted', !useCustomDeadline);
  instanceEditFieldsEl?.classList.toggle('is-muted', isDisabled);
}

function openInstanceDialog(choreId, workDate) {
  const item = findScheduleInstance(choreId, workDate);
  if (!item) {
    setStatus(t('couldNotFindChoreInstance'), true);
    return;
  }

  const override = item.instance_override || null;

  instanceForm.reset();
  instanceForm.chore_id.value = String(item.chore_id);
  instanceForm.work_date.value = String(workDate);
  instanceForm.name.value = override?.name || '';
  instanceForm.description.value = override?.description || '';
  instanceDeadlineModeEl.value =
    override?.deadline_mode === 0 || override?.deadline_mode === 1 ? String(override.deadline_mode) : '';
  instanceDueTimeInputEl.value = override?.deadline_mode === 1 ? override?.due_time || '' : '';
  instanceAlertToggleEl.checked = override?.deadline_mode === 1 && Number(override?.alert_enabled) === 1;
  instanceDisabledToggleEl.checked = Boolean(item.instance_disabled);
  renderInstancePersonOptions(override?.person_id || null);

  instanceDialogTitleEl.textContent = t('editChoreInstance');
  instanceDialogSubtitleEl.textContent = `${t('week', {
    week: weekNumberFromDateKey(workDate)
  })} · ${dateLongLabel(workDate)}`;
  instancePreviewNameEl.textContent = item.chore_name;
  instancePreviewDateEl.textContent = `${dateLongLabel(workDate)} (${workDate})`;
  removeInstanceOverrideBtn.disabled = !item.has_instance_override;

  syncInstanceDialogUi();
  openDialog(instanceDialog);
}

function setWeekdayCheckboxes(weekdayMask) {
  const selected = new Set(parseWeekdayMask(weekdayMask));
  choreWeekdayInputs.forEach((input) => {
    input.checked = selected.has(Number.parseInt(input.value, 10));
  });
}

function selectedChoreRepeatMode() {
  const checked = choreForm.querySelector('input[name="repeat_mode"]:checked');
  return checked?.value === 'weekdays' ? 'weekdays' : 'interval';
}

function setChoreRepeatMode(mode) {
  const normalized = mode === 'weekdays' ? 'weekdays' : 'interval';
  const targetInput = choreForm.querySelector(`input[name="repeat_mode"][value="${normalized}"]`);
  if (targetInput instanceof HTMLInputElement) {
    targetInput.checked = true;
  }
}

function syncChoreRepeatModeUi() {
  const mode = selectedChoreRepeatMode();
  const isWeekdayMode = mode === 'weekdays';

  choreWeekdayInputs.forEach((input) => {
    input.disabled = !isWeekdayMode;
  });

  choreForm.interval_days.disabled = isWeekdayMode;
  choreForm.interval_days.required = !isWeekdayMode;

  if (!isWeekdayMode && !choreForm.interval_days.value) {
    choreForm.interval_days.value = '1';
  }

  choreIntervalFieldEl?.classList.toggle('is-muted', isWeekdayMode);
  choreWeekdayFieldEl?.classList.toggle('is-muted', !isWeekdayMode);
}

function syncChoreDeadlineUi() {
  const hasDeadline = Boolean(choreDeadlineToggleEl?.checked);

  choreForm.due_time.disabled = !hasDeadline;
  choreForm.due_time.required = hasDeadline;
  choreForm.alert_enabled.disabled = !hasDeadline;

  if (!hasDeadline) {
    choreForm.alert_enabled.checked = false;
  }

  choreDeadlineFieldsEl?.classList.toggle('is-muted', !hasDeadline);
}

function openPersonDialogForCreate() {
  personForm.reset();
  personForm.person_id.value = '';
  personDialogTitleEl.textContent = t('addTeamMember');
  personSubmitLabelEl.textContent = t('createMember');
  openDialog(personDialog);
}

function openPersonDialogForEdit(personId) {
  const person = state.people.find((item) => Number(item.id) === Number(personId));
  if (!person) {
    setStatus(t('couldNotFindTeamMember'), true);
    return;
  }

  personForm.reset();
  personForm.person_id.value = String(person.id);
  personForm.name.value = person.name || '';
  personForm.email.value = person.email || '';
  personForm.phone.value = person.phone || '';
  personDialogTitleEl.textContent = t('editTeamMemberTitle');
  personSubmitLabelEl.textContent = t('saveChanges');
  openDialog(personDialog);
}

function openChoreDialogForCreate() {
  choreForm.reset();
  choreForm.start_date.value = todayKey();
  choreForm.interval_days.value = '1';
  choreForm.due_time.value = '';
  choreForm.alert_enabled.checked = false;
  choreForm.active.checked = true;
  choreForm.chore_id.value = '';
  choreDeadlineToggleEl.checked = false;
  setChoreRepeatMode('interval');
  setWeekdayCheckboxes(null);
  syncChoreRepeatModeUi();
  syncChoreDeadlineUi();
  choreDialogTitleEl.textContent = t('addChore');
  choreSubmitLabelEl.textContent = t('createChore');
  openDialog(choreDialog);
}

function openChoreDialogForEdit(choreId) {
  const chore = state.chores.find((item) => Number(item.id) === Number(choreId));
  if (!chore) {
    setStatus(t('couldNotFindChore'), true);
    return;
  }

  choreForm.reset();
  choreForm.chore_id.value = String(chore.id);
  choreForm.name.value = chore.name || '';
  choreForm.interval_days.value = String(chore.interval_days || 1);
  choreForm.start_date.value = chore.start_date || todayKey();
  const hasDeadline = Boolean(chore.due_time);
  choreForm.due_time.value = chore.due_time || '';
  choreForm.alert_enabled.checked = hasDeadline && Number(chore.alert_enabled) === 1;
  choreForm.active.checked = Boolean(chore.active);
  choreDeadlineToggleEl.checked = hasDeadline;
  choreForm.description.value = chore.description || '';
  const hasWeekdays = parseWeekdayMask(chore.weekday_mask).length > 0;
  setChoreRepeatMode(hasWeekdays ? 'weekdays' : 'interval');
  setWeekdayCheckboxes(chore.weekday_mask);
  syncChoreRepeatModeUi();
  syncChoreDeadlineUi();
  choreDialogTitleEl.textContent = t('editChoreTitle');
  choreSubmitLabelEl.textContent = t('saveChanges');
  openDialog(choreDialog);
}

async function loadCoreData() {
  const [people, chores] = await Promise.all([api.getPeople(), api.getChores()]);

  state.people = people;
  state.chores = chores;

  renderPeople();
  renderChores();
  renderWeekOwnerFormOptions();
}

async function loadWeekOwners() {
  state.weekOwners = await api.getWeekOwners(state.weekViewStart, state.weekViewCount);
  renderWeekOwners();
}

async function loadOverviewData() {
  const today = todayKey();
  const overviewWeekStart = startOfWeek(today);

  const [summary, plan, alerts, weekOwners] = await Promise.all([
    api.getSummary(today),
    api.getPlan(today),
    api.getAlerts(10),
    api.getWeekOwners(overviewWeekStart, 8)
  ]);

  state.overviewSummary = summary;
  state.overviewPlan = plan;
  state.overviewAlerts = alerts;
  state.overviewWeekOwners = weekOwners;

  renderOverviewSummary();
  renderOverviewPlanCards();
  renderOverviewAlerts();
  renderOverviewWeekOwners();
}

async function loadStats() {
  const stats = await api.getStats({
    start: state.statsStart,
    end: state.statsEnd
  });
  state.stats = stats;
  if (stats?.mode && state.settings) {
    state.settings.gamification_mode = stats.mode;
    if (settingsForm?.gamification_mode) {
      settingsForm.gamification_mode.value = stats.mode;
    }
  }
  renderStats();
}

async function loadSettings() {
  state.settings = await api.getSettings();
  applyLanguage(state.settings.language);
  applySettingsToForm(state.settings);
}

async function loadPlan() {
  state.plan = await api.getPlan(state.planDate);
  renderPlan();
}

async function loadScheduleWeekPlan() {
  renderScheduleWeekHeader();
  state.scheduleWeekDates = mondayToFridayDates(state.weekViewStart);
  const plans = await Promise.all(
    state.scheduleWeekDates.map((dateKey) => api.getPlan(dateKey, { includeDisabled: true, includeBeforeStart: true }))
  );
  state.scheduleWeekPlans = new Map(state.scheduleWeekDates.map((dateKey, index) => [dateKey, plans[index] || []]));
  renderScheduleWeekPlan();
}

async function refreshScheduleSections() {
  await Promise.all([loadWeekOwners(), loadScheduleWeekPlan()]);
}

async function refreshAll({ includeStats = state.section === 'stats' } = {}) {
  await loadCoreData();
  const tasks = [refreshScheduleSections(), loadPlan(), loadOverviewData()];
  if (includeStats) {
    tasks.push(loadStats());
  }
  await Promise.all(tasks);
}

function openWeekOwnerDialogForWeek(weekStart) {
  const normalizedWeek = startOfWeek(weekStart || state.weekViewStart);
  applyWeekOwnerSelection(normalizedWeek);

  openDialog(weekOwnerDialog);
}

function updateWeekOwnerPreview(weekStart) {
  if (!weekStart) {
    weekOwnerPreviewNumberEl.textContent = t('week', { week: '' }).trim();
    weekOwnerPreviewRangeEl.textContent = '';
    return;
  }

  const weekNumber = weekNumberFromDateKey(weekStart);
  weekOwnerPreviewNumberEl.textContent = t('week', { week: weekNumber });
  weekOwnerPreviewRangeEl.textContent = formatWeekRange(weekStart);
}

function applyWeekOwnerSelection(weekStart) {
  const normalized = startOfWeek(weekStart || state.weekViewStart);
  const existing = state.weekOwners.find((item) => item.week_start === normalized);

  weekOwnerWeekInput.value = normalized;
  renderWeekOwnerFormOptions(existing?.person_id || null);

  if (existing?.person_id) {
    weekOwnerPersonSelect.value = String(existing.person_id);
  }

  removeWeekOwnerBtn.disabled = !existing;
  updateWeekOwnerPreview(normalized);
}

async function onPersonSubmit(event) {
  event.preventDefault();
  const formData = new FormData(personForm);
  const personId = Number(formData.get('person_id')) || null;
  const payload = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone')
  };

  try {
    if (personId) {
      await api.updatePerson(personId, payload);
    } else {
      await api.createPerson(payload);
    }

    personForm.reset();
    closeDialog(personDialog);
    await refreshAll();
    setStatus(personId ? t('teamMemberUpdated') : t('teamMemberAdded'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function deletePersonFromTable(personId) {
  const person = state.people.find((item) => Number(item.id) === Number(personId));
  if (!person) {
    setStatus(t('couldNotFindTeamMember'), true);
    return;
  }

  const confirmed = window.confirm(t('deletePrompt', { name: person.name }));
  if (!confirmed) {
    return;
  }

  try {
    const result = await api.deletePerson(person.id);
    await refreshAll();

    if (result?.mode === 'disabled') {
      setStatus(t('teamMemberDisabledHistory', { name: person.name }));
      return;
    }

    setStatus(t('teamMemberDeleted'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function deleteChoreFromTable(choreId) {
  const chore = state.chores.find((item) => Number(item.id) === Number(choreId));
  if (!chore) {
    setStatus(t('couldNotFindChore'), true);
    return;
  }

  const confirmed = window.confirm(t('deletePrompt', { name: chore.name }));
  if (!confirmed) {
    return;
  }

  try {
    await api.deleteChore(chore.id);
    await refreshAll();
    setStatus(t('choreDeleted'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onChoreSubmit(event) {
  event.preventDefault();
  const formData = new FormData(choreForm);
  const choreId = Number(formData.get('chore_id')) || null;
  const hasDeadline = Boolean(formData.get('has_deadline'));
  const repeatMode = String(formData.get('repeat_mode') || 'interval');
  const weekdayMask =
    repeatMode === 'weekdays'
      ? formData
          .getAll('weekday_mask')
          .map((value) => Number.parseInt(String(value), 10))
          .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
      : [];

  if (repeatMode === 'weekdays' && !weekdayMask.length) {
    setStatus(t('chooseWeekday'), true);
    return;
  }

  if (hasDeadline && !String(formData.get('due_time') || '').trim()) {
    setStatus(t('setDeadlineOrOff'), true);
    return;
  }

  const payload = {
    name: formData.get('name'),
    description: formData.get('description'),
    interval_days: repeatMode === 'weekdays' ? 1 : Number(formData.get('interval_days')) || 1,
    start_date: formData.get('start_date'),
    due_time: hasDeadline ? formData.get('due_time') || null : null,
    weekday_mask: repeatMode === 'weekdays' ? weekdayMask.join(',') : null,
    alert_enabled: hasDeadline && formData.get('alert_enabled') ? 1 : 0,
    active: formData.get('active') ? 1 : 0
  };

  try {
    if (choreId) {
      await api.updateChore(choreId, payload);
    } else {
      await api.createChore(payload);
    }

    closeDialog(choreDialog);
    await refreshAll();
    setStatus(choreId ? t('choreUpdated') : t('choreAdded'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onWeekOwnerSubmit(event) {
  event.preventDefault();
  const formData = new FormData(weekOwnerForm);
  const weekStart = startOfWeek(String(formData.get('week_start')));
  const personId = Number(formData.get('person_id'));

  if (!personId) {
    setStatus(t('selectResponsiblePerson'), true);
    return;
  }

  try {
    await api.setWeekOwner({
      week_start: weekStart,
      person_id: personId
    });

    closeDialog(weekOwnerDialog);
    await Promise.all([loadWeekOwners(), loadPlan(), loadOverviewData()]);
    setStatus(t('weekOwnerSaved'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onRemoveWeekOwner() {
  const weekStart = weekOwnerWeekInput.value;

  if (!weekStart) {
    setStatus(t('selectWeekToClear'), true);
    return;
  }

  try {
    await api.deleteWeekOwner({ week_start: weekStart });
    closeDialog(weekOwnerDialog);
    await Promise.all([loadWeekOwners(), loadPlan(), loadOverviewData()]);
    setStatus(t('weekOwnerCleared'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

function onPeopleTableClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button');
  if (!(button instanceof HTMLButtonElement)) return;

  if (button.dataset.role === 'edit-person') {
    openPersonDialogForEdit(button.dataset.id);
    return;
  }

  if (button.dataset.role === 'delete-person') {
    deletePersonFromTable(button.dataset.id);
  }
}

function onWeekOwnerTableClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button');
  if (!(button instanceof HTMLButtonElement)) return;
  if (button.dataset.role !== 'edit-week-owner') return;

  openWeekOwnerDialogForWeek(button.dataset.weekStart);
}

async function onToggleCompletion(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button');
  if (!(button instanceof HTMLButtonElement)) return;
  if (button.dataset.role !== 'toggle-completion') return;

  const choreId = Number(button.dataset.choreId);
  const isCompleted = button.dataset.completed === '1';

  try {
    if (isCompleted) {
      await api.unmarkDone({ chore_id: choreId, work_date: state.planDate });
    } else {
      const item = state.plan.find((entry) => Number(entry.chore_id) === choreId);
      const completedBy = item?.responsible_person?.id || state.people[0]?.id;

      if (!completedBy) {
        setStatus(t('noPersonForCompletion'), true);
        return;
      }

      await api.markDone({
        chore_id: choreId,
        work_date: state.planDate,
        completed_by: completedBy
      });
    }

    await Promise.all([loadPlan(), loadOverviewData()]);
    setStatus(isCompleted ? t('completionRemoved') : t('choreMarkedComplete'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onToggleChore(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button');
  if (!(button instanceof HTMLButtonElement)) return;

  if (button.dataset.role === 'edit-chore') {
    openChoreDialogForEdit(button.dataset.id);
    return;
  }

  if (button.dataset.role === 'delete-chore') {
    deleteChoreFromTable(button.dataset.id);
    return;
  }

  if (button.dataset.role !== 'toggle-chore') return;

  const choreId = Number(button.dataset.id);
  const active = button.dataset.active === '1';

  try {
    await api.updateChore(choreId, { active: active ? 0 : 1 });
    await Promise.all([loadCoreData(), loadPlan(), loadOverviewData()]);
    setStatus(t('choreStatusUpdated'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onInstanceSubmit(event) {
  event.preventDefault();
  const formData = new FormData(instanceForm);
  const choreId = Number(formData.get('chore_id'));
  const workDate = String(formData.get('work_date') || '');
  const deadlineModeRaw = String(formData.get('deadline_mode') || '');
  const deadlineMode = deadlineModeRaw === '' ? null : Number(deadlineModeRaw);
  const dueTime = deadlineMode === 1 ? String(formData.get('due_time') || '').trim() : null;

  if (!choreId || !workDate) {
    setStatus(t('missingChoreInstanceInfo'), true);
    return;
  }

  if (deadlineMode === 1 && !dueTime) {
    setStatus(t('setCustomDeadlineOrMode'), true);
    return;
  }

  try {
    await api.setInstanceOverride({
      chore_id: choreId,
      work_date: workDate,
      name: String(formData.get('name') || '').trim() || null,
      description: String(formData.get('description') || '').trim() || null,
      deadline_mode: deadlineMode,
      due_time: dueTime,
      alert_enabled: deadlineMode === 1 ? (formData.get('alert_enabled') ? 1 : 0) : null,
      person_id: formData.get('person_id') ? Number(formData.get('person_id')) : null,
      disabled: formData.get('disabled') ? 1 : 0
    });

    closeDialog(instanceDialog);
    await Promise.all([loadScheduleWeekPlan(), loadPlan(), loadOverviewData()]);
    setStatus(formData.get('disabled') ? t('choreInstanceDisabledForDay') : t('choreInstanceSaved'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onRemoveInstanceOverride() {
  const choreId = Number(instanceForm.chore_id.value);
  const workDate = String(instanceForm.work_date.value || '');

  if (!choreId || !workDate) {
    setStatus(t('missingChoreInstanceInfo'), true);
    return;
  }

  try {
    await api.deleteInstanceOverride({
      chore_id: choreId,
      work_date: workDate
    });
    closeDialog(instanceDialog);
    await Promise.all([loadScheduleWeekPlan(), loadPlan(), loadOverviewData()]);
    setStatus(t('instanceOverrideReset'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onScheduleWeekPlanClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button');
  if (!(button instanceof HTMLButtonElement)) return;

  const choreId = Number(button.dataset.choreId);
  const workDate = String(button.dataset.workDate || '');
  if (!choreId || !workDate) return;

  if (button.dataset.role === 'edit-instance') {
    openInstanceDialog(choreId, workDate);
    return;
  }

  if (button.dataset.role !== 'toggle-instance-disabled') return;

  const item = findScheduleInstance(choreId, workDate);
  if (!item) {
    setStatus(t('couldNotFindChoreInstance'), true);
    return;
  }

  const existing = item.instance_override || null;
  const existingDeadlineMode =
    existing?.deadline_mode === 0 || existing?.deadline_mode === 1 ? Number(existing.deadline_mode) : null;
  const existingAlert =
    existingDeadlineMode === 1 && (existing?.alert_enabled === 0 || existing?.alert_enabled === 1)
      ? Number(existing.alert_enabled)
      : null;
  const willDisable = button.dataset.disabled !== '1';

  try {
    await api.setInstanceOverride({
      chore_id: choreId,
      work_date: workDate,
      name: existing?.name || null,
      description: existing?.description || null,
      deadline_mode: existingDeadlineMode,
      due_time: existingDeadlineMode === 1 ? existing?.due_time || null : null,
      alert_enabled: existingAlert,
      person_id: existing?.person_id ? Number(existing.person_id) : null,
      disabled: willDisable ? 1 : 0
    });

    await Promise.all([loadScheduleWeekPlan(), loadPlan(), loadOverviewData()]);
    setStatus(willDisable ? t('choreInstanceDisabledForDay') : t('choreInstanceEnabledForDay'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function onSettingsSubmit(event) {
  event.preventDefault();
  const formData = new FormData(settingsForm);
  const smtpPortRaw = String(formData.get('smtp_port') || '').trim();

  try {
    const updated = await api.updateSettings({
      language: String(formData.get('language') || 'en'),
      gamification_mode: String(formData.get('gamification_mode') || 'friendly'),
      deadline_alerts_enabled: formData.get('deadline_alerts_enabled') ? 1 : 0,
      weekly_owner_alert_enabled: formData.get('weekly_owner_alert_enabled') ? 1 : 0,
      alert_webhook_url: String(formData.get('alert_webhook_url') || '').trim(),
      sms_gateway_url: String(formData.get('sms_gateway_url') || '').trim(),
      smtp_host: String(formData.get('smtp_host') || '').trim(),
      smtp_port: smtpPortRaw ? Number(smtpPortRaw) : 587,
      smtp_secure: formData.get('smtp_secure') ? 1 : 0,
      smtp_user: String(formData.get('smtp_user') || '').trim(),
      smtp_pass: String(formData.get('smtp_pass') || ''),
      smtp_from: String(formData.get('smtp_from') || '').trim()
    });

    state.settings = updated;
    applySettingsToForm(updated);
    applyLanguage(updated.language);
    await loadStats();
    closeDialog(settingsDialog);
    setStatus(t('alertSettingsUpdated'));
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function reloadStatsFromInputs() {
  if (state.statsStart > state.statsEnd) {
    const swap = state.statsStart;
    state.statsStart = state.statsEnd;
    state.statsEnd = swap;
  }

  syncStatsInputs({ setRangeValue: true });
  await loadStats();
}

function attachDialogCloseHandlers() {
  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => {
      const dialogId = button.getAttribute('data-close-dialog');
      const dialogEl = document.getElementById(dialogId);
      closeDialog(dialogEl);
    });
  });
}

async function runBackgroundRefresh() {
  try {
    await refreshAll();
  } catch {
    // Keep background refresh silent.
  }
}

function startAutoRefresh() {
  setInterval(() => {
    runBackgroundRefresh();
  }, 45000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      refreshAll().catch(() => {});
    }
  });

  window.addEventListener('focus', () => {
    refreshAll().catch(() => {});
  });
}

async function init() {
  applyLanguage('en');
  applySection();

  state.planDate = todayKey();
  state.weekViewStart = startOfWeek(todayKey());
  state.weekViewCount = Number(weekViewCountSelect.value) || 8;
  state.statsEnd = todayKey();
  applyStatsRange(30, { anchorEnd: state.statsEnd });

  setPlanDate(state.planDate);
  setWeekViewStart(state.weekViewStart);
  weekOwnerWeekInput.value = state.weekViewStart;

  choreForm.start_date.value = todayKey();
  choreForm.alert_enabled.checked = false;
  choreForm.active.checked = true;
  choreDeadlineToggleEl.checked = false;
  if (instanceDeadlineModeEl) {
    instanceDeadlineModeEl.value = '';
  }
  if (instanceDisabledToggleEl) {
    instanceDisabledToggleEl.checked = false;
  }
  setChoreRepeatMode('interval');
  syncChoreRepeatModeUi();
  syncChoreDeadlineUi();
  syncInstanceDialogUi();

  attachDialogCloseHandlers();

  try {
    await loadSettings();
    await refreshAll();
    startAutoRefresh();
  } catch (error) {
    setStatus(t('failedLoadData', { error: error.message }), true);
  }
}

personForm.addEventListener('submit', onPersonSubmit);
choreForm.addEventListener('submit', onChoreSubmit);
weekOwnerForm.addEventListener('submit', onWeekOwnerSubmit);
if (instanceForm) {
  instanceForm.addEventListener('submit', onInstanceSubmit);
}
if (settingsForm) {
  settingsForm.addEventListener('submit', onSettingsSubmit);
}

removeWeekOwnerBtn.addEventListener('click', onRemoveWeekOwner);

peopleTableEl.addEventListener('click', onPeopleTableClick);
weekOwnerTableEl.addEventListener('click', onWeekOwnerTableClick);
if (boardSectionEl) {
  boardSectionEl.addEventListener('click', onToggleCompletion);
}
choresTableEl.addEventListener('click', onToggleChore);
if (adminWeekPlanGridEl) {
  adminWeekPlanGridEl.addEventListener('click', onScheduleWeekPlanClick);
}

openPersonDialogBtn.addEventListener('click', () => {
  openPersonDialogForCreate();
});

openChoreDialogBtn.addEventListener('click', () => {
  openChoreDialogForCreate();
});

if (openSettingsDialogBtn) {
  openSettingsDialogBtn.addEventListener('click', () => {
    if (state.settings) {
      applySettingsToForm(state.settings);
    } else {
      loadSettings().catch(() => {});
    }
    openDialog(settingsDialog);
  });
}

if (settingsLanguageSelectEl) {
  settingsLanguageSelectEl.addEventListener('change', () => {
    applyLanguage(settingsLanguageSelectEl.value || state.language);
  });
}

if (settingsDialog) {
  settingsDialog.addEventListener('close', () => {
    const persistedLanguage = normalizeLanguage(state.settings?.language || state.language);
    if (state.language !== persistedLanguage) {
      applyLanguage(persistedLanguage);
    }
    if (settingsLanguageSelectEl) {
      settingsLanguageSelectEl.value = persistedLanguage;
    }
  });
}

choreRepeatModeInputs.forEach((input) => {
  input.addEventListener('change', () => {
    syncChoreRepeatModeUi();
  });
});

if (choreDeadlineToggleEl) {
  choreDeadlineToggleEl.addEventListener('change', () => {
    syncChoreDeadlineUi();
  });
}

if (instanceDeadlineModeEl) {
  instanceDeadlineModeEl.addEventListener('change', () => {
    syncInstanceDialogUi();
  });
}

if (instanceDisabledToggleEl) {
  instanceDisabledToggleEl.addEventListener('change', () => {
    syncInstanceDialogUi();
  });
}

if (removeInstanceOverrideBtn) {
  removeInstanceOverrideBtn.addEventListener('click', onRemoveInstanceOverride);
}

if (openWeekOwnerDialogBtn) {
  openWeekOwnerDialogBtn.addEventListener('click', () => {
    openWeekOwnerDialogForWeek(state.weekViewStart);
  });
}

weekViewStartInput.addEventListener('change', () => {
  setWeekViewStart(weekViewStartInput.value || todayKey());
  refreshScheduleSections().catch((error) => setStatus(error.message, true));
});

if (instanceWeekStartInput) {
  instanceWeekStartInput.addEventListener('change', () => {
    setWeekViewStart(instanceWeekStartInput.value || todayKey());
    refreshScheduleSections().catch((error) => setStatus(error.message, true));
  });
}

if (instanceWeekPrevBtn) {
  instanceWeekPrevBtn.addEventListener('click', () => {
    setWeekViewStart(addDays(state.weekViewStart, -7));
    refreshScheduleSections().catch((error) => setStatus(error.message, true));
  });
}

if (instanceWeekNextBtn) {
  instanceWeekNextBtn.addEventListener('click', () => {
    setWeekViewStart(addDays(state.weekViewStart, 7));
    refreshScheduleSections().catch((error) => setStatus(error.message, true));
  });
}

weekViewCountSelect.addEventListener('change', () => {
  state.weekViewCount = Number(weekViewCountSelect.value) || 8;
  loadWeekOwners().catch((error) => setStatus(error.message, true));
});

planDateInput.addEventListener('change', () => {
  setPlanDate(planDateInput.value || todayKey());
  // Force native date pickers to collapse after selection on browsers that keep them open.
  planDateInput.blur();
  loadPlan().catch((error) => setStatus(error.message, true));
});

if (planDatePrevBtn) {
  planDatePrevBtn.addEventListener('click', () => {
    setPlanDate(addDays(state.planDate, -1));
    loadPlan().catch((error) => setStatus(error.message, true));
  });
}

if (planDateNextBtn) {
  planDateNextBtn.addEventListener('click', () => {
    setPlanDate(addDays(state.planDate, 1));
    loadPlan().catch((error) => setStatus(error.message, true));
  });
}

if (planDatePickerBtn) {
  planDatePickerBtn.addEventListener('click', () => {
    // Use the same open path as direct field interaction for consistent close behavior.
    planDateInput.focus();
    planDateInput.click();
  });
}

if (statsRangeDaysSelect) {
  statsRangeDaysSelect.addEventListener('change', () => {
    const value = String(statsRangeDaysSelect.value || 'custom');
    if (value === 'custom') {
      state.statsRangeDays = 0;
      syncStatsInputs({ setRangeValue: true });
      return;
    }

    applyStatsRange(Number(value), { anchorEnd: state.statsEnd });
    loadStats().catch((error) => setStatus(error.message, true));
  });
}

if (statsStartInput) {
  statsStartInput.addEventListener('change', () => {
    state.statsStart = statsStartInput.value || state.statsStart;
    state.statsRangeDays = 0;
    reloadStatsFromInputs().catch((error) => setStatus(error.message, true));
  });
}

if (statsEndInput) {
  statsEndInput.addEventListener('change', () => {
    state.statsEnd = statsEndInput.value || state.statsEnd;
    state.statsRangeDays = 0;
    reloadStatsFromInputs().catch((error) => setStatus(error.message, true));
  });
}

weekOwnerWeekInput.addEventListener('change', () => {
  applyWeekOwnerSelection(weekOwnerWeekInput.value || state.weekViewStart);
});

init();
