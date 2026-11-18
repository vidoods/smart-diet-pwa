import React from 'react';
import { User, LogOut, Users, DoorOpen, ShieldCheck, Check, ShieldOff, Sun, Moon, Laptop } from 'lucide-react';
import UserProfileForm from './profile/UserProfileForm';
import FamilyMembersSection from './profile/FamilyMembersSection';
import { useTheme } from '../context/ThemeContext';

export default function ProfileFamilyView({
  user,
  profile,
  onSaveProfile,
  familyHost,
  allowHostMenuSync,
  onToggleAllowHostMenuSync,
  onLeaveFamily,
  manualMembers,
  onAddManualMember,
  onRemoveManualMember,
  linkedMembers,
  onUpdateMemberSyncPref,
  onRemoveLinkedMember,
  pendingRequests,
  onRespondToRequest,
  onCreateInviteLink,
  onLogout
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Карточка аккаунта */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-11 h-11 rounded-2xl object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{profile.name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-transparent dark:border-rose-900/50 px-3 py-2 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" /> Выйти
        </button>
      </div>

      {/* 2. Блок выбора темы оформления */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Laptop className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">Тема оформления</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {theme === 'system' ? 'Как в системе' : theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-950/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`tap-spring py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Светлая</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`tap-spring py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              theme === 'dark'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Тёмная</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`tap-spring py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              theme === 'system'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-emerald-500" />
            <span>Системная</span>
          </button>
        </div>
      </div>

      {/* 2. Блок участника семьи (если вас пригласил глава семьи) */}
      {familyHost?.uid && (
        <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-4 space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Вы в семье у {familyHost.name}
              </div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-400/80 mt-0.5">{familyHost.email}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Выйти из семьи пользователя ${familyHost.name}?`)) {
                  onLeaveFamily();
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-slate-800 border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 rounded-xl transition"
            >
              <DoorOpen className="w-3.5 h-3.5" /> Выйти из семьи
            </button>
          </div>

          <label className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-3 border border-indigo-200/70 dark:border-indigo-900/60 cursor-pointer transition-colors">
            <div className="pr-3">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Синхронизировать моё меню с главой семьи</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                Блюда будут обновляться от <b>{familyHost.name}</b>, а вес порций и КБЖУ останутся строго по вашим параметрам.
              </div>
            </div>
            <input
              type="checkbox"
              checked={allowHostMenuSync}
              onChange={(e) => onToggleAllowHostMenuSync(e.target.checked)}
              className="w-5 h-5 rounded accent-indigo-600 shrink-0"
            />
          </label>
        </div>
      )}

      {/* 3. Входящие запросы на доступ к вашему меню */}
      {pendingRequests?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-4 space-y-3 transition-colors">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Запросы на доступ к вашему меню
          </div>
          {pendingRequests.map((req) => (
            <div key={req.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-amber-200/70 dark:border-amber-900/60 space-y-2 transition-colors">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Пользователь <b>{req.fromName}</b> ({req.fromEmail}) приглашает вас в семью для общего списка покупок.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onRespondToRequest(req, true, true)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Вступить
                </button>
                <button
                  onClick={() => onRespondToRequest(req, false, false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <ShieldOff className="w-4 h-4" /> Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Мои антропометрические параметры */}
      <UserProfileForm profile={profile} onSaveProfile={onSaveProfile} />

      {/* 5. Блок «Семья и совместные покупки» */}
      <FamilyMembersSection
        manualMembers={manualMembers}
        onAddManualMember={onAddManualMember}
        onRemoveManualMember={onRemoveManualMember}
        linkedMembers={linkedMembers}
        onUpdateMemberSyncPref={onUpdateMemberSyncPref}
        onRemoveLinkedMember={onRemoveLinkedMember}
        onCreateInviteLink={onCreateInviteLink}
      />
    </div>
  );
}
