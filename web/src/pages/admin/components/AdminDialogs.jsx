import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTheme, THEMES, THEME_LABELS, THEME_COLORS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Field } from './AdminShared';

function ColorSchemePicker({ t }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className='grid gap-1.5'>
      <Label>{t('colorScheme')}</Label>
      <div className='flex flex-wrap gap-2'>
        {THEMES.map((id) => (
          <button
            key={id}
            type='button'
            onClick={() => setTheme(id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl border-2 px-2.5 py-2 transition-all',
              theme === id ? 'border-primary bg-accent' : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <div className='flex gap-0.5'>
              <div className='h-5 w-5 rounded-full' style={{ background: THEME_COLORS[id][0] }} />
              <div className='h-5 w-5 rounded-full' style={{ background: THEME_COLORS[id][1] }} />
            </div>
            <span className='text-xs font-medium text-slate-700'>{THEME_LABELS[id]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function AdminDialogs({
  t,
  people,
  personDialogOpen,
  setPersonDialogOpen,
  personForm,
  setPersonForm,
  submitPerson,
  choreDialogOpen,
  setChoreDialogOpen,
  choreForm,
  setChoreForm,
  weekdayLabel,
  submitChore,
  weekOwnerDialogOpen,
  setWeekOwnerDialogOpen,
  weekOwnerForm,
  setWeekOwnerForm,
  submitWeekOwner,
  clearWeekOwner,
  instanceDialogOpen,
  setInstanceDialogOpen,
  instanceForm,
  setInstanceForm,
  submitInstance,
  resetInstanceOverride,
  settingsOpen,
  setSettingsOpen,
  closeSettings,
  settingsForm,
  setSettingsForm,
  language,
  setLanguage,
  submitSettings,
  formatDay
}) {
  return (
    <>
      <Dialog open={personDialogOpen} onOpenChange={setPersonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addEditMember')}</DialogTitle>
            <DialogDescription>{t('sectionTeamSubtitle')}</DialogDescription>
          </DialogHeader>
          <form className='grid gap-3' onSubmit={submitPerson}>
            <div className='grid gap-1'>
              <Label>{t('placeHolderName')}</Label>
              <Input
                required
                value={personForm.name}
                onChange={(e) => setPersonForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('placeHolderName')}
              />
            </div>
            <div className='grid gap-1'>
              <Label>{t('placeHolderEmail')}</Label>
              <Input
                value={personForm.email}
                onChange={(e) => setPersonForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder={t('placeHolderEmail')}
              />
            </div>
            <div className='grid gap-1'>
              <Label>{t('placeHolderPhone')}</Label>
              <Input
                value={personForm.phone}
                onChange={(e) => setPersonForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder={t('placeHolderPhone')}
              />
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setPersonDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type='submit'>{t('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={choreDialogOpen} onOpenChange={setChoreDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('addEditChore')}</DialogTitle>
            <DialogDescription>{t('sectionChoresSubtitle')}</DialogDescription>
          </DialogHeader>
          <form className='grid gap-4' onSubmit={submitChore}>
            <div className='grid gap-3 md:grid-cols-2'>
              <div className='grid gap-1 md:col-span-2'>
                <Label>{t('placeHolderName')}</Label>
                <Input
                  required
                  value={choreForm.name}
                  onChange={(e) => setChoreForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className='grid gap-1'>
                <Label>{t('startDate')}</Label>
                <Input
                  type='date'
                  required
                  value={choreForm.start_date}
                  onChange={(e) => setChoreForm((prev) => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className='grid gap-1'>
                <Label>{t('scheduleMode')}</Label>
                <Tabs
                  value={choreForm.repeat_mode}
                  onValueChange={(value) => setChoreForm((prev) => ({ ...prev, repeat_mode: value }))}
                >
                  <TabsList className='grid grid-cols-2'>
                    <TabsTrigger value='interval'>{t('intervalMode')}</TabsTrigger>
                    <TabsTrigger value='weekdays'>{t('weekdaysMode')}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {choreForm.repeat_mode === 'interval' ? (
                <div className='grid gap-1'>
                  <Label>{t('intervalDays')}</Label>
                  <Input
                    type='number'
                    min='1'
                    value={choreForm.interval_days}
                    onChange={(e) => setChoreForm((prev) => ({ ...prev, interval_days: Number(e.target.value || 1) }))}
                  />
                </div>
              ) : (
                <div className='grid gap-1 md:col-span-2'>
                  <Label>{t('weekdaysLabel')}</Label>
                  <div className='flex flex-wrap gap-2'>
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                      const selected = choreForm.weekday_mask.has(day);
                      return (
                        <Button
                          key={day}
                          type='button'
                          variant={selected ? 'default' : 'outline'}
                          size='sm'
                          onClick={() => {
                            setChoreForm((prev) => {
                              const next = new Set(prev.weekday_mask);
                              if (next.has(day)) next.delete(day);
                              else next.add(day);
                              return { ...prev, weekday_mask: next };
                            });
                          }}
                        >
                          {weekdayLabel(day)}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className='grid gap-1 md:col-span-2'>
                <Label>{t('description')}</Label>
                <Textarea
                  value={choreForm.description}
                  onChange={(e) => setChoreForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t('placeHolderDescription')}
                />
              </div>
            </div>

            <div className='rounded-xl border p-3'>
              <div className='flex items-center justify-between'>
                <Label>{t('useDeadline')}</Label>
                <Switch
                  checked={choreForm.has_deadline}
                  onCheckedChange={(checked) => setChoreForm((prev) => ({ ...prev, has_deadline: checked }))}
                />
              </div>
              <div className='mt-2 grid gap-2 md:grid-cols-2'>
                <div className='grid gap-1'>
                  <Label>{t('deadline')}</Label>
                  <Input
                    type='time'
                    disabled={!choreForm.has_deadline}
                    value={choreForm.due_time}
                    onChange={(e) => setChoreForm((prev) => ({ ...prev, due_time: e.target.value }))}
                  />
                </div>
                <div className='flex items-center justify-between rounded-xl border p-2'>
                  <Label>{t('dueIfMissed')}</Label>
                  <Switch
                    checked={choreForm.has_deadline && choreForm.alert_enabled}
                    onCheckedChange={(checked) => setChoreForm((prev) => ({ ...prev, alert_enabled: checked }))}
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between rounded-xl border p-3'>
              <Label>{t('active')}</Label>
              <Switch checked={choreForm.active} onCheckedChange={(checked) => setChoreForm((prev) => ({ ...prev, active: checked }))} />
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setChoreDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type='submit'>{t('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={weekOwnerDialogOpen} onOpenChange={setWeekOwnerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('assignWeekOwner')}</DialogTitle>
          </DialogHeader>
          <form className='grid gap-3' onSubmit={submitWeekOwner}>
            <div className='grid gap-1'>
              <Label>{t('weekStart')}</Label>
              <Input
                type='date'
                value={weekOwnerForm.week_start}
                onChange={(e) => setWeekOwnerForm((prev) => ({ ...prev, week_start: e.target.value }))}
              />
            </div>
            <div className='grid gap-1'>
              <Label>{t('responsible')}</Label>
              <select
                className='h-9 rounded-md border border-input bg-background px-3 text-sm'
                value={weekOwnerForm.person_id}
                onChange={(e) => setWeekOwnerForm((prev) => ({ ...prev, person_id: e.target.value }))}
                required
              >
                <option value=''>{t('choosePerson')}</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter className='sm:justify-between'>
              <Button type='button' variant='outline' onClick={clearWeekOwner}>
                {t('delete')}
              </Button>
              <div className='flex gap-2'>
                <Button type='button' variant='outline' onClick={() => setWeekOwnerDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type='submit'>{t('save')}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={instanceDialogOpen} onOpenChange={setInstanceDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('editInstance')}</DialogTitle>
            <DialogDescription>{instanceForm.work_date ? formatDay(instanceForm.work_date) : ''}</DialogDescription>
          </DialogHeader>
          <form className='grid gap-3' onSubmit={submitInstance}>
            <div className='grid gap-1'>
              <Label>{t('responsible')}</Label>
              <select
                className='h-9 rounded-md border border-input bg-background px-3 text-sm'
                value={instanceForm.person_id}
                onChange={(e) => setInstanceForm((prev) => ({ ...prev, person_id: e.target.value }))}
              >
                <option value=''>{t('fallbackOwner')}</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex items-center justify-between rounded-xl border p-2'>
              <Label>{t('disableInstance')}</Label>
              <Switch
                checked={instanceForm.disabled}
                onCheckedChange={(checked) => setInstanceForm((prev) => ({ ...prev, disabled: checked }))}
              />
            </div>
            <div className='grid gap-1'>
              <Label>{t('nameOverride')}</Label>
              <Input
                value={instanceForm.name}
                onChange={(e) => setInstanceForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className='grid gap-1'>
              <Label>{t('descriptionOverride')}</Label>
              <Textarea
                value={instanceForm.description}
                onChange={(e) => setInstanceForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className='grid gap-3 md:grid-cols-2'>
              <div className='grid gap-1'>
                <Label>{t('deadlineMode')}</Label>
                <select
                  className='h-9 rounded-md border border-input bg-background px-3 text-sm'
                  value={instanceForm.deadline_mode}
                  onChange={(e) => setInstanceForm((prev) => ({ ...prev, deadline_mode: e.target.value }))}
                >
                  <option value=''>{t('useChoreDefault')}</option>
                  <option value='0'>{t('noDeadlineThisDay')}</option>
                  <option value='1'>{t('customDeadline')}</option>
                </select>
              </div>
              <div className='grid gap-1'>
                <Label>{t('deadline')}</Label>
                <Input
                  type='time'
                  disabled={instanceForm.deadline_mode !== '1'}
                  value={instanceForm.due_time}
                  onChange={(e) => setInstanceForm((prev) => ({ ...prev, due_time: e.target.value }))}
                />
              </div>
            </div>
            <div className='flex items-center justify-between rounded-xl border p-2'>
              <Label>{t('dueIfMissed')}</Label>
              <Switch
                checked={instanceForm.deadline_mode === '1' && instanceForm.alert_enabled}
                onCheckedChange={(checked) => setInstanceForm((prev) => ({ ...prev, alert_enabled: checked }))}
              />
            </div>
            <DialogFooter className='sm:justify-between'>
              <Button
                type='button'
                variant='outline'
                onClick={resetInstanceOverride}
                disabled={!instanceForm.has_override}
              >
                {t('resetOverride')}
              </Button>
              <div className='flex gap-2'>
                <Button type='button' variant='outline' onClick={() => setInstanceDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type='submit'>{t('save')}</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={(open) => (open ? setSettingsOpen(true) : closeSettings())}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('settings')}</DialogTitle>
            <DialogDescription>{t('sectionScheduleSubtitle')}</DialogDescription>
          </DialogHeader>
          {settingsForm ? (
            <form className='grid gap-4' onSubmit={submitSettings}>
              <div className='grid gap-3 md:grid-cols-2'>
                <div className='grid gap-1'>
                  <Label>{t('language')}</Label>
                  <Tabs
                    value={settingsForm.language}
                    onValueChange={(value) => {
                      setSettingsForm((prev) => ({ ...prev, language: value }));
                      setLanguage(value);
                    }}
                  >
                    <TabsList className='grid grid-cols-2'>
                      <TabsTrigger value='en'>{t('english')}</TabsTrigger>
                      <TabsTrigger value='no'>{t('norwegian')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className='grid gap-1'>
                  <Label>{t('gamification')}</Label>
                  <Tabs
                    value={settingsForm.gamification_mode || 'friendly'}
                    onValueChange={(value) => setSettingsForm((prev) => ({ ...prev, gamification_mode: value }))}
                  >
                    <TabsList className='grid grid-cols-2'>
                      <TabsTrigger value='friendly'>{t('friendly')}</TabsTrigger>
                      <TabsTrigger value='hardcore'>{t('hardcore')}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <ColorSchemePicker t={t} />

              <div className='grid gap-2 rounded-xl border p-3'>
                <div className='flex items-center justify-between'>
                  <Label>{t('deadlineAlertsEnabled')}</Label>
                  <Switch
                    checked={Boolean(settingsForm.deadline_alerts_enabled)}
                    onCheckedChange={(checked) =>
                      setSettingsForm((prev) => ({ ...prev, deadline_alerts_enabled: checked ? 1 : 0 }))
                    }
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <Label>{t('weekOwnerReminder')}</Label>
                  <Switch
                    checked={Boolean(settingsForm.weekly_owner_alert_enabled)}
                    onCheckedChange={(checked) =>
                      setSettingsForm((prev) => ({ ...prev, weekly_owner_alert_enabled: checked ? 1 : 0 }))
                    }
                  />
                </div>
              </div>
              <div className='grid gap-3 md:grid-cols-2'>
                <Field
                  label={t('alertWebhookUrl')}
                  value={settingsForm.alert_webhook_url || ''}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, alert_webhook_url: value }))}
                  InputComponent={Input}
                />
                <Field
                  label={t('smsApiGatewayUrl')}
                  value={settingsForm.sms_gateway_url || ''}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, sms_gateway_url: value }))}
                  InputComponent={Input}
                />
                <Field
                  label={t('smtpHost')}
                  value={settingsForm.smtp_host || ''}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, smtp_host: value }))}
                  InputComponent={Input}
                />
                <Field
                  label={t('smtpPort')}
                  type='number'
                  value={String(settingsForm.smtp_port || 587)}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, smtp_port: Number(value || 587) }))}
                  InputComponent={Input}
                />
                <Field
                  label={t('smtpUser')}
                  value={settingsForm.smtp_user || ''}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, smtp_user: value }))}
                  InputComponent={Input}
                />
                <Field
                  label={t('smtpPass')}
                  type='password'
                  value={settingsForm.smtp_pass || ''}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, smtp_pass: value }))}
                  InputComponent={Input}
                />
                <Field
                  label={t('smtpFrom')}
                  value={settingsForm.smtp_from || ''}
                  onChange={(value) => setSettingsForm((prev) => ({ ...prev, smtp_from: value }))}
                  InputComponent={Input}
                />
                <div className='flex items-center justify-between rounded-xl border p-2'>
                  <Label>{t('smtpSecure')}</Label>
                  <Switch
                    checked={Boolean(settingsForm.smtp_secure)}
                    onCheckedChange={(checked) => setSettingsForm((prev) => ({ ...prev, smtp_secure: checked ? 1 : 0 }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={closeSettings}>
                  {t('cancel')}
                </Button>
                <Button type='submit'>{t('save')}</Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
