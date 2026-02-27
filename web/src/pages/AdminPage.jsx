import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Check,
  ClipboardCheck,
  ListTodo,
  Users,
} from 'lucide-react';
import {
  addDays,
  api,
  formatWeekRange,
  localDateFromKey,
  mondayToFridayDates,
  startOfWeek,
  todayKey,
  weekNumberFromDateKey
} from '@/lib/api';
import { localeForLanguage, normalizeLanguage, tr } from '@/lib/i18n';
import { AdminLayout } from '@/pages/admin/components/AdminLayout';
import {
  BoardSection,
  ChoresSection,
  OverviewSection,
  ScheduleSection,
  StatsSection,
  TeamSection
} from '@/pages/admin/components/AdminSections';
import { AdminDialogs } from '@/pages/admin/components/AdminDialogs';

const TEXT = {
  en: {
    appSubtitle: 'Gjøremåloppfølging',
    overview: 'Overview',
    stats: 'Statistics',
    team: 'Team Members',
    chores: 'Chores',
    schedule: 'Schedule',
    board: 'Daily Operations',
    sectionOverviewTitle: 'Overview',
    sectionOverviewSubtitle: 'Planning status and operational risk at a glance',
    sectionStatsTitle: 'Statistics',
    sectionStatsSubtitle: 'Performance ranking and trend over time',
    sectionTeamTitle: 'Team Members',
    sectionTeamSubtitle: 'Employees available for assignments',
    sectionChoresTitle: 'Chores',
    sectionChoresSubtitle: 'Cadence, deadlines, and per-chore alerts',
    sectionScheduleTitle: 'Schedule',
    sectionScheduleSubtitle: 'Week ownership and per-day instance overrides',
    sectionBoardTitle: 'Daily Operations Board',
    sectionBoardSubtitle: 'Execution board for selected date',
    todayGlance: 'Today',
    todayChores: "Today's chores",
    deadlineAlerts: 'Deadline alerts',
    upcomingWeeks: 'Upcoming weeks',
    addMember: 'Add member',
    addChore: 'Add chore',
    weekResponsibility: 'Week responsibility view',
    weeklyInstance: 'Weekly instance plan',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    pause: 'Pause',
    activate: 'Activate',
    markDone: 'Mark done',
    undoDone: 'Undo completion',
    unassigned: 'Unassigned',
    noDescription: 'No description',
    noDeadline: 'No deadline',
    noData: 'No data',
    noChores: 'No chores found',
    noPeople: 'No people found',
    noAlerts: 'No alerts',
    noWeekOwners: 'No week owners configured',
    noPlan: 'No plan for selected date',
    noDue: 'No chores due',
    done: 'Done',
    open: 'Open',
    overdue: 'Overdue',
    disabled: 'Disabled',
    active: 'Active',
    inactive: 'Inactive',
    responsible: 'Responsible',
    deadline: 'Deadline',
    date: 'Date',
    startWeek: 'Start week (Monday)',
    weeksShown: 'Weeks shown',
    weekStart: 'Week start',
    weekNumber: 'Week',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    previousDay: 'Previous day',
    nextDay: 'Next day',
    completionRate: 'Completion',
    total: 'Total',
    completed: 'Completed',
    addEditMember: 'Team member',
    addEditChore: 'Chore',
    assignWeekOwner: 'Assign week owner',
    editInstance: 'Edit chore instance',
    settings: 'Settings',
    colorScheme: 'Color scheme',
    language: 'Language',
    english: 'English',
    norwegian: 'Norwegian',
    gamification: 'Gamification',
    friendly: 'Friendly',
    hardcore: 'Hardcore',
    weekOwnerReminder: 'Weekly owner reminder (Mon 08:00)',
    deadlineAlertsEnabled: 'Deadline alerts enabled',
    doneBy: 'Done by {name}',
    doneByAt: 'Done by {name} at {time}',
    everyDays: 'Every {days} day(s)',
    weekdays: 'Weekdays: {days}',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
    dueIfMissed: 'Alert when missed',
    useDeadline: 'Use specific deadline time',
    intervalMode: 'Every X days',
    weekdaysMode: 'Specific weekdays',
    failedLoad: 'Failed to load: {error}',
    fallbackOwner: 'Use scheduled owner',
    disableInstance: 'Disable this single instance',
    resetOverride: 'Reset override',
    from: 'From',
    to: 'To',
    range: 'Range',
    dayRange: '{days} days',
    custom: 'Custom',
    leaderboard: 'Leaderboard',
    weeklyMomentum: 'Weekly momentum',
    source: 'Source',
    sourceWeekOwner: 'Week owner',
    sourceOverride: 'Instance override',
    sourceUnassigned: 'Unassigned',
    chooseWeekday: 'Choose at least one weekday',
    required: 'Required',
    launchIpad: 'Open iPad view',
    launchIphone: 'Open iPhone view',
    placeHolderName: 'Name',
    placeHolderEmail: 'Email',
    placeHolderPhone: 'Phone',
    placeHolderDescription: 'Description',
    choosePerson: 'Choose person',
    actions: 'Actions',
    alerts: 'Alerts',
    on: 'On',
    off: 'Off',
    startDate: 'Start date',
    scheduleMode: 'Schedule mode',
    intervalDays: 'Interval days',
    weekdaysLabel: 'Weekdays',
    description: 'Description',
    nameOverride: 'Name override',
    descriptionOverride: 'Description override',
    deadlineMode: 'Deadline mode',
    useChoreDefault: 'Use chore default',
    noDeadlineThisDay: 'No deadline this day',
    customDeadline: 'Custom deadline',
    assigned: 'Assigned',
    score: 'Score',
    ownDone: 'Own done',
    ownRate: 'Own rate',
    onTime: 'On time',
    streak: 'Streak',
    refresh: 'Refresh',
    alertWebhookUrl: 'Alert webhook URL',
    smsApiGatewayUrl: 'SMS API gateway URL',
    smsApiUsername: 'SMS API username',
    smsApiPassword: 'SMS API password',
    smsMessageType: 'SMS message type',
    smtpHost: 'SMTP host',
    smtpPort: 'SMTP port',
    smtpUser: 'SMTP user (optional)',
    smtpPass: 'SMTP pass (optional)',
    smtpFrom: 'SMTP from',
    smtpSecure: 'SMTP secure',
    testEmailTo: 'Test email to',
    testSmsTo: 'Test SMS to',
    testSmsMessage: 'Test SMS message',
    sendTestEmail: 'Send test email',
    sendTestSms: 'Send test SMS',
    sending: 'Sending...',
    testSuccess: 'Test sent successfully',
    testFailed: 'Test failed',
    loading: 'Loading...'
  },
  no: {
    appSubtitle: 'Gjøremåloppfølging',
    overview: 'Oversikt',
    stats: 'Statistikk',
    team: 'Ansatte',
    chores: 'Gjøremål',
    schedule: 'Planlegging',
    board: 'Gjennomføring',
    sectionOverviewTitle: 'Oversikt',
    sectionOverviewSubtitle: 'Status og operasjonell risiko',
    sectionStatsTitle: 'Statistikk',
    sectionStatsSubtitle: 'Ytelse og utvikling over tid',
    sectionTeamTitle: 'Ansatte',
    sectionTeamSubtitle: 'Personer som kan tildeles',
    sectionChoresTitle: 'Gjøremål',
    sectionChoresSubtitle: 'Intervall, frist og varsling',
    sectionScheduleTitle: 'Planlegging',
    sectionScheduleSubtitle: 'Ukeansvar og instansoverstyring',
    sectionBoardTitle: 'Gjennomføring',
    sectionBoardSubtitle: 'Oppfølging for valgt dato',
    todayGlance: 'I dag',
    todayChores: 'Dagens gjøremål',
    deadlineAlerts: 'Fristvarsler',
    upcomingWeeks: 'Kommende uker',
    addMember: 'Legg til ansatt',
    addChore: 'Legg til gjøremål',
    weekResponsibility: 'Ansvarlig',
    weeklyInstance: 'Ukeplan',
    save: 'Lagre',
    cancel: 'Avbryt',
    edit: 'Rediger',
    delete: 'Slett',
    pause: 'Pause',
    activate: 'Aktiver',
    markDone: 'Marker fullført',
    undoDone: 'Angre fullføring',
    unassigned: 'Ikke tildelt',
    noDescription: 'Ingen beskrivelse',
    noDeadline: '',
    noData: 'Ingen data',
    noChores: 'Ingen gjøremål',
    noPeople: 'Ingen ansatte',
    noAlerts: 'Ingen varsler',
    noWeekOwners: 'Ingen ukeansvar satt',
    noPlan: 'Ingen plan for valgt dato',
    noDue: 'Ingen gjøremål',
    done: 'Fullført',
    open: 'Åpen',
    overdue: 'Forsinket',
    disabled: 'Deaktivert',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    responsible: 'Ansvarlig',
    deadline: 'Frist',
    date: 'Dato',
    startWeek: 'Startuke (mandag)',
    weeksShown: 'Antall uker',
    weekStart: 'Ukestart',
    weekNumber: 'Uke',
    previousWeek: 'Forrige uke',
    nextWeek: 'Neste uke',
    previousDay: 'Forrige dag',
    nextDay: 'Neste dag',
    completionRate: 'Fullføring',
    total: 'Totalt',
    completed: 'Fullført',
    addEditMember: 'Ansatt',
    addEditChore: 'Gjøremål',
    assignWeekOwner: 'Sett ukeansvar',
    editInstance: 'Rediger instans',
    settings: 'Innstillinger',
    colorScheme: 'Fargeskjema',
    language: 'Språk',
    english: 'Engelsk',
    norwegian: 'Norsk',
    gamification: 'Gamification',
    friendly: 'Vennlig',
    hardcore: 'Hardcore',
    weekOwnerReminder: 'Ukevarsel (man 08:00)',
    deadlineAlertsEnabled: 'Fristvarsler aktiv',
    doneBy: 'Fullført av {name}',
    doneByAt: 'Fullført av {name} kl {time}',
    everyDays: 'Hver {days}. dag',
    weekdays: 'Ukedager: {days}',
    mon: 'Man',
    tue: 'Tir',
    wed: 'Ons',
    thu: 'Tor',
    fri: 'Fre',
    sat: 'Lør',
    sun: 'Søn',
    dueIfMissed: 'Varsle ved brudd',
    useDeadline: 'Bruk spesifikk frist',
    intervalMode: 'Hver X dag',
    weekdaysMode: 'Faste ukedager',
    failedLoad: 'Kunne ikke laste: {error}',
    fallbackOwner: 'Bruk planlagt ansvarlig',
    disableInstance: 'Deaktiver denne instansen',
    resetOverride: 'Nullstill overstyring',
    from: 'Fra',
    to: 'Til',
    range: 'Periode',
    dayRange: '{days} dager',
    custom: 'Tilpasset',
    leaderboard: 'Rangering',
    weeklyMomentum: 'Ukentlig utvikling',
    source: 'Kilde',
    sourceWeekOwner: 'Ukeansvar',
    sourceOverride: 'Instansoverstyring',
    sourceUnassigned: 'Ikke tildelt',
    chooseWeekday: 'Velg minst én ukedag',
    required: 'Påkrevd',
    launchIpad: 'Åpne iPad-visning',
    launchIphone: 'Åpne iPhone-visning',
    placeHolderName: 'Navn',
    placeHolderEmail: 'E-post',
    placeHolderPhone: 'Telefon',
    placeHolderDescription: 'Beskrivelse',
    choosePerson: 'Velg person',
    actions: 'Handlinger',
    alerts: 'Varsler',
    on: 'På',
    off: 'Av',
    startDate: 'Startdato',
    scheduleMode: 'Planmodus',
    intervalDays: 'Intervall dager',
    weekdaysLabel: 'Ukedager',
    description: 'Beskrivelse',
    nameOverride: 'Navneoverstyring',
    descriptionOverride: 'Beskrivelse-overstyring',
    deadlineMode: 'Fristmodus',
    useChoreDefault: 'Bruk standard fra gjøremål',
    noDeadlineThisDay: 'Ingen frist denne dagen',
    customDeadline: 'Tilpasset frist',
    assigned: 'Tildelt',
    score: 'Poeng',
    ownDone: 'Egne fullført',
    ownRate: 'Egenandel',
    onTime: 'I tide',
    streak: 'Streak',
    refresh: 'Oppdater',
    alertWebhookUrl: 'Varsel-webhook URL',
    smsApiGatewayUrl: 'SMS API gateway URL',
    smsApiUsername: 'SMS API brukernavn',
    smsApiPassword: 'SMS API passord',
    smsMessageType: 'SMS meldingstype',
    smtpHost: 'SMTP vert',
    smtpPort: 'SMTP port',
    smtpUser: 'SMTP bruker (valgfri)',
    smtpPass: 'SMTP passord (valgfritt)',
    smtpFrom: 'SMTP fra',
    smtpSecure: 'SMTP sikker',
    testEmailTo: 'Test e-post til',
    testSmsTo: 'Test SMS til',
    testSmsMessage: 'Test SMS-melding',
    sendTestEmail: 'Send test e-post',
    sendTestSms: 'Send test SMS',
    sending: 'Sender...',
    testSuccess: 'Test sendt',
    testFailed: 'Test feilet',
    loading: 'Laster...'
  }
};

const sectionMeta = {
  overview: { title: 'sectionOverviewTitle', subtitle: 'sectionOverviewSubtitle' },
  stats: { title: 'sectionStatsTitle', subtitle: 'sectionStatsSubtitle' },
  team: { title: 'sectionTeamTitle', subtitle: 'sectionTeamSubtitle' },
  chores: { title: 'sectionChoresTitle', subtitle: 'sectionChoresSubtitle' },
  schedule: { title: 'sectionScheduleTitle', subtitle: 'sectionScheduleSubtitle' },
  board: { title: 'sectionBoardTitle', subtitle: 'sectionBoardSubtitle' }
};

function toWeekdaySet(mask) {
  if (!mask) return new Set();
  return new Set(
    String(mask)
      .split(',')
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6)
  );
}

function padTime(iso, locale) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function AdminPage() {
  const navigate = useNavigate();
  const params = useParams();
  const section = sectionMeta[params.section] ? params.section : 'overview';

  const [language, setLanguage] = useState('en');
  const [settings, setSettings] = useState(null);
  const [people, setPeople] = useState([]);
  const [chores, setChores] = useState([]);
  const [overviewSummary, setOverviewSummary] = useState(null);
  const [overviewPlan, setOverviewPlan] = useState([]);
  const [overviewAlerts, setOverviewAlerts] = useState([]);
  const [overviewWeekOwners, setOverviewWeekOwners] = useState([]);
  const [weekOwners, setWeekOwners] = useState([]);
  const [planDate, setPlanDate] = useState(todayKey());
  const [plan, setPlan] = useState([]);
  const [weekViewStart, setWeekViewStart] = useState(startOfWeek(todayKey()));
  const [weekViewCount, setWeekViewCount] = useState(8);
  const [weekPlans, setWeekPlans] = useState({});
  const [statsRange, setStatsRange] = useState(30);
  const [statsStart, setStatsStart] = useState(addDays(todayKey(), -29));
  const [statsEnd, setStatsEnd] = useState(todayKey());
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState(null);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [personForm, setPersonForm] = useState({ id: null, name: '', email: '', phone: '' });
  const [choreDialogOpen, setChoreDialogOpen] = useState(false);
  const [choreForm, setChoreForm] = useState({
    id: null,
    name: '',
    description: '',
    start_date: todayKey(),
    repeat_mode: 'interval',
    interval_days: 1,
    weekday_mask: new Set(),
    has_deadline: false,
    due_time: '',
    alert_enabled: false,
    active: true
  });
  const [weekOwnerDialogOpen, setWeekOwnerDialogOpen] = useState(false);
  const [weekOwnerForm, setWeekOwnerForm] = useState({ week_start: weekViewStart, person_id: '' });
  const [instanceDialogOpen, setInstanceDialogOpen] = useState(false);
  const [instanceForm, setInstanceForm] = useState({
    chore_id: null,
    work_date: '',
    name: '',
    description: '',
    person_id: '',
    disabled: false,
    deadline_mode: '',
    due_time: '',
    alert_enabled: false,
    has_override: false
  });

  const t = (key, vars = {}) => tr(TEXT, language, key, vars);
  const locale = localeForLanguage(language);

  const navItems = useMemo(
    () => [
      { key: 'overview', label: t('overview'), icon: ClipboardCheck },
      { key: 'stats', label: t('stats'), icon: BarChart3 },
      { key: 'team', label: t('team'), icon: Users },
      { key: 'chores', label: t('chores'), icon: ListTodo },
      { key: 'schedule', label: t('schedule'), icon: CalendarDays },
      { key: 'board', label: t('board'), icon: Check }
    ],
    [language]
  );

  const pageTitle = t(sectionMeta[section].title);
  const pageSubtitle = t(sectionMeta[section].subtitle);

  const boardAttention = useMemo(() => {
    return plan
      .filter((item) => !item.completion)
      .sort((a, b) => {
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
        const aUnassigned = !a.responsible_person;
        const bUnassigned = !b.responsible_person;
        if (aUnassigned !== bUnassigned) return aUnassigned ? -1 : 1;
        return String(a.chore_name).localeCompare(String(b.chore_name));
      });
  }, [plan]);

  const boardCompleted = useMemo(() => {
    return plan
      .filter((item) => item.completion)
      .sort((a, b) => {
        const aTs = a.completion?.completed_at ? new Date(a.completion.completed_at).getTime() : 0;
        const bTs = b.completion?.completed_at ? new Date(b.completion.completed_at).getTime() : 0;
        return bTs - aTs;
      });
  }, [plan]);

  const boardSummary = useMemo(() => {
    const total = plan.length;
    const done = boardCompleted.length;
    const open = boardAttention.length;
    const overdue = boardAttention.filter((item) => item.overdue).length;
    const unassigned = boardAttention.filter((item) => !item.responsible_person).length;
    return { total, done, open, overdue, unassigned };
  }, [plan, boardAttention, boardCompleted]);

  async function loadSettings() {
    const next = await api.getSettings();
    setSettings(next);
    setSettingsForm(next);
    setLanguage(normalizeLanguage(next.language));
  }

  async function loadCore() {
    const [peopleRows, choreRows] = await Promise.all([api.getPeople(), api.getChores()]);
    setPeople(peopleRows);
    setChores(choreRows);
  }

  async function loadOverview() {
    const today = todayKey();
    const weekStart = startOfWeek(today);
    const [summary, planRows, alertsRows, weekOwnerRows] = await Promise.all([
      api.getSummary(today),
      api.getPlan(today),
      api.getAlerts(10),
      api.getWeekOwners(weekStart, 8)
    ]);
    setOverviewSummary(summary);
    setOverviewPlan(planRows);
    setOverviewAlerts(alertsRows);
    setOverviewWeekOwners(weekOwnerRows);
  }

  async function loadWeekOwners() {
    const rows = await api.getWeekOwners(weekViewStart, weekViewCount);
    setWeekOwners(rows);
  }

  async function loadPlan() {
    const rows = await api.getPlan(planDate);
    setPlan(rows);
  }

  async function loadWeekPlan() {
    const days = mondayToFridayDates(weekViewStart);
    const plans = await Promise.all(
      days.map((day) => api.getPlan(day, { includeDisabled: true, includeBeforeStart: true }))
    );

    const mapped = {};
    days.forEach((day, index) => {
      mapped[day] = plans[index] || [];
    });
    setWeekPlans(mapped);
  }

  async function loadStats() {
    const rows = await api.getStats({ start: statsStart, end: statsEnd });
    setStats(rows);
  }

  async function refreshAll({ includeStats = true } = {}) {
    setError('');
    await loadCore();
    await Promise.all([loadOverview(), loadWeekOwners(), loadPlan(), loadWeekPlan(), includeStats ? loadStats() : Promise.resolve()]);
  }

  async function refreshPlanningViews({ includeStats = false, includeWeekOwners = false } = {}) {
    const jobs = [loadPlan(), loadOverview(), loadWeekPlan()];
    if (includeWeekOwners) {
      jobs.push(loadWeekOwners());
    }
    if (includeStats && section === 'stats') {
      jobs.push(loadStats());
    }
    await Promise.all(jobs);
  }

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        setLoading(true);
        await loadSettings();
        await refreshAll({ includeStats: true });
      } catch (err) {
        if (mounted) {
          setError(t('failedLoad', { error: err.message }));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    boot();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    loadWeekOwners().catch((err) => setError(err.message));
    loadWeekPlan().catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekViewStart, weekViewCount]);

  useEffect(() => {
    if (loading) return;
    loadPlan().catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planDate]);

  useEffect(() => {
    if (section === 'stats' && !loading) {
      loadStats().catch((err) => setError(err.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  function formatDay(dateKey) {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(
      localDateFromKey(dateKey)
    );
  }

  function weekdayLabel(day) {
    const names = {
      1: t('mon'),
      2: t('tue'),
      3: t('wed'),
      4: t('thu'),
      5: t('fri'),
      6: t('sat'),
      0: t('sun')
    };
    return names[day] || '';
  }

  function choreSchedule(chore) {
    const days = Array.from(toWeekdaySet(chore.weekday_mask));
    if (days.length > 0) {
      return t('weekdays', { days: days.map((day) => weekdayLabel(day)).join(', ') });
    }
    return t('everyDays', { days: chore.interval_days });
  }

  function normalizedSettingsPayload(form) {
    const source = form || {};
    return {
      ...source,
      language: normalizeLanguage(source.language),
      gamification_mode: source.gamification_mode || 'friendly',
      deadline_alerts_enabled: source.deadline_alerts_enabled ? 1 : 0,
      weekly_owner_alert_enabled: source.weekly_owner_alert_enabled ? 1 : 0,
      alert_webhook_url: String(source.alert_webhook_url || '').trim(),
      sms_gateway_url: String(source.sms_gateway_url || '').trim(),
      sms_gateway_username: String(source.sms_gateway_username || '').trim(),
      sms_gateway_password: String(source.sms_gateway_password || '').trim(),
      sms_gateway_message_type: String(source.sms_gateway_message_type || 'sms.automatic').trim() || 'sms.automatic',
      smtp_host: String(source.smtp_host || '').trim(),
      smtp_port: Number(source.smtp_port || 587),
      smtp_secure: source.smtp_secure ? 1 : 0,
      smtp_user: String(source.smtp_user || '').trim(),
      smtp_pass: String(source.smtp_pass || '').trim(),
      smtp_from: String(source.smtp_from || '').trim()
    };
  }

  async function submitPerson(event) {
    event.preventDefault();
    const payload = {
      name: personForm.name.trim(),
      email: personForm.email.trim() || null,
      phone: personForm.phone.trim() || null
    };
    if (!payload.name) return;

    if (personForm.id) {
      await api.updatePerson(personForm.id, payload);
    } else {
      await api.createPerson(payload);
    }

    setPersonDialogOpen(false);
    await refreshAll({ includeStats: section === 'stats' });
  }

  async function deletePerson(row) {
    if (!window.confirm(`${t('delete')} ${row.name}?`)) return;
    await api.deletePerson(row.id);
    await refreshAll({ includeStats: section === 'stats' });
  }

  async function submitChore(event) {
    event.preventDefault();
    if (choreForm.repeat_mode === 'weekdays' && choreForm.weekday_mask.size === 0) {
      setError(t('chooseWeekday'));
      return;
    }

    const payload = {
      name: choreForm.name.trim(),
      description: choreForm.description.trim(),
      interval_days: choreForm.repeat_mode === 'weekdays' ? 1 : Number(choreForm.interval_days || 1),
      start_date: choreForm.start_date,
      weekday_mask: choreForm.repeat_mode === 'weekdays' ? Array.from(choreForm.weekday_mask).join(',') : null,
      due_time: choreForm.has_deadline ? choreForm.due_time || null : null,
      alert_enabled: choreForm.has_deadline && choreForm.alert_enabled ? 1 : 0,
      active: choreForm.active ? 1 : 0
    };

    if (choreForm.id) {
      await api.updateChore(choreForm.id, payload);
    } else {
      await api.createChore(payload);
    }

    setChoreDialogOpen(false);
    await refreshAll({ includeStats: section === 'stats' });
  }

  async function deleteChore(row) {
    if (!window.confirm(`${t('delete')} ${row.name}?`)) return;
    await api.deleteChore(row.id);
    await refreshAll({ includeStats: section === 'stats' });
  }

  async function toggleChore(chore) {
    await api.updateChore(chore.id, { active: chore.active ? 0 : 1 });
    await refreshAll({ includeStats: false });
  }

  async function submitWeekOwner(event) {
    event.preventDefault();
    if (!weekOwnerForm.person_id) return;
    await api.setWeekOwner({
      week_start: startOfWeek(weekOwnerForm.week_start),
      person_id: Number(weekOwnerForm.person_id)
    });
    setWeekOwnerDialogOpen(false);
    await refreshPlanningViews({ includeWeekOwners: true });
  }

  async function clearWeekOwner() {
    if (!weekOwnerForm.week_start) return;
    await api.deleteWeekOwner({ week_start: startOfWeek(weekOwnerForm.week_start) });
    setWeekOwnerDialogOpen(false);
    await refreshPlanningViews({ includeWeekOwners: true });
  }

  async function toggleCompletion(item) {
    if (item.completion) {
      await api.unmarkDone({ chore_id: item.chore_id, work_date: planDate });
    } else {
      const completedBy = item.responsible_person?.id || people[0]?.id;
      if (!completedBy) return;
      await api.markDone({ chore_id: item.chore_id, work_date: planDate, completed_by: completedBy });
    }
    await refreshPlanningViews({ includeStats: true });
  }

  function openInstance(item, dateKey) {
    const override = item.instance_override || null;
    const form = {
      chore_id: item.chore_id,
      work_date: dateKey,
      name: override?.name || '',
      description: override?.description || '',
      person_id: override?.person_id ? String(override.person_id) : '',
      disabled: Boolean(item.instance_disabled),
      deadline_mode:
        override?.deadline_mode === 0 || override?.deadline_mode === 1 ? String(override.deadline_mode) : '',
      due_time: override?.deadline_mode === 1 ? override?.due_time || '' : '',
      alert_enabled: override?.deadline_mode === 1 && Number(override?.alert_enabled) === 1,
      has_override: Boolean(item.has_instance_override)
    };
    setInstanceForm(form);
    setInstanceDialogOpen(true);
  }

  async function submitInstance(event) {
    event.preventDefault();
    await api.setInstanceOverride({
      chore_id: Number(instanceForm.chore_id),
      work_date: instanceForm.work_date,
      name: instanceForm.name.trim() || null,
      description: instanceForm.description.trim() || null,
      deadline_mode: instanceForm.deadline_mode === '' ? null : Number(instanceForm.deadline_mode),
      due_time: instanceForm.deadline_mode === '1' ? instanceForm.due_time || null : null,
      alert_enabled: instanceForm.deadline_mode === '1' ? (instanceForm.alert_enabled ? 1 : 0) : null,
      person_id: instanceForm.person_id ? Number(instanceForm.person_id) : null,
      disabled: instanceForm.disabled ? 1 : 0
    });

    setInstanceDialogOpen(false);
    await refreshPlanningViews({ includeStats: true });
  }

  async function resetInstanceOverride() {
    await api.deleteInstanceOverride({ chore_id: Number(instanceForm.chore_id), work_date: instanceForm.work_date });
    setInstanceDialogOpen(false);
    await refreshPlanningViews({ includeStats: true });
  }

  async function toggleInstanceDisabled(item, dateKey) {
    const override = item.instance_override || null;
    const existingDeadlineMode =
      override?.deadline_mode === 0 || override?.deadline_mode === 1 ? Number(override.deadline_mode) : null;

    await api.setInstanceOverride({
      chore_id: Number(item.chore_id),
      work_date: dateKey,
      name: override?.name || null,
      description: override?.description || null,
      deadline_mode: existingDeadlineMode,
      due_time: existingDeadlineMode === 1 ? override?.due_time || null : null,
      alert_enabled:
        existingDeadlineMode === 1 && (override?.alert_enabled === 0 || override?.alert_enabled === 1)
          ? Number(override.alert_enabled)
          : null,
      person_id: override?.person_id ? Number(override.person_id) : null,
      disabled: item.instance_disabled ? 0 : 1
    });

    await refreshPlanningViews();
  }

  async function submitSettings(event) {
    event.preventDefault();
    const next = await api.updateSettings(normalizedSettingsPayload(settingsForm));

    setSettings(next);
    setSettingsForm(next);
    setLanguage(normalizeLanguage(next.language));
    setSettingsOpen(false);
    await loadStats();
  }

  async function testSettingsEmail({ to, subject, message }) {
    const result = await api.testSettingsEmail({
      settings: normalizedSettingsPayload(settingsForm),
      to,
      subject,
      message
    });
    return result;
  }

  async function testSettingsSms({ to, message }) {
    const result = await api.testSettingsSms({
      settings: normalizedSettingsPayload(settingsForm),
      to,
      message
    });
    return result;
  }

  function openSettings() {
    if (!settings) return;
    setSettingsForm({ ...settings });
    setSettingsOpen(true);
  }

  function closeSettings() {
    setSettingsOpen(false);
    if (settings) {
      setSettingsForm({ ...settings });
      setLanguage(normalizeLanguage(settings.language));
    }
  }

  if (loading) {
    return (
      <div className='app-shell flex min-h-dvh items-center justify-center'>
        <p className='text-sm text-muted-foreground'>{t('loading')}</p>
      </div>
    );
  }

  return (
    <AdminLayout
      navItems={navItems}
      section={section}
      navigate={navigate}
      t={t}
      openSettings={openSettings}
      pageTitle={pageTitle}
      pageSubtitle={pageSubtitle}
      error={error}
    >
      {section === 'overview' ? (
        <OverviewSection
          t={t}
          overviewSummary={overviewSummary}
          overviewWeekOwners={overviewWeekOwners}
          overviewPlan={overviewPlan}
          overviewAlerts={overviewAlerts}
        />
      ) : null}
      {section === 'team' ? (
        <TeamSection
          t={t}
          people={people}
          onCreate={() => {
            setPersonForm({ id: null, name: '', email: '', phone: '' });
            setPersonDialogOpen(true);
          }}
          onEdit={(row) => {
            setPersonForm({
              id: row.id,
              name: row.name || '',
              email: row.email || '',
              phone: row.phone || ''
            });
            setPersonDialogOpen(true);
          }}
          onDelete={deletePerson}
        />
      ) : null}
      {section === 'chores' ? (
        <ChoresSection
          t={t}
          chores={chores}
          choreSchedule={choreSchedule}
          onCreate={() => {
            setChoreForm({
              id: null,
              name: '',
              description: '',
              start_date: todayKey(),
              repeat_mode: 'interval',
              interval_days: 1,
              weekday_mask: new Set(),
              has_deadline: false,
              due_time: '',
              alert_enabled: false,
              active: true
            });
            setChoreDialogOpen(true);
          }}
          onEdit={(row) => {
            setChoreForm({
              id: row.id,
              name: row.name || '',
              description: row.description || '',
              start_date: row.start_date || todayKey(),
              repeat_mode: row.weekday_mask ? 'weekdays' : 'interval',
              interval_days: row.interval_days || 1,
              weekday_mask: toWeekdaySet(row.weekday_mask),
              has_deadline: Boolean(row.due_time),
              due_time: row.due_time || '',
              alert_enabled: Boolean(row.due_time) && Number(row.alert_enabled) === 1,
              active: Boolean(row.active)
            });
            setChoreDialogOpen(true);
          }}
          onDelete={deleteChore}
          onToggle={toggleChore}
        />
      ) : null}
      {section === 'board' ? (
        <BoardSection
          t={t}
          planDate={planDate}
          setPlanDate={setPlanDate}
          formatDay={formatDay}
          boardSummary={boardSummary}
          boardAttention={boardAttention}
          boardCompleted={boardCompleted}
          toggleCompletion={toggleCompletion}
          locale={locale}
          padTime={padTime}
        />
      ) : null}
      {section === 'schedule' ? (
        <ScheduleSection
          t={t}
          weekViewStart={weekViewStart}
          setWeekViewStart={setWeekViewStart}
          weekViewCount={weekViewCount}
          setWeekViewCount={setWeekViewCount}
          weekOwners={weekOwners}
          locale={locale}
          onEditWeekOwner={(row) => {
            setWeekOwnerForm({
              week_start: row.week_start,
              person_id: row.person_id ? String(row.person_id) : ''
            });
            setWeekOwnerDialogOpen(true);
          }}
          weekPlans={weekPlans}
          formatDay={formatDay}
          openInstance={openInstance}
          toggleInstanceDisabled={toggleInstanceDisabled}
        />
      ) : null}
      {section === 'stats' ? (
        <StatsSection
          t={t}
          statsStart={statsStart}
          setStatsStart={setStatsStart}
          statsEnd={statsEnd}
          setStatsEnd={setStatsEnd}
          statsRange={statsRange}
          setStatsRange={setStatsRange}
          stats={stats}
          onRefresh={() => loadStats().catch((err) => setError(err.message))}
        />
      ) : null}

      <AdminDialogs
        t={t}
        people={people}
        personDialogOpen={personDialogOpen}
        setPersonDialogOpen={setPersonDialogOpen}
        personForm={personForm}
        setPersonForm={setPersonForm}
        submitPerson={submitPerson}
        choreDialogOpen={choreDialogOpen}
        setChoreDialogOpen={setChoreDialogOpen}
        choreForm={choreForm}
        setChoreForm={setChoreForm}
        weekdayLabel={weekdayLabel}
        submitChore={submitChore}
        weekOwnerDialogOpen={weekOwnerDialogOpen}
        setWeekOwnerDialogOpen={setWeekOwnerDialogOpen}
        weekOwnerForm={weekOwnerForm}
        setWeekOwnerForm={setWeekOwnerForm}
        submitWeekOwner={submitWeekOwner}
        clearWeekOwner={clearWeekOwner}
        instanceDialogOpen={instanceDialogOpen}
        setInstanceDialogOpen={setInstanceDialogOpen}
        instanceForm={instanceForm}
        setInstanceForm={setInstanceForm}
        submitInstance={submitInstance}
        resetInstanceOverride={resetInstanceOverride}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        closeSettings={closeSettings}
        settingsForm={settingsForm}
        setSettingsForm={setSettingsForm}
        language={language}
        setLanguage={(value) => setLanguage(normalizeLanguage(value))}
        submitSettings={submitSettings}
        testSettingsEmail={testSettingsEmail}
        testSettingsSms={testSettingsSms}
        formatDay={formatDay}
      />
    </AdminLayout>
  );
}
